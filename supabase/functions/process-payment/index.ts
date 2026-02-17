import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  userId: string;
  amount: number;
  phone: string;
  method: "mpesa" | "emola";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, amount, phone, method }: PaymentRequest = await req.json();

    // Validate inputs
    if (!userId || !amount || !phone || !method) {
      return new Response(
        JSON.stringify({ success: false, error: "Campos obrigatórios em falta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount < 50) {
      return new Response(
        JSON.stringify({ success: false, error: "Valor mínimo de recarga é 50 MZN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone number format
    const validMpesa = /^8[45]\d{7}$/.test(phone);
    const validEmola = /^8[67]\d{7}$/.test(phone);

    if (method === "mpesa" && !validMpesa) {
      return new Response(
        JSON.stringify({ success: false, error: "Número M-Pesa inválido (deve começar com 84 ou 85)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (method === "emola" && !validEmola) {
      return new Response(
        JSON.stringify({ success: false, error: "Número E-Mola inválido (deve começar com 86 ou 87)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get E2Payments credentials from environment
    const clientId = Deno.env.get("E2PAYMENTS_CLIENT_ID");
    const clientSecret = Deno.env.get("E2PAYMENTS_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Missing E2Payments credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de pagamento em falta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get OAuth token
    const tokenResponse = await fetch("https://e2payments.explicador.co.mz/oauth/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenText = await tokenResponse.text();
    console.log("Token response status:", tokenResponse.status);

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      console.error("Token endpoint returned non-JSON:", tokenText.substring(0, 300));
      return new Response(
        JSON.stringify({ success: false, error: "Serviço de pagamentos indisponível. Tente novamente mais tarde." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const token = tokenData.access_token;

    // Step 2: Process payment
    const endpoint = method === "mpesa"
      ? "https://e2payments.explicador.co.mz/v1/c2b/mpesa-payment/999813"
      : "https://e2payments.explicador.co.mz/v1/c2b/emola-payment/999814";

    const paymentResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        amount: amount.toString(),
        reference: `sb${userId.slice(0, 8)}`,
        phone: phone,
      }),
    });

    const paymentText = await paymentResponse.text();
    console.log("Payment raw response status:", paymentResponse.status);
    console.log("Payment raw response:", paymentText.substring(0, 500));

    let paymentResult;
    try {
      paymentResult = JSON.parse(paymentText);
    } catch {
      console.error("E2Payments returned non-JSON response:", paymentText.substring(0, 300));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Serviço de pagamentos indisponível. Tente novamente mais tarde." 
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Payment parsed response:", JSON.stringify(paymentResult, null, 2));

    // Check if payment was successful
    if (paymentResult.success && paymentResult.success.includes("sucesso")) {
      // Create Supabase client with service role
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get current balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao buscar saldo do utilizador" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const currentBalance = Number(profile.balance) || 0;
      const newBalance = currentBalance + amount;

      // Update balance and auto-unblock user
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance, is_blocked: false })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating balance:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao actualizar saldo" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create transaction record
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          amount: amount,
          type: "deposit",
          description: `Recarga via ${method.toUpperCase()} - ${phone}`,
          reference_id: `${method}-${Date.now()}`,
        });

      if (txError) {
        console.error("Error creating transaction:", txError);
        // Don't fail the whole request, balance was already updated
      }

      // Send webhook notification
      try {
        const webhookUrl = "https://api.pushcut.io/LwrUR20CODgHBOG_HuUOK/notifications/Venda%20aprovada";
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `Recarregamento de ${amount} MZN APROVADO💰`,
          }),
        });
        console.log("Webhook notification sent successfully");
      } catch (webhookError) {
        console.error("Failed to send webhook notification:", webhookError);
        // Don't fail the request if webhook fails
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Pagamento processado com sucesso!",
          newBalance: newBalance
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Pagamento não concluído. Verifique o seu telefone e tente novamente."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

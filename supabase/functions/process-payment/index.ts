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
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    if (!token) {
      console.error("Failed to get E2Payments token:", tokenData);
      return new Response(
        JSON.stringify({ success: false, error: "Erro de autenticação com o serviço de pagamentos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Process payment
    const endpoint = method === "mpesa"
      ? "https://e2payments.explicador.co.mz/v1/c2b/mpesa-payment/999813"
      : "https://e2payments.explicador.co.mz/v1/c2b/emola-payment/999814";

    const paymentResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: new URLSearchParams({
        client_id: clientId,
        amount: amount.toString(),
        reference: `socialboost-${userId.slice(0, 8)}-${Date.now()}`,
        phone: phone,
      }),
    });

    const paymentResult = await paymentResponse.json();
    console.log("Payment response:", JSON.stringify(paymentResult, null, 2));

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

      // Update balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
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

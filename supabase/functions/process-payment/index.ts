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

const ZUMBOPAY_BASE = "https://zumbopay.com/api/public/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, amount, phone, method }: PaymentRequest = await req.json();

    if (!userId || !amount || !phone || !method) {
      return new Response(
        JSON.stringify({ success: false, error: "Campos obrigatórios em falta" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount < 20) {
      return new Response(
        JSON.stringify({ success: false, error: "Valor mínimo de recarga é 20 MZN" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validMpesa = /^8[45]\d{7}$/.test(phone);
    const validEmola = /^8[67]\d{7}$/.test(phone);

    if (method === "mpesa" && !validMpesa) {
      return new Response(
        JSON.stringify({ success: false, error: "Número M-Pesa inválido (deve começar com 84 ou 85)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (method === "emola" && !validEmola) {
      return new Response(
        JSON.stringify({ success: false, error: "Número E-Mola inválido (deve começar com 86 ou 87)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ZUMBOPAY_API_KEY");
    const merchantId = Deno.env.get("ZUMBOPAY_MERCHANT_ID");
    const mpesaWallet = Deno.env.get("ZUMBOPAY_MPESA_WALLET_ID");
    const emolaWallet = Deno.env.get("ZUMBOPAY_EMOLA_WALLET_ID");

    if (!apiKey || !merchantId || !mpesaWallet || !emolaWallet) {
      console.error("Missing Zumbopay credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de pagamento em falta no servidor" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const walletId = method === "mpesa" ? mpesaWallet : emolaWallet;
    const formattedPhone = `258${phone}`;
    const sourceId = `sb_${userId.slice(0, 8)}_${Date.now()}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call Zumbopay charges endpoint
    const body = {
      wallet_id: walletId,
      amount: amount,
      msisdn: formattedPhone,
      customer_name: "Cliente SocialBoost",
      source_id: sourceId,
    };

    console.log("Calling Zumbopay direct charge:", JSON.stringify(body));

    const response = await fetch(`${ZUMBOPAY_BASE}/charges`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Merchant-Id": merchantId,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const resText = await response.text();
    console.log("Zumbopay status:", response.status, "body:", resText.substring(0, 1000));

    let resData: any;
    try {
      resData = JSON.parse(resText);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Resposta inválida do gateway de pagamento" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle error response from Zumbopay
    if (resData.error || !resData.data) {
      const errorMsg = resData.error?.message || "O pagamento foi rejeitado.";
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { status, reference } = resData.data;

    // === Synchronous success → credit immediately ===
    if (status === "success") {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao buscar saldo do utilizador" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newBalance = (Number(profile.balance) || 0) + amount;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance, is_blocked: false })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating balance:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao actualizar saldo" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: amount,
        type: "deposit",
        description: `Recarga via ${method.toUpperCase()} - ${phone}`,
        reference_id: reference || sourceId,
      });

      // Pushcut notification
      try {
        await fetch("https://api.pushcut.io/LwrUR20CODgHBOG_HuUOK/notifications/Venda%20aprovada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `Recarregamento de ${amount} MZN APROVADO💰` }),
        });
      } catch (e) {
        console.error("Pushcut failed:", e);
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "success",
          message: "Pagamento processado com sucesso!",
          newBalance,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Pending: store pending payment in DB → wait for webhook or poll ===
    if (status === "pending" && reference) {
      const { error: pendingError } = await supabase.from("pending_payments").insert({
        payment_id: reference, // we use the Zumbopay reference as the primary payment identifier
        user_id: userId,
        amount: amount,
        method: method,
        phone: phone,
        status: "pending",
        provider_reference: reference,
      });

      if (pendingError) {
        console.error("Error inserting pending payment:", pendingError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao registar pagamento pendente" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "pending",
          payment_id: reference,
          message: "Confirme o pagamento no seu telefone. O saldo será actualizado automaticamente.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Resposta inesperada do gateway de pagamento" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

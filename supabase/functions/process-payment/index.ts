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

const DEBITOPAY_BASE = "https://gyqoaningqhurhvdugne.supabase.co/functions/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, amount, phone, method }: PaymentRequest = await req.json();

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

    const apiKey = Deno.env.get("DEBITOPAY_API_KEY");
    const merchantId = Deno.env.get("DEBITOPAY_MERCHANT_ID");
    const mpesaWallet = Deno.env.get("DEBITOPAY_MPESA_WALLET_CODE");
    const emolaWallet = Deno.env.get("DEBITOPAY_EMOLA_WALLET_CODE");

    if (!apiKey || !merchantId || !mpesaWallet || !emolaWallet) {
      console.error("Missing Debito Pay credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de pagamento em falta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const walletCode = method === "mpesa" ? mpesaWallet : emolaWallet;
    const internationalPhone = `+258${phone}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call Debito Pay orchestrator
    const orchestratorBody = {
      action: "process",
      payment_method: method,
      merchant_id: merchantId,
      wallet_code: walletCode,
      amount: amount,
      currency: "MZN",
      phone: internationalPhone,
      source: "gateway",
      source_id: `sb_${userId.slice(0, 8)}_${Date.now()}`,
      customer_phone: internationalPhone,
    };

    console.log("Calling Debito Pay orchestrator:", JSON.stringify(orchestratorBody));

    const dpResponse = await fetch(`${DEBITOPAY_BASE}/payment-orchestrator`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(orchestratorBody),
    });

    const dpText = await dpResponse.text();
    console.log("Debito Pay status:", dpResponse.status, "body:", dpText.substring(0, 500));

    let dpResult: any;
    try {
      dpResult = JSON.parse(dpText);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Resposta inválida do gateway de pagamento" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!dpResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: dpResult.error || "Pagamento não foi aceite. Tente novamente.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === M-Pesa: synchronous success → credit immediately ===
    if (method === "mpesa" && dpResult.status === "success") {
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

      const newBalance = (Number(profile.balance) || 0) + amount;

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

      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: amount,
        type: "deposit",
        description: `Recarga via MPESA - ${phone}`,
        reference_id: dpResult.reference || dpResult.transactionId || dpResult.payment_id,
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

    // === E-Mola (or M-Pesa pending): store pending → wait for webhook ===
    if (dpResult.payment_id) {
      const { error: pendingError } = await supabase.from("pending_payments").insert({
        payment_id: dpResult.payment_id,
        user_id: userId,
        amount: amount,
        method: method,
        phone: phone,
        status: "pending",
        provider_reference: dpResult.reference || null,
      });

      if (pendingError) {
        console.error("Error inserting pending payment:", pendingError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao registar pagamento pendente" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "pending",
          payment_id: dpResult.payment_id,
          message: "Confirme o pagamento no seu telefone. O saldo será actualizado automaticamente.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Resposta inesperada do gateway de pagamento" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

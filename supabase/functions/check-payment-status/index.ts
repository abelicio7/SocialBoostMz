import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZUMBOPAY_BASE = "https://zumbopay.com/api/public/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { payment_id } = await req.json();
    if (!payment_id) {
      return new Response(JSON.stringify({ success: false, error: "payment_id em falta" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pending } = await supabase
      .from("pending_payments").select("*").eq("payment_id", payment_id).maybeSingle();

    if (!pending) {
      return new Response(JSON.stringify({ success: false, error: "Pagamento não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already processed — return current state
    if (pending.status !== "pending") {
      return new Response(JSON.stringify({ success: true, status: pending.status }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ask Zumbopay
    const apiKey = Deno.env.get("ZUMBOPAY_API_KEY")!;
    const merchantId = Deno.env.get("ZUMBOPAY_MERCHANT_ID")!;

    const response = await fetch(`${ZUMBOPAY_BASE}/payments/${payment_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Merchant-Id": merchantId,
        Accept: "application/json",
      },
    });

    const resText = await response.text();
    console.log("Check status response:", response.status, resText.substring(0, 1000));

    let resData: any;
    try {
      resData = JSON.parse(resText);
    } catch {
      return new Response(JSON.stringify({ success: true, status: "pending" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gwStatus: string | undefined = resData?.data?.status;
    const reference: string | undefined = resData?.data?.reference;

    if (gwStatus === "success") {
      // Atomic claim: only credit if still pending
      const { data: claimed } = await supabase
        .from("pending_payments")
        .update({ status: "success", provider_reference: reference || payment_id })
        .eq("payment_id", payment_id)
        .eq("status", "pending")
        .select()
        .maybeSingle();

      if (claimed) {
        const { data: profile } = await supabase
          .from("profiles").select("balance").eq("id", pending.user_id).single();
        const newBalance = (Number(profile?.balance) || 0) + Number(pending.amount);
        
        await supabase
          .from("profiles")
          .update({ balance: newBalance, is_blocked: false })
          .eq("id", pending.user_id);

        await supabase.from("wallet_transactions").insert({
          user_id: pending.user_id,
          amount: pending.amount,
          type: "deposit",
          description: `Recarga via ${pending.method.toUpperCase()} - ${pending.phone}`,
          reference_id: reference || payment_id,
        });

        try {
          await fetch("https://api.pushcut.io/LwrUR20CODgHBOG_HuUOK/notifications/Venda%20aprovada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: `Recarregamento de ${pending.amount} MZN APROVADO💰` }),
          });
        } catch (_) { /* ignore */ }
      }
      return new Response(JSON.stringify({ success: true, status: "success" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (gwStatus === "failed" || gwStatus === "expired" || gwStatus === "cancelled") {
      await supabase
        .from("pending_payments").update({ status: "failed" })
        .eq("payment_id", payment_id).eq("status", "pending");
      return new Response(JSON.stringify({ success: true, status: "failed" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, status: "pending" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-payment-status error:", err);
    return new Response(JSON.stringify({ success: false, error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

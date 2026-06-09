import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEBITOPAY_BASE = "https://gyqoaningqhurhvdugne.supabase.co/functions/v1";

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

    // Ask Debito Pay
    const apiKey = Deno.env.get("DEBITOPAY_API_KEY")!;
    const dpRes = await fetch(`${DEBITOPAY_BASE}/payment-orchestrator`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ action: "check-status", payment_id }),
    });
    const dpData = await dpRes.json();
    const gwStatus: string | undefined = dpData?.payment?.status;
    const reference: string | undefined = dpData?.payment?.provider_reference;

    if (gwStatus === "success") {
      // Atomic claim: only credit if still pending
      const { data: claimed } = await supabase
        .from("pending_payments")
        .update({ status: "success", provider_reference: reference || null })
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

    if (gwStatus === "failed" || gwStatus === "expired") {
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

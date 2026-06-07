import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

async function verifyHmac(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const secret = Deno.env.get("DEBITOPAY_WEBHOOK_SECRET");

    if (!secret) {
      console.error("DEBITOPAY_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!signature || !(await verifyHmac(rawBody, signature, secret))) {
      console.warn("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    console.log("Webhook event:", payload.event, "payment_id:", payload?.data?.payment_id);

    const event = payload.event as string;
    const data = payload.data || {};
    const paymentId = data.payment_id as string | undefined;

    if (!paymentId) {
      return new Response(JSON.stringify({ ok: true, note: "no payment_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pending, error: pendingError } = await supabase
      .from("pending_payments")
      .select("*")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (pendingError || !pending) {
      console.warn("Pending payment not found for", paymentId);
      // Always 200 to avoid retries forever
      return new Response(JSON.stringify({ ok: true, note: "unknown payment" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: skip if already processed
    if (pending.status !== "pending") {
      return new Response(JSON.stringify({ ok: true, note: "already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event === "payment.completed") {
      // Credit user balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", pending.user_id)
        .single();

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
        reference_id: data.reference || paymentId,
      });

      await supabase
        .from("pending_payments")
        .update({ status: "success", provider_reference: data.reference || null })
        .eq("payment_id", paymentId);

      try {
        await fetch("https://api.pushcut.io/LwrUR20CODgHBOG_HuUOK/notifications/Venda%20aprovada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `Recarregamento de ${pending.amount} MZN APROVADO💰` }),
        });
      } catch (e) {
        console.error("Pushcut failed:", e);
      }
    } else if (event === "payment.failed") {
      await supabase
        .from("pending_payments")
        .update({ status: "failed" })
        .eq("payment_id", paymentId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

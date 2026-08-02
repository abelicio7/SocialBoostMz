import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-zumbopay-signature",
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
  return hex.toLowerCase() === signature.toLowerCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-zumbopay-signature") || "";
    const secret = Deno.env.get("ZUMBOPAY_WEBHOOK_SECRET");

    if (!secret) {
      console.error("ZUMBOPAY_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!signature || !(await verifyHmac(rawBody, signature, secret))) {
      console.warn("Invalid webhook signature received:", signature);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    console.log("Webhook event received:", payload.event, "data:", JSON.stringify(payload.data));

    const event = payload.event as string;
    const data = payload.data || {};
    
    // Zumbopay uses reference (like ZP_AB12CD34) as the transaction identifier
    const reference = data.reference as string | undefined;

    if (!reference) {
      return new Response(JSON.stringify({ ok: true, note: "no reference in payload" }), {
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
      .eq("payment_id", reference)
      .maybeSingle();

    if (pendingError || !pending) {
      console.warn("Pending payment not found for reference:", reference);
      // Always 200 to acknowledge receipt and avoid endless retries
      return new Response(JSON.stringify({ ok: true, note: "unknown transaction" }), {
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

    if (event === "payment.succeeded") {
      const brevoApiKey = Deno.env.get("BREVO_API_KEY");
      const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL") || "suporte@socialboostmz.com";

      // Credit user balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, balance")
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
        reference_id: reference,
      });

      await supabase
        .from("pending_payments")
        .update({ status: "success", provider_reference: reference })
        .eq("payment_id", reference);

      // Send email confirmation to user
      if (brevoApiKey) {
        try {
          const { data: userAuth } = await supabase.auth.admin.getUserById(pending.user_id);
          const userEmail = userAuth?.user?.email;

          if (userEmail) {
            const customerName = profile?.full_name || "Cliente";
            const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
              method: "POST",
              headers: {
                "api-key": brevoApiKey,
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
              body: JSON.stringify({
                sender: { name: "SocialBoostMz", email: brevoSenderEmail },
                to: [{ email: userEmail, name: customerName }],
                subject: `💰 Depósito de ${pending.amount} MZN Confirmado!`,
                htmlContent: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">💰 Saldo Adicionado!</h2>
                    <p>Olá, <strong>${customerName}</strong>,</p>
                    <p>Confirmamos que a sua recarga de carteira foi processada com sucesso.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr style="background: #f9fafb;">
                        <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">ID da Transação</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb;">#${reference.slice(0, 12)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Valor Adicionado</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; color: #059669; font-weight: bold;">${Number(pending.amount).toLocaleString()} MZN</td>
                      </tr>
                      <tr style="background: #f9fafb;">
                        <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Método</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb;">${pending.method.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Novo Saldo da Carteira</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${Number(newBalance).toLocaleString()} MZN</td>
                      </tr>
                    </table>
                    
                    <p>O seu saldo já está disponível e pode ser usado para efetuar novos pedidos de imediato.</p>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">SocialBoostMz - Impulsione suas redes sociais</p>
                  </div>
                `,
              }),
            });

            if (brevoRes.ok) {
              console.log(`Deposit confirmation email sent to user (${userEmail})`);
            } else {
              console.error(`Failed to send deposit email to ${userEmail}:`, await brevoRes.text());
            }
          }
        } catch (emailErr) {
          console.error("Failed to send deposit email notification:", emailErr);
        }
      }

      try {
        await supabase.functions.invoke("send-push", {
          body: {
            user_id: pending.user_id,
            title: "Depósito Confirmado! 💰",
            body: `A sua recarga de ${pending.amount} MZN foi creditada com sucesso via ${pending.method.toUpperCase()}.`,
            url: "/dashboard?tab=wallet"
          }
        });
      } catch (e) {
        console.error("Failed to send deposit push notification:", e);
      }
    } else if (event === "payment.failed") {
      await supabase
        .from("pending_payments")
        .update({ status: "failed" })
        .eq("payment_id", reference);
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

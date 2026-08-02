import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPushPayload } from "npm:@block65/webcrypto-web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const { user_id, title, body: text, url } = body;

    if (!user_id || !title || !text) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subscriptions, error: subError } = await supabase
      .from("admin_push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) throw subError;

    let successCount = 0;
    if (subscriptions && subscriptions.length > 0) {
      const message = JSON.stringify({
        title,
        body: text,
        url: url || "/dashboard",
      });

      const vapid = {
        subject: "mailto:suporte@socialboostmz.com",
        publicKey: vapidPublicKey,
        privateKey: vapidPrivateKey,
      };

      for (const sub of subscriptions) {
        try {
          const subscription = {
            endpoint: sub.subscription.endpoint,
            keys: {
              p256dh: sub.subscription.keys.p256dh,
              auth: sub.subscription.keys.auth,
            },
          };

          const pushRequest = await buildPushPayload(message, subscription, vapid);
          const res = await fetch(subscription.endpoint, pushRequest);

          if (res.status === 410 || res.status === 404) {
            console.log(`Deleting expired push subscription: ${sub.id}`);
            await supabase.from("admin_push_subscriptions").delete().eq("id", sub.id);
          } else if (res.ok) {
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to send web push to subscription ${sub.id}:`, err);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sent: successCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

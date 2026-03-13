import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDER_API_URL = "https://baratosociais.com/api/v2";

// Map provider status to our order status
function mapProviderStatus(providerStatus: string): string | null {
  const s = providerStatus?.toLowerCase();
  if (["completed", "complete"].includes(s)) return "completed";
  if (["processing", "in progress", "inprogress", "pending"].includes(s)) return "processing";
  if (["canceled", "cancelled", "refunded", "partial"].includes(s)) return "cancelled";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const providerApiKey = Deno.env.get("PROVIDER_API_KEY");
    if (!providerApiKey) throw new Error("PROVIDER_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch orders that have a provider_order_id and are not yet completed/cancelled
    const { data: orders, error: fetchErr } = await supabase
      .from("orders")
      .select("id, provider_order_id, status, provider_status, user_id, total_price")
      .not("provider_order_id", "is", null)
      .in("status", ["pending", "processing"]);

    if (fetchErr) throw fetchErr;
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No orders to sync", synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use multi-status API to check all orders at once (max 100 per batch)
    const batchSize = 100;
    let totalSynced = 0;

    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      const providerIds = batch.map((o) => o.provider_order_id).join(",");

      const body = new URLSearchParams({
        key: providerApiKey,
        action: "status",
        orders: providerIds,
      });

      const res = await fetch(PROVIDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const text = await res.text();
      let statuses: Record<string, any>;
      try {
        statuses = JSON.parse(text);
      } catch {
        console.error("Invalid JSON from provider:", text.substring(0, 200));
        continue;
      }

      // Update each order
      for (const order of batch) {
        const providerData = statuses[order.provider_order_id!];
        if (!providerData || providerData.error) continue;

        const newProviderStatus = providerData.status;
        const mappedStatus = mapProviderStatus(newProviderStatus);

        // Skip if no change or unknown status
        if (!mappedStatus || (mappedStatus === order.status && newProviderStatus === order.provider_status)) {
          continue;
        }

        const updateData: Record<string, any> = {
          provider_status: newProviderStatus,
        };

        // Only update our status if it changed
        if (mappedStatus !== order.status) {
          updateData.status = mappedStatus;
        }

        const { error: updateErr } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", order.id);

        if (updateErr) {
          console.error(`Failed to update order ${order.id}:`, updateErr);
          continue;
        }

        // If cancelled/partial by provider, refund the user
        if (mappedStatus === "cancelled" && order.status !== "cancelled") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("balance")
            .eq("id", order.user_id)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({ balance: profile.balance + order.total_price })
              .eq("id", order.user_id);

            await supabase.from("wallet_transactions").insert({
              user_id: order.user_id,
              amount: order.total_price,
              type: "refund",
              order_id: order.id,
              description: `Reembolso automático - pedido cancelado pelo fornecedor`,
            });
          }
        }

        totalSynced++;
        console.log(`Order ${order.id}: ${order.status} → ${mappedStatus} (provider: ${newProviderStatus})`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: totalSynced, total: orders.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

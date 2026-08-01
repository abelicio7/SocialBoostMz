import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDER_API_URL = "https://baratosociais.com/api/v2";

function mapProviderStatus(providerStatus: string): string | null {
  const s = providerStatus?.toLowerCase()?.trim();
  if (["completed", "complete", "success", "delivered"].includes(s)) return "completed";
  if (["processing", "in progress", "inprogress", "pending", "queued", "active"].includes(s)) return "processing";
  if (["canceled", "cancelled", "refunded", "partial", "partial refunded", "failed"].includes(s)) return "cancelled";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const providerApiKey = Deno.env.get("PROVIDER_API_KEY");
    if (!providerApiKey) throw new Error("PROVIDER_API_KEY not configured");

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL") || "suporte@socialboostmz.com";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const requestedOrderIds = Array.isArray(body?.order_ids)
      ? body.order_ids.filter((id: unknown): id is string => typeof id === "string").slice(0, 100)
      : [];

    const authHeader = req.headers.get("Authorization");
    let requesterId: string | null = null;
    let isAdmin = false;

    if (requestedOrderIds.length > 0 && !authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (authHeader) {
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userErr } = await authClient.auth.getUser();
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      requesterId = user.id;
      const { data: adminRole, error: roleErr } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (roleErr) throw roleErr;
      isAdmin = !!adminRole;
    }

    let ordersQuery = supabase
      .from("orders")
      .select("id, provider_order_id, status, provider_status, user_id, total_price, quantity, link, service_id, services(name)")
      .not("provider_order_id", "is", null)
      .in("status", ["pending", "processing"]);

    if (requestedOrderIds.length > 0) {
      ordersQuery = ordersQuery.in("id", requestedOrderIds);
    }

    if (requesterId && !isAdmin) {
      ordersQuery = ordersQuery.eq("user_id", requesterId);
    }

    const { data: orders, error: fetchErr } = await ordersQuery;

    if (fetchErr) throw fetchErr;
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No orders to sync", synced: 0, checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const batchSize = 100;
    let totalSynced = 0;

    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      const providerIds = batch.map((order) => order.provider_order_id).join(",");

      const providerBody = new URLSearchParams({
        key: providerApiKey,
        action: "status",
        orders: providerIds,
      });

      const res = await fetch(PROVIDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: providerBody.toString(),
      });

      const text = await res.text();
      let statuses: Record<string, any>;
      try {
        statuses = JSON.parse(text);
      } catch {
        console.error("Invalid JSON from provider:", text.substring(0, 200));
        continue;
      }

      for (const order of batch) {
        const providerData = statuses[order.provider_order_id!];
        if (!providerData || providerData.error) continue;

        const newProviderStatus = providerData.status;
        const mappedStatus = mapProviderStatus(newProviderStatus);

        if (!mappedStatus || (mappedStatus === order.status && newProviderStatus === order.provider_status)) {
          continue;
        }

        const updateData: Record<string, any> = {
          provider_status: newProviderStatus,
        };

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
              description: "Reembolso automático - pedido cancelado pelo fornecedor",
            });
          }
         }
 
         // Send email to user if status changed to completed or cancelled
         if (brevoApiKey && mappedStatus !== order.status) {
           try {
             // Get user's email
             const { data: userAuth } = await supabase.auth.admin.getUserById(order.user_id);
             const userEmail = userAuth?.user?.email;
             
             const { data: profile } = await supabase
               .from("profiles")
               .select("full_name")
               .eq("id", order.user_id)
               .single();
             
             const customerName = profile?.full_name || "Cliente";
 
             if (userEmail) {
               const serviceName = (order.services as any)?.name || "Serviço";
               let subject = "";
               let htmlContent = "";
 
               if (mappedStatus === "completed") {
                 subject = `✅ Pedido #${order.id.slice(0, 8)} Concluído com Sucesso!`;
                 htmlContent = `
                   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                     <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">🎉 Seu Pedido foi Entregue!</h2>
                     <p>Olá, <strong>${customerName}</strong>,</p>
                     <p>Temos o prazer de informar que o seu pedido foi concluído com sucesso.</p>
                     
                     <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                       <tr style="background: #f9fafb;">
                         <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">ID do Pedido</td>
                         <td style="padding: 10px; border: 1px solid #e5e7eb;">#${order.id.slice(0, 8)}</td>
                       </tr>
                       <tr>
                         <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Serviço</td>
                         <td style="padding: 10px; border: 1px solid #e5e7eb;">${serviceName}</td>
                       </tr>
                       <tr style="background: #f9fafb;">
                         <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Quantidade</td>
                         <td style="padding: 10px; border: 1px solid #e5e7eb;">${Number(order.quantity).toLocaleString()}</td>
                       </tr>
                       <tr>
                         <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Link de Destino</td>
                         <td style="padding: 10px; border: 1px solid #e5e7eb;"><a href="${order.link}" style="color: #7c3aed; text-decoration: none;">${order.link}</a></td>
                       </tr>
                     </table>
                     
                     <p>Agradecemos a sua preferência! Se tiver alguma dúvida, entre em contacto com o nosso suporte.</p>
                     <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                     <p style="color: #6b7280; font-size: 12px; text-align: center;">SocialBoostMz - Impulsione suas redes sociais</p>
                   </div>
                 `;
               } else if (mappedStatus === "cancelled") {
                 subject = `❌ Pedido #${order.id.slice(0, 8)} Cancelado e Reembolsado`;
                 htmlContent = `
                   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                     <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">⚠️ Pedido Cancelado</h2>
                     <p>Olá, <strong>${customerName}</strong>,</p>
                     <p>Informamos que o seu pedido foi cancelado pelo sistema ou fornecedor.</p>
                     <p style="font-weight: bold; color: #10b981;">O valor integral correspondente foi devolvido automaticamente ao saldo da sua carteira.</p>
                     
                     <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                       <tr style="background: #f9fafb;">
                         <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">ID do Pedido</td>
                         <td style="padding: 10px; border: 1px solid #e5e7eb;">#${order.id.slice(0, 8)}</td>
                       </tr>
                       <tr>
                         <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Serviço</td>
                         <td style="padding: 10px; border: 1px solid #e5e7eb;">${serviceName}</td>
                       </tr>
                       <tr style="background: #f9fafb;">
                         <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Valor Reembolsado</td>
                         <td style="padding: 10px; border: 1px solid #e5e7eb; color: #059669; font-weight: bold;">${Number(order.total_price).toLocaleString()} MZN</td>
                       </tr>
                     </table>
                     
                     <p>Pode utilizar o saldo reembolsado para efetuar um novo pedido a qualquer momento. Lamentamos o inconveniente.</p>
                     <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                     <p style="color: #6b7280; font-size: 12px; text-align: center;">SocialBoostMz - Impulsione suas redes sociais</p>
                   </div>
                 `;
               }
 
               if (subject && htmlContent) {
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
                     subject: subject,
                     htmlContent: htmlContent,
                   }),
                 });
                 
                 if (brevoRes.ok) {
                   console.log(`Notification email sent to user (${userEmail}) for order ${order.id} (${mappedStatus})`);
                 } else {
                   console.error(`Failed to send notification email to ${userEmail}:`, await brevoRes.text());
                 }
               }
             }
           } catch (emailErr) {
             console.error(`Failed to process notification email for order ${order.id}:`, emailErr);
           }
         }
 
         totalSynced++;
         console.log(`Order ${order.id}: ${order.status} → ${mappedStatus} (provider: ${newProviderStatus})`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: totalSynced, total: orders.length, checked: orders.length }),
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

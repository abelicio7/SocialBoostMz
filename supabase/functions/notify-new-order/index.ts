import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload from the DB trigger
    const payload = await req.json();
    const record = payload.record || payload;

    const orderId = record.id;
    const userId = record.user_id;
    const serviceId = record.service_id;
    const quantity = record.quantity;
    const totalPrice = record.total_price;
    const link = record.link;

    // Get customer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .single();

    // Get service info
    const { data: service } = await supabase
      .from("services")
      .select("name, platform")
      .eq("id", serviceId)
      .single();

    // Get admin email (users with admin role)
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      console.error("No admin users found");
      return new Response(JSON.stringify({ success: false, error: "No admin found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin email from auth
    const { data: adminUser } = await supabase.auth.admin.getUserById(adminRoles[0].user_id);
    const adminEmail = adminUser?.user?.email;

    if (!adminEmail) {
      console.error("Admin email not found");
      return new Response(JSON.stringify({ success: false, error: "Admin email not found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerName = profile?.full_name || "N/A";
    const customerPhone = profile?.phone || "N/A";
    const serviceName = service?.name || "N/A";
    const platform = service?.platform || "N/A";

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SocialBoost <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `🛒 Novo Pedido #${orderId.slice(0, 8)} - ${serviceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">🛒 Novo Pedido Recebido</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 12px; background: #f3f4f6; font-weight: bold;">ID do Pedido</td>
                <td style="padding: 8px 12px; background: #f3f4f6;">#${orderId.slice(0, 8)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold;">Cliente</td>
                <td style="padding: 8px 12px;">${customerName} (${customerPhone})</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f3f4f6; font-weight: bold;">Serviço</td>
                <td style="padding: 8px 12px; background: #f3f4f6;">${serviceName} (${platform})</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold;">Quantidade</td>
                <td style="padding: 8px 12px;">${Number(quantity).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f3f4f6; font-weight: bold;">Valor</td>
                <td style="padding: 8px 12px; background: #f3f4f6; color: #059669; font-weight: bold;">${Number(totalPrice).toLocaleString()} MZN</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold;">Link</td>
                <td style="padding: 8px 12px;"><a href="${link}" style="color: #7c3aed;">${link}</a></td>
              </tr>
            </table>
            
            <p style="color: #6b7280; font-size: 14px;">Aceda ao painel admin para processar este pedido.</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend error:", JSON.stringify(emailResult));
      throw new Error(`Resend API failed [${emailResponse.status}]: ${JSON.stringify(emailResult)}`);
    }

    console.log("Email notification sent successfully to", adminEmail);

    // Also send Pushcut notification (like payments)
    try {
      await fetch("https://api.pushcut.io/LwrUR20CODgHBOG_HuUOK/notifications/Venda%20aprovada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🛒 Novo pedido #${orderId.slice(0, 8)} - ${serviceName} (${Number(totalPrice).toLocaleString()} MZN)`,
        }),
      });
    } catch (pushError) {
      console.error("Pushcut notification failed:", pushError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

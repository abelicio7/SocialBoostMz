import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
    const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") || "suporte@socialboostmz.com";
    const PROVIDER_API_KEY = Deno.env.get("PROVIDER_API_KEY")!;

    // 1. Get Admin Emails
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminEmails: string[] = [];
    for (const role of adminRoles || []) {
      const { data: adminUser } = await supabase.auth.admin.getUserById(role.user_id);
      if (adminUser?.user?.email) {
        adminEmails.push(adminUser.user.email);
      }
    }

    if (adminEmails.length === 0) {
      throw new Error("No admin email found");
    }

    // 2. Fetch Provider Balance
    let providerBalance = 0;
    let providerCurrency = "BRL";
    let balanceError = "";

    try {
      const balanceRes = await fetch("https://baratosociais.com/api/v2", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ key: PROVIDER_API_KEY, action: "balance" }).toString(),
      });
      const balanceData = await balanceRes.json();
      providerBalance = Number(balanceData?.balance || 0);
      providerCurrency = balanceData?.currency || "BRL";
    } catch (e) {
      balanceError = e.message;
      console.error("Failed to fetch provider balance:", e);
    }

    // 3. Get Exchange Rate
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("exchange_rate_brl_mzn")
      .eq("id", "main")
      .single();
    const exchangeRate = Number(settings?.exchange_rate_brl_mzn || 12.00);

    // 4. Get Orders in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: orders } = await supabase
      .from("orders")
      .select("id, total_price, quantity, status, service_id, services(provider_price)")
      .gte("created_at", oneDayAgo);

    let totalOrders = 0;
    let completedOrders = 0;
    let pendingOrders = 0;
    let processingOrders = 0;
    let cancelledOrders = 0;
    let totalRevenue = 0;
    let totalCostMzn = 0;

    for (const order of orders || []) {
      totalOrders++;
      const status = order.status;
      if (status === "completed") completedOrders++;
      else if (status === "pending") pendingOrders++;
      else if (status === "processing") processingOrders++;
      else if (status === "cancelled") cancelledOrders++;

      if (status !== "cancelled") {
        const revenue = Number(order.total_price || 0);
        totalRevenue += revenue;

        const providerPrice = Number((order.services as any)?.provider_price || 0);
        const costBrl = (providerPrice / 1000) * Number(order.quantity || 0);
        const costMzn = costBrl * exchangeRate;
        totalCostMzn += costMzn;
      }
    }

    const estimatedProfit = totalRevenue - totalCostMzn;

    // 5. Build HTML Report Email
    const isBalanceLow = providerBalance < 50.00;
    const balanceAlertStyle = isBalanceLow ? "background: #fee2e2; border-left: 4px solid #ef4444; color: #991b1b; padding: 15px; border-radius: 6px; margin: 20px 0;" : "background: #ecfdf5; border-left: 4px solid #10b981; color: #065f46; padding: 15px; border-radius: 6px; margin: 20px 0;";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; text-align: center;">📊 Relatório Diário de Vendas</h2>
        <p style="text-align: center; color: #6b7280; font-size: 14px;">SocialBoostMz - Resumo das últimas 24 horas</p>
        
        <div style="${balanceAlertStyle}">
          <strong>Saldo no Provedor (baratosociais.com):</strong><br />
          <span style="font-size: 20px; font-weight: bold;">${providerBalance.toFixed(2)} ${providerCurrency}</span>
          ${isBalanceLow ? "<br /><span style='font-size: 12px;'>⚠️ ATENÇÃO: Seu saldo está abaixo do limite de 50.00 BRL! Por favor, recarregue a conta do fornecedor para evitar que as ordens fiquem bloqueadas.</span>" : ""}
          ${balanceError ? `<br /><span style='font-size: 12px; color: #ef4444;'>Erro ao consultar saldo: ${balanceError}</span>` : ""}
        </div>

        <h3 style="color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">💰 Indicadores Financeiros</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr style="background: #f9fafb;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Faturação (MZN)</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #059669; font-weight: bold; font-size: 16px;">${totalRevenue.toLocaleString()} MZN</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Custo Fornecedor Est.</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626;">${totalCostMzn.toLocaleString()} MZN</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Lucro Estimado</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #7c3aed; font-weight: bold; font-size: 18px;">${estimatedProfit.toLocaleString()} MZN</td>
          </tr>
        </table>

        <h3 style="color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">📦 Status dos Pedidos</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; text-align: center;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #e5e7eb;">Total</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; color: #10b981;">Concluídos</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; color: #d97706;">Pendente/Process.</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; color: #ef4444;">Cancelados</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${totalOrders}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${completedOrders}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${pendingOrders + processingOrders}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${cancelledOrders}</td>
            </tr>
          </tbody>
        </table>

        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 35px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center;">Gerado automaticamente pelo SocialBoostMz</p>
      </div>
    `;

    // 6. Send Email Notification
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "SocialBoostMz", email: BREVO_SENDER_EMAIL },
        to: adminEmails.map(email => ({ email })),
        subject: `📊 Relatório Diário de Vendas - SocialBoostMz`,
        htmlContent,
      }),
    });

    if (!brevoResponse.ok) {
      console.error("Failed to send report email via Brevo:", await brevoResponse.text());
    }

    // 7. Send Pushcut Notification
    try {
      let pushText = `📊 Relatório Diário:\n🛒 Pedidos: ${totalOrders} | Lucro: ${estimatedProfit.toLocaleString()} MZN`;
      if (isBalanceLow) {
        pushText += `\n🚨 SALDO BAIXO NO PROVEDOR: ${providerBalance.toFixed(2)} BRL`;
      }
      await fetch("https://api.pushcut.io/LwrUR20CODgHBOG_HuUOK/notifications/Venda%20aprovada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pushText }),
      });
    } catch (pushErr) {
      console.error("Pushcut notification failed:", pushErr);
    }

    return new Response(JSON.stringify({ success: true, totalOrders, estimatedProfit }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Daily report failed:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

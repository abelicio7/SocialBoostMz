import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

async function authenticateApiKey(supabase: ReturnType<typeof createClient>, apiKey: string) {
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  // Check daily limit
  if (data.requests_today >= data.daily_limit) return null;

  // Increment request count and update last_used_at
  await supabase
    .from("api_keys")
    .update({
      requests_today: data.requests_today + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Extract API key from header
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return errorResponse("API key em falta. Use o header 'X-API-Key'.", 401);
  }

  // Authenticate
  const keyData = await authenticateApiKey(supabase, apiKey);
  if (!keyData) {
    return errorResponse("API key inválida, inactiva ou limite diário atingido.", 401);
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/reseller-api\/?/, "");

  try {
    // GET /services - List active services with reseller prices
    if (req.method === "GET" && (path === "services" || path === "")) {
      const { data: services, error } = await supabase
        .from("services")
        .select("id, name, platform, description, price_per_1000, min_quantity, max_quantity, daily_limit, estimated_time")
        .eq("is_active", true)
        .order("platform");

      if (error) return errorResponse("Erro ao buscar serviços", 500);

      const discountMultiplier = 1 - (Number(keyData.discount_percent) / 100);
      const servicesWithDiscount = services.map((s: any) => ({
        ...s,
        price_per_1000: Math.round(Number(s.price_per_1000) * discountMultiplier * 100) / 100,
        original_price_per_1000: undefined, // hide original
      }));

      return jsonResponse({ success: true, data: servicesWithDiscount });
    }

    // POST /orders - Create an order
    if (req.method === "POST" && path === "orders") {
      const body = await req.json();
      const { service_id, link, quantity } = body;

      if (!service_id || !link || !quantity) {
        return errorResponse("Campos obrigatórios: service_id, link, quantity");
      }

      // Get service
      const { data: service, error: svcErr } = await supabase
        .from("services")
        .select("*")
        .eq("id", service_id)
        .eq("is_active", true)
        .single();

      if (svcErr || !service) return errorResponse("Serviço não encontrado ou inactivo");

      if (quantity < service.min_quantity || quantity > service.max_quantity) {
        return errorResponse(`Quantidade deve ser entre ${service.min_quantity} e ${service.max_quantity}`);
      }

      // Calculate price with discount
      const discountMultiplier = 1 - (Number(keyData.discount_percent) / 100);
      const pricePerUnit = (Number(service.price_per_1000) * discountMultiplier) / 1000;
      const totalPrice = Math.round(pricePerUnit * quantity * 100) / 100;

      // Check balance
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("balance, is_blocked")
        .eq("id", keyData.user_id)
        .single();

      if (profErr || !profile) return errorResponse("Perfil não encontrado", 500);
      if (profile.is_blocked) return errorResponse("Conta bloqueada");
      if (Number(profile.balance) < totalPrice) {
        return errorResponse(`Saldo insuficiente. Necessário: ${totalPrice} MZN, Disponível: ${profile.balance} MZN`);
      }

      // Debit balance
      const newBalance = Number(profile.balance) - totalPrice;
      const { error: balErr } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", keyData.user_id);

      if (balErr) return errorResponse("Erro ao debitar saldo", 500);

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: keyData.user_id,
          service_id,
          link,
          quantity,
          total_price: totalPrice,
          status: "pending",
        })
        .select("id, status, quantity, total_price, link, created_at")
        .single();

      if (orderErr) {
        // Rollback balance
        await supabase.from("profiles").update({ balance: profile.balance }).eq("id", keyData.user_id);
        return errorResponse("Erro ao criar pedido", 500);
      }

      // Create transaction
      await supabase.from("wallet_transactions").insert({
        user_id: keyData.user_id,
        amount: totalPrice,
        type: "order_payment",
        description: `Pedido API: ${service.name} x${quantity}`,
        order_id: order.id,
      });

      return jsonResponse({ success: true, data: order }, 201);
    }

    // GET /orders/:id - Get order status
    if (req.method === "GET" && path.startsWith("orders/")) {
      const orderId = path.replace("orders/", "");

      const { data: order, error } = await supabase
        .from("orders")
        .select("id, status, quantity, total_price, link, created_at, updated_at")
        .eq("id", orderId)
        .eq("user_id", keyData.user_id)
        .single();

      if (error || !order) return errorResponse("Pedido não encontrado", 404);

      return jsonResponse({ success: true, data: order });
    }

    // GET /orders - List all orders
    if (req.method === "GET" && path === "orders") {
      const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
      const offset = Number(url.searchParams.get("offset") || 0);

      const { data: orders, error, count } = await supabase
        .from("orders")
        .select("id, status, quantity, total_price, link, created_at, updated_at", { count: "exact" })
        .eq("user_id", keyData.user_id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return errorResponse("Erro ao buscar pedidos", 500);

      return jsonResponse({ success: true, data: orders, total: count, limit, offset });
    }

    // GET /balance - Get account balance
    if (req.method === "GET" && path === "balance") {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", keyData.user_id)
        .single();

      if (error || !profile) return errorResponse("Erro ao buscar saldo", 500);

      return jsonResponse({
        success: true,
        data: {
          balance: Number(profile.balance),
          currency: "MZN",
        },
      });
    }

    return errorResponse("Endpoint não encontrado", 404);
  } catch (err) {
    console.error("API Error:", err);
    return errorResponse("Erro interno do servidor", 500);
  }
});

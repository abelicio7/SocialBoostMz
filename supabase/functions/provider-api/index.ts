import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDER_API_URL = "https://baratosociais.com/api/v2";

async function providerRequest(action: string, params: Record<string, string> = {}) {
  const apiKey = Deno.env.get("PROVIDER_API_KEY");
  if (!apiKey) throw new Error("PROVIDER_API_KEY not configured");

  const body = new URLSearchParams({ key: apiKey, action, ...params });

  const res = await fetch(PROVIDER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Provider returned invalid JSON: ${text.substring(0, 200)}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Check admin role using service role client
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/provider-api\/?/, "");

    // Support both path-based routing and body-based action
    let body: any = {};
    if (req.method === "POST") {
      body = await req.json().catch(() => ({}));
    }
    const action = body?.action || path;
    // POST /order - Create order at provider
    if (action === "order") {
      const { service_id, link, quantity } = body;
      console.log(`Creating provider order: service=${service_id}, link=${link}, qty=${quantity}`);
      const result = await providerRequest("add", {
        service: service_id.toString(),
        link,
        quantity: quantity.toString(),
      });
      console.log("Provider order result:", JSON.stringify(result));
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /status - Check order status at provider
    if (action === "status") {
      const { order_id } = body;
      const result = await providerRequest("status", { order: order_id.toString() });
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Admin-only actions ---
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /services - Fetch services from provider
    if (action === "services") {
      const result = await providerRequest("services");
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /balance - Check provider balance
    if (action === "balance") {
      const result = await providerRequest("balance");
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch live BRL→MZN exchange rate and optionally save it
    if (action === "exchange-rate") {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/BRL");
        const data = await res.json();
        if (data?.result === "success" && data?.rates?.MZN) {
          const rate = data.rates.MZN;
          // Save to platform_settings if auto mode
          await supabaseAdmin
            .from("platform_settings")
            .update({ 
              exchange_rate_brl_mzn: rate, 
              exchange_rate_updated_at: new Date().toISOString() 
            })
            .eq("id", "main");
          return new Response(JSON.stringify({ success: true, rate }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("Failed to fetch exchange rate");
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Provider API Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

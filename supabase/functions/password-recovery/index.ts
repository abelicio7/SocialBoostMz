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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const { action, email, code, new_password } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "E-mail em falta" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Action 1: Request Code
    if (action === "request") {
      // 1. Verify user exists in auth
      const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;

      const foundUser = usersData.users.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
      if (!foundUser) {
        return new Response(JSON.stringify({ error: "Nenhuma conta encontrada com este e-mail." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Generate a random 6-digit code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Delete existing codes and insert new one
      await supabase.from("password_recovery_codes").delete().eq("email", normalizedEmail);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Valid for 15 mins

      const { error: insertErr } = await supabase.from("password_recovery_codes").insert({
        email: normalizedEmail,
        code: otpCode,
        expires_at: expiresAt.toISOString(),
      });
      if (insertErr) throw insertErr;

      // 4. Send recovery email via Brevo SMTP
      const brevoApiKey = Deno.env.get("BREVO_API_KEY");
      const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL") || "suporte@socialboostmz.com";

      if (!brevoApiKey) {
        console.error("BREVO_API_KEY environment variable is not configured.");
        return new Response(JSON.stringify({ error: "Serviço de e-mail não configurado." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "SocialBoostMz", email: brevoSenderEmail },
          to: [{ email: normalizedEmail }],
          subject: "🔑 Código de Recuperação de Senha",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; text-align: center;">🔑 Código de Recuperação de Senha</h2>
              <p>Olá,</p>
              <p>Recebemos um pedido para redefinir a palavra-passe da sua conta no <strong>SocialBoostMz</strong>.</p>
              <p>Utilize o código de verificação abaixo para prosseguir com a recuperação:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f59e0b; background: #fffbeb; border: 1px dashed #f59e0b; padding: 10px 20px; border-radius: 8px;">
                  ${otpCode}
                </span>
              </div>
              
              <p style="color: #6b7280; font-size: 13px;">Este código é válido por <strong>15 minutos</strong>. Se não solicitou a redefinição de palavra-passe, pode ignorar este e-mail com segurança.</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">SocialBoostMz - Impulsione suas redes sociais</p>
            </div>
          `,
        }),
      });

      if (!brevoRes.ok) {
        const errText = await brevoRes.text();
        console.error("Brevo API error:", errText);
        throw new Error("Erro ao enviar email via Brevo: " + errText);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action 2: Reset Password
    if (action === "reset") {
      if (!code || !new_password) {
        return new Response(JSON.stringify({ error: "Dados em falta (código ou nova palavra-passe)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1. Fetch and verify code from DB
      const { data: codeData, error: codeErr } = await supabase
        .from("password_recovery_codes")
        .select("*")
        .eq("email", normalizedEmail)
        .eq("code", code.trim())
        .maybeSingle();

      if (codeErr || !codeData) {
        return new Response(JSON.stringify({ error: "Código de verificação incorreto ou inválido." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Check expiration
      if (new Date() > new Date(codeData.expires_at)) {
        return new Response(JSON.stringify({ error: "Código de verificação expirado. Solicite um novo." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 3. Find user and update password
      const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;

      const foundUser = usersData.users.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
      if (!foundUser) {
        return new Response(JSON.stringify({ error: "Utilizador não encontrado." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabase.auth.admin.updateUserById(foundUser.id, {
        password: new_password,
      });
      if (updateErr) throw updateErr;

      // 4. Delete codes
      await supabase.from("password_recovery_codes").delete().eq("email", normalizedEmail);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("recovery error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

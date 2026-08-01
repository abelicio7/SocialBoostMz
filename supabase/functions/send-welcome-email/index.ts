import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured");
    }
    const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") || "suporte@socialboostmz.com";

    const { email, fullName } = await req.json();
    if (!email) {
      throw new Error("Email is required");
    }

    const customerName = fullName || "Cliente";

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "SocialBoostMz", email: BREVO_SENDER_EMAIL },
        to: [{ email, name: customerName }],
        subject: "🚀 Bem-vindo à SocialBoostMz!",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">🚀 Bem-vindo à SocialBoostMz!</h2>
            <p>Olá, <strong>${customerName}</strong>,</p>
            <p>Seja muito bem-vindo à maior plataforma de engajamento e marketing de redes sociais de Moçambique!</p>
            
            <p>Aqui está como pode começar a impulsionar os seus perfis em 3 passos simples:</p>
            
            <ol style="line-height: 1.6;">
              <li><strong>Carregar a sua Carteira:</strong> Aceda à secção "Adicionar Saldo" no seu painel e utilize métodos seguros como M-Pesa, e-Mola ou cartões de débito.</li>
              <li><strong>Escolher um Serviço:</strong> Selecione a plataforma (Instagram, Facebook, YouTube, TikTok, etc.), o serviço desejado e a quantidade.</li>
              <li><strong>Ver os Resultados:</strong> Insira o link do seu perfil ou publicação, confirme o pedido e acompanhe a entrega em tempo real!</li>
            </ol>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px;">
              <strong>Precisa de Ajuda?</strong><br />
              Se tiver dúvidas ou precisar de suporte personalizado, fale connosco diretamente através da nossa secção de Suporte no painel ou envie um e-mail para <a href="mailto:${BREVO_SENDER_EMAIL}" style="color: #7c3aed;">${BREVO_SENDER_EMAIL}</a>.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://socialboostmz.com/dashboard" style="background: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Aceder ao Meu Painel</a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px; text-align: center;">SocialBoostMz - Impulsione suas redes sociais</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    if (!emailResponse.ok) {
      console.error("Brevo error:", JSON.stringify(emailResult));
      throw new Error(`Brevo API failed [${emailResponse.status}]: ${JSON.stringify(emailResult)}`);
    }

    console.log("Welcome email sent successfully to", email);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Welcome email error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

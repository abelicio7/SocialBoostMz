import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/EQNlPTLb15FJFqFWDwUiLI?mode=gi_t";

const WhatsAppFloat = () => {
  const { pathname } = useLocation();

  // Hide on dashboard and admin pages
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <a
      href={WHATSAPP_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Entrar no grupo WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] text-white shadow-[0_4px_20px_-4px_hsla(142,70%,45%,0.5)] hover:scale-110 hover:shadow-[0_6px_30px_-4px_hsla(142,70%,45%,0.6)] transition-all duration-300"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
};

export default WhatsAppFloat;

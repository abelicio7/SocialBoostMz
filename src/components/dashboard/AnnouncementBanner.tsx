import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Megaphone } from "lucide-react";

const AnnouncementBanner = () => {
  const { data: settings } = usePlatformSettings();

  if (!settings?.dashboard_announcement) return null;

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 animate-pulse">
          <Megaphone className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-primary text-lg">Comunicado Importante 📢</h3>
          <p className="text-foreground text-sm mt-1 whitespace-pre-line leading-relaxed">
            {settings.dashboard_announcement}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;

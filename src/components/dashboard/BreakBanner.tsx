import { useState, useEffect } from "react";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Coffee, Clock } from "lucide-react";

const BreakBanner = () => {
  const { data: settings } = usePlatformSettings();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!settings?.is_on_break || !settings.break_end_time) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(settings.break_end_time!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("A qualquer momento...");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      } else if (mins > 0) {
        setTimeLeft(`${mins}m ${secs}s`);
      } else {
        setTimeLeft(`${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [settings?.is_on_break, settings?.break_end_time]);

  if (!settings?.is_on_break) return null;

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-warning/10 border border-warning/20 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
          <Coffee className="w-6 h-6 text-warning" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-warning text-lg">Estamos em Intervalo</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {settings.break_message}
          </p>
          {settings.break_end_time && (
            <div className="flex items-center gap-2 mt-3">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-warning font-bold text-lg font-mono">
                {timeLeft}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreakBanner;

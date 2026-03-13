import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformSettings {
  id: string;
  is_on_break: boolean;
  break_end_time: string | null;
  break_message: string;
  updated_at: string;
  exchange_rate_brl_mzn: number;
  exchange_rate_auto: boolean;
  exchange_rate_updated_at: string | null;
}

export const usePlatformSettings = () => {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", "main")
        .single();

      if (error) throw error;
      return data as PlatformSettings;
    },
    refetchInterval: 30000,
  });
};

import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SyncableOrder {
  id: string;
  status: string;
  provider_order_id: string | null;
}

interface UseOrderStatusSyncOptions {
  orders?: SyncableOrder[] | null;
  queryKeys: ReadonlyArray<readonly unknown[]>;
  enabled?: boolean;
  intervalMs?: number;
}

const ACTIVE_STATUSES = new Set(["pending", "processing"]);

export const useOrderStatusSync = ({
  orders,
  queryKeys,
  enabled = true,
  intervalMs = 20000,
}: UseOrderStatusSyncOptions) => {
  const queryClient = useQueryClient();
  const isSyncingRef = useRef(false);

  const syncableOrderIds = useMemo(
    () =>
      (orders ?? [])
        .filter((order) => order.provider_order_id && ACTIVE_STATUSES.has(order.status))
        .map((order) => order.id),
    [orders]
  );

  const orderIdsKey = syncableOrderIds.join(",");
  const queryKeysKey = JSON.stringify(queryKeys);

  useEffect(() => {
    if (!enabled || syncableOrderIds.length === 0) return;

    let isMounted = true;

    const syncStatuses = async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const { error } = await supabase.functions.invoke("sync-order-status", {
          body: { order_ids: syncableOrderIds },
        });

        if (error) throw error;
        if (!isMounted) return;

        queryKeys.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [...queryKey] });
        });
      } catch (error) {
        console.error("Order sync polling failed:", error);
      } finally {
        isSyncingRef.current = false;
      }
    };

    syncStatuses();
    const intervalId = window.setInterval(syncStatuses, intervalMs);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [enabled, intervalMs, orderIdsKey, queryClient, queryKeys, queryKeysKey, syncableOrderIds]);
};

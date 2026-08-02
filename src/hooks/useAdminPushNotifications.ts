import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useAdminPushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !VAPID_PUBLIC_KEY) return;

    const registerAndSubscribe = async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.warn("Push notifications are not supported in this browser");
          return;
        }

        // 1. Wait for page load and check/register Service Worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("Service Worker registered on scope:", registration.scope);

        // 2. Request permission if not already prompt/denied
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            console.warn("Push notification permission denied by user");
            return;
          }
        } else if (Notification.permission === "denied") {
          console.warn("Push notification permission was previously denied");
          return;
        }

        // 3. Subscribe to Web Push
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
          });
        }

        console.log("Registered Push Subscription:", subscription);

        // 4. Save/Upsert subscription on Database
        const subscriptionJwk = subscription.toJSON();
        if (!subscriptionJwk.endpoint) return;

        const { error } = await supabase.from("admin_push_subscriptions").upsert(
          {
            user_id: user.id,
            endpoint: subscriptionJwk.endpoint,
            subscription: subscriptionJwk,
          },
          { onConflict: "endpoint" }
        );

        if (error) {
          console.error("Failed to upsert push subscription:", error);
        } else {
          console.log("Push subscription synchronized in database.");
        }
      } catch (err) {
        console.error("Error setting up Web Push:", err);
      }
    };

    // Delay slightly to avoid blocking critical initial loads
    const timer = setTimeout(registerAndSubscribe, 2000);
    return () => clearTimeout(timer);
  }, [user]);
}

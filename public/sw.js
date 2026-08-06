self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  // Try to parse payload from push event data
  let payloadData = null;
  if (event.data) {
    try {
      payloadData = event.data.json();
    } catch (e) {
      const text = event.data.text();
      if (text) {
        payloadData = { title: 'Novo pedido! 🛒', body: text };
      }
    }
  }

  // If payload exists and contains the price text, show it immediately
  if (payloadData && payloadData.body && (payloadData.body.includes('MT') || payloadData.body.includes('MZN'))) {
    const options = {
      body: payloadData.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [200, 100, 200],
      data: {
        url: payloadData.url || '/admin/pedidos'
      }
    };
    event.waitUntil(
      self.registration.showNotification(payloadData.title || 'Novo pedido! 🛒', options)
    );
    return;
  }

  // Fallback: Fetch the commission and ID of the latest order from Supabase RPC
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbHhrZnd6b21ram1saXVvZm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTI4NDUsImV4cCI6MjA5MzE2ODg0NX0.cut6lVM3PX7GMwniNwQ7X2i_rlXek-8_Jh2LeZOJZNE';
  const fetchPromise = fetch('https://mqlxkfwzomkjmliuofmv.supabase.co/rest/v1/rpc/get_latest_order_push_fallback', {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': 'Bearer ' + anonKey,
      'Content-Type': 'application/json'
    }
  })
  .then(function(res) {
    return res.json();
  })
  .then(function(resultData) {
    const commNum = Number(resultData?.commission);
    const commText = (!isNaN(commNum) && commNum >= 0)
      ? Math.max(0, Math.round(commNum)).toLocaleString() + ' MT'
      : '0 MT';
    const orderId = resultData?.order_id || '';

    const bodyText = 'Um novo pedido foi recebido na Plataforma\nComissão: ' + commText + ' - ' + orderId;

    return self.registration.showNotification('Novo pedido! 🛒', {
      body: bodyText,
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/admin/pedidos'
      }
    });
  })
  .catch(function(err) {
    console.error('Failed to fetch latest order push details:', err);
    return self.registration.showNotification('Novo pedido! 🛒', {
      body: 'Um novo pedido foi recebido na Plataforma.',
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/admin/pedidos'
      }
    });
  });

  event.waitUntil(fetchPromise);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';
  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// PWA compliance fetch event handler
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});

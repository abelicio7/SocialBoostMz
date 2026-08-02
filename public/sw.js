self.addEventListener('push', function(event) {
  let data = { title: 'Novo pedido! 🛒', body: 'Um novo pedido foi recebido na plataforma.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Novo pedido! 🛒', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || data.text || 'Detalhes do pedido não disponíveis.',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Novo pedido! 🛒', options)
  );
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

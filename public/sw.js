// Service Worker para Notificações e PWA - Logística JPatrício
const CACHE_NAME = 'logistica-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener para exibição e clique em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma aba aberta, foca nela
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não houver, abre o painel
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Listener para push notifications caso backend envie web-push
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Logística', body: event.data.text() };
    }
  }

  const title = data.title || '🚨 Atualização de Logística';
  const options = {
    body: data.body || 'Você tem novas atualizações no seu painel.',
    icon: 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1773232316/favicon-photoaidcom-cropped_hgixpq.png',
    badge: 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1773232316/favicon-photoaidcom-cropped_hgixpq.png',
    vibrate: [200, 100, 200, 100, 300],
    tag: data.tag || 'logistica-notification',
    renotify: true,
    data: data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

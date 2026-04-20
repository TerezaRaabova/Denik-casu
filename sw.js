// Service Worker pro Deník času
const CACHE_NAME = 'denik-casu-v4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Instalace - nacacheuj soubory
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.log('Cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Aktivace - smaž staré cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - offline podpora (cache first)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});

// Notifikace - přijetí zprávy z hlavní aplikace
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification('Deník času', {
      body: event.data.body || 'Co právě děláš? Zapiš si to ✍️',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'reminder',
      vibrate: [200, 100, 200],
      requireInteraction: false,
    });
  }
});

// Kliknutí na notifikaci - otevři aplikaci
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    })
  );
});

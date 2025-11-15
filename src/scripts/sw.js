import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { skipWaiting, clientsClaim } from 'workbox-core';

skipWaiting();
clientsClaim();

const API_ORIGIN = 'https://story-api.dicoding.dev';

precacheAndRoute(self.__WB_MANIFEST || []);

registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);

registerRoute(
  ({ request, url }) =>
    url.origin === API_ORIGIN && request.destination !== 'image',
  new NetworkFirst({
    cacheName: 'story-api-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) =>
    url.origin === API_ORIGIN && request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'story-image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
);

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Diterima.');

  let notificationTitle = 'Notifikasi Baru';
  let notificationOptions = {
    body: 'Anda memiliki pesan baru.',
    icon: 'images/icons/icon-192x192.png',
    badge: 'images/icons/icon-192x192.png',
    data: { url: '/#/home' },
    actions: [{ action: 'explore-action', title: 'Buka Aplikasi' }],
  };

  if (event.data) {
    try {
      const data = event.data.json();

      notificationTitle = data.title;
      notificationOptions.body = data.options.body;

      if (data.options.url) {
        notificationOptions.data.url = data.options.url;
      }

      console.log('[Service Worker] Push data (JSON):', data);
    } catch (e) {
      const textData = event.data.text();
      notificationOptions.body = textData;
      console.log('[Service Worker] Push data (Teks):', textData);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions),
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url;

  if (event.action === 'explore-action') {
    console.log('Action button clicked');
    event.waitUntil(clients.openWindow(urlToOpen));
  } else {
    console.log('Notification body clicked');
    event.waitUntil(clients.openWindow(urlToOpen));
  }
});

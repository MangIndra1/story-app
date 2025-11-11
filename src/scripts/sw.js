import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
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
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
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
  console.log('[Service Worker] Push Received.');
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Story App Notification',
      options: {
        body: event.data.text(),
      },
    };
  }

  const options = {
    body: data.options.body || 'Notifikasi baru dari Story App.',
    icon: 'images/icons/icon-192x192.png',
    badge: 'images/icons/icon-192x192.png',
    data: {
      url: data.options.url || '/#/home',
    },
    actions: [
      {
        action: 'explore-action',
        title: 'Lihat Cerita',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url;

  if (event.action === 'explore-action') {
    console.log('Action button clicked');
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  } else {
    console.log('Notification body clicked');
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});
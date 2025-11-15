import '../styles/styles.css';
import App from './pages/app';
import { Workbox } from 'workbox-window';
import SyncHelper from './utils/sync-helper';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  const skipLink = document.querySelector('.skip-link');
  const mainContent = document.querySelector('#main-content');

  if (skipLink && mainContent) {
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      mainContent.removeAttribute('tabindex');
    });
  }

  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('Service worker baru telah terinstal.');
        if (confirm('Aplikasi telah diperbarui. Muat ulang sekarang?')) {
          window.location.reload();
        }
      }
    });

    wb.register();
  }

  if (navigator.onLine) {
    console.log('Online saat memuat. Menjalankan sinkronisasi...');
    SyncHelper.syncOfflineStories();
  }

  window.addEventListener('online', () => {
    console.log('Koneksi kembali online! Menjalankan sinkronisasi...');
    SyncHelper.syncOfflineStories();
  });
});

import Swal from 'sweetalert2';
import StoryApi from '../data/story-api';

const VAPID_PUBLIC_KEY =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const PushNotificationHelper = {
  async _requestPermission() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Izin notifikasi tidak diberikan.');
    }
  },

  async subscribe() {
    await this._requestPermission();
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    try {
      const subscription =
        await serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

      const { endpoint, keys } = subscription.toJSON();
      await StoryApi.subbscribeNotification({ endpoint, keys }).then(() => {
        Swal.fire(
          'Berhasil!',
          'Anda telah berlangganan notifikasi.',
          'success',
        );
      });

      return subscription;
    } catch (error) {
      console.error('Gagal berlangganan:', error);
      const existingSubscription =
        await serviceWorkerRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Langganan sudah ada:', existingSubscription.toJSON());
        return existingSubscription;
      }
      Swal.fire('Gagal', 'Gagal berlangganan notifikasi.', 'error');
      throw error;
    }
  },

  async unsubscribe() {
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    const existingSubscription =
      await serviceWorkerRegistration.pushManager.getSubscription();

    if (!existingSubscription) {
      console.log('Tidak ada langganan untuk dihentikan.');
      Swal.fire('Info', 'Anda belum berlangganan notifikasi.', 'info');
      return;
    }

    try {
      await existingSubscription.unsubscribe();
      console.log('Berhasil berhenti berlangganan.');
      Swal.fire(
        'Berhasil!',
        'Anda telah berhenti berlangganan notifikasi.',
        'success',
      );
    } catch (error) {
      console.error('Gagal berhenti berlangganan:', error);
      Swal.fire('Gagal', 'Gagal berhenti berlangganan.', 'error');
    }
  },

  async isSubscribed() {
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    const existingSubscription =
      await serviceWorkerRegistration.pushManager.getSubscription();
    return !!existingSubscription;
  },
};

export default PushNotificationHelper;

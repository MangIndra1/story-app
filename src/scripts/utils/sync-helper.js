import DbHelper from './db-helper';
import StoryApi from '../data/story-api';
import Swal from 'sweetalert2';

function bufferToFile(buffer, type, name) {
  const blob = new Blob([buffer], { type: type });
  return new File([blob], name, { type: type });
}

const SyncHelper = {
  async syncOfflineStories() {
    console.log('Mencoba sinkronisasi cerita offline...');
    const stories = await DbHelper.getAllStories();

    if (stories.length === 0) {
      console.log('Tidak ada cerita di outbox untuk disinkronkan.');
      return;
    }

    Swal.fire({
      title: 'Sinkronisasi...',
      text: `Mengirim ${stories.length} cerita yang tersimpan offline...`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    let successCount = 0;
    let failCount = 0;

    for (const story of stories) {
      try {
        const photoFile = bufferToFile(
          story.photoBuffer,
          story.photoType,
          'offline-story.jpg',
        );

        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', photoFile);
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);

        await StoryApi.addStory(formData);

        await DbHelper.deleteStory(story.id);
        successCount++;
      } catch (error) {
        console.error(`Gagal sinkronisasi cerita ID ${story.id}:`, error);
        failCount++;
      }
    }

    Swal.close();

    if (successCount > 0) {
      Swal.fire({
        icon: 'success',
        title: 'Sinkronisasi Selesai!',
        text: `${successCount} cerita berhasil dikirim ke server.`,
      }).then(() => {
        window.location.hash = '#/home';
        window.location.reload();
      });
    } else if (failCount > 0 && successCount === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Sinkronisasi Gagal',
        text: 'Gagal mengirim cerita offline. Silakan periksa koneksi Anda dan coba lagi.',
      });
    }
  },
};

export default SyncHelper;

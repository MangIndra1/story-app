import DbHelper from './db-helper';
import StoryApi from '../data/story-api';
import Swal from 'sweetalert2';

// Helper untuk mengubah ArrayBuffer kembali menjadi File
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
      return; // Tidak ada yang perlu disinkronkan
    }

    // Tampilkan notifikasi bahwa sinkronisasi dimulai
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

    // Kirim setiap cerita satu per satu
    for (const story of stories) {
      try {
        // 1. Ubah data buffer kembali menjadi File
        const photoFile = bufferToFile(
          story.photoBuffer, 
          story.photoType, 
          'offline-story.jpg' // Nama file default
        );
        
        // 2. Buat FormData
        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', photoFile);
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);
        
        // 3. Kirim ke API
        await StoryApi.addStory(formData);
        
        // 4. Hapus dari IndexedDB jika berhasil
        await DbHelper.deleteStory(story.id);
        successCount++;
        
      } catch (error) {
        console.error(`Gagal sinkronisasi cerita ID ${story.id}:`, error);
        failCount++;
      }
    }

    // Tutup notifikasi loading
    Swal.close();

    // Berikan laporan hasil sinkronisasi
    if (successCount > 0) {
      Swal.fire({
        icon: 'success',
        title: 'Sinkronisasi Selesai!',
        text: `${successCount} cerita berhasil dikirim ke server.`,
      }).then(() => {
        // Muat ulang halaman untuk menampilkan cerita baru di Beranda
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
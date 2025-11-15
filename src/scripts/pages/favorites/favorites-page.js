import DbHelper from '../../utils/db-helper';
import Swal from 'sweetalert2';

export default class FavoritesPage {
  #stories = [];
  #container = null;

  async render() {
    return `
      <section class="container home-container">
        <h1>Cerita Tersimpan (Offline)</h1>
        <p class="info-offline">Cerita berikut disimpan di perangkat Anda menggunakan IndexedDB.</p>
        <div id="favorite-story-list" class="story-list">
          <p>Memuat cerita tersimpan...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#container = document.querySelector('#favorite-story-list');
    await this._loadAndRenderFavorites();

    this.#container.addEventListener('click', async (event) => {
      if (event.target.classList.contains('delete-favorite-button')) {
        const storyId = event.target.dataset.id;
        await this._deleteFavorite(storyId);
      }
    });
  }

  async _loadAndRenderFavorites() {
    try {
      this.#stories = await DbHelper.getAllFavorites();
      this._renderStoryList(this.#container);
    } catch (error) {
      console.error('Gagal memuat favorit:', error);
      this.#container.innerHTML =
        '<p style="color: red;">Gagal memuat cerita tersimpan.</p>';
    }
  }

  async _deleteFavorite(id) {
    try {
      await DbHelper.deleteFavorite(id);
      Swal.fire(
        'Dihapus!',
        'Cerita telah dihapus dari daftar tersimpan.',
        'success',
      );
      await this._loadAndRenderFavorites();
    } catch (error) {
      Swal.fire('Gagal', 'Gagal menghapus cerita.', 'error');
    }
  }

  _renderStoryList(container) {
    container.innerHTML = '';
    if (this.#stories.length === 0) {
      container.innerHTML = '<p>Anda belum menyimpan cerita apapun.</p>';
      return;
    }

    this.#stories.forEach((story) => {
      const storyElement = document.createElement('article');
      storyElement.classList.add('story-item');
      storyElement.innerHTML = `
        <img src="${story.photoUrl}" alt="Gambar untuk cerita ${story.name}" class="story-item__image">
        <div class="story-item__content">
          <h3 class="story-item__name">${story.name}</h3>
          <p class="story-item__date">${new Date(story.createdAt).toLocaleDateString('id-ID')}</p>
          <p class="story-item__description">${story.description}</p>
          
          <button 
            data-id="${story.id}" 
            class="button button-danger delete-favorite-button" 
            style="margin-top: 10px; width: 100%;">
            Hapus dari Favorit
          </button>
        </div>
      `;
      container.appendChild(storyElement);
    });
  }
}

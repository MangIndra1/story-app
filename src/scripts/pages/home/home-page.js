import DbHelper from '../../utils/db-helper';
import Swal from 'sweetalert2';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HomePresenter from '../../presenters/home-presenter';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default class HomePage {
  #presenter = null;
  #storyListElement = null;
  #favoriteIds = new Set();

  constructor() {
    this.#presenter = new HomePresenter({ view: this });
  }

  async render() {
    return `
      <section class="container home-container">
        <h1>Daftar Cerita</h1>
        <div id="story-list" class="story-list">
          <p>Memuat cerita...</p>
        </div>
        
        <h2>Lokasi Cerita</h2>
        <div id="story-map" class="story-map"></div>
      </section>
    `;
  }

  async afterRender() {
    this.#storyListElement = document.querySelector('#story-list');

    try {
      const favoriteStories = await DbHelper.getAllFavorites();
      this.#favoriteIds = new Set(favoriteStories.map((story) => story.id));

      await this.#presenter.fetchStories();

      this.#storyListElement.addEventListener('click', (event) => {
        const storyItem = event.target.closest('.story-item[data-id]');
        if (storyItem && !event.target.closest('.favorite-button-container')) {
          this._handleStoryItemInteraction(event.target);
          return;
        }

        const favoriteButton = event.target.closest('.favorite-button');
        if (favoriteButton) {
          const storyId = favoriteButton.dataset.id;
          this._handleFavoriteClick(storyId, favoriteButton);
        }
      });

      this.#storyListElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          if (event.target.classList.contains('story-item')) {
            event.preventDefault();
            this._handleStoryItemInteraction(event.target);
          }
        }
      });
    } catch (error) {
      console.error(error);
      this.#storyListElement.innerHTML = `<p style="color: red;">Gagal memuat cerita: ${error.message}</p>`;
      const mapElement = document.querySelector('#story-map');
      if (mapElement) mapElement.style.display = 'none';
    }
  }

  async _handleFavoriteClick(storyId, button) {
    const isFavorited = button.classList.contains('active');
    const story = this.#presenter.getStoryById(storyId);

    if (!story) {
      console.error('Data cerita tidak ditemukan untuk di-favorit');
      return;
    }

    if (isFavorited) {
      await DbHelper.deleteFavorite(storyId);
      button.classList.remove('active');
      button.innerHTML = '❤️ Simpan';
      Swal.fire('Dihapus', 'Cerita dihapus dari favorit.', 'info');
    } else {
      await DbHelper.putFavorite(story);
      button.classList.add('active');
      button.innerHTML = '✅ Tersimpan';
      Swal.fire('Tersimpan!', 'Cerita disimpan ke favorit.', 'success');
    }
  }

  _handleStoryItemInteraction(targetElement) {
    const storyItem = targetElement.closest('.story-item');
    if (storyItem && storyItem.dataset.id) {
      const storyId = storyItem.dataset.id;
      this.#presenter.focusMapToStory(storyId);
    }
  }

  showLoading() {
    if (this.#storyListElement) {
      this.#storyListElement.innerHTML = '<p>Memuat cerita...</p>';
    }
  }

  hideLoading() {}

  showError(message) {
    if (this.#storyListElement) {
      this.#storyListElement.innerHTML = `<p style="color: red;">${message}</p>`;
      const mapElement = document.querySelector('#story-map');
      if (mapElement) mapElement.style.display = 'none';
    }
  }

  renderStoryList(stories) {
    if (!this.#storyListElement) return;
    this.#storyListElement.innerHTML = '';

    if (stories.length === 0) {
      this.#storyListElement.innerHTML =
        '<p>Belum ada cerita yang dibagikan.</p>';
      return;
    }

    stories.forEach((story) => {
      const storyElement = document.createElement('article');
      const isFavorited = this.#favoriteIds.has(story.id);
      storyElement.classList.add('story-item');
      storyElement.setAttribute('data-id', story.id);
      storyElement.setAttribute('tabindex', '0');
      storyElement.setAttribute('role', 'button');
      storyElement.setAttribute(
        'aria-label',
        `Lihat detail cerita ${story.name}`,
      );
      storyElement.innerHTML = `
        <img src="${story.photoUrl}" alt="Gambar untuk cerita ${story.name}" class="story-item__image">
        
        <div class="favorite-button-container">
            <button 
                data-id="${story.id}" 
                class="favorite-button ${isFavorited ? 'active' : ''}" 
                aria-label="${isFavorited ? 'Hapus dari favorit' : 'Simpan ke favorit'}">
                ${isFavorited ? '✅ Tersimpan' : '❤️ Simpan'}
            </button>
        </div>

        <div class="story-item__content">
          <h3 class="story-item__name">${story.name}</h3>
          <p class="story-item__date">${new Date(story.createdAt).toLocaleDateString('id-ID')}</p>
          <p class="story-item__description">${story.description}</p>
        </div>
      `;
      this.#storyListElement.appendChild(storyElement);
    });
  }

  initializeMapBase() {
    const mapElement = document.querySelector('#story-map');
    if (!mapElement) {
      console.error('Map container #story-map not found!');
      return null;
    }

    if (this._mapInstance) {
      this._mapInstance.remove();
      this._mapInstance = null;
    }

    const initialCenter = [-2.5489, 118.0149];
    const initialZoom = 5;

    const osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    );
    const osmHotLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
      },
    );
    const esriWorldImagery = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
    );

    this._mapInstance = L.map(mapElement, {
      center: initialCenter,
      zoom: initialZoom,
      layers: [osmLayer],
    });

    const baseLayers = {
      OpenStreetMap: osmLayer,
      'OSM Humanitarian': osmHotLayer,
      'Satelit Esri': esriWorldImagery,
    };

    L.control.layers(baseLayers).addTo(this._mapInstance);

    return this._mapInstance;
  }

  createMarker(story, map) {
    return L.marker([story.lat, story.lon])
      .addTo(map)
      .bindPopup(
        `<b>${story.name}</b><br>${story.description.substring(0, 50)}...`,
      );
  }

  flyToMarker(map, latLng, zoom) {
    map.flyTo(latLng, zoom);
  }

  openMarkerPopup(marker) {
    marker.openPopup();
  }
}

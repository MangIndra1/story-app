import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HomePresenter from '../../presenters/home-presenter';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41],
    popupAnchor: [1, -34], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default class HomePage {
  #presenter = null;
  #storyListElement = null;

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
    
    await this.#presenter.fetchStories();

    this.#storyListElement.addEventListener('click', (event) => {
      this._handleStoryItemInteraction(event.target);
    });

    this.#storyListElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        if (event.target.classList.contains('story-item')) { 
           event.preventDefault();
           this._handleStoryItemInteraction(event.target);
        }
      }
    });
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

  hideLoading() {
    // Kita tidak perlu melakukan apa-apa di sini karena konten akan diganti
  }

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
      this.#storyListElement.innerHTML = '<p>Belum ada cerita yang dibagikan.</p>';
      return;
    }

    stories.forEach(story => {
      const storyElement = document.createElement('article');
      storyElement.classList.add('story-item');
      storyElement.setAttribute('data-id', story.id);
      storyElement.setAttribute('tabindex', '0');
      storyElement.setAttribute('role', 'button');
      storyElement.setAttribute('aria-label', `Lihat detail cerita ${story.name}`);
      storyElement.innerHTML = `
        <img src="${story.photoUrl}" alt="Gambar untuk cerita ${story.name}" class="story-item__image">
        <div class="story-item__content">
          <h3 class="story-item__name">${story.name}</h3>
          <p class="story-item__date">${new Date(story.createdAt).toLocaleDateString('id-ID')}</p>
          <p class="story-item__description">${story.description}</p>
        </div>
      `;
      this.#storyListElement.appendChild(storyElement);
    });
  }

  // === Metode Peta yang dipanggil oleh Presenter ===

  initializeMapBase() {
    const mapElement = document.querySelector('#story-map');
    if (!mapElement) {
        console.error('Map container #story-map not found!');
        return null;
    }

    // Hapus peta lama jika ada (penting untuk SPA)
    if (this._mapInstance) {
        this._mapInstance.remove();
        this._mapInstance = null;
    }

    const initialCenter = [-2.5489, 118.0149];
    const initialZoom = 5;

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    const osmHotLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    });
    const esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    this._mapInstance = L.map(mapElement, {
      center: initialCenter, zoom: initialZoom, layers: [osmLayer]
    });

    const baseLayers = {
      "OpenStreetMap": osmLayer, "OSM Humanitarian": osmHotLayer, "Satelit Esri": esriWorldImagery
    };

    L.control.layers(baseLayers).addTo(this._mapInstance);
    
    return this._mapInstance; // Kembalikan instance peta ke Presenter
  }

  createMarker(story, map) {
    return L.marker([story.lat, story.lon])
             .addTo(map)
             .bindPopup(`<b>${story.name}</b><br>${story.description.substring(0, 50)}...`);
  }
  
  flyToMarker(map, latLng, zoom) {
    map.flyTo(latLng, zoom);
  }
  
  openMarkerPopup(marker) {
    marker.openPopup();
  }
}
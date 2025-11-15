import StoryApi from '../data/story-api';

class HomePresenter {
  #view = null;
  #stories = [];
  #map = null;
  #markers = {};

  constructor({ view }) {
    this.#view = view;
  }

  getStoryById(storyId) {
    return this.#stories.find((story) => story.id === storyId);
  }

  async fetchStories() {
    this.#view.showLoading();
    try {
      this.#stories = await StoryApi.getStories();
      this.#view.renderStoryList(this.#stories);

      this._initializeMap();
    } catch (error) {
      console.error(error);
      this.#view.showError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }

  _initializeMap() {
    this.#map = this.#view.initializeMapBase();
    if (!this.#map) return;

    this.#markers = {};
    this.#stories.forEach((story) => {
      if (
        story.lat != null &&
        story.lon != null &&
        !isNaN(story.lat) &&
        !isNaN(story.lon)
      ) {
        try {
          const marker = this.#view.createMarker(story, this.#map);
          this.#markers[story.id] = marker;
        } catch (error) {
          console.error(
            `Gagal membuat marker untuk cerita ID ${story.id}:`,
            error,
          );
        }
      } else {
        console.warn(
          `Data lokasi tidak valid untuk cerita ID ${story.id}: lat=${story.lat}, lon=${story.lon}`,
        );
      }
    });
  }

  focusMapToStory(storyId) {
    const marker = this.#markers[storyId];
    if (marker && this.#map) {
      this.#view.flyToMarker(this.#map, marker.getLatLng(), 15);
      this.#view.openMarkerPopup(marker);
    } else {
      console.warn(`Marker untuk story ID ${storyId} tidak ditemukan.`);
    }
  }
}

export default HomePresenter;

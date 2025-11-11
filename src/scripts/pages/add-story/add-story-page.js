import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StoryApi from '../../data/story-api';
import Swal from 'sweetalert2';
import DbHelper from '../../utils/db-helper'; // Pastikan import DbHelper

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41],
    popupAnchor: [1, -34], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default class AddStoryPage {
  #map = null;
  #marker = null;
  #selectedLat = null;
  #selectedLon = null;
  #stream = null;
  #photoBlob = null;

  async render() {
    return `
      <section class="container add-story-container">
        <h1>Bagikan Cerita Baru Anda</h1>
        <form id="addStoryForm" class="add-story-form" novalidate>
          <div class="form-group">
            <label for="storyDescription">Deskripsi:</label>
            <textarea id="storyDescription" name="description" rows="5" required aria-describedby="descriptionError"></textarea>
            <div id="descriptionError" class="invalid-feedback">Deskripsi tidak boleh kosong.</div> 
          </div>
          <div class="form-group">
            <label>Foto Cerita:</label> 
            <div class="photo-source-buttons">
                 <label for="storyPhoto" class="button button-secondary">Unggah File</label>
                 <button type="button" id="useCameraButton" class="button button-secondary">Gunakan Kamera</button>
            </div>
            <input type="file" id="storyPhoto" name="photo" accept="image/*" aria-describedby="photoError" style="display: none;"> 
            <div id="photoError" class="invalid-feedback">Foto harus diunggah atau diambil.</div> 
            <div id="imagePreviewContainer" class="image-preview-container">
                 <img id="previewImage" src="#" alt="Pratinjau Gambar" class="image-preview"/>
                 <video id="cameraStream" class="camera-stream" autoplay playsinline></video> 
            </div>
            <div id="cameraControls" class="camera-controls" style="display: none;">
                <button type="button" id="captureButton" class="button button-primary">Ambil Foto</button>
                <button type="button" id="cancelCameraButton" class="button button-danger">Batal Kamera</button> 
            </div>
            <canvas id="photoCanvas" style="display: none;"></canvas>
          </div>
          <div class="form-group">
            <label>Pilih Lokasi di Peta:</label>
            <div id="locationPickerMap" class="location-picker-map" aria-describedby="locationError"></div>
            <input type="hidden" id="storyLatitude" name="lat">
            <input type="hidden" id="storyLongitude" name="lon">
            <small id="mapInstruction">Klik pada peta untuk memilih lokasi cerita Anda.</small>
            <div id="locationError" class="invalid-feedback" style="display: none;">Lokasi harus dipilih di peta.</div>
          </div>
          <button type="submit" class="button button-primary">Bagikan Cerita</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._initializeMap();
    this._setupFormSubmit();
    this._setupImagePreview();

    const useCameraButton = document.querySelector('#useCameraButton');
    const captureButton = document.querySelector('#captureButton');
    const cancelCameraButton = document.querySelector('#cancelCameraButton');

    useCameraButton.addEventListener('click', () => this._startCamera());
    captureButton.addEventListener('click', () => this._capturePhoto());
    cancelCameraButton.addEventListener('click', () => this._stopCamera());

    const descriptionInput = document.querySelector('#storyDescription');
    const photoInput = document.querySelector('#storyPhoto'); 
    descriptionInput.addEventListener('blur', (event) => this._validateField(event.target, 'descriptionError'));
    photoInput.addEventListener('blur', (event) => this._validateField(event.target, 'photoError'));
    descriptionInput.addEventListener('input', (event) => this._validateField(event.target, 'descriptionError'));
    photoInput.addEventListener('change', (event) => {
        this._validateField(event.target, 'photoError');
        this.#photoBlob = null; 
    });
  }

  async _startCamera() {
    const videoElement = document.querySelector('#cameraStream');
    const previewImage = document.querySelector('#previewImage');
    const cameraControls = document.querySelector('#cameraControls');
    const photoInput = document.querySelector('#storyPhoto');
    
    previewImage.classList.remove('active');
    videoElement.classList.add('active');
    cameraControls.style.display = 'flex';
    photoInput.value = ''; 
    this.#photoBlob = null; 

    try {
      if (this.#stream) { 
        this._stopCameraStreamTracks();
      }
      this.#stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
      });
      videoElement.srcObject = this.#stream;
      await videoElement.play(); 
      this._checkOverallValidity(); 
      this._validateField(photoInput, 'photoError'); 

    } catch (error) {
      console.error('Gagal mengakses kamera!', error);
      Swal.fire({ icon: 'error', title: 'Kamera Error', text: 'Tidak bisa mengakses kamera. Pastikan Anda memberikan izin.' });
      this._stopCamera(); 
    }
  }

  _capturePhoto() {
    const videoElement = document.querySelector('#cameraStream');
    const canvasElement = document.querySelector('#photoCanvas');
    const previewImage = document.querySelector('#previewImage');
    const photoInput = document.querySelector('#storyPhoto');

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    const context = canvasElement.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    canvasElement.toBlob((blob) => {
        this.#photoBlob = blob; 
        previewImage.src = URL.createObjectURL(blob); 

        photoInput.value = ''; 

        this._stopCamera(); 
        this._validateField(photoInput, 'photoError'); 
        this._checkOverallValidity(); 
    }, 'image/jpeg'); 
  }

  _stopCamera() {
    const videoElement = document.querySelector('#cameraStream');
    const previewImage = document.querySelector('#previewImage');
    const cameraControls = document.querySelector('#cameraControls');
    
    this._stopCameraStreamTracks(); 
    videoElement.srcObject = null; 
    
    videoElement.classList.remove('active');
    if (this.#photoBlob) {
        previewImage.classList.add('active'); 
    } else {
        previewImage.classList.remove('active'); 
    }
    cameraControls.style.display = 'none'; 
    this._checkOverallValidity(); 
  }
  
  _stopCameraStreamTracks() {
      if (this.#stream) {
          this.#stream.getTracks().forEach(track => track.stop());
          this.#stream = null;
      }
  }

  _validateField(inputElement, errorElementId) {
    const errorElement = document.querySelector(`#${errorElementId}`);
    let isValid = inputElement.checkValidity(); 

    if (inputElement.type === 'file' && inputElement.files.length === 0 && !this.#photoBlob) {
      isValid = false;
    }
    if (inputElement.tagName === 'TEXTAREA' && inputElement.value.trim() === '') {
        isValid = false;
    }

    if (!isValid) {
      inputElement.classList.add('is-invalid'); 
      errorElement.style.display = 'block'; 
      errorElement.textContent = inputElement.validationMessage || 'Input tidak valid.';
    } else {
      inputElement.classList.remove('is-invalid'); 
      errorElement.style.display = 'none'; 
      errorElement.textContent = ''; 
    }
    return isValid; 
  }

  _initializeMap() {
    const mapElement = document.querySelector('#locationPickerMap');
    if (!mapElement) return;

    // Hapus peta lama jika ada (penting untuk SPA)
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }

    this.#map = L.map(mapElement).setView([-2.5489, 118.0149], 5); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    this.#map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.#selectedLat = lat;
      this.#selectedLon = lng;

      document.querySelector('#storyLatitude').value = lat;
      document.querySelector('#storyLongitude').value = lng;

      if (this.#marker) {
        this.#map.removeLayer(this.#marker);
      }

      this.#marker = L.marker([lat, lng]).addTo(this.#map)
                      .bindPopup("Lokasi cerita dipilih.").openPopup();
      
      document.querySelector('#locationError').style.display = 'none';
      document.querySelector('#mapInstruction').style.display = 'none'; 
      this._checkOverallValidity(); 
    });
  }

  _setupImagePreview() {
      const photoInput = document.querySelector('#storyPhoto');
      const previewImage = document.querySelector('#previewImage');
      const videoElement = document.querySelector('#cameraStream');
      const cameraControls = document.querySelector('#cameraControls');

      previewImage.classList.remove('active');
      videoElement.classList.remove('active'); 

      photoInput.addEventListener('change', () => {
          this._stopCameraStreamTracks(); 
          videoElement.classList.remove('active');
          if (cameraControls) cameraControls.style.display = 'none'; 

          const file = photoInput.files[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                  previewImage.src = e.target.result;
                  previewImage.classList.add('active'); 
                  this.#photoBlob = null; 
              }
              reader.readAsDataURL(file);
          } else {
              previewImage.classList.remove('active'); 
          }
          this._validateField(photoInput, 'photoError');
          this._checkOverallValidity(); 
      });
  }

  // === FUNGSI BARU UNTUK KONVERSI BLOB ===
  _convertBlobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result); // Hasilnya adalah ArrayBuffer
      };
      reader.readAsArrayBuffer(blob);
    });
  }
  // ======================================

  _setupFormSubmit() {
    const addStoryForm = document.querySelector('#addStoryForm');
    
    const inputs = addStoryForm.querySelectorAll('textarea, input[type="file"]');
    inputs.forEach(input => {
      input.addEventListener('input', () => this._checkOverallValidity()); 
      input.addEventListener('blur', () => this._checkOverallValidity()); 
    });
    this._checkOverallValidity();

    addStoryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const descriptionInput = addStoryForm.elements.description;
      const photoInput = addStoryForm.elements.photo;
      const submitButton = addStoryForm.querySelector('button[type="submit"]');

      const isDescriptionValid = this._validateField(descriptionInput, 'descriptionError');
      const isPhotoValid = this._validateField(photoInput, 'photoError'); 
      let isLocationValid = true;
      if (!this.#selectedLat || !this.#selectedLon) {
        document.querySelector('#locationError').style.display = 'block';
        isLocationValid = false;
      } else {
        document.querySelector('#locationError').style.display = 'none';
      }

      const isFormValid = isDescriptionValid && isPhotoValid && isLocationValid;
      
      if (!isFormValid) {
        Swal.fire({ icon: 'warning', title: 'Input Tidak Valid', text: 'Periksa kembali semua isian yang ditandai.' });
        return; 
      }

      submitButton.disabled = true;
      submitButton.innerHTML = 'Mengunggah...';

      if (navigator.onLine) {
        // --- LOGIKA ONLINE ---
        try {
          const formData = new FormData();
          formData.append('description', descriptionInput.value);
          if (this.#photoBlob) {
              formData.append('photo', this.#photoBlob, 'camera-photo.jpg'); 
          } else {
              formData.append('photo', photoInput.files[0]);
          }
          formData.append('lat', this.#selectedLat);
          formData.append('lon', this.#selectedLon);
          
          await StoryApi.addStory(formData); 
          Swal.fire({
            icon: 'success', title: 'Berhasil!', text: 'Cerita baru berhasil dibagikan.', timer: 1500, showConfirmButton: false,
          }).then(() => {
            window.location.hash = '#/home'; 
          });
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'Upload Gagal', text: error.message || 'Terjadi kesalahan saat mengunggah cerita.' });
        } finally {
          submitButton.disabled = false;
          submitButton.innerHTML = 'Bagikan Cerita';
        }
      } else {
        // --- LOGIKA OFFLINE DENGAN PERBAIKAN ---
        console.log('Koneksi offline. Menyimpan cerita ke IndexedDB Outbox...');
        try {
          const photoData = this.#photoBlob || photoInput.files[0];
          
          // PERBAIKAN: Ubah foto menjadi ArrayBuffer sebelum disimpan
          const photoBuffer = await this._convertBlobToArrayBuffer(photoData);
          const photoType = photoData.type; // Simpan juga tipe file-nya

          await DbHelper.putStory({
            description: descriptionInput.value,
            photoBuffer: photoBuffer, // Simpan buffer
            photoType: photoType,     // Simpan tipe file
            lat: this.#selectedLat,
            lon: this.#selectedLon,
            createdAt: new Date().toISOString(),
          });
          
          Swal.fire({
            icon: 'info',
            title: 'Berhasil Disimpan!',
            text: 'Anda sedang offline. Cerita disimpan di Outbox dan akan dikirim saat koneksi kembali.',
          }).then(() => {
            addStoryForm.reset();
            this.#photoBlob = null;
            const previewImage = document.querySelector('#previewImage');
            if (previewImage) {
                previewImage.src = '#';
                previewImage.classList.remove('active');
            }
            window.location.hash = '#/home';
          });
          
        } catch (dbError) {
          console.error('Gagal menyimpan ke IndexedDB:', dbError);
          // Ini adalah error yang Anda lihat
          Swal.fire({ icon: 'error', title: 'Gagal Menyimpan', text: 'Gagal menyimpan cerita di perangkat Anda.' }); 
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Bagikan Cerita';
        }
      }
    });
  }
  
  _checkOverallValidity() {
    const addStoryForm = document.querySelector('#addStoryForm');
    const submitButton = addStoryForm.querySelector('button[type="submit"]'); 
    const descriptionInput = addStoryForm.elements.description;
    const photoInput = addStoryForm.elements.photo;

    if (!addStoryForm || !submitButton || !descriptionInput || !photoInput) return; // Tambahkan penjagaan

    const isBasicFormValid = descriptionInput.checkValidity() && descriptionInput.value.trim() !== '' && (photoInput.files.length > 0 || !!this.#photoBlob); 
    const isLocationSelected = !!(this.#selectedLat && this.#selectedLon);
    
    submitButton.disabled = !(isBasicFormValid && isLocationSelected);
  }
}
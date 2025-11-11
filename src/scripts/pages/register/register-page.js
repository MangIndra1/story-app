import StoryApi from '../../data/story-api';
import Swal from 'sweetalert2';

export default class RegisterPage {
  async render() {
    return `
      <section class="container register-container">
        <h1>Registrasi Akun Baru</h1>
        <form id="registerForm" class="auth-form" novalidate>
          <div class="form-group">
            <label for="registerName">Nama:</label>
            <input type="text" id="registerName" name="name" required>
            <div class="invalid-feedback">Nama tidak boleh kosong.</div>
          </div>
          <div class="form-group">
            <label for="registerEmail">Email:</label>
            <input type="email" id="registerEmail" name="email" required>
            <div class="invalid-feedback">Email tidak valid.</div>
          </div>
          <div class="form-group">
            <label for="registerPassword">Password:</label>
            <input type="password" id="registerPassword" name="password" required minlength="8">
            <div class="invalid-feedback">Password minimal 8 karakter.</div>
          </div>
          <button type="submit" class="button button-primary">Register</button>
        </form>
        <p class="auth-switch">Sudah punya akun? <a href="#/login">Login di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    console.log('RegisterPage afterRender executed');
    const registerForm = document.querySelector('#registerForm');

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!registerForm.checkValidity()) {
        registerForm.classList.add('was-validated');
        Swal.fire({
          icon: 'warning',
          title: 'Input Tidak Valid',
          text: 'Periksa kembali isian Anda.',
        });
        return;
      }

      const name = registerForm.elements.name.value;
      const email = registerForm.elements.email.value;
      const password = registerForm.elements.password.value;
      const registerButton = registerForm.querySelector('button');

      registerButton.disabled = true;
      registerButton.innerHTML = 'Memproses...';

      try {
        const response = await StoryApi.register({ name, email, password });

        Swal.fire({
          icon: 'success',
          title: 'Registrasi Berhasil!',
          text: response.message,
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          window.location.hash = '#/login';
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Registrasi Gagal',
          text: error.message || 'Terjadi kesalahan saat registrasi.',
        });
      } finally {
        registerButton.disabled = false;
        registerButton.innerHTML = 'Register';
      }
    });
  }
}

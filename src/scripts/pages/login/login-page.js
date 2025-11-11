import StoryApi from '../../data/story-api';
import AuthUtils from '../../utils/auth-utils';
import Swal from 'sweetalert2';

export default class LoginPage {
  async render() {
    return `
      <section class="container login-container">
        <h1>Login Pengguna</h1>
        <form id="loginForm" class="auth-form" novalidate>
          <div class="form-group">
            <label for="loginEmail">Email:</label>
            <input type="email" id="loginEmail" name="email" required>
            <div class="invalid-feedback">Email tidak valid.</div>
          </div>
          <div class="form-group">
            <label for="loginPassword">Password:</label>
            <input type="password" id="loginPassword" name="password" required minlength="8">
            <div class="invalid-feedback">Password minimal 8 karakter.</div>
          </div>
          <button type="submit" class="button button-primary">Login</button>
        </form>
        <p class="auth-switch">Belum punya akun? <a href="#/register">Register di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    console.log('LoginPage afterRender executed');
    const loginForm = document.querySelector('#loginForm');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!loginForm.checkValidity()) {
        loginForm.classList.add('was-validated');
        Swal.fire({
          icon: 'warning',
          title: 'Input Tidak Valid',
          text: 'Periksa kembali isian Anda.',
        });
        return;
      }

      const email = loginForm.elements.email.value;
      const password = loginForm.elements.password.value;
      const loginButton = loginForm.querySelector('button');

      loginButton.disabled = true;
      loginButton.innerHTML = 'Memproses...';

      try {
        const loginResult = await StoryApi.login({ email, password });

        AuthUtils.saveUserToken(loginResult.token);

        Swal.fire({
          icon: 'success',
          title: 'Login Berhasil!',
          text: `Selamat datang kembali, ${loginResult.name}!`,
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.hash = '#/home';
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: error.message || 'Terjadi kesalahan saat login.',
        });
      } finally {
        loginButton.disabled = false;
        loginButton.innerHTML = 'Login';
      }
    });
  }
}

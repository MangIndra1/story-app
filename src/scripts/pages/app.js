import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import AuthUtils from '../utils/auth-utils';
import PushNotificationHelper from '../utils/push-notification-helper';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #authNavigation = null;
  #currentPage = null;
  #pushToggle = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#authNavigation = document.querySelector('#auth-navigation');
    this.#pushToggle = document.querySelector('#pushToggle');

    if (!this.#content || !this.#drawerButton || !this.#navigationDrawer || !this.#authNavigation || !this.#pushToggle) {
      console.error('Initialization Error: One or more essential elements are missing!');
      throw new Error('Essential DOM elements not found during App initialization.'); 
    }

    this._setupDrawer();
    this._setupPushNotificationToggle();
  }

  async _updatePushToggleState() {
    const isSubscribed = await PushNotificationHelper.isSubscribed();
    this.#pushToggle.checked = isSubscribed;
  }

  _setupPushNotificationToggle() {
    this._updatePushToggleState();

    this.#pushToggle.addEventListener('change', async (event) => {
      const isChecked = event.target.checked;

      if (isChecked) {
        try {
          await PushNotificationHelper.subscribe();
        } catch (error) {
          console.error('Gagal subscribe:', error);
          event.target.checked = false;
        }
      } else {
        // Jika tidak dicentang, unsubscribe
        await PushNotificationHelper.unsubscribe();
      }
    });
  }

  _renderAuthNavigation() {
    const isLoggedIn = AuthUtils.isUserLoggedIn();
    if (!this.#authNavigation) return;

    this.#authNavigation.innerHTML = '';

    if (isLoggedIn) {
      this.#authNavigation.innerHTML = `
        <li class="nav__item">
          <button id="logout-button" class="button button-danger">Logout</button>
        </li>
      `;
      const logoutButton = this.#authNavigation.querySelector('#logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', () => {
          AuthUtils.clearUserToken();
          window.location.hash = '#/login';
        });
      } else {
        console.error('Logout button could not be found after rendering!');
      }
    } else {
      this.#authNavigation.innerHTML = `
        <li class="nav__item"><a href="#/login">Login</a></li>
        <li class="nav__item"><a href="#/register">Register</a></li>
      `;
    }
  }

  _setupDrawer() {
    if (this.#drawerButton) {
      this.#drawerButton.addEventListener('click', () => {
        if (this.#navigationDrawer) {
          this.#navigationDrawer.classList.toggle('open');
        }
      });
    }

    document.body.addEventListener('click', (event) => {
      if (
        this.#navigationDrawer &&
        this.#drawerButton &&
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      if (this.#navigationDrawer) {
        this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
          if (link.contains(event.target)) {
            this.#navigationDrawer.classList.remove('open');
          }
        });
      }
    });
  }

  async renderPage() {
    if (this.#currentPage && typeof this.#currentPage._stopCameraStreamTracks === 'function') {
      console.log('Stopping camera stream from previous page...');
      this.#currentPage._stopCameraStreamTracks();
    }

    this._renderAuthNavigation();
    const path = getActiveRoute();
    const isLoggedIn = AuthUtils.isUserLoggedIn();

    const protectedRoutes = ['/', '/home', '/add-story'];
    const publicOnlyRoutes = ['/login', '/register'];

    if (protectedRoutes.includes(path) && !isLoggedIn) {
      
      window.location.hash = '#/login';
      return;
    }
    if (publicOnlyRoutes.includes(path) && isLoggedIn) {
      
      window.location.hash = '#/home';
      return;
    }

    const page = routes[path] || routes['/'];

    const mainContent = this.#content;
    if (!mainContent) {
      console.error('Render Error: #main-content element is missing!');
      return;
    }

    if (!document.startViewTransition) {
      mainContent.innerHTML = await page.render();
      await page.afterRender();
      this._focusMainContent();
    } else {
      document.startViewTransition(async () => {
        mainContent.innerHTML = await page.render();
        await page.afterRender();
        this._focusMainContent();
      });
    }
    this.#currentPage = page;
  }

  _focusMainContent() {
    const mainContentElement = this.#content;
    if (mainContentElement) {
      mainContentElement.setAttribute('tabindex', '-1');
      mainContentElement.focus();
      mainContentElement.removeAttribute('tabindex');
    }
  }
}

export default App;

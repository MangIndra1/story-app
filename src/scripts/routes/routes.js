import HomePage from '../pages/home/home-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import AddStoryPage from '../pages/add-story/add-story-page';

const routes = {
  '/': new HomePage(), // Halaman default (HomePage)
  '/home': new HomePage(), // Rute eksplisit ke beranda (HomePage)
  '/login': new LoginPage(), // Rute ke halaman login (LoginPage)
  '/register': new RegisterPage(), // Rute ke halaman register (RegisterPage)
  '/add-story': new AddStoryPage(), // Rute ke halaman tambah cerita (AddStoryPage)
};

export default routes;

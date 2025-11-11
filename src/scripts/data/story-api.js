import AuthUtils from '../utils/auth-utils';

// Definisikan BASE_URL langsung di sini
const BASE_URL = 'https://story-api.dicoding.dev/v1';

const StoryApi = {
  async register({ name, email, password }) {
    // Gunakan BASE_URL (tanpa Config.)
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  async login({ email, password }) {
    // Gunakan BASE_URL
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson.loginResult;
  },

  async getStories() {
    const token = AuthUtils.getUserToken();
    if (!token) {
      throw new Error('Anda harus login untuk melihat cerita.');
    }

    // Gunakan BASE_URL
    const response = await fetch(`${BASE_URL}/stories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson.listStory;
  },

  async addStory(formData) {
    const token = AuthUtils.getUserToken();
    if (!token) {
      throw new Error('Anda harus login untuk menambahkan cerita.');
    }

    // Gunakan BASE_URL
    const response = await fetch(`${BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();

    if (!response.ok || responseJson.error) {
      throw new Error(responseJson.message || `HTTP error! status: ${response.status}`);
    }

    return responseJson;
  },
};

export default StoryApi;
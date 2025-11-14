import AuthUtils from '../utils/auth-utils';

const BASE_URL = 'https://story-api.dicoding.dev/v1';

const StoryApi = {
  async register({ name, email, password }) {
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

  async subbscribeNotification({ endpoint, keys: { p256dh, auth } }) {
    const token = AuthUtils.getUserToken();
    const data = JSON.stringify({
      endpoint,
      keys: { p256dh, auth },
    });
    const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: data,
    });
    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
  },
};

export default StoryApi;
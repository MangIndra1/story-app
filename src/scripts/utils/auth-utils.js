const AuthUtils = {
  saveUserToken(token) {
    sessionStorage.setItem('authToken', token);
  },

  getUserToken() {
    return sessionStorage.getItem('authToken');
  },

  clearUserToken() {
    sessionStorage.removeItem('authToken');
  },

  isUserLoggedIn() {
    return !!this.getUserToken();
  },
};

export default AuthUtils;

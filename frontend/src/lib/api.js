import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'https://priiyanka.onrender.com/api';

axios.defaults.baseURL = API;
axios.defaults.withCredentials = true;

// Header-based auth fallback: cross-domain (Hostinger frontend + Render backend)
// makes the session cookie a third-party cookie, which Safari/iOS block. If we
// have a saved token, send it as a Bearer header so auth still works there.
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
  }
};

export default API;

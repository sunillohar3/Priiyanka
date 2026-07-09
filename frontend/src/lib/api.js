import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'https://priiyanka.onrender.com/api';

axios.defaults.baseURL = API;
axios.defaults.withCredentials = true;

export default API;

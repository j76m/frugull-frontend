import axios from 'axios';

// Backend base URL — set VITE_API_URL in your .env file.
// Local dev: your backend runs on http://localhost:3000 (or whatever port
// your ~/Documents/frugull-backend npm run dev prints).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach session token to every request, if we have one.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('frugull_session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever says our session is invalid/expired, clear it
// locally so the app falls back to the login screen instead of
// silently failing every request.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('frugull_session_token');
      localStorage.removeItem('frugull_user');
    }
    return Promise.reject(error);
  }
);

export default client;

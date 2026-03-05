import axios from 'axios';

// Resolve API root (Vite env or fallback)
const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env.VITE_API_URL || import.meta.env.API_URL)) || '';
const BASE = (API_ROOT.replace(/\/$/, '') || '') + '/auth';

// initialize axios auth header from localStorage
const tokenInStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
if (tokenInStorage) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${tokenInStorage}`;
}

export async function login(credentials) {
  const res = await axios.post(`${BASE}/login`, credentials);
  if (res && res.data && res.data.token) {
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
  }
  return res.data;
}

export async function register(payload) {
  const res = await axios.post(`${BASE}/register`, payload);
  if (res && res.data && res.data.token) {
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
  }
  return res.data;
}

export function logout() {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
}

export function getToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
}

export default { login, register, logout, getToken };

import axios from 'axios';

// Resolve API root (Vite env or fallback)
const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env.VITE_API_URL || import.meta.env.API_URL)) || '';
const BASE = (API_ROOT.replace(/\/$/, '') || '') + '/auth';

// initialize axios auth header from localStorage
const tokenInStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
if (tokenInStorage) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${tokenInStorage}`;
}

export function parseJwt(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(payload).split('').map((c) => (`%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)).join(''));
    return JSON.parse(json);
  } catch (_e) {
    return null;
  }
}

export function getAuthPayload() {
  const token = getToken();
  return parseJwt(token);
}

export async function login(credentials) {
  const res = await axios.post(`${BASE}/login`, credentials);
  if (res && res.data && res.data.token) {
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    window.dispatchEvent(new Event('auth-changed'));
  }
  return res.data;
}

export async function register(payload) {
  const res = await axios.post(`${BASE}/register`, payload);
  if (res && res.data && res.data.token) {
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    window.dispatchEvent(new Event('auth-changed'));
  }
  return res.data;
}

export function logout() {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
  window.dispatchEvent(new Event('auth-changed'));
}

export function getToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
}

export default { login, register, logout, getToken, parseJwt, getAuthPayload };

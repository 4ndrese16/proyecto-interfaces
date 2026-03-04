// API helpers for color palettes using axios
import axios from 'axios';

// Resolve API root from env. Prefer VITE_API_URL for Vite setups, fallback to API_URL.
const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
  || (typeof process !== 'undefined' && process.env.API_URL)
  || '';

const defaultBase = (API_ROOT ? API_ROOT.replace(/\/$/, '') : '') + '/colorPalettes';

// axios instance with simple interceptor
function createClient(baseURL = defaultBase) {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' }
  });

  // request interceptor (placeholder for auth)
  client.interceptors.request.use(cfg => {
    // e.g., attach auth token if present
    // const token = localStorage.getItem('token');
    // if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  }, err => Promise.reject(err));

  // response interceptor: pass through, axios will throw on non-2xx
  client.interceptors.response.use(r => r, err => Promise.reject(err));

  return client;
}

// Mapping between frontend (CSS-style) keys and backend Sequelize model keys
const KEY_MAP = {
  main_bg_color: 'main_bg_background',
  secondary_color: 'secondary_background',
  accent_color: 'accent_color',
  text_color: 'text_color',
  alternate_text_color: 'alternate_text_color',
  name: 'name',
  id: 'id'
};

function mapToBackend(obj = {}) {
  const out = {};
  Object.keys(obj).forEach(k => {
    const bk = KEY_MAP[k] || k;
    out[bk] = obj[k];
  });
  return out;
}

function mapFromBackend(obj = {}) {
  const out = {};
  Object.keys(obj).forEach(k => {
    const fk = Object.keys(KEY_MAP).find(key => KEY_MAP[key] === k) || k;
    out[fk] = obj[k];
  });
  return out;
}

export async function getDefault(apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.get('/default');
  return mapFromBackend(res.data);
}

export async function getPublic(apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.get('/public');
  // expect array
  return Array.isArray(res.data) ? res.data.map(mapFromBackend) : [];
}

export async function getAll(apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.get('/');
  return Array.isArray(res.data) ? res.data.map(mapFromBackend) : [];
}

export async function getById(id, apiBase = defaultBase) {
  if (!id) throw new Error('id required');
  const client = createClient(apiBase);
  const res = await client.get(`/${id}`);
  return mapFromBackend(res.data);
}

export async function createPalette(payload, apiBase = defaultBase) {
  const client = createClient(apiBase);
  const backendPayload = mapToBackend(payload);
  const res = await client.post('/', backendPayload);
  return mapFromBackend(res.data);
}

export async function updatePalette(id, payload, apiBase = defaultBase) {
  if (!id) throw new Error('id required');
  const client = createClient(apiBase);
  const backendPayload = mapToBackend(payload);
  const res = await client.put(`/${id}`, backendPayload);
  return mapFromBackend(res.data);
}

export default {
  getDefault,
  getById,
  createPalette,
  updatePalette
};

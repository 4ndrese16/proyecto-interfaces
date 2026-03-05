import axios from 'axios';

// Resolve API root from env (Vite or process env)
const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
  || (typeof process !== 'undefined' && process.env.API_URL)
  || '';

const defaultBase = (API_ROOT ? API_ROOT.replace(/\/$/, '') : '') + '/typography';

function createClient(baseURL = defaultBase) {
  const client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
  client.interceptors.request.use(cfg => cfg, e => Promise.reject(e));
  client.interceptors.response.use(r => r, e => Promise.reject(e));
  return client;
}

function mapFromBackend(obj = {}) {
  // Map backend names to frontend-friendly keys if needed (keep simple)
  return { ...obj };
}

export async function getActive(apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.get('/active');
  return mapFromBackend(res.data);
}

export async function getAll(apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.get('/');
  return Array.isArray(res.data) ? res.data.map(mapFromBackend) : [];
}

export async function createTypography(payload, apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.post('/', payload);
  return mapFromBackend(res.data);
}

export async function updateTypography(id, payload, apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.put(`/${id}`, payload);
  return mapFromBackend(res.data);
}

export async function setActive(id, apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.put(`/active/${id}`);
  return res.data;
}

export default { getActive, getAll, createTypography, updateTypography, setActive };

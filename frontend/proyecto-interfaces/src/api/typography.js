import axios from 'axios';

// Resolve API root from env (Vite or process env)
const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
  || (typeof process !== 'undefined' && process.env.API_URL)
  || '';

const defaultBase = (API_ROOT ? API_ROOT.replace(/\/$/, '') : '') + '/typography';

function createClient(baseURL = defaultBase) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use(cfg => {
    try {
      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;
      if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
    } catch (e) {
      // ignore auth header errors
    }
    return cfg;
  }, e => Promise.reject(e));
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
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
  const res = await client.post('/', payload, {
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' }
  });
  return mapFromBackend(res.data);
}

export async function updateTypography(id, payload, apiBase = defaultBase) {
  const client = createClient(apiBase);
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
  const res = await client.put(`/${id}`, payload, {
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' }
  });
  return mapFromBackend(res.data);
}

export async function setActive(id, apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.put(`/active/${id}`);
  return res.data;
}

export async function deleteTypography(id, apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.delete(`/${id}`);
  return res.data;
}

export default { getActive, getAll, createTypography, updateTypography, setActive, deleteTypography };

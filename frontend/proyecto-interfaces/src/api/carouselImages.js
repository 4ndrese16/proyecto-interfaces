import axios from 'axios';

const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
  || (typeof process !== 'undefined' && process.env.API_URL)
  || '';

const defaultBase = (API_ROOT ? API_ROOT.replace(/\/$/, '') : '') + '/carousel-images';

function createClient(baseURL = defaultBase) {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((cfg) => {
    try {
      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;
      if (token) {
        cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
      }
    } catch (_e) {
      // Ignore localStorage access errors.
    }
    return cfg;
  }, (e) => Promise.reject(e));

  return client;
}

export async function getCarouselImages() {
  const client = createClient();
  const res = await client.get('/');
  return res.data;
}

export async function addCarouselImage(formData) {
  const client = createClient();
  const res = await client.post('/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

export async function deleteCarouselImage(id) {
  const client = createClient();
  const res = await client.delete(`/${id}`);
  return res.data;
}

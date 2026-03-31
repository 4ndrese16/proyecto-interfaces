import axios from 'axios';

const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
  || (typeof process !== 'undefined' && process.env.API_URL)
  || '';

const defaultBase = (API_ROOT ? API_ROOT.replace(/\/$/, '') : '') + '/printer-profile';

function createClient(baseURL = defaultBase) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use((cfg) => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
    } catch (_e) {
      // ignore auth access issues
    }
    return cfg;
  });
  return client;
}

export async function getPrinterProfile(apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.get('/');
  return res.data;
}

export async function savePrinterProfile(payload, apiBase = defaultBase) {
  const client = createClient(apiBase);
  const res = await client.put('/', payload, { headers: { 'Content-Type': 'application/json' } });
  return res.data;
}

export default { getPrinterProfile, savePrinterProfile };

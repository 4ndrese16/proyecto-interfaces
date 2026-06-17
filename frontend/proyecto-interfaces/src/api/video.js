import axios from 'axios';

const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
	|| (typeof process !== 'undefined' && process.env.API_URL)
	|| '';

const defaultBase = (API_ROOT ? API_ROOT.replace(/\/$/, '') : '') + '/videos';

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

	client.interceptors.response.use((r) => r, (e) => Promise.reject(e));
	return client;
}

export async function getVideo(apiBase = defaultBase) {
	const client = createClient(apiBase);
	const res = await client.get('/');
	return res.data;
}

export async function saveVideo(formData, apiBase = defaultBase) {
	const client = createClient(apiBase);
	const res = await client.post('/', formData, {
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	});
	return res.data;
}

export async function updateVideo(formData, apiBase = defaultBase) {
	const client = createClient(apiBase);
	const res = await client.put('/', formData, {
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	});
	return res.data;
}
import axios from 'axios';

const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
	|| (typeof process !== 'undefined' && process.env.API_URL)
	|| '';

const defaultBase = (API_ROOT ? API_ROOT.replace(/\/$/, '') : '') + '/products';

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

export async function getAllProducts(params = {}, apiBase = defaultBase) {
	const client = createClient(apiBase);
	const res = await client.get('/', { params: { ...params, _ts: Date.now() } });
	return Array.isArray(res.data) ? res.data : [];
}

export async function getProductById(id, apiBase = defaultBase) {
	if (!id) throw new Error('id required');
	const client = createClient(apiBase);
	const res = await client.get(`/${id}`);
	return res.data;
}

export async function createProduct(payload, apiBase = defaultBase) {
	const client = createClient(apiBase);
	const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;

	const res = await client.post('/', payload, {
		headers: isFormData ? undefined : { 'Content-Type': 'application/json' }
	});

	return res.data;
}

export async function updateProduct(id, payload, apiBase = defaultBase) {
	if (!id) throw new Error('id required');
	const client = createClient(apiBase);
	const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;

	const res = await client.put(`/${id}`, payload, {
		headers: isFormData ? undefined : { 'Content-Type': 'application/json' }
	});

	return res.data;
}

export async function deleteProduct(id, apiBase = defaultBase) {
	if (!id) throw new Error('id required');
	const client = createClient(apiBase);
	const res = await client.delete(`/${id}`);
	return res.data;
}

export default {
	getAllProducts,
	getProductById,
	createProduct,
	updateProduct,
	deleteProduct
};

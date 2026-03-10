import { defineStore } from 'pinia';
import { getAll, getActive, setActive, deleteTypography } from '@/api/typography';

const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
	|| (typeof process !== 'undefined' && process.env.API_URL)
	|| '';

const API_ORIGIN = API_ROOT
	? API_ROOT.replace(/\/api\/?$/, '').replace(/\/$/, '')
	: '';

function resolveFontSource(pathValue) {
	if (!pathValue) return null;
	if (/^https?:\/\//i.test(pathValue)) return pathValue;
	if (pathValue.startsWith('/')) {
		return API_ORIGIN ? `${API_ORIGIN}${pathValue}` : pathValue;
	}
	return API_ORIGIN ? `${API_ORIGIN}/${pathValue}` : `/${pathValue}`;
}

function registerFont(familyName, sourceUrl, styleId) {
	if (!familyName || !sourceUrl || typeof document === 'undefined') return null;

	let styleTag = document.getElementById(styleId);
	if (!styleTag) {
		styleTag = document.createElement('style');
		styleTag.id = styleId;
		document.head.appendChild(styleTag);
	}

	styleTag.innerHTML = `@font-face { font-family: "${familyName}"; src: url(${sourceUrl}); font-display: swap; }`;
	return familyName;
}

export const useFontStore = defineStore('fonts', {
	state: () => ({
		items: [],
		activeId: null,
		loading: false,
		lastLoadedAt: null
	}),
	getters: {
		activeTypography: (state) => state.items.find((x) => x.id === state.activeId) || null
	},
	actions: {
		applyTypography(typography) {
			if (!typography || typeof document === 'undefined') return;

			const titleFamily = typography.font_title_name || 'Poppins';
			const bodyFamily = typography.font_body_name || 'Poppins';

			const titleSource = resolveFontSource(typography.font_title_path);
			const bodySource = resolveFontSource(typography.font_body_path);

			const registeredTitle = titleSource
				? registerFont(`${titleFamily}-${typography.id}-title`, titleSource, `global-font-title-${typography.id}`)
				: null;

			const registeredBody = bodySource
				? registerFont(`${bodyFamily}-${typography.id}-body`, bodySource, `global-font-body-${typography.id}`)
				: null;

			const root = document.documentElement;
			root.style.setProperty('--font-family-title', registeredTitle ? `"${registeredTitle}", sans-serif` : `${titleFamily}, sans-serif`);
			root.style.setProperty('--font-family-body', registeredBody ? `"${registeredBody}", sans-serif` : `${bodyFamily}, sans-serif`);
			root.style.setProperty('--h1-size', `${parseInt(typography.h1_size, 10) || 24}px`);
			root.style.setProperty('--h2-size', `${parseInt(typography.h2_size, 10) || 18}px`);
			root.style.setProperty('--p-size', `${parseInt(typography.p_size, 10) || 15}px`);
		},

		async load(admin = false) {
			this.loading = true;
			try {
				this.items = admin ? (await getAll()) || [] : [];

				const active = await getActive();
				this.activeId = active?.id || null;

				if (active) {
					this.applyTypography(active);

					if (admin && !this.items.some((x) => x.id === active.id)) {
						this.items = [active, ...this.items];
					}
				}

				this.lastLoadedAt = Date.now();
			} catch (error) {
				// Keep store resilient; table/form show user errors.
			} finally {
				this.loading = false;
			}
		},

		async setAsActive(id) {
			await setActive(id);
			this.activeId = id;

			const candidate = this.items.find((x) => x.id === id);
			if (candidate) {
				this.applyTypography(candidate);
			} else {
				const active = await getActive();
				if (active) this.applyTypography(active);
			}
		},

		async remove(id) {
			await deleteTypography(id);
			this.items = this.items.filter((x) => x.id !== id);

			if (this.activeId === id) {
				this.activeId = null;
				const active = await getActive();
				if (active) {
					this.activeId = active.id;
					this.applyTypography(active);
				}
			}
		}
	}
});

export default useFontStore;

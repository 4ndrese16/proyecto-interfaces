import { defineStore } from 'pinia';
import { getToken, parseJwt } from '@/api/auth';

const STORAGE_PREFIX = 'cart_items';

function getItemUnitPrice(item) {
  const preferred = Number(item.final_price ?? item.price ?? 0);
  return Number.isFinite(preferred) ? preferred : 0;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),

  getters: {
    totalItems: (state) => state.items.reduce((acc, item) => acc + Number(item.qty || 0), 0),
    subtotal: (state) => Number(state.items.reduce((acc, item) => acc + (getItemUnitPrice(item) * Number(item.qty || 0)), 0).toFixed(2))
  },

  actions: {
    getCurrentUserId() {
      const token = getToken();
      const payload = parseJwt(token);
      return payload?.id ? String(payload.id) : null;
    },

    getStorageKey() {
      const userId = this.getCurrentUserId();
      return userId ? `${STORAGE_PREFIX}:${userId}` : null;
    },

    load() {
      const key = this.getStorageKey();
      if (!key) {
        this.items = [];
        return;
      }

      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        this.items = Array.isArray(parsed) ? parsed : [];
      } catch (_e) {
        this.items = [];
      }
    },

    persist() {
      const key = this.getStorageKey();
      if (!key) return;

      try {
        localStorage.setItem(key, JSON.stringify(this.items));
      } catch (_e) {
        // ignore persistence errors
      }
    },

    addItem(product, variant = null, qty = 1) {
      if (!this.getCurrentUserId()) {
        return { ok: false, reason: 'auth-required' };
      }

      if (!product?.id) return { ok: false, reason: 'invalid-product' };

      const safeQty = Math.max(1, parseInt(qty, 10) || 1);
      const variantKey = variant?.color_name || 'default';
      const id = `${product.id}::${variantKey}`;

      const existing = this.items.find((item) => item.id === id);

      if (existing) {
        existing.qty += safeQty;
      } else {
        this.items.push({
          id,
          product_id: product.id,
          name: product.name || 'Producto',
          brand: product.brand || '',
          price: Number(product.price || 0),
          final_price: Number(product.final_price ?? product.price ?? 0),
          image_path: variant?.image_path || product.main_image_path || null,
          color_name: variant?.color_name || null,
          color_hex: variant?.color_hex || null,
          qty: safeQty
        });
      }

      this.persist();
      return { ok: true };
    },

    increase(id) {
      const found = this.items.find((item) => item.id === id);
      if (!found) return;
      found.qty += 1;
      this.persist();
    },

    decrease(id) {
      const found = this.items.find((item) => item.id === id);
      if (!found) return;
      found.qty = Math.max(1, Number(found.qty || 1) - 1);
      this.persist();
    },

    remove(id) {
      this.items = this.items.filter((item) => item.id !== id);
      this.persist();
    },

    clear() {
      this.items = [];
      this.persist();
    }
  }
});

export default useCartStore;
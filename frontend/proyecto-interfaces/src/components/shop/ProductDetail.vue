<template>
  <section class="product-detail py-4">
    <div class="container-fluid">
      <div v-if="loading" class="text-center py-5">Cargando producto...</div>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-else-if="!product" class="alert alert-light border">Producto no encontrado.</div>

      <div v-else class="row g-4 align-items-start">
        <div class="col-12 col-lg-6">
          <div class="image-box">
            <img :src="displayImage" :alt="product.name" class="main-image" />
          </div>        
        </div>

        <div class="col-12 col-lg-6">
          <h1 class="title mb-1">{{ product.name }}</h1>
          <p class="meta mb-2">{{ product.brand }} • {{ categoryLabel }}</p>

          <div class="mb-3">
            <span v-if="product.is_new" class="badge badge-new rounded-pill me-1">Nuevo</span>
            <span v-if="product.has_discount" class="badge badge-discount rounded-pill">-{{ product.discount_percentage
              }}%</span>
          </div>

          <div class="price-wrap mb-3">
            <span v-if="product.has_discount" class="old-price">{{ money(product.price) }}</span>
            <span class="new-price">{{ money(product.final_price ?? product.price) }}</span>
          </div>

          <p class="description">{{ product.description }}</p>

          <div class="d-flex gap-2 mt-4">
            <button class="btn btn-primary" @click="addToCart">Añadir al carrito</button>
            <router-link class="btn btn-outline-secondary" to="/catalogo">Volver al catalogo</router-link>

          </div>
          <div class="share-wrap mt-2" v-if="product.id">
            <button class="btn btn-outline-secondary btn-sm" type="button" @click="toggleShareMenu">
              <i class="fas fa-share-alt me-1"></i> Compartir
            </button>
            <div v-if="showShareMenu" class="share-menu">
              <button class="share-item" type="button" @click="shareTelegram">
                <i class="fab fa-telegram-plane me-1"></i> Telegram
              </button>
              <button class="share-item" type="button" @click="shareWhatsapp">
                <i class="fab fa-whatsapp me-1"></i> WhatsApp
              </button>
            </div>
          </div>

          <div v-if="variants.length" class="mt-3">
            <small class="d-block mb-2">Colores disponibles</small>
            <div class="swatches d-flex gap-2 flex-wrap">
              <button
                v-for="(variant, idx) in variants"
                :key="`${variant.color_name}-${idx}`"
                class="swatch"
                :class="{ active: idx === selectedVariantIndex }"
                :title="variant.color_name"
                :style="{ background: variant.color_hex || fallbackSwatchColor }"
                @click="selectedVariantIndex = idx"
              />
            </div>
            <small class="text-muted d-block mt-2">{{ activeVariant?.color_name || '' }}</small>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProductById } from '@/api/product';
import { useCartStore } from '@/stores/cartStore';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref(null);
const product = ref(null);
const selectedVariantIndex = ref(0);
const cartStore = useCartStore();
const showShareMenu = ref(false);
const fallbackSwatchColor = 'var(--secondary-color)';

const fallbackImage = new URL('@/assets/images/interfaces/xiaomi_15_ultra_product.png', import.meta.url).href;
const apiRoot = (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');

const buildAssetUrl = (pathValue) => {
  if (!pathValue) return null;
  if (/^https?:\/\//i.test(pathValue)) return pathValue;
  if (pathValue.startsWith('/')) return apiRoot ? `${apiRoot}${pathValue}` : pathValue;
  return apiRoot ? `${apiRoot}/${pathValue}` : `/${pathValue}`;
};

const variants = computed(() => Array.isArray(product.value?.variants) ? product.value.variants : []);
const activeVariant = computed(() => variants.value[selectedVariantIndex.value] || null);

const displayImage = computed(() => (
  buildAssetUrl(activeVariant.value?.image_path)
  || buildAssetUrl(product.value?.main_image_path)
  || fallbackImage
));

const categoryLabel = computed(() => product.value?.category === 'accesorio' ? 'Accesorio' : 'Telefono');

const money = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' });
};

const addToCart = () => {
  if (!product.value) return;
  const result = cartStore.addItem(product.value, activeVariant.value || null, 1);
  if (result?.ok) return;

  if (result?.reason === 'auth-required') {
    const shouldRedirect = window.confirm('Debes iniciar sesion para agregar productos al carrito. ¿Ir a login ahora?');
    if (shouldRedirect) {
      router.push({ path: '/login', query: { redirect: route.fullPath || '/catalogo' } });
    }
  }
};

const load = async () => {
  const id = route.params.id;
  if (!id) return;

  loading.value = true;
  error.value = null;
  product.value = null;
  selectedVariantIndex.value = 0;

  try {
    product.value = await getProductById(id);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'No se pudo cargar el producto';
  } finally {
    loading.value = false;
  }
};

watch(() => route.params.id, load);
onMounted(load);

const productPublicUrl = computed(() => {
  if (!product.value?.id) return '';
  if (typeof window === 'undefined') return `/producto/${product.value.id}`;
  return `${window.location.origin}/producto/${product.value.id}`;
});

const shareText = computed(() => {
  const name = product.value?.name || 'Producto';
  return `Mira este producto: ${name}`;
});

const toggleShareMenu = () => {
  showShareMenu.value = !showShareMenu.value;
};

const openShareUrl = (url) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
  showShareMenu.value = false;
};

const shareTelegram = () => {
  const text = encodeURIComponent(`${shareText.value} ${productPublicUrl.value}`);
  openShareUrl(`https://t.me/share/url?url=${encodeURIComponent(productPublicUrl.value)}&text=${text}`);
};

const shareWhatsapp = () => {
  const text = encodeURIComponent(`${shareText.value} ${productPublicUrl.value}`);
  openShareUrl(`https://wa.me/?text=${text}`);
};
</script>

<style scoped>
.product-detail {
  background: var(--main-bg-color);
  color: var(--text-color);
  padding: 0 10rem;
}

.image-box {
  border: 1px solid var(--text-color);
  border-radius: 8px;
  background: var(--main-bg-color);
  padding: 1rem;
}

.main-image {
  width: 100%;
  max-height: 480px;
  object-fit: contain;
}

.swatches {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--text-color);
  cursor: pointer;
}

.swatch.active {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

.title {
  font-family: var(--font-family-title);
}

.meta {
  opacity: 0.85;
}

.price-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.old-price {
  text-decoration: line-through;
  opacity: 0.75;
}

.new-price {
  font-size: calc(var(--h2-size) + 2px);
  font-weight: 700;
}

.badge-new {
  background: var(--accent-color);
  color: var(--alternate-text-color);
}

.badge-discount {
  background: var(--secondary-color);
  color: var(--alternate-text-color);
}

.btn-primary {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  border: none;
}

.btn-primary:hover {
  background: var(--accent-color);
  filter: brightness(0.9);
  border: none;
  color: var(--alternate-text-color);
}

.btn-outline-secondary {
  color: var(--text-color);
  border: 1px solid var(--text-color);
  background: var(--main-bg-color);
}

.btn-outline-secondary:hover {
  background: var(--secondary-color);
  color: var(--alternate-text-color);
  border: 1px solid var(--alternate-text-color);
}

.btn-outline-primary,
.btn-secondary {
  border: 1px solid var(--accent-color);
  background-color: var(--main-bg-color);
  color: var(--accent-color);
}

.btn-outline-primary:hover,
.btn-secondary:hover {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  border: 1px solid var(--accent-color);
}

.btn-outline-danger,
.btn-outline-danger:disabled,
.btn-danger {
  border: 1px solid var(--alternate-text-color);
  background-color: var(--secondary-color);
  color: var(--alternate-text-color);
}

.btn-outline-danger:hover,
.btn-danger:hover {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}

.share-wrap {
  position: relative;
  display: inline-block;
}

.share-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  min-width: 165px;
  border: 1px solid var(--text-color);
  border-radius: 8px;
  background: var(--main-bg-color);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  z-index: 6;
}

.share-item {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-color);
  text-align: left;
  padding: 8px 10px;
  cursor: pointer;
}

.share-item:hover {
  background: var(--secondary-color);
  color: var(--alternate-text-color);
}

.btn {
  font-size: var(--p-size);
}
</style>

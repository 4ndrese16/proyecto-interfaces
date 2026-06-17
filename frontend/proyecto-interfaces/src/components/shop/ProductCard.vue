<template>
    <div class="card h-100" style="width: 18rem;">
        <div class="img-wrap">
            <img :src="displayImage" class="card-img-top" :alt="product.name || 'Producto'">
            <span v-if="product.is_new" class="badge badge-new">Nuevo</span>
            <span v-if="product.has_discount" class="badge badge-discount">-{{ product.discount_percentage }}%</span>
        </div>

        <div class="card-body d-flex flex-column">
            <h3 class="card-header">{{ product.name || 'Producto' }}</h3>

            <p class="product-meta mb-1">{{ product.brand || 'Marca' }} • {{ categoryLabel }}</p>
            <p class="card-text mb-2">{{ shortDescription }}</p>

            <div class="price-wrap mb-2">
                <span v-if="product.has_discount" class="old-price">{{ money(product.price) }}</span>
                <span class="new-price">{{ money(product.final_price ?? product.price) }}</span>
            </div>

            <div v-if="normalizedVariants.length" class="variants mb-3">
                <small class="d-block mb-1">Colores:</small>
                <div class="swatches">
                    <button
                        v-for="(variant, idx) in normalizedVariants"
                        :key="`${variant.color_name}-${idx}`"
                        class="swatch"
                        :class="{ active: idx === selectedVariantIndex }"
                        :title="variant.color_name"
                        :style="{ background: variant.color_hex || fallbackSwatchColor }"
                        @click="selectedVariantIndex = idx"
                    />
                </div>
            </div>

            <div class="d-flex gap-2 mt-auto">
                <button class="btn btn-primary flex-fill" @click="addToCart">Añadir al carrito</button>
                <router-link
                    v-if="product.id"
                    class="btn btn-outline-secondary flex-fill"
                    :to="`/producto/${product.id}`"
                >
                    Ver detalle
                </router-link>
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
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cartStore';

const fallbackImage = new URL('@/assets/images/interfaces/xiaomi_15_ultra_product.png', import.meta.url).href;

const props = defineProps({
    product: {
        type: Object,
        default: () => ({})
    }
});

const cartStore = useCartStore();
const router = useRouter();
const route = useRoute();

const selectedVariantIndex = ref(0);
const showShareMenu = ref(false);
const fallbackSwatchColor = 'var(--secondary-color)';

const apiRoot = (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');

const buildAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return apiRoot ? `${apiRoot}${path}` : path;
    return apiRoot ? `${apiRoot}/${path}` : `/${path}`;
};

const normalizedVariants = computed(() => Array.isArray(props.product.variants) ? props.product.variants : []);

const activeVariant = computed(() => normalizedVariants.value[selectedVariantIndex.value] || null);

const displayImage = computed(() => (
    buildAssetUrl(activeVariant.value?.image_path)
    || buildAssetUrl(props.product.main_image_path)
    || fallbackImage
));

const categoryLabel = computed(() => props.product.category === 'accesorio' ? 'Accesorio' : 'Telefono');

const shortDescription = computed(() => {
    const text = String(props.product.description || 'Sin descripcion');
    return text.length > 88 ? `${text.slice(0, 88)}...` : text;
});

const productPublicUrl = computed(() => {
    if (!props.product?.id) return '';
    if (typeof window === 'undefined') return `/producto/${props.product.id}`;
    return `${window.location.origin}/producto/${props.product.id}`;
});

const shareText = computed(() => {
    const name = props.product?.name || 'Producto';
    return `Mira este producto: ${name}`;
});

const money = (value) => {
    const amount = Number(value || 0);
    return amount.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' });
};

const addToCart = () => {
    const variant = activeVariant.value || null;
    const result = cartStore.addItem(props.product, variant, 1);

    if (result?.ok) return;

    if (result?.reason === 'auth-required') {
        const shouldRedirect = window.confirm('Debes iniciar sesion para agregar productos al carrito. ¿Ir a login ahora?');
        if (shouldRedirect) {
            router.push({ path: '/login', query: { redirect: route.fullPath || '/catalogo' } });
        }
    }
};

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
.card {
    background: var(--main-bg-color);
    color: var(--text-color);
    border: 1px solid var(--text-color);
}

.img-wrap {
    position: relative;
}

.card-img-top {
    height: 220px;
    object-fit: contain;
    background: var(--main-bg-color);
}

.badge {
    position: absolute;
    top: 10px;
    padding: 4px 10px;
    font-size: var(--p-size);
    border-radius: 999px;
}

.badge-new {
    left: 10px;
    background: var(--accent-color);
    color: var(--alternate-text-color);
}

.badge-discount {
    right: 10px;
    background: var(--secondary-color);
    color: var(--alternate-text-color);
}

.card-header {
    font-family: var(--font-family-title);
    font-size: calc(var(--h2-size) - 1px);
    background: transparent;
    color: var(--text-color);
    padding: 0;
    border: 0;
    margin-bottom: 4px;
}

.product-meta {
    font-size: calc(var(--p-size) - 1px);
    color: var(--text-color);
    opacity: 0.8;
}

.card-text {
    font-size: var(--p-size);
}

.price-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.old-price {
    text-decoration: line-through;
    opacity: 0.75;
    font-size: var(--p-size);
}

.new-price {
    font-weight: 700;
    font-size: calc(var(--h2-size) - 2px);
}

.swatches {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.swatch {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1px solid var(--text-color);
    cursor: pointer;
}

.swatch.active {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
}

.btn-primary {
    background: var(--accent-color);
    color: var(--alternate-text-color);
    border: none;
}

.btn-primary:hover {
    background: var(--alternate-text-color);
    color: var(--accent-color);
    opacity: 0.9;
}

.btn-outline-secondary {
    border: 1px solid var(--text-color);
    color: var(--text-color);
    background: var(--main-bg-color);
}

.btn-outline-secondary:hover {
    background: var(--secondary-color);
    color: var(--alternate-text-color);
    border: 1px solid var(--secondary-color);
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
    font-size: var(--p-size)
}
</style>
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
                        :style="{ background: variant.color_hex || '#d9d9d9' }"
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
    background: #fff;
}

.badge {
    position: absolute;
    top: 10px;
    padding: 4px 10px;
    font-size: 12px;
    border-radius: 999px;
}

.badge-new {
    left: 10px;
    background: #198754;
    color: #fff;
}

.badge-discount {
    right: 10px;
    background: #dc3545;
    color: #fff;
}

.card-header {
    font-family: var(--font-family-title);
    font-size: 1.15rem;
    background: transparent;
    color: var(--text-color);
    padding: 0;
    border: 0;
    margin-bottom: 4px;
}

.product-meta {
    font-size: 0.85rem;
    color: var(--text-color);
    opacity: 0.8;
}

.card-text {
    font-size: 0.92rem;
}

.price-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.old-price {
    text-decoration: line-through;
    opacity: 0.75;
    font-size: 0.9rem;
}

.new-price {
    font-weight: 700;
    font-size: 1rem;
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
    border: 1px solid #999;
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
</style>
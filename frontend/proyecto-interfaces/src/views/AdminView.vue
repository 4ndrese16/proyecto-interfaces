<template>
    <AppHeader />
    <div class="container-fluid py-4 admin-section" style="background: var(--main-bg-color); color: var(--text-color);">
        <div class="row">
            <!-- Sidebar / Tabs -->
            <div class="col-12 col-lg-3 mb-3">
                <div class="card h-100" style="background: var(--main-bg-color); color: var(--alternate-text-color);">
                    <div class="card-body">
                        <h2 class="card-title">Admin Dashboard</h2>
                        <p class="small text-muted">Selecciona un módulo</p>
                        <ul class="nav nav-pills flex-column mt-3" role="tablist">
                            <li class="nav-item mb-2" role="presentation">
                                <button :class="['nav-link', activeTab === 'config' ? 'active' : '']" @click="activeTab = 'config'" type="button">Configuraciones</button>
                                <!-- Submenu shown when Configuraciones active -->
                                <ul v-if="activeTab === 'config'" class="nav flex-column small mt-2 ms-2">
                                    <li class="nav-item mb-1">
                                        <button :class="['nav-link p-1', subTab === 'palette' ? 'active' : '']" @click="subTab = 'palette'" type="button">Paleta de colores</button>
                                    </li>
                                    <li class="nav-item mb-1">
                                        <button :class="['nav-link p-1', subTab === 'typography' ? 'active' : '']" @click="subTab = 'typography'" type="button">Tipografías</button>
                                    </li>
                                    <li class="nav-item mb-1">
                                        <button :class="['nav-link p-1', subTab === 'products' ? 'active' : '']" @click="subTab = 'products'" type="button">Productos</button>
                                    </li>
                                    <li class="nav-item mb-1">
                                        <button :class="['nav-link p-1', subTab === 'fiscal' ? 'active' : '']" @click="subTab = 'fiscal'" type="button">Facturación</button>
                                    </li>
                                    <li class="nav-item mb-1">
                                        <button :class="['nav-link p-1', subTab === 'coupons' ? 'active' : '']" @click="subTab = 'coupons'" type="button">Cupones</button>
                                    </li>
                                    <!-- future submenu items -->
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="col-12 col-lg-9">
                <div class="card" style="background: var(--main-bg-color); color: var(--text-color);">
                    <div class="card-body">
                        <div v-show="activeTab === 'config'">
                            <h4 class="mb-3">Configuraciones</h4>

                            <div v-show="subTab === 'palette'">
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <ColorForm :paletteId="editingPaletteId" @saved="onPaletteSaved" />
                                    </div>
                                    <div class="col-12">
                                        <PaletteTable :key="paletteTableKey" :adminMode="true" @edit="onEditPalette" />
                                    </div>
                                </div>
                            </div>

                            <div v-show="subTab === 'typography'">
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <FontForm :editingTypography="editingFont" @saved="onFontSaved" />
                                    </div>
                                    <div class="col-12">
                                        <FontTable ref="fontTable" @edit="onEditFont" />
                                    </div>
                                </div>
                            </div>

                            <div v-show="subTab === 'products'">
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <ProductForm :productId="editingProductId" @saved="onProductSaved" />
                                    </div>
                                    <div class="col-12">
                                        <ProductTable ref="productTable" @edit="onEditProduct" />
                                    </div>
                                </div>
                            </div>

                            <div v-show="subTab === 'fiscal'">
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <CompanyFiscalForm />
                                    </div>
                                    <div class="col-12">
                                        <PrinterProfileForm />
                                    </div>
                                </div>
                            </div>

                            <div v-show="subTab === 'coupons'">
                                <div class="row">
                                    <div class="col-12">
                                        <CouponManager />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <AppFooter />
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useColorStore } from '@/stores/colorStore'
import { useFontStore } from '@/stores/fontStore';
import ColorForm from '@/components/admin/settings/ColorForm.vue';
import PaletteTable from '@/components/admin/settings/PaletteTable.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import FontForm from '@/components/admin/settings/FontForm.vue';
import FontTable from '@/components/admin/settings/FontTable.vue';
import ProductForm from '@/components/shop/productForm.vue';
import ProductTable from '@/components/shop/ProductTable.vue';
import CompanyFiscalForm from '@/components/admin/settings/CompanyFiscalForm.vue';
import PrinterProfileForm from '@/components/admin/settings/PrinterProfileForm.vue';
import CouponManager from '@/components/admin/settings/CouponManager.vue';

// default tab on load: configuraciones and default submenu
const activeTab = ref('config');
const subTab = ref('palette');
const editingPaletteId = ref(null);
const editingFont = ref(null);
const paletteTableKey = ref(0);
const fontTable = ref(null);
const productTable = ref(null);
const editingProductId = ref(null);

function onEditPalette(palette) {
    editingPaletteId.value = palette && palette.id ? palette.id : null;
}

async function onPaletteSaved() {
    editingPaletteId.value = null;

    try {
        const pal = useColorStore();
        await pal.load(false);
    } catch (e) {
        // ignore
    }

    await nextTick();
    paletteTableKey.value += 1;
}

function onEditFont(font) {
    editingFont.value = font || null;
}

async function onFontSaved() {
    editingFont.value = null;

    try {
        const fs = useFontStore();
        await fs.load(false);
    } catch (e) {
        // ignore
    }

    await nextTick();

    try {
        if (fontTable.value && typeof fontTable.value.loadAll === 'function') {
            await fontTable.value.loadAll();
        }
    } catch (e) {
        // ignore
    }
}

function onEditProduct(product) {
    editingProductId.value = product?.id || null;
}

async function onProductSaved() {
    editingProductId.value = null;

    await nextTick();

    try {
        if (productTable.value && typeof productTable.value.loadAll === 'function') {
            await productTable.value.loadAll();
        }
    } catch (e) {
        // ignore
    }
}
</script>

<style scoped>
.admin-section {
    padding: 0 5rem;
}

.active{
    background-color: var(--accent-color) !important;
    border: none !important;
    color: var(--alternate-text-color) !important;
}

.nav-link {
    background: var(--main-bg-color);
    color: var(--text-color);
    border: 1px solid var(--text-color)
}
</style>
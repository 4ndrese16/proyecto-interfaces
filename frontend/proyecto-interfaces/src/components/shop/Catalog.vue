<template>
	<section class="catalog-section py-4">
		<div class="container-fluid">
			<div class="catalog-head mb-3">
				<h2 class="mb-1">Catalogo de Productos</h2>
				<p class="mb-0 text-muted">Explora telefonos y accesorios disponibles.</p>
			</div>

			<div class="filters card p-3 mb-3">
				<div class="row g-2 align-items-end">
					<div class="col-12 col-md-4">
						<label class="form-label">Buscar</label>
						<input v-model.trim="searchText" class="form-control" type="text" placeholder="Marca, nombre o descripcion" />
					</div>

					<div class="col-6 col-md-2">
						<label class="form-label">Categoria</label>
						<select v-model="category" class="form-select">
							<option value="">Todas</option>
							<option value="telefono">Telefonos</option>
							<option value="accesorio">Accesorios</option>
						</select>
					</div>

					<div class="col-6 col-md-2">
						<label class="form-label">Marca</label>
						<select v-model="brand" class="form-select">
							<option value="">Todas</option>
							<option v-for="b in availableBrands" :key="b" :value="b">{{ b }}</option>
						</select>
					</div>

					<div class="col-8 col-md-2">
						<label class="form-label">Ordenar por</label>
						<select v-model="sortBy" class="form-select">
							<option value="newest">Mas recientes</option>
							<option value="priceAsc">Precio: menor a mayor</option>
							<option value="priceDesc">Precio: mayor a menor</option>
							<option value="nameAsc">Nombre A-Z</option>
						</select>
					</div>

					<div class="col-4 col-md-2 d-grid">
						<button class="btn btn-outline-secondary" type="button" @click="resetFilters">Limpiar</button>
					</div>
				</div>
			</div>

			<div v-if="loading" class="text-center py-5">Cargando catalogo...</div>
			<div v-else-if="error" class="alert alert-danger">{{ error }}</div>
			<div v-else-if="!filteredProducts.length" class="alert alert-light border">No se encontraron productos con esos filtros.</div>

			<div v-else>
				<div class="results-meta d-flex justify-content-between align-items-center mb-3">
					<span>{{ filteredProducts.length }} resultados</span>
					<span>Pagina {{ currentPage }} de {{ totalPages }}</span>
				</div>

				<div class="row g-3">
					<div v-for="item in paginatedProducts" :key="item.id" class="col-12 col-sm-6 col-lg-4 col-xl-3 d-flex justify-content-center">
						<ProductCard :product="item" />
					</div>
				</div>

				<div v-if="totalPages > 1" class="pagination-wrap mt-4 d-flex justify-content-center gap-2">
					<button class="btn btn-outline-secondary" :disabled="currentPage === 1" @click="currentPage -= 1">Anterior</button>
					<button
						v-for="p in totalPages"
						:key="`p-${p}`"
						class="btn"
						:class="p === currentPage ? 'btn-primary' : 'btn-outline-secondary'"
						@click="currentPage = p"
					>
						{{ p }}
					</button>
					<button class="btn btn-outline-secondary" :disabled="currentPage === totalPages" @click="currentPage += 1">Siguiente</button>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import ProductCard from '@/components/shop/ProductCard.vue';
import { getAllProducts } from '@/api/product';

const loading = ref(false);
const error = ref(null);
const products = ref([]);

const searchText = ref('');
const category = ref('');
const brand = ref('');
const sortBy = ref('newest');

const pageSize = 8;
const currentPage = ref(1);

const availableBrands = computed(() => {
	const set = new Set((products.value || []).map((p) => String(p.brand || '').trim()).filter(Boolean));
	return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const normalizedSearch = computed(() => searchText.value.toLowerCase().trim());

const filteredProducts = computed(() => {
	let list = Array.isArray(products.value) ? [...products.value] : [];

	if (category.value) {
		list = list.filter((p) => p.category === category.value);
	}

	if (brand.value) {
		list = list.filter((p) => String(p.brand || '') === brand.value);
	}

	if (normalizedSearch.value) {
		list = list.filter((p) => {
			const haystack = `${p.name || ''} ${p.brand || ''} ${p.description || ''}`.toLowerCase();
			return haystack.includes(normalizedSearch.value);
		});
	}

	if (sortBy.value === 'priceAsc') {
		list.sort((a, b) => Number(a.final_price ?? a.price ?? 0) - Number(b.final_price ?? b.price ?? 0));
	} else if (sortBy.value === 'priceDesc') {
		list.sort((a, b) => Number(b.final_price ?? b.price ?? 0) - Number(a.final_price ?? a.price ?? 0));
	} else if (sortBy.value === 'nameAsc') {
		list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
	}

	return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / pageSize)));

const paginatedProducts = computed(() => {
	const safePage = Math.min(currentPage.value, totalPages.value);
	const start = (safePage - 1) * pageSize;
	return filteredProducts.value.slice(start, start + pageSize);
});

watch([searchText, category, brand, sortBy], () => {
	currentPage.value = 1;
});

watch(totalPages, (next) => {
	if (currentPage.value > next) {
		currentPage.value = next;
	}
});

const resetFilters = () => {
	searchText.value = '';
	category.value = '';
	brand.value = '';
	sortBy.value = 'newest';
};

const load = async () => {
	loading.value = true;
	error.value = null;
	try {
		const list = await getAllProducts();
		products.value = Array.isArray(list) ? list : [];
	} catch (e) {
		error.value = e?.response?.data?.message || e?.message || 'No se pudo cargar el catalogo';
	} finally {
		loading.value = false;
	}
};

onMounted(load);
</script>

<style scoped>
.catalog-section {
	background: var(--main-bg-color);
	color: var(--text-color);
}

.filters {
	background: var(--main-bg-color);
	border: 1px solid var(--text-color);
}

.form-control,
.form-select {
	background: var(--main-bg-color);
	color: var(--text-color);
	border: 1px solid var(--text-color);
}

.btn-primary {
	background: var(--accent-color);
	color: var(--alternate-text-color);
	border: none;
}
</style>

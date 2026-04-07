<template>
	<div class="product-table">
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h5>Productos guardados</h5>
			<button class="btn btn-sm btn-outline-primary" @click="loadAll" :disabled="loading">Recargar</button>
		</div>

		<div v-if="loading" class="text-center py-4">Cargando...</div>
		<div v-else-if="error" class="alert alert-danger">{{ error }}</div>
		<div v-else-if="!items.length" class="text-muted">No hay productos guardados.</div>

		<div v-else class="table-responsive">
			<table :key="tableRenderKey" ref="dataTable" class="table table-striped table-sm align-middle" style="width: 100%">
				<thead>
					<tr>
						<th>Imagen</th>
						<th>Nombre</th>
						<th>Categoria</th>
						<th>Marca</th>
						<th>Precio</th>
						<th>Badges</th>
						<th>Colores</th>
						<th>Acciones</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in items" :key="item.id">
						<td style="width: 88px;">
							<img :src="mainImage(item)" :alt="item.name" class="thumb" />
						</td>
						<td>
							<strong>{{ item.name }}</strong>
							<div class="small text-muted">ID: {{ item.id }}</div>
						</td>
						<td>{{ categoryLabel(item.category) }}</td>
						<td>{{ item.brand }}</td>
						<td>
							<div v-if="item.has_discount">
								<span class="old-price">{{ money(item.price) }}</span>
								<span class="new-price">{{ money(item.final_price || item.price) }}</span>
							</div>
							<div v-else>
								{{ money(item.price) }}
							</div>
						</td>
						<td>
							<span v-if="item.is_new" class="badge badge-new rounded-pill me-1">Nuevo</span>
							<span v-if="item.has_discount" class="badge badge-discount rounded-pill">-{{ item.discount_percentage }}%</span>
							<span v-if="!item.is_new && !item.has_discount" class="text-muted">-</span>
						</td>
						<td>
							<div class="d-flex gap-1 flex-wrap">
								<span
									v-for="(variant, idx) in (item.variants || [])"
									:key="`${item.id}-${idx}`"
									class="swatch"
									:title="variant.color_name"
									:style="{ background: variant.color_hex || fallbackSwatchColor }"
								/>
							</div>
							<div class="small text-muted">{{ (item.variants || []).length }} variantes</div>
						</td>
						<td style="width: 165px;">
							<button class="btn btn-sm btn-outline-secondary me-2" @click="edit(item)">Editar</button>
							<button class="btn btn-sm btn-danger" @click="askDelete(item)" :disabled="deletingId === item.id">Eliminar</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="modal fade" tabindex="-1" role="dialog" :class="{ show: showConfirm }" :style="{ display: showConfirm ? 'block' : 'none' }">
			<div class="modal-dialog" role="document">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Confirmar eliminacion</h5>
						<button type="button" class="btn-close" aria-label="Close" @click="cancelDelete"></button>
					</div>
					<div class="modal-body">
						<p>Quieres eliminar <strong>{{ pendingDelete?.name }}</strong>?</p>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" @click="cancelDelete">Cancelar</button>
						<button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="deletingId === pendingDelete?.id">Eliminar</button>
					</div>
				</div>
			</div>
		</div>

		<div v-if="toast.show" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1060;">
			<div class="toast show align-items-center text-white" :class="toast.type === 'danger' ? 'bg-danger' : toast.type === 'success' ? 'bg-success' : 'bg-info'" role="alert">
				<div class="d-flex">
					<div class="toast-body">{{ toast.message }}</div>
					<button type="button" class="btn-close btn-close-white me-2 m-auto" @click="toast.show = false"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { deleteProduct, getAllProducts } from '@/api/product';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';
import DataTable from 'datatables.net-dt';

const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
	|| (typeof process !== 'undefined' && process.env.API_URL)
	|| '';

const API_ORIGIN = API_ROOT
	? API_ROOT.replace(/\/api\/?$/, '').replace(/\/$/, '')
	: '';

export default {
	name: 'ProductTable',
	emits: ['edit', 'updated'],
	setup(_props, { emit }) {
		const fallbackSwatchColor = 'var(--secondary-color)';
		const items = ref([]);
		const loading = ref(false);
		const error = ref(null);
		const dataTable = ref(null);
		const tableRenderKey = ref(0);
		const pendingDelete = ref(null);
		const showConfirm = ref(false);
		const deletingId = ref(null);
		const toast = ref({ show: false, message: '', type: 'info' });
		const mountedReady = ref(false);

		let dt = null;

		const buildAssetUrl = (pathValue) => {
			if (!pathValue) return null;
			if (/^https?:\/\//i.test(pathValue)) return pathValue;
			if (pathValue.startsWith('/')) return API_ORIGIN ? `${API_ORIGIN}${pathValue}` : pathValue;
			return API_ORIGIN ? `${API_ORIGIN}/${pathValue}` : `/${pathValue}`;
		};

		function showToast(message, type = 'info') {
			toast.value = { show: true, message, type };
			setTimeout(() => {
				toast.value.show = false;
			}, 2600);
		}

		function categoryLabel(category) {
			return category === 'accesorio' ? 'Accesorio' : 'Telefono';
		}

		function money(value) {
			const amount = Number(value || 0);
			return amount.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' });
		}

		function mainImage(item) {
			const firstVariant = Array.isArray(item.variants) && item.variants.length ? item.variants[0] : null;
			const variantImage = buildAssetUrl(firstVariant?.image_path);
			const productImage = buildAssetUrl(item.main_image_path);
			const fallback = new URL('@/assets/images/interfaces/xiaomi_15_ultra_product.png', import.meta.url).href;
			return variantImage || productImage || fallback;
		}

		async function loadAll() {
			loading.value = true;
			error.value = null;
			try {
				const list = await getAllProducts({ include_inactive: true });
				items.value = Array.isArray(list) ? list : [];
				if (mountedReady.value) {
					rebuildDataTable();
				}
			} catch (err) {
				error.value = err?.message || 'Error cargando productos';
			} finally {
				loading.value = false;
			}
		}

		function edit(item) {
			emit('edit', item);
		}

		function askDelete(item) {
			pendingDelete.value = item;
			showConfirm.value = true;
		}

		function cancelDelete() {
			pendingDelete.value = null;
			showConfirm.value = false;
		}

		async function confirmDelete() {
			if (!pendingDelete.value?.id) return;
			deletingId.value = pendingDelete.value.id;
			error.value = null;
			try {
				await deleteProduct(pendingDelete.value.id);
				showToast('Producto eliminado', 'success');
				pendingDelete.value = null;
				showConfirm.value = false;
				await loadAll();
				emit('updated');
			} catch (err) {
				error.value = err?.response?.data?.message || err?.message || 'Error eliminando producto';
				showToast('No se pudo eliminar el producto', 'danger');
			} finally {
				deletingId.value = null;
			}
		}

		function initDataTable() {
			try {
				if (!dataTable.value) return;
				dt = new DataTable(dataTable.value, {
					searching: true,
					lengthChange: true,
					info: true,
					paging: true,
					ordering: false,
					pageLength: 10,
					lengthMenu: [5, 10, 25, 50],
					language: {
						search: 'Buscar:',
						lengthMenu: 'Mostrar _MENU_ registros',
						info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
						infoEmpty: 'Mostrando 0 a 0 de 0 registros',
						zeroRecords: 'No se encontraron resultados',
						paginate: {
							first: 'Primero',
							last: 'Ultimo',
							next: 'Siguiente',
							previous: 'Anterior'
						}
					}
				});
			} catch (_e) {
				// Ignore DataTable init errors.
			}
		}

		function rebuildDataTable() {
			try {
				if (dt) {
					dt.destroy();
					dt = null;
				}
			} catch (_e) {
				// Ignore destroy errors.
			}

			tableRenderKey.value += 1;

			setTimeout(() => {
				initDataTable();
			}, 0);
		}

		onMounted(() => {
			mountedReady.value = true;
			loadAll();
		});

		onBeforeUnmount(() => {
			try {
				if (dt) dt.destroy();
			} catch (_e) {
				// Ignore destroy errors.
			}
		});

		return {
			fallbackSwatchColor,
			items,
			loading,
			error,
			dataTable,
			tableRenderKey,
			pendingDelete,
			showConfirm,
			deletingId,
			toast,
			loadAll,
			edit,
			askDelete,
			cancelDelete,
			confirmDelete,
			categoryLabel,
			money,
			mainImage
		};
	}
};
</script>

<style scoped>
.thumb {
	width: 64px;
	height: 64px;
	object-fit: contain;
	border: 1px solid var(--text-color);
	border-radius: 6px;
	background: var(--main-bg-color);
}

.swatch {
	width: 14px;
	height: 14px;
	border-radius: 50%;
	border: 1px solid var(--text-color);
}

.old-price {
	text-decoration: line-through;
	margin-right: 6px;
	color: var(--text-color);
	opacity: 0.75;
}

.badge-new {
    background: var(--accent-color);
    color: var(--alternate-text-color);
}

.badge-discount {
    background: var(--secondary-color);
    color: var(--alternate-text-color);
}

.new-price {
	font-weight: 700;
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

.btn-outline-primary, .btn-secondary {
  border: 1px solid var(--accent-color);
  background-color: var(--main-bg-color);
  color: var(--accent-color);
}

.btn-outline-primary:hover, .btn-secondary:hover {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  border: 1px solid var(--accent-color);
}

.btn-outline-danger, .btn-outline-danger:disabled, .btn-danger {
  border: 1px solid var(--alternate-text-color);
  background-color: var(--secondary-color);
  color: var(--alternate-text-color);
}

.btn-outline-danger:hover, .btn-danger:hover {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}
</style>

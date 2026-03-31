<template>
	<div class="product-form card p-3">
		<h3 class="mb-3">{{ isEditing ? 'Editar producto' : 'Cargar producto' }}</h3>

		<div v-if="serverError" class="alert alert-danger">{{ serverError }}</div>
		<div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

		<form @submit.prevent="saveProduct">
			<div class="row g-3">
				<div class="col-12 col-md-6">
					<label class="form-label">Nombre</label>
					<input v-model.trim="form.name" class="form-control" type="text" required />
				</div>

				<div class="col-12 col-md-6">
					<label class="form-label">Marca</label>
					<input v-model.trim="form.brand" class="form-control" type="text" placeholder="Xiaomi, Samsung..." required />
				</div>

				<div class="col-12">
					<label class="form-label">Descripcion</label>
					<textarea v-model.trim="form.description" class="form-control" rows="3" required />
				</div>

				<div class="col-12 col-md-4">
					<label class="form-label">Precio</label>
					<input v-model.number="form.price" class="form-control" type="number" min="0" step="0.01" required />
				</div>

				<div class="col-12 col-md-4">
					<label class="form-label">Categoria</label>
					<select v-model="form.category" class="form-select" required>
						<option value="telefono">Telefono</option>
						<option value="accesorio">Accesorio</option>
					</select>
				</div>

				<div class="col-12 col-md-4 d-flex align-items-end">
					<div class="form-check me-3">
						<input id="is-new" v-model="form.is_new" class="form-check-input" type="checkbox" />
						<label for="is-new" class="form-check-label">Nuevo</label>
					</div>
					<div class="form-check">
						<input id="has-discount" v-model="form.has_discount" class="form-check-input" type="checkbox" />
						<label for="has-discount" class="form-check-label">Con descuento</label>
					</div>
				</div>

				<div v-if="form.has_discount" class="col-12 col-md-4">
					<label class="form-label">% de descuento</label>
					<input v-model.number="form.discount_percentage" class="form-control" type="number" min="1" max="99" />
				</div>

				<div class="col-12 col-md-8">
					<label class="form-label">Imagen principal</label>
					<input class="form-control" type="file" accept=".jpg,.jpeg,.png,.webp" @change="onMainImageChange" />
					<small v-if="mainImageLabel" class="text-muted">{{ mainImageLabel }}</small>
				</div>
			</div>

			<hr class="my-4" />

			<div class="d-flex justify-content-between align-items-center mb-2">
				<h4 class="mb-0">Modelos / colores</h4>
				<button type="button" class="btn btn-outline-primary btn-sm" @click="addVariant">Agregar color</button>
			</div>

			<div v-if="!form.variants.length" class="small text-muted mb-3">
				No hay variantes. Puedes dejarlo vacio o agregar colores del modelo.
			</div>

			<div v-for="(variant, index) in form.variants" :key="variant.uid" class="variant-row p-3 mb-3 rounded">
				<div class="row g-3 align-items-end">
					<div class="col-12 col-md-4">
						<label class="form-label">Nombre del color</label>
						<input v-model.trim="variant.color_name" class="form-control" type="text" placeholder="Negro titanio" />
					</div>

					<div class="col-12 col-md-3">
						<label class="form-label">Color HEX</label>
						<input v-model.trim="variant.color_hex" class="form-control" type="text" placeholder="#1a1a1a" />
					</div>

					<div class="col-12 col-md-4">
						<label class="form-label">Imagen del color</label>
						<input class="form-control" type="file" accept=".jpg,.jpeg,.png,.webp" @change="onVariantImageChange($event, index)" />
						<small v-if="variant.existing_image_path && !variant.image_file" class="text-muted">Imagen actual conservada</small>
					</div>

					<div class="col-12 col-md-1 text-md-end">
						<button type="button" class="btn btn-outline-danger" @click="removeVariant(index)">X</button>
					</div>
				</div>
			</div>

			<div class="d-flex gap-2 mt-3">
				<button class="btn btn-primary" type="submit" :disabled="saving">
					<span v-if="saving" class="spinner-border spinner-border-sm me-2" />
					{{ isEditing ? 'Actualizar producto' : 'Guardar producto' }}
				</button>
				<button class="btn btn-outline-secondary" type="button" @click="reset" :disabled="saving">Reset</button>
			</div>
		</form>
	</div>
</template>

<script>
import { createProduct, updateProduct, getProductById } from '@/api/product';

const createEmptyVariant = () => ({
	uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
	color_name: '',
	color_hex: '',
	image_file: null,
	existing_image_path: null
});

const createEmptyForm = () => ({
	id: null,
	name: '',
	description: '',
	price: 0,
	category: 'telefono',
	brand: '',
	is_new: false,
	has_discount: false,
	discount_percentage: 0,
	main_image_file: null,
	main_image_path: null,
	variants: []
});

export default {
	name: 'ProductForm',
	props: {
		productId: {
			type: [String, Number],
			default: null
		}
	},
	emits: ['saved'],
	data() {
		return {
			form: createEmptyForm(),
			saving: false,
			serverError: null,
			successMessage: null
		};
	},
	computed: {
		isEditing() {
			return !!this.form.id;
		},
		mainImageLabel() {
			if (this.form.main_image_file) return this.form.main_image_file.name;
			if (this.form.main_image_path) return 'Imagen actual conservada';
			return '';
		}
	},
	watch: {
		productId: {
			immediate: true,
			async handler(value) {
				if (!value) {
					this.reset();
					return;
				}

				await this.loadProduct(value);
			}
		}
	},
	methods: {
		addVariant() {
			this.form.variants.push(createEmptyVariant());
		},
		removeVariant(index) {
			this.form.variants.splice(index, 1);
		},
		onMainImageChange(event) {
			this.form.main_image_file = event.target.files?.[0] || null;
		},
		onVariantImageChange(event, index) {
			const file = event.target.files?.[0] || null;
			if (!this.form.variants[index]) return;
			this.form.variants[index].image_file = file;
		},
		async loadProduct(id) {
			try {
				this.serverError = null;
				const product = await getProductById(id);

				this.form = {
					id: product.id,
					name: product.name || '',
					description: product.description || '',
					price: Number(product.price || 0),
					category: product.category || 'telefono',
					brand: product.brand || '',
					is_new: !!product.is_new,
					has_discount: !!product.has_discount,
					discount_percentage: Number(product.discount_percentage || 0),
					main_image_file: null,
					main_image_path: product.main_image_path || null,
					variants: Array.isArray(product.variants)
						? product.variants.map((variant) => ({
							...createEmptyVariant(),
							color_name: variant.color_name || '',
							color_hex: variant.color_hex || '',
							existing_image_path: variant.image_path || null
						}))
						: []
				};
			} catch (error) {
				this.serverError = error?.response?.data?.message || error?.message || 'No se pudo cargar el producto';
			}
		},
		buildPayload() {
			const payload = new FormData();
			payload.append('name', this.form.name);
			payload.append('description', this.form.description);
			payload.append('price', String(this.form.price));
			payload.append('category', this.form.category);
			payload.append('brand', this.form.brand);
			payload.append('is_new', String(!!this.form.is_new));
			payload.append('has_discount', String(!!this.form.has_discount));
			payload.append('discount_percentage', String(this.form.has_discount ? this.form.discount_percentage : 0));

			if (this.form.main_image_file) {
				payload.append('main_image', this.form.main_image_file);
			}

			const variantPayload = [];
			let imageIndex = 0;

			this.form.variants.forEach((variant) => {
				if (!variant.color_name) return;

				const entry = {
					color_name: variant.color_name,
					color_hex: variant.color_hex || null
				};

				if (variant.image_file) {
					payload.append('variant_images', variant.image_file);
					entry.image_index = imageIndex;
					imageIndex += 1;
				} else if (variant.existing_image_path) {
					entry.image_path = variant.existing_image_path;
				}

				variantPayload.push(entry);
			});

			payload.append('variants', JSON.stringify(variantPayload));
			return payload;
		},
		async saveProduct() {
			this.saving = true;
			this.serverError = null;
			this.successMessage = null;

			try {
				const payload = this.buildPayload();
				const saved = this.isEditing
					? await updateProduct(this.form.id, payload)
					: await createProduct(payload);

				this.successMessage = this.isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente';
				this.$emit('saved', saved);

				if (!this.isEditing) {
					this.reset();
				}

				setTimeout(() => {
					this.successMessage = null;
				}, 3000);
			} catch (error) {
				this.serverError = error?.response?.data?.message || error?.message || 'No se pudo guardar el producto';
			} finally {
				this.saving = false;
			}
		},
		reset() {
			this.form = createEmptyForm();
		}
	}
};
</script>

<style scoped>
.product-form {
	background: var(--main-bg-color);
	color: var(--text-color);
	border: 1px solid var(--text-color);
}

.form-control,
.form-select {
	background: var(--main-bg-color);
	color: var(--text-color);
	border: 1px solid var(--text-color);
}

.variant-row {
	border: 1px solid var(--text-color);
	background: rgba(0, 0, 0, 0.02);
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

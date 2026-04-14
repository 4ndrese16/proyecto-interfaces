<template>
  <div class="coupon-manager card p-3">
    <h4 class="mb-3">Gestión de Cupones</h4>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <form class="mb-4" @submit.prevent="saveCoupon">
      <div class="row g-2">
        <div class="col-12 col-md-3">
          <label class="form-label">Código</label>
          <input v-model.trim="form.code" class="form-control" placeholder="DESCUENTO10" required />
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label">Cantidad de usos</label>
          <input v-model.number="form.usage_limit" type="number" min="1" step="1" class="form-control" required />
        </div>

        <div class="col-6 col-md-2">
          <label class="form-label">Descuento %</label>
          <input v-model.number="form.discount_value" type="number" min="1" max="100" step="1" class="form-control" required />
        </div>

        <div class="col-6 col-md-3">
          <label class="form-label">Expira en</label>
          <input v-model="form.expires_at" type="datetime-local" class="form-control" required />
        </div>

        <div class="col-12 col-md-3 d-flex align-items-end">
          <div class="form-check">
            <input id="coupon-active" v-model="form.is_active" class="form-check-input" type="checkbox" />
            <label for="coupon-active" class="form-check-label">Activo</label>
          </div>
        </div>
      </div>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-primary" :disabled="saving" type="submit">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
          {{ form.id ? 'Actualizar cupón' : 'Crear cupón' }}
        </button>
        <button class="btn btn-outline-secondary" type="button" @click="resetForm" :disabled="saving">Limpiar</button>
      </div>
    </form>

    <div class="table-responsive" v-if="items.length">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descuento</th>
            <th>Usos</th>
            <th>Expira</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td><strong>{{ item.code }}</strong></td>
            <td>{{ Number(item.discount_value) }}%</td>
            <td>{{ item.used_count }} / {{ item.usage_limit ?? '∞' }}</td>
            <td>{{ formatDate(item.expires_at) }}</td>
            <td>
              <span class="badge" :class="item.is_active ? 'bg-active' : 'bg-inactive'">{{ item.is_active ? 'Activo' : 'Inactivo' }}</span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline-secondary me-2" @click="edit(item)">Editar</button>
              <button class="btn btn-sm btn-outline-danger" @click="remove(item)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="text-muted">No hay cupones creados.</p>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { createCoupon, deleteCoupon, getAllCoupons, updateCoupon } from '@/api/coupon';

const items = ref([]);
const saving = ref(false);
const error = ref(null);
const success = ref(null);

const createEmptyForm = () => ({
  id: null,
  code: '',
  discount_value: 10,
  usage_limit: 1,
  expires_at: '',
  is_active: true
});

const form = reactive(createEmptyForm());

const money = (value) => Number(value || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' });

const normalizeDateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 16);
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear());
  return `${d}/${m}/${y}`;
};

function resetForm() {
  Object.assign(form, createEmptyForm());
}

async function load() {
  error.value = null;
  try {
    items.value = await getAllCoupons();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'No se pudo cargar cupones';
  }
}

function edit(item) {
  Object.assign(form, {
    id: item.id,
    code: item.code,
    discount_value: Number(item.discount_value),
    usage_limit: item.usage_limit !== null ? Number(item.usage_limit) : null,
    expires_at: normalizeDateForInput(item.expires_at),
    is_active: !!item.is_active
  });
}

async function saveCoupon() {
  saving.value = true;
  error.value = null;
  success.value = null;

  const payload = {
    code: String(form.code || '').toUpperCase(),
    discount_value: form.discount_value,
    usage_limit: form.usage_limit === null || form.usage_limit === '' ? '' : form.usage_limit,
    expires_at: form.expires_at || '',
    is_active: !!form.is_active
  };

  try {
    if (form.id) {
      await updateCoupon(form.id, payload);
      success.value = 'Cupón actualizado';
    } else {
      await createCoupon(payload);
      success.value = 'Cupón creado';
    }

    await load();
    resetForm();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'No se pudo guardar el cupón';
  } finally {
    saving.value = false;
  }
}

async function remove(item) {
  const ok = window.confirm(`¿Eliminar cupón ${item.code}?`);
  if (!ok) return;

  error.value = null;
  success.value = null;

  try {
    await deleteCoupon(item.id);
    success.value = 'Cupón eliminado';
    await load();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'No se pudo eliminar el cupón';
  }
}

onMounted(load);
</script>

<style scoped>
.coupon-manager {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
  border-radius: 20px;
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

.bg-active {
  background-color: var(--accent-color);
  color: var(--alternate-text-color);
}

.bg-inactive {
  background-color: var(--secondary-color);
  color: var(--alternate-text-color);
}
</style>

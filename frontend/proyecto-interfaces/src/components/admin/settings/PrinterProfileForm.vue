<template>
  <div class="settings-form card p-3">
    <h4 class="mb-3">Datos de la Imprenta Autorizada</h4>

    <div v-if="serverError" class="alert alert-danger">{{ serverError }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <form @submit.prevent="save">
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label">Razón social</label>
          <input v-model.trim="form.company_name" class="form-control" type="text" required />
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">RIF</label>
          <input v-model.trim="form.rif" class="form-control" type="text" placeholder="J-12345678-9" required />
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">Providencia administrativa</label>
          <input v-model.trim="form.providence_code" class="form-control" type="text" placeholder="GAT-DI-2026-0119" required />
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">Fecha de providencia</label>
          <input v-model.trim="form.providence_date" class="form-control" type="text" placeholder="dd/mm/aaaa" required />
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label">Número de control desde</label>
          <input v-model.trim="form.control_range_start" class="form-control" type="text" required />
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label">Número de control hasta</label>
          <input v-model.trim="form.control_range_end" class="form-control" type="text" required />
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">Fecha asignación control</label>
          <input v-model.trim="form.control_assignment_date" class="form-control" type="text" placeholder="dd/mm/aaaa" required />
        </div>
      </div>

      <small class="text-muted d-block mt-2">Formato de fecha requerido: dd/mm/aaaa</small>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-primary" type="submit" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
          Guardar imprenta
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { getPrinterProfile, savePrinterProfile } from '@/api/printerProfile';

const form = reactive({
  company_name: '',
  rif: '',
  providence_code: '',
  providence_date: '',
  control_range_start: '',
  control_range_end: '',
  control_assignment_date: ''
});

const saving = ref(false);
const serverError = ref(null);
const successMessage = ref(null);

const toSlashDate = (value) => {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  return raw;
};

const load = async () => {
  serverError.value = null;
  try {
    const data = await getPrinterProfile();
    form.company_name = data?.company_name || '';
    form.rif = data?.rif || '';
    form.providence_code = data?.providence_code || '';
    form.providence_date = toSlashDate(data?.providence_date || '');
    form.control_range_start = data?.control_range_start || '';
    form.control_range_end = data?.control_range_end || '';
    form.control_assignment_date = toSlashDate(data?.control_assignment_date || '');
  } catch (e) {
    serverError.value = e?.response?.data?.message || e?.message || 'No se pudo cargar la imprenta';
  }
};

const save = async () => {
  saving.value = true;
  serverError.value = null;
  successMessage.value = null;
  try {
    await savePrinterProfile({
      ...form,
      rif: String(form.rif || '').toUpperCase(),
      providence_code: String(form.providence_code || '').toUpperCase(),
      providence_date: toSlashDate(form.providence_date),
      control_assignment_date: toSlashDate(form.control_assignment_date)
    });
    successMessage.value = 'Datos de imprenta guardados correctamente';
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (e) {
    serverError.value = e?.response?.data?.message || e?.message || 'No se pudo guardar la imprenta';
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.settings-form {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}

.form-control {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
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

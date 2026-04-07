<template>
  <div class="settings-form card p-3">
    <h4 class="mb-3">Datos Fiscales de la Empresa</h4>

    <div v-if="serverError" class="alert alert-danger">{{ serverError }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <form @submit.prevent="save">
      <div class="mb-3">
        <label class="form-label">Razón social</label>
        <input v-model.trim="form.legal_name" class="form-control" type="text" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Domicilio fiscal</label>
        <textarea v-model.trim="form.fiscal_address" class="form-control" rows="3" required />
      </div>

      <div class="mb-3">
        <label class="form-label">RIF</label>
        <input v-model.trim="form.rif" class="form-control" type="text" placeholder="J-12345678-9" required />
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-primary" type="submit" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
          Guardar datos fiscales
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { getCompanyProfile, saveCompanyProfile } from '@/api/companyProfile';

const form = reactive({
  legal_name: '',
  fiscal_address: '',
  rif: ''
});

const saving = ref(false);
const serverError = ref(null);
const successMessage = ref(null);

const load = async () => {
  serverError.value = null;
  try {
    const data = await getCompanyProfile();
    form.legal_name = data?.legal_name || '';
    form.fiscal_address = data?.fiscal_address || '';
    form.rif = data?.rif || '';
  } catch (e) {
    serverError.value = e?.response?.data?.message || e?.message || 'No se pudo cargar la empresa';
  }
};

const save = async () => {
  saving.value = true;
  serverError.value = null;
  successMessage.value = null;
  try {
    await saveCompanyProfile({ ...form, rif: String(form.rif || '').toUpperCase() });
    successMessage.value = 'Datos fiscales guardados correctamente';
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (e) {
    serverError.value = e?.response?.data?.message || e?.message || 'No se pudo guardar la empresa';
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

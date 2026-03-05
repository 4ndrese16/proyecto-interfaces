<template>
    <AppHeader />
  <div class="register-container container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-md-6">
        <div class="card">
          <div class="card-body">
            <h3 class="mb-3">Crear cuenta</h3>
            <form @submit.prevent="onSubmit">
              <div class="mb-3">
                <label class="form-label">Usuario</label>
                <input v-model="form.username" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Contraseña</label>
                <input type="password" v-model="form.password" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Confirmar contraseña</label>
                <input type="password" v-model="form.password2" class="form-control" required />
              </div>
              <div class="d-flex align-items-center gap-2">
                <button class="btn btn-primary" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Crear cuenta
                </button>
                <router-link to="/login" class="btn btn-link">Volver al login</router-link>
              </div>
              <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
              <div v-if="success" class="alert alert-success mt-3">{{ success }}</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { register } from '@/api/auth';
import AppHeader from '@/components/layout/AppHeader.vue';

const router = useRouter();
const route = useRoute();
const form = reactive({ username: '', password: '', password2: '' });
const loading = ref(false);
const error = ref(null);
const success = ref(null);

async function onSubmit() {
  if (form.password !== form.password2) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    await register({ username: form.username, password: form.password });
  success.value = 'Cuenta creada. Redirigiendo...';
  const redirectTo = route.query && route.query.redirect ? String(route.query.redirect) : '/admin';
  setTimeout(() => router.push(redirectTo), 800);
  } catch (err) {
    error.value = (err && err.response && err.response.data && err.response.data.message) || (err && err.message) || 'Error al crear cuenta';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-container { max-width: 720px; margin: 0 auto; }
</style>

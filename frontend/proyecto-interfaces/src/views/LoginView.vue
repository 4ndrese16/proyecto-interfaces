<template>
  <AppHeader />
  <div class="login-container container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-md-6">
        <div class="card">
          <div class="card-body">
            <h3 class="mb-3">Iniciar sesión</h3>
            <form @submit.prevent="onSubmit">
              <div class="mb-3">
                <label class="form-label">Usuario</label>
                <input v-model="form.username" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Contraseña</label>
                <input type="password" v-model="form.password" class="form-control" required />
              </div>
              <div class="d-flex align-items-center gap-2">
                <button class="btn btn-primary" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Entrar
                </button>
                <router-link to="/register" class="btn btn-link">Crear cuenta</router-link>
              </div>
              <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
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
import { login } from '@/api/auth';
import AppHeader from '@/components/layout/AppHeader.vue';

const router = useRouter();
const route = useRoute();
const form = reactive({ username: '', password: '' });
const loading = ref(false);
const error = ref(null);

async function onSubmit() {
  loading.value = true;
  error.value = null;
  try {
    await login({ username: form.username, password: form.password });
    // redirect to requested path or to catalog
    const redirectTo = route.query && route.query.redirect ? String(route.query.redirect) : '/catalogo';
    router.push(redirectTo);
  } catch (err) {
    error.value = (err && err.response && err.response.data && err.response.data.message) || (err && err.message) || 'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>

.login-container {
  max-width: 720px;
  margin: 0 auto;
  background-color: var(--main-bg-color);
  color: var(--alternate-text-color);
  height: 90vh;
}

.card {
  background-color: var(--secondary-color);
  color: var(--alternate-text-color);
  margin-top: 10rem;
}

h3 {
  color: var(--alternate-text-color);
}

.btn-link {
  color: var(--accent-color);
}
</style>
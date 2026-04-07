<template>
  <AppHeader />
  <div class="container-fluid py-4 user-section" style="background: var(--main-bg-color); color: var(--text-color);">
    <div class="row">
      <div class="col-12 col-lg-3 mb-3">
        <div class="card h-100 panel-card">
          <div class="card-body">
            <h2 class="card-title">Mi Cuenta</h2>
            <p class="small text-muted">Gestiona tus datos y compras</p>
            <ul class="nav nav-pills flex-column mt-3">
              <li class="nav-item mb-2">
                <button :class="['nav-link', activeTab === 'billing' ? 'active' : '']" @click="activeTab = 'billing'" type="button">
                  Datos de facturacion
                </button>
              </li>
              <li class="nav-item mb-2">
                <button :class="['nav-link', activeTab === 'history' ? 'active' : '']" @click="activeTab = 'history'" type="button">
                  Compras anteriores
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-9">
        <div class="card panel-card">
          <div class="card-body">
            <div v-if="activeTab === 'billing'">
              <h4 class="mb-3">Datos requeridos para facturar</h4>

              <div v-if="profileError" class="alert alert-danger">{{ profileError }}</div>
              <div v-if="profileSuccess" class="alert alert-success">{{ profileSuccess }}</div>

              <form class="row g-3" @submit.prevent="saveProfile">
                <div class="col-12 col-md-6">
                  <label class="form-label">Nombre completo / Razon social</label>
                  <input v-model.trim="form.full_name" class="form-control" required />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Correo</label>
                  <input v-model.trim="form.email" class="form-control" type="email" required />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Documento CI/NIT</label>
                  <input v-model.trim="form.document_id" class="form-control" required />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">RIF/NIT fiscal</label>
                  <input v-model.trim="form.tax_id" class="form-control" />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Telefono</label>
                  <input v-model.trim="form.phone" class="form-control" required />
                </div>
                <div class="col-12">
                  <label class="form-label">Domicilio fiscal</label>
                  <input v-model.trim="form.fiscal_address" class="form-control" required />
                </div>
                <div class="col-12">
                  <button class="btn btn-primary" type="submit" :disabled="savingProfile">
                    {{ savingProfile ? 'Guardando...' : 'Guardar datos' }}
                  </button>
                </div>
              </form>
            </div>

            <div v-else>
              <h4 class="mb-3">Facturas viejas</h4>

              <div v-if="purchasesError" class="alert alert-danger">{{ purchasesError }}</div>

              <div v-if="loadingPurchases" class="text-muted">Cargando historial...</div>
              <div v-else-if="!purchases.length" class="alert alert-light border">
                Todavia no tienes compras registradas.
              </div>

              <div v-else class="table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Factura</th>
                      <th>Control</th>
                      <th>Fecha</th>
                      <th>Items</th>
                      <th class="text-end">Total</th>
                      <th class="text-end">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in purchases" :key="item.id">
                      <td><strong>{{ item.invoice_number }}</strong></td>
                      <td>{{ item.control_number }}</td>
                      <td>{{ formatDate(item.createdAt) }}</td>
                      <td>{{ Array.isArray(item.items) ? item.items.length : 0 }}</td>
                      <td class="text-end">{{ money(item.total) }}</td>
                      <td class="text-end">
                        <router-link class="btn btn-sm btn-outline-secondary" :to="`/receipt-demo/${item.id}`">Ver factura</router-link>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
import { onMounted, reactive, ref } from 'vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import { getMyProfile, updateMyProfile } from '@/api/userProfile';
import { getMyPurchases } from '@/api/purchase';

const activeTab = ref('billing');

const profileError = ref(null);
const profileSuccess = ref(null);
const savingProfile = ref(false);

const purchases = ref([]);
const purchasesError = ref(null);
const loadingPurchases = ref(false);

const form = reactive({
  full_name: '',
  email: '',
  fiscal_address: '',
  phone: '',
  document_id: '',
  tax_id: ''
});

const money = (value) => Number(value || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' });

function formatDate(value) {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString('es-BO');
}

async function loadProfile() {
  profileError.value = null;
  try {
    const data = await getMyProfile();
    form.full_name = data.full_name || '';
    form.email = data.email || '';
    form.fiscal_address = data.fiscal_address || '';
    form.phone = data.phone || '';
    form.document_id = data.document_id || '';
    form.tax_id = data.tax_id || '';
  } catch (e) {
    profileError.value = e?.response?.data?.message || e?.message || 'No se pudo cargar el perfil';
  }
}

async function saveProfile() {
  profileError.value = null;
  profileSuccess.value = null;
  savingProfile.value = true;
  try {
    await updateMyProfile({ ...form });
    profileSuccess.value = 'Datos actualizados correctamente';
  } catch (e) {
    profileError.value = e?.response?.data?.message || e?.message || 'No se pudo actualizar el perfil';
  } finally {
    savingProfile.value = false;
  }
}

async function loadPurchases() {
  purchasesError.value = null;
  loadingPurchases.value = true;
  try {
    purchases.value = await getMyPurchases();
  } catch (e) {
    purchasesError.value = e?.response?.data?.message || e?.message || 'No se pudo cargar el historial';
  } finally {
    loadingPurchases.value = false;
  }
}

onMounted(async () => {
  await loadProfile();
  await loadPurchases();
});
</script>

<style scoped>
.user-section {
    padding: 0 5rem;
}

.panel-card {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}

.active {
  background-color: var(--accent-color) !important;
  border: none !important;
  color: var(--alternate-text-color) !important;
}

.nav-link {
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
  margin-top: 1rem;
}
</style>

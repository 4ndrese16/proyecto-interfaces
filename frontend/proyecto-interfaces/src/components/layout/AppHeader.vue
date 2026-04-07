<template>
    <header class="app-header">
        <div class="header">
            <div class="container-fluid">
               <div class="row">
                  <div class="col-xl-3 col-lg-3 col-md-3 col-sm-3 col logo_section">
                     <div class="full">
                        <div class="center-desk">
                           <div class="logo">
                              <router-link to="/"><img src="@/assets/images/interfaces/logo_intefaces_sf.png" alt="Estudio Phone" style="width: 12rem" /></router-link>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div class="col-xl-9 col-lg-9 col-md-9 col-sm-9">
                     <nav class="navigation navbar navbar-expand-md">
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample04" aria-controls="navbarsExample04" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarsExample04">
                           <ul class="navbar-nav mr-auto">
                              <li class="nav-item active">
                                 <router-link class="nav-link" to="/">Inicio</router-link>
                              </li>
                              <li class="nav-item">
                                 <router-link class="nav-link" to="/catalogo">Catálogo</router-link>
                              </li>
                              <li v-if="isAdmin" class="nav-item">
                                 <router-link class="nav-link" to="/admin">Admin</router-link>
                              </li>
                              <li class="nav-item">
                                 <router-link class="nav-link" to="/carrito"><i class="fas fa-shopping-cart me-2"></i><span v-if="cartCount" class="cart-badge">{{ cartCount }}</span></router-link>
                              </li>
                                 <li class="nav-item dropdown me-2">
                                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                       <i class="fas fa-eye me-2"></i>
                                    </a>
                                    <ul class="dropdown-menu">
                                       <li v-if="palStore.defaultPalette"><a class="dropdown-item" href="#" @click.prevent="apply('default')">Default</a></li>
                                       <li v-if="palStore.darkPalette"><a class="dropdown-item" href="#" @click.prevent="apply('dark')">Modo Oscuro</a></li>
                                       <li v-if="palStore.daltonicPalette"><a class="dropdown-item" href="#" @click.prevent="apply('daltonic')">Modo Daltónico</a></li>
                                       <li v-if="!palStore.defaultPalette && !palStore.darkPalette && !palStore.daltonicPalette"><span class="dropdown-item text-muted">No hay paletas asignadas</span></li>
                                    </ul>
                                 </li>
                              <li v-if="!isAuthenticated" class="nav-item d_none login_btn">
                                 <router-link class="nav-link" to="/login">Login</router-link>
                              </li>
                              <li v-if="!isAuthenticated" class="nav-item d_none">
                                 <router-link class="nav-link" to="/register">Registrarse</router-link>
                              </li>
                              <li v-if="isAuthenticated" class="nav-item d_none">
                                 <router-link class="nav-link" to="/usuario"><i class="fas fa-user me-1"></i>Mi Cuenta</router-link>
                              </li>
                              <li v-if="isAuthenticated" class="nav-item d_none">
                                 <button class="nav-link logout-link" type="button" @click="handleLogout">Cerrar sesión</button>
                              </li>
                           </ul>
                        </div>
                     </nav>
                  </div>
               </div>
            </div>
         </div>
    </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getToken, logout } from '@/api/auth';
import { useColorStore } from '@/stores/colorStore'
import { useCartStore } from '@/stores/cartStore';

const palStore = useColorStore()
const cartStore = useCartStore();
const router = useRouter();

const hasAnySelection = computed(() => {
   return !!(palStore.defaultId || palStore.darkId || palStore.daltonicId)
})

const cartCount = computed(() => cartStore.totalItems);

const isAdmin = ref(false);
const isAuthenticated = ref(false);

function parseJwt(token) {
   try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(payload).split('').map(function(c) {
         return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(json);
   } catch (e) {
      return null;
   }
}

function checkRole() {
   const token = getToken();
   isAuthenticated.value = !!token;

   if (!token) {
      isAdmin.value = false;
      return;
   }
   const payload = parseJwt(token);
   isAdmin.value = payload && payload.role === 'admin';
}

function onAuthChanged() {
   checkRole();
   cartStore.load();
}

onMounted(() => {
   checkRole();
   window.addEventListener('storage', checkRole);
   window.addEventListener('auth-changed', onAuthChanged);
   // ensure palettes loaded for header display
   palStore.load(false)
   cartStore.load()
});

onBeforeUnmount(() => {
   window.removeEventListener('storage', checkRole);
   window.removeEventListener('auth-changed', onAuthChanged);
});

function apply(mode) {
   palStore.applyMode(mode)
}

function handleLogout() {
   logout();
   router.push('/login');
}
</script>

<style scoped>
.dropdown-menu {
   background-color: var(--main-bg-color);
}

.dropdown-item {
   color: var(--text-color);
}

.dropdown-item:hover {
   background-color: var(--secondary-color);
   color: var(--alternate-text-color);
}

.cart-badge {
   display: inline-flex;
   align-items: center;
   justify-content: center;
   min-width: 18px;
   height: 18px;
   margin-left: 6px;
   padding: 0 6px;
   border-radius: 999px;
   background: var(--accent-color);
   color: var(--alternate-text-color);
   font-size: calc(var(--p-size) - 4px);
   font-weight: 700;
}

.logout-link {
   border: none;
   background: transparent;
   cursor: pointer;
}
</style>
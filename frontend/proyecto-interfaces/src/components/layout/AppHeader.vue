<template>
    <header class="app-header">
        <div class="header">
            <div class="container-fluid">
               <div class="row">
                  <div class="col-xl-3 col-lg-3 col-md-3 col-sm-3 col logo_section">
                     <div class="full">
                        <div class="center-desk">
                           <div class="logo">
                              <a href="index.html"><img src="@/assets/images/logo.png" alt="#" /></a>
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
                                 <a class="nav-link" href="index.html">Home</a>
                              </li>
                              <li class="nav-item">
                                 <a class="nav-link" href="about.html">About</a>
                              </li>
                              <li class="nav-item">
                                 <a class="nav-link" href="glasses.html">Our Glasses</a>
                              </li>
                              <li class="nav-item">
                                 <a class="nav-link" href="shop.html">Shop</a>
                              </li>
                              <li v-if="isAdmin" class="nav-item">
                                 <router-link class="nav-link" to="/admin">Admin</router-link>
                              </li>
                              <li class="nav-item d_none login_btn">
                                 <a class="nav-link" href="#">Login</a>
                              </li>
                              <li class="nav-item d_none">
                                 <a class="nav-link" href="#">Register</a>
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { getToken } from '@/api/auth';

const isAdmin = ref(false);

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
   if (!token) {
      isAdmin.value = false;
      return;
   }
   const payload = parseJwt(token);
   isAdmin.value = payload && payload.role === 'admin';
}

onMounted(() => {
   checkRole();
   window.addEventListener('storage', checkRole);
});

onBeforeUnmount(() => {
   window.removeEventListener('storage', checkRole);
});
</script>
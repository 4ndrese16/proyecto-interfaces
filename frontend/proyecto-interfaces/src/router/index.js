import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import HomeView from '@/views/HomeView.vue'
import AdminView from '@/views/AdminView.vue'
import RegisterView from '@/views/RegisterView.vue'
import { getToken } from '@/api/auth';

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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/login', component: LoginView },
    { path: '/admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/register', component: RegisterView }
  ],
})

router.beforeEach((to, from, next) => {
  const token = getToken();
  // if route doesn't require auth, continue
  if (!to.meta || !to.meta.requiresAuth) return next();

  if (!token) {
    return next({ path: '/', query: { redirect: to.fullPath } });
  }

  // If route requires admin, verify role in token
  if (to.meta.requiresAdmin) {
    const payload = parseJwt(token);
    if (!payload || payload.role !== 'admin') {
      return next({ path: '/', query: { redirect: to.fullPath } });
    }
  }

  return next();
});

export default router

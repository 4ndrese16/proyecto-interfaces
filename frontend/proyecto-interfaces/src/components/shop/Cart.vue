<template>
  <section class="cart-section py-4">
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Carrito de Compras</h2>
        <button v-if="cart.items.length" class="btn btn-outline-danger" @click="cart.clear">Vaciar carrito</button>
      </div>

      <div v-if="!cart.items.length" class="alert alert-light border">
        Tu carrito esta vacio. <router-link to="/catalogo">Ir al catalogo</router-link>
      </div>

      <div v-else class="row g-3">
        <div class="col-12 col-lg-8">
          <div class="table-responsive card p-2">
            <table class="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in cart.items" :key="item.id">
                  <td>
                    <div class="d-flex gap-2 align-items-center">
                      <img :src="resolveImage(item.image_path)" class="thumb" :alt="item.name" />
                      <div>
                        <strong>{{ item.name }}</strong>
                        <div class="small text-muted">{{ item.brand }} <span v-if="item.color_name">• {{ item.color_name }}</span></div>
                      </div>
                    </div>
                  </td>
                  <td>{{ money(item.final_price ?? item.price) }}</td>
                  <td>
                    <div class="qty-controls">
                      <button class="btn btn-sm btn-outline-secondary" @click="cart.decrease(item.id)">-</button>
                      <span>{{ item.qty }}</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="cart.increase(item.id)">+</button>
                    </div>
                  </td>
                  <td>{{ money((item.final_price ?? item.price) * item.qty) }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-danger" @click="cart.remove(item.id)">Eliminar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="col-12 col-lg-4">
          <div class="card p-3 summary-card">
            <h4>Resumen</h4>
            <p class="d-flex justify-content-between mb-1"><span>Items</span><strong>{{ cart.totalItems }}</strong></p>
            <p class="d-flex justify-content-between mb-2"><span>Subtotal</span><strong>{{ money(cart.subtotal) }}</strong></p>
            <p class="d-flex justify-content-between mb-2"><span>IVA (16%)</span><strong>{{ money(vatAmount) }}</strong></p>
            <hr />
            <p class="d-flex justify-content-between"><span>Total</span><strong>{{ money(total) }}</strong></p>

            <button class="btn btn-primary w-100 mt-2" @click="goCheckout">Proceder al pago</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cartStore';

const cart = useCartStore();
const router = useRouter();

const apiRoot = (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
const fallbackImage = new URL('@/assets/images/interfaces/xiaomi_15_ultra_product.png', import.meta.url).href;

const resolveImage = (pathValue) => {
  if (!pathValue) return fallbackImage;
  if (/^https?:\/\//i.test(pathValue)) return pathValue;
  if (pathValue.startsWith('/')) return apiRoot ? `${apiRoot}${pathValue}` : pathValue;
  return apiRoot ? `${apiRoot}/${pathValue}` : `/${pathValue}`;
};

const vatAmount = computed(() => Number((cart.subtotal * 0.16).toFixed(2)));
const total = computed(() => Number((cart.subtotal + vatAmount.value).toFixed(2)));

const money = (value) => Number(value || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' });

const goCheckout = () => {
  router.push('/receipt-demo');
};
</script>

<style scoped>
.cart-section {
  background: var(--main-bg-color);
  color: var(--text-color);
}

.card {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}

.thumb {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: #fff;
}

.qty-controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  border: none;
}
</style>

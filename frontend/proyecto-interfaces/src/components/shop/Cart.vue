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
            <div class="coupon-box mb-2">
              <label class="form-label">Cupón</label>
              <div class="d-flex gap-2">
                <input v-model.trim="couponCode" class="form-control" placeholder="EJ: DESCUENTO10" />
                <button class="btn btn-outline-secondary" :disabled="couponLoading" @click="applyCoupon">
                  {{ couponLoading ? '...' : 'Aplicar' }}
                </button>
              </div>
              <small v-if="couponError" class="text-danger d-block mt-1">{{ couponError }}</small>
              <small v-if="cart.appliedCoupon" class="text-success d-block mt-1">
                Cupón aplicado: <strong>{{ cart.appliedCoupon.code }}</strong>
                <button class="btn btn-link btn-sm p-0 ms-2" @click="removeCoupon">Quitar</button>
              </small>
            </div>
            <p class="d-flex justify-content-between mb-2"><span>Descuento</span><strong>- {{ money(discountAmount) }}</strong></p>
            <p class="d-flex justify-content-between mb-2"><span>Base imponible</span><strong>{{ money(taxableBase) }}</strong></p>
            <p class="d-flex justify-content-between mb-2"><span>IVA (16%)</span><strong>{{ money(vatAmount) }}</strong></p>

            <div class="payment-box mt-2 mb-2">
              <label class="form-label mb-1">Forma de pago</label>
              <div class="form-check">
                <input id="pay-single" v-model="paymentMode" value="single" class="form-check-input" type="radio" />
                <label for="pay-single" class="form-check-label">Pago único</label>
              </div>
              <div class="form-check mb-2">
                <input id="pay-installments" v-model="paymentMode" value="installments" class="form-check-input" type="radio" />
                <label for="pay-installments" class="form-check-label">Pago en cuotas</label>
              </div>

              <div v-if="paymentMode === 'installments'">
                <select v-model.number="installments" class="form-select mb-2">
                  <option v-for="opt in installmentOptions" :key="opt" :value="opt">{{ opt }} cuotas</option>
                </select>
                <small class="text-muted">Cada cuota aproximada: {{ money(installmentAmount) }}</small>
              </div>
            </div>

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
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cartStore';
import { validateCoupon } from '@/api/coupon';

const cart = useCartStore();
const router = useRouter();
const couponCode = ref(cart.appliedCoupon?.code || '');
const couponLoading = ref(false);
const couponError = ref(null);

const installmentOptions = [2, 3, 6, 12];
const paymentMode = ref(cart.paymentPlan?.mode || 'single');
const installments = ref(cart.paymentPlan?.installments || 1);

const apiRoot = (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
const fallbackImage = new URL('@/assets/images/interfaces/xiaomi_15_ultra_product.png', import.meta.url).href;

const resolveImage = (pathValue) => {
  if (!pathValue) return fallbackImage;
  if (/^https?:\/\//i.test(pathValue)) return pathValue;
  if (pathValue.startsWith('/')) return apiRoot ? `${apiRoot}${pathValue}` : pathValue;
  return apiRoot ? `${apiRoot}/${pathValue}` : `/${pathValue}`;
};

const discountAmount = computed(() => Number(cart.appliedCoupon?.discount_amount || 0));
const taxableBase = computed(() => Number(Math.max(cart.subtotal - discountAmount.value, 0).toFixed(2)));
const vatAmount = computed(() => Number((taxableBase.value * 0.16).toFixed(2)));
const total = computed(() => Number((taxableBase.value + vatAmount.value).toFixed(2)));
const installmentAmount = computed(() => Number((total.value / Math.max(1, installments.value)).toFixed(2)));

watch(paymentMode, (mode) => {
  if (mode === 'single') {
    installments.value = 1;
    cart.setPaymentPlan('single', 1);
  } else {
    if (installments.value <= 1) installments.value = 3;
    cart.setPaymentPlan('installments', installments.value);
  }
});

watch(installments, (value) => {
  if (paymentMode.value === 'installments') {
    cart.setPaymentPlan('installments', value);
  }
});

async function applyCoupon() {
  couponError.value = null;

  if (!couponCode.value.trim()) {
    couponError.value = 'Ingresa un código de cupón';
    return;
  }

  couponLoading.value = true;
  try {
    const result = await validateCoupon(couponCode.value.trim(), cart.subtotal);
    cart.applyCoupon(result);
    couponCode.value = result.code;
  } catch (e) {
    cart.clearCoupon();
    couponError.value = e?.response?.data?.message || e?.message || 'Cupón no válido';
  } finally {
    couponLoading.value = false;
  }
}

function removeCoupon() {
  cart.clearCoupon();
  couponCode.value = '';
  couponError.value = null;
}

const money = (value) => Number(value || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' });

const goCheckout = () => {
  router.push('/pago');
};
</script>

<style scoped>
.cart-section {
  background: var(--main-bg-color);
  color: var(--text-color);
  padding: 0 5rem;
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
  border: 1px solid var(--text-color);
  background: var(--main-bg-color);
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

@media screen and (max-width: 700px) {
  .cart-section {
    padding: 0;
}
}
</style>

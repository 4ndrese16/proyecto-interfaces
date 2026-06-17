<template>
  <section class="checkout-section py-4">
    <div class="container-fluid">
      <h2 class="mb-3">Página de Pagos</h2>

      <div v-if="!cart.items.length" class="alert alert-light border">
        Tu carrito está vacío. <router-link to="/catalogo">Ir al catálogo</router-link>
      </div>

      <div v-else class="row g-3">
        <div class="col-12 col-lg-7">
          <div class="card p-3 mb-3">
            <h4 class="mb-2">Cupón</h4>
            <div class="d-flex gap-2">
              <input v-model.trim="couponCode" class="form-control" placeholder="EJ: DESCUENTO10" />
              <button class="btn btn-outline-secondary" :disabled="couponLoading" @click="applyCoupon">{{ couponLoading ? '...' : 'Aplicar' }}</button>
            </div>
            <small v-if="couponError" class="text-danger d-block mt-1">{{ couponError }}</small>
            <small v-if="cart.appliedCoupon" class="text-success d-block mt-1">
              Cupón aplicado: <strong>{{ cart.appliedCoupon.code }}</strong>
              <button class="btn btn-link btn-sm p-0 ms-2" @click="removeCoupon">Quitar</button>
            </small>
          </div>

          <div class="card p-3 mb-3">
            <h4 class="mb-2">Configuración de Pago</h4>

            <div class="form-check">
              <input id="mode-single" v-model="paymentMode" class="form-check-input" type="radio" value="single" />
              <label for="mode-single" class="form-check-label">Pago único</label>
            </div>
            <div class="form-check">
              <input id="mode-50" v-model="paymentMode" class="form-check-input" type="radio" value="split50" />
              <label for="mode-50" class="form-check-label">50/50</label>
            </div>
            <div class="form-check mb-2">
              <input id="mode-equal" v-model="paymentMode" class="form-check-input" type="radio" value="splitEqual" />
              <label for="mode-equal" class="form-check-label">Split</label>
            </div>

            <div v-if="paymentMode === 'splitEqual'" class="mt-2">
              <label class="form-label">Cantidad de partes</label>
              <select v-model.number="equalPartsCount" class="form-select">
                <option v-for="opt in equalPartsOptions" :key="opt" :value="opt">{{ opt }} partes</option>
              </select>
            </div>
          </div>

          <div class="card p-3">
            <h4 class="mb-3">Métodos por Parte</h4>

            <div v-for="row in paymentRows" :key="row.key" class="part-block mb-3 p-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>{{ row.label }}</strong>
                <span>{{ money(row.amount) }}</span>
              </div>

              <label class="form-label">Método</label>
              <select class="form-select mb-2" v-model="partStates[row.key].method">
                <option value="card">Tarjeta de crédito</option>
                <option value="bank">Transferencia bancaria</option>
              </select>

              <div v-if="partStates[row.key].method === 'card'" class="row g-2">
                <div class="col-12 col-md-6">
                  <input v-model.trim="partStates[row.key].card.holder" class="form-control" placeholder="Titular" />
                </div>
                <div class="col-12 col-md-6">
                  <input v-model.trim="partStates[row.key].card.number" class="form-control" placeholder="Número de tarjeta" />
                </div>
                <div class="col-6">
                  <input v-model.trim="partStates[row.key].card.expiry" class="form-control" placeholder="MM/AA" />
                </div>
                <div class="col-6">
                  <input v-model.trim="partStates[row.key].card.cvv" class="form-control" placeholder="CVV" />
                </div>
              </div>

              <div v-else class="row g-2">
                <div class="col-12 col-md-6">
                  <input v-model.trim="partStates[row.key].bank.bank_name" class="form-control" placeholder="Banco" />
                </div>
                <div class="col-12 col-md-6">
                  <input v-model.trim="partStates[row.key].bank.reference" class="form-control" placeholder="Referencia" />
                </div>
                <div class="col-12">
                  <input v-model.trim="partStates[row.key].bank.account" class="form-control" placeholder="Cuenta / correo destino" />
                </div>
              </div>
            </div>

            <div v-if="paymentError" class="alert alert-danger">{{ paymentError }}</div>
            <button class="btn btn-primary w-100" @click="confirmPayment">Confirmar pago</button>
          </div>
        </div>

        <div class="col-12 col-lg-5">
          <div class="card p-3 summary-card sticky-top">
            <h4>Resumen final</h4>
            <p class="d-flex justify-content-between"><span>Items</span><strong>{{ cart.totalItems }}</strong></p>
            <p class="d-flex justify-content-between"><span>Subtotal</span><strong>{{ money(cart.subtotal) }}</strong></p>
            <p class="d-flex justify-content-between"><span>Descuento</span><strong>- {{ money(discountAmount) }}</strong></p>
            <p class="d-flex justify-content-between"><span>Base imponible</span><strong>{{ money(taxableBase) }}</strong></p>
            <p class="d-flex justify-content-between"><span>IVA (16%)</span><strong>{{ money(vatAmount) }}</strong></p>
            <hr />
            <p class="d-flex justify-content-between"><span>Total a pagar</span><strong>{{ money(total) }}</strong></p>

            <div class="mt-2">
              <h6>Desglose de pago</h6>
              <ul class="mb-0 ps-3">
                <li v-for="row in paymentRows" :key="`sum-${row.key}`">{{ row.label }}: {{ money(row.amount) }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cartStore';
import { validateCoupon } from '@/api/coupon';
import { createMyPurchase } from '@/api/purchase';

const cart = useCartStore();
const router = useRouter();

const couponCode = ref(cart.appliedCoupon?.code || '');
const couponLoading = ref(false);
const couponError = ref(null);

const paymentMode = ref('single');
const equalPartsCount = ref(3);
const equalPartsOptions = [2, 3, 4, 5, 6];
const paymentError = ref(null);

const partStates = reactive({});

const discountAmount = computed(() => Number(cart.appliedCoupon?.discount_amount || 0));
const taxableBase = computed(() => Number(Math.max(cart.subtotal - discountAmount.value, 0).toFixed(2)));
const vatAmount = computed(() => Number((taxableBase.value * 0.16).toFixed(2)));
const total = computed(() => Number((taxableBase.value + vatAmount.value).toFixed(2)));

const createPartState = () => ({
  method: 'card',
  card: {
    holder: '',
    number: '',
    expiry: '',
    cvv: ''
  },
  bank: {
    bank_name: '',
    reference: '',
    account: ''
  }
});

const paymentRows = computed(() => {
  const amount = total.value;

  if (paymentMode.value === 'single') {
    return [{ key: 'single', label: 'Pago único', amount }];
  }

  if (paymentMode.value === 'split50') {
    const half = Number((amount / 2).toFixed(2));
    return [
      { key: 'split50-a', label: 'Parte A (50%)', amount: half },
      { key: 'split50-b', label: 'Parte B (50%)', amount: Number((amount - half).toFixed(2)) }
    ];
  }

  const parts = Math.max(2, Number(equalPartsCount.value || 2));
  const each = Number((amount / parts).toFixed(2));
  const rows = [];
  let consumed = 0;

  for (let i = 1; i <= parts; i += 1) {
    const isLast = i === parts;
    const value = isLast ? Number((amount - consumed).toFixed(2)) : each;
    rows.push({ key: `equal-${i}`, label: `Parte ${i} de ${parts}`, amount: value });
    consumed = Number((consumed + value).toFixed(2));
  }

  return rows;
});

watch(paymentRows, (rows) => {
  const keys = new Set(rows.map((row) => row.key));

  rows.forEach((row) => {
    if (!partStates[row.key]) {
      partStates[row.key] = createPartState();
    }
  });

  Object.keys(partStates).forEach((key) => {
    if (!keys.has(key)) {
      delete partStates[key];
    }
  });
}, { immediate: true });

const money = (value) => Number(value || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' });

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

function validateCardFields(card) {
  return !!(card.holder && card.number && card.expiry && card.cvv);
}

function validateBankFields(bank) {
  return !!(bank.bank_name && bank.reference && bank.account);
}

function validatePayment() {
  paymentError.value = null;

  if (!paymentRows.value.length) {
    paymentError.value = 'No hay partes de pago definidas';
    return false;
  }

  if (paymentMode.value === 'split50') {
    const m1 = partStates['split50-a']?.method;
    const m2 = partStates['split50-b']?.method;
    if (m1 && m2 && m1 === m2) {
      paymentError.value = 'En el modo 50/50 debes usar métodos distintos en cada parte';
      return false;
    }
  }

  for (const row of paymentRows.value) {
    const state = partStates[row.key];
    if (!state) {
      paymentError.value = 'Falta información de una parte de pago';
      return false;
    }

    if (state.method === 'card') {
      if (!validateCardFields(state.card)) {
        paymentError.value = `Completa todos los datos de tarjeta en ${row.label}`;
        return false;
      }
    } else {
      if (!validateBankFields(state.bank)) {
        paymentError.value = `Completa todos los datos de transferencia en ${row.label}`;
        return false;
      }
    }
  }

  return true;
}

async function confirmPayment() {
  if (!validatePayment()) return;

  cart.setPaymentPlan(paymentMode.value === 'single' ? 'single' : 'installments', paymentRows.value.length);

  const paymentParts = paymentRows.value.map((row) => ({
    key: row.key,
    label: row.label,
    amount: row.amount,
    method: partStates[row.key]?.method || 'card'
  }));

  try {
    const created = await createMyPurchase({
      subtotal: cart.subtotal,
      discount: discountAmount.value,
      taxable_base: taxableBase.value,
      vat_amount: vatAmount.value,
      total: total.value,
      currency: 'BOB',
      items: cart.items,
      payment_plan: {
        mode: paymentMode.value,
        parts: paymentRows.value.length
      },
      payment_parts: paymentParts,
      coupon: cart.appliedCoupon || null
    });

    cart.clear();
    router.push(`/receipt-demo/${created.id}`);
  } catch (_e) {
    paymentError.value = _e?.response?.data?.message || _e?.message || 'No se pudo emitir la factura.';
  }
}
</script>

<style scoped>
.checkout-section {
  background: var(--main-bg-color);
  color: var(--text-color);
  padding: 0 5rem;
}

.card {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}

.part-block {
  border: 1px dashed var(--text-color);
  border-radius: 6px;
}

.form-control,
.form-select {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}

.btn-primary {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  border: none;
}

.btn {
  font-size: var(--p-size);
}

@media screen and (max-width: 700px) {
  .checkout-section {
    padding: 0;
}}
</style>

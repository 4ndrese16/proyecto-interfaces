<template>
	<section class="receipt-page">
		<div v-if="loading" class="alert alert-light border">Cargando factura...</div>
		<div v-else-if="error" class="alert alert-danger">{{ error }}</div>

		<template v-else-if="invoice">
			<div class="receipt-actions no-print">
				<button class="btn btn-outline-secondary" type="button" @click="goBack">Regresar</button>
				<button class="btn btn-primary" type="button" @click="printReceipt">Imprimir factura</button>
			</div>

			<article class="receipt-card" aria-label="Factura">
			<header class="receipt-header">
				<div>
					<h1 class="doc-title">FACTURA</h1>
					<p class="doc-number">Factura Nro: {{ invoice.invoice_number }}</p>
					<p class="doc-number">Numeracion consecutiva unica: {{ uniqueConsecutiveNumber }}</p>
				</div>
				<div class="text-end">
					<p class="meta-row"><strong>Fecha de emision:</strong> {{ formattedDate }}</p>
					<p class="meta-row"><strong>Hora de emision:</strong> {{ formattedTime }}</p>
					<p class="meta-row"><strong>Numero de control:</strong> {{ invoice.control_number }}</p>
				</div>
			</header>

			<section class="info-grid">
				<div class="info-block">
					<h2>Datos del emisor</h2>
					<p><strong>Razon social:</strong> {{ issuer.legal_name }}</p>
					<p><strong>Domicilio fiscal:</strong> {{ issuer.fiscal_address }}</p>
					<p><strong>RIF:</strong> {{ issuer.rif }}</p>
				</div>

				<div class="info-block">
					<h2>Datos del adquiriente</h2>
					<p><strong>Nombre:</strong> {{ buyer.full_name }}</p>
					<p><strong>Domicilio fiscal:</strong> {{ buyer.fiscal_address }}</p>
					<p><strong>Documento:</strong> {{ buyer.document_id }}</p>
					<p><strong>RIF/NIT:</strong> {{ buyer.tax_id || 'No aplica (persona natural)' }}</p>
				</div>
			</section>

			<section class="control-info">
				<p><strong>Control asignado por imprenta digital autorizada:</strong> {{ invoice.control_number }}</p>
				<p><strong>Total de numeros de control asignados:</strong> desde el N° {{ printer.control_range_start }} hasta el N° {{ printer.control_range_end }}</p>
			</section>

			<section>
				<h2>Detalle de operaciones</h2>
				<div class="table-wrap">
					<table class="table table-bordered table-sm mb-0">
						<thead>
							<tr>
								<th>Codigo operacion</th>
								<th>Descripcion</th>
								<th class="text-end">Cantidad</th>
								<th class="text-end">Precio unitario</th>
								<th class="text-end">Subtotal</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="line in lines" :key="line.code">
								<td>{{ line.code }}</td>
								<td>{{ line.description }}</td>
								<td class="text-end">{{ line.qty }}</td>
								<td class="text-end">{{ money(line.unitPrice) }}</td>
								<td class="text-end">{{ money(line.qty * line.unitPrice) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section>
				<h2>Descuentos y ajustes</h2>
				<ul class="adjustments-list">
					<li v-for="adj in adjustments" :key="adj.description">
						<span>{{ adj.description }}</span>
						<strong>{{ adj.value < 0 ? '-' : '+' }}{{ money(Math.abs(adj.value)) }}</strong>
					</li>
				</ul>
			</section>

			<section class="totals-grid">
				<p><span>Base imponible total:</span> <strong>{{ money(invoice.taxable_base) }}</strong></p>
				<p><span>IVA (16%):</span> <strong>{{ money(invoice.vat_amount) }}</strong></p>
				<p><span>Total operaciones:</span> <strong>{{ money(invoice.total) }}</strong></p>
			</section>

			<footer class="receipt-footer">
				<p><strong>Imprenta digital autorizada:</strong> {{ printer.company_name }}</p>
				<p><strong>RIF imprenta:</strong> {{ printer.rif }}</p>
				<p><strong>Providencia administrativa:</strong> {{ printer.providence_code }} de fecha {{ formatDateText(printer.providence_date) }}</p>
				<p><strong>Fecha de asignacion de numero de control (8 digitos):</strong> {{ formatDateText(printer.control_assignment_date) }}</p>
			</footer>
			</article>
		</template>
	</section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getMyLatestPurchase, getMyPurchaseById } from '@/api/purchase';

const route = useRoute();
const router = useRouter();

const invoice = ref(null);
const loading = ref(false);
const error = ref(null);

const issuer = computed(() => invoice.value?.issuer_data || {});
const buyer = computed(() => invoice.value?.buyer_data || {});
const printer = computed(() => invoice.value?.printer_data || {});

const lines = computed(() => {
	const raw = Array.isArray(invoice.value?.items) ? invoice.value.items : [];
	return raw.map((line, idx) => ({
		code: line.product_id || line.id || `OP-${idx + 1}`,
		description: line.name || 'Producto',
		qty: Number(line.qty || 0),
		unitPrice: Number(line.final_price ?? line.price ?? 0)
	}));
});

const adjustments = computed(() => {
	const discount = Number(invoice.value?.discount || 0);
	if (discount <= 0) return [];
	return [{ description: 'Descuento aplicado', value: -discount }];
});

const formatDate8 = (date) => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear());
	return `${day}/${month}/${year}`;
};

const formatDateText = (value) => {
	const raw = String(value || '').trim();
	if (!raw) return '';

	if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;

	const digits = raw.replace(/\D/g, '');
	if (digits.length === 8) {
		return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
	}

	const date = new Date(raw);
	if (!Number.isNaN(date.getTime())) return formatDate8(date);

	return raw;
};

const formatTimeMeridiem = (date) => {
	const hours24 = date.getHours();
	const ampm = hours24 >= 12 ? 'pm' : 'am';
	const hours12 = hours24 % 12 || 12;
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${String(hours12).padStart(2, '0')}.${minutes}.${seconds} ${ampm}`;
};

const issuedAt = computed(() => {
	const dt = new Date(invoice.value?.createdAt || Date.now());
	return Number.isNaN(dt.getTime()) ? new Date() : dt;
});

const formattedDate = computed(() => formatDate8(issuedAt.value));
const formattedTime = computed(() => formatTimeMeridiem(issuedAt.value));

const uniqueConsecutiveNumber = computed(() => String(invoice.value?.id || '').padStart(9, '0'));

const money = (value) => Number(value || 0).toLocaleString('es-BO', {
	style: 'currency',
	currency: String(invoice.value?.currency || 'BOB')
});

const printReceipt = () => {
	window.print();
};

const goBack = () => {
	if (window.history.length > 1) {
		router.back();
		return;
	}
	router.push('/usuario');
};

onMounted(async () => {
	loading.value = true;
	error.value = null;

	try {
		const id = route.params.id;
		invoice.value = id ? await getMyPurchaseById(id) : await getMyLatestPurchase();
	} catch (e) {
		error.value = e?.response?.data?.message || e?.message || 'No se pudo cargar la factura';
	} finally {
		loading.value = false;
	}
});
</script>

<style scoped>
.receipt-page {
	padding: 1.5rem;
	background: var(--main-bg-color);
	color: var(--text-color);
}

.receipt-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
	margin-bottom: 1rem;
}

.receipt-card {
	max-width: 980px;
	margin: 0 auto;
	border: 1px solid var(--text-color);
	border-radius: 8px;
	background: var(--main-bg-color);
	color: var(--text-color);
	padding: 1.5rem;
}

.receipt-header {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	border-bottom: 1px solid var(--text-color);
	padding-bottom: 1rem;
	margin-bottom: 1rem;
}

.doc-title {
	margin: 0;
	letter-spacing: 1px;
}

.doc-number,
.meta-row {
	margin: 0.2rem 0;
	font-size: var(--p-size);
}

.info-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
}

.info-block {
	border: 1px solid var(--text-color);
	border-radius: 6px;
	padding: 0.75rem;
}

.info-block h2,
section h2 {
	font-size: calc(var(--h2-size) - 2px);
	margin: 0 0 0.5rem;
}

.info-block p {
	margin: 0.25rem 0;
	font-size: var(--p-size);
}

.control-info {
	margin-bottom: 1rem;
	padding: 0.75rem;
	border: 1px dashed var(--text-color);
	border-radius: 6px;
}

.table-wrap {
	overflow-x: auto;
	margin-bottom: 1rem;
}

.adjustments-list {
	margin: 0 0 1rem;
	padding: 0;
	list-style: none;
}

.adjustments-list li {
	display: flex;
	justify-content: space-between;
	border-bottom: 1px solid var(--text-color);
	padding: 0.4rem 0;
}

.totals-grid {
	margin-left: auto;
	max-width: 380px;
	border: 1px solid var(--text-color);
	border-radius: 6px;
	padding: 0.75rem;
}

.totals-grid p {
	display: flex;
	justify-content: space-between;
	margin: 0.35rem 0;
}

.receipt-footer {
	margin-top: 1rem;
	border-top: 1px solid var(--text-color);
	padding-top: 0.8rem;
	font-size: var(--p-size);
}

.receipt-footer p {
	margin: 0.25rem 0;
}

@media (max-width: 768px) {
	.receipt-page {
		padding: 0.5rem;
	}

	.receipt-card {
		padding: 1rem;
	}

	.receipt-header {
		flex-direction: column;
	}

	.info-grid {
		grid-template-columns: 1fr;
	}

	.totals-grid {
		max-width: 100%;
	}
}

@media print {
	.no-print {
		display: none !important;
	}

	.receipt-page {
		padding: 0;
		background: #fff;
	}

	.receipt-card {
		max-width: 100%;
		border: none;
		border-radius: 0;
		padding: 0;
	}
}
</style>

<style>
@media print {
  /* Oculta toolbars/overlays comunes de desarrollo */
  #vite-plugin-vue-devtools-container,
  .vite-plugin-vue-devtools__toggle,
  [data-v-inspector],
  #__vue-devtools-host {
    display: none !important;
  }

  /* Imprime solo la factura */
  body * {
    visibility: hidden !important;
  }

  .receipt-card,
  .receipt-card * {
    visibility: visible !important;
  }

  .receipt-card {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
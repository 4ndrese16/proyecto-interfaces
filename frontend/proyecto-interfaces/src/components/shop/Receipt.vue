<template>
	<section class="receipt-page">
		<div class="receipt-actions no-print">
			<button class="btn btn-primary" type="button" @click="printReceipt">Imprimir factura</button>
		</div>

		<article class="receipt-card" aria-label="Factura demo">
			<header class="receipt-header">
				<div>
					<h1 class="doc-title">FACTURA</h1>
					<p class="doc-number">Factura Nro: {{ invoiceNumber }}</p>
					<p class="doc-number">Numeracion consecutiva unica: {{ uniqueConsecutiveNumber }}</p>
				</div>
				<div class="text-end">
					<p class="meta-row"><strong>Fecha de emision:</strong> {{ formattedDate }}</p>
					<p class="meta-row"><strong>Hora de emision:</strong> {{ formattedTime }}</p>
					<p class="meta-row"><strong>Numero de control:</strong> {{ controlNumber }}</p>
				</div>
			</header>

			<section class="info-grid">
				<div class="info-block">
					<h2>Datos del emisor</h2>
					<p><strong>Razon social:</strong> {{ issuer.name }}</p>
					<p><strong>Domicilio fiscal:</strong> {{ issuer.address }}</p>
					<p><strong>RIF:</strong> {{ issuer.rif }}</p>
				</div>

				<div class="info-block">
					<h2>Datos del adquiriente</h2>
					<p><strong>Nombre:</strong> {{ buyer.name }}</p>
					<p><strong>Domicilio fiscal:</strong> {{ buyer.address }}</p>
					<p><strong>Documento:</strong> {{ buyer.document }}</p>
					<p><strong>RIF:</strong> {{ buyer.rif || 'No aplica (persona natural)' }}</p>
				</div>
			</section>

			<section class="control-info">
				<p><strong>Control asignado por imprenta digital autorizada:</strong> {{ controlNumber }}</p>
				<p><strong>Total de numeros de control asignados:</strong> desde el N° {{ controlRangeStart }} hasta el N° {{ controlRangeEnd }}</p>
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
				<p><span>Base imponible total:</span> <strong>{{ money(baseAmount) }}</strong></p>
				<p><span>IVA ({{ (vatRate * 100).toFixed(0) }}%):</span> <strong>{{ money(vatAmount) }}</strong></p>
				<p><span>Total operaciones:</span> <strong>{{ money(totalOperations) }}</strong></p>
			</section>

			<footer class="receipt-footer">
				<p><strong>Imprenta digital autorizada:</strong> {{ printer.companyName }}</p>
				<p><strong>RIF imprenta:</strong> {{ printer.rif }}</p>
				<p><strong>Providencia administrativa:</strong> {{ printer.providenceCode }} de fecha {{ printer.providenceDate }}</p>
				<p><strong>Fecha de asignacion de numero de control (8 digitos):</strong> {{ controlAssignmentDate8 }}</p>
			</footer>
		</article>
	</section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { getCompanyProfile } from '@/api/companyProfile';
import { getPrinterProfile } from '@/api/printerProfile';

const now = new Date();

const invoiceNumber = 'F-2026-000145';
const uniqueConsecutiveNumber = '000000145';
const fallbackControlNumber = '00-DC0101-00002341';
const fallbackControlRangeStart = '00-DC0101-00002001';
const fallbackControlRangeEnd = '00-DC0101-00003000';

const fallbackIssuer = {
	name: 'Interfaces Mobile Store C.A.',
	address: 'Av. Principal Las Delicias, Torre Norte, Piso 2, Caracas, Distrito Capital',
	rif: 'J-50321987-4'
};

const buyer = {
	name: 'Carlos Alberto Perez Rojas',
	address: 'Urb. Lomas del Este, Valencia, Carabobo',
	document: 'V-18456789',
	rif: ''
};

const fallbackPrinter = {
	companyName: 'Impresos Digitales Andinos, C.A.',
	rif: 'J-41234567-8',
	providenceCode: 'GAT-DI-2026-0119',
	providenceDate: '12022026',
	controlRangeStart: fallbackControlRangeStart,
	controlRangeEnd: fallbackControlRangeEnd,
	controlAssignmentDate: '15032026'
};

const companyProfile = ref(null);
const printerProfile = ref(null);

const lines = [
	{
		code: 'OP-XM15U-001',
		description: 'Telefono Xiaomi 15 Ultra 512GB - Color Negro',
		qty: 1,
		unitPrice: 9999.99
	},
	{
		code: 'OP-ACC-041',
		description: 'Case protector premium para Xiaomi 15 Ultra',
		qty: 1,
		unitPrice: 249.5
	}
];

const adjustments = [
	{ description: 'Descuento promocional lanzamiento (10%)', value: -1024.95 },
	{ description: 'Ajuste por redondeo', value: 0.01 }
];

const vatRate = 0.16;

const formatDate8 = (date) => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear());
	return `${day}/${month}/${year}`;
};

const formatTimeMeridiem = (date) => {
	const hours24 = date.getHours();
	const ampm = hours24 >= 12 ? 'pm' : 'am';
	const hours12 = hours24 % 12 || 12;
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${String(hours12).padStart(2, '0')}.${minutes}.${seconds} ${ampm}`;
};

const formattedDate = formatDate8(now);
const formattedTime = formatTimeMeridiem(now);

const issuer = computed(() => ({
	name: companyProfile.value?.legal_name || fallbackIssuer.name,
	address: companyProfile.value?.fiscal_address || fallbackIssuer.address,
	rif: companyProfile.value?.rif || fallbackIssuer.rif
}));

const printer = computed(() => ({
	companyName: printerProfile.value?.company_name || fallbackPrinter.companyName,
	rif: printerProfile.value?.rif || fallbackPrinter.rif,
	providenceCode: printerProfile.value?.providence_code || fallbackPrinter.providenceCode,
	providenceDate: printerProfile.value?.providence_date || fallbackPrinter.providenceDate,
	controlRangeStart: printerProfile.value?.control_range_start || fallbackPrinter.controlRangeStart,
	controlRangeEnd: printerProfile.value?.control_range_end || fallbackPrinter.controlRangeEnd,
	controlAssignmentDate: printerProfile.value?.control_assignment_date || fallbackPrinter.controlAssignmentDate
}));

const controlNumber = computed(() => printer.value.controlRangeStart || fallbackControlNumber);
const controlRangeStart = computed(() => printer.value.controlRangeStart);
const controlRangeEnd = computed(() => printer.value.controlRangeEnd);
const controlAssignmentDate8 = computed(() => printer.value.controlAssignmentDate);

const grossAmount = computed(() => lines.reduce((acc, line) => acc + (line.qty * line.unitPrice), 0));
const adjustmentsTotal = computed(() => adjustments.reduce((acc, adj) => acc + adj.value, 0));
const baseAmount = computed(() => Number((grossAmount.value + adjustmentsTotal.value).toFixed(2)));
const vatAmount = computed(() => Number((baseAmount.value * vatRate).toFixed(2)));
const totalOperations = computed(() => Number((baseAmount.value + vatAmount.value).toFixed(2)));

const money = (value) => Number(value || 0).toLocaleString('es-VE', {
	style: 'currency',
	currency: 'VES'
});

const printReceipt = () => {
	window.print();
};

onMounted(async () => {
	try {
		companyProfile.value = await getCompanyProfile();
	} catch (_e) {
		companyProfile.value = null;
	}

	try {
		printerProfile.value = await getPrinterProfile();
	} catch (_e) {
		printerProfile.value = null;
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
	margin-bottom: 1rem;
}

.receipt-card {
	max-width: 980px;
	margin: 0 auto;
	border: 1px solid #cfcfcf;
	border-radius: 8px;
	background: #fff;
	color: #1b1b1b;
	padding: 1.5rem;
}

.receipt-header {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	border-bottom: 1px solid #dedede;
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
	font-size: 0.95rem;
}

.info-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
}

.info-block {
	border: 1px solid #ebebeb;
	border-radius: 6px;
	padding: 0.75rem;
}

.info-block h2,
section h2 {
	font-size: 1rem;
	margin: 0 0 0.5rem;
}

.info-block p {
	margin: 0.25rem 0;
	font-size: 0.92rem;
}

.control-info {
	margin-bottom: 1rem;
	padding: 0.75rem;
	border: 1px dashed #c9c9c9;
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
	border-bottom: 1px solid #ececec;
	padding: 0.4rem 0;
}

.totals-grid {
	margin-left: auto;
	max-width: 380px;
	border: 1px solid #e4e4e4;
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
	border-top: 1px solid #dedede;
	padding-top: 0.8rem;
	font-size: 0.9rem;
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
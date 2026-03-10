<template>
	<section class="services-section py-5">
		<div class="container">
			<div class="text-center mb-4">
				<h2 class="services-title">Nuestros Servicios</h2>
				<p class="services-subtitle">
					Soluciones completas para tu smartphone: compra, reparacion y accesorios en un solo lugar.
				</p>
			</div>

			<div class="row g-3 g-md-4">
				<div class="col-12 col-md-6 col-lg-4">
					<article class="service-card h-100">
						<div class="service-icon" aria-hidden="true">
							<i class="fa fa-mobile"></i>
						</div>
						<h3 class="service-title">Venta de Celulares</h3>
						<p class="service-text">
							Equipos nuevos y seminuevos de las principales marcas, con asesoria para elegir el modelo ideal.
						</p>
					</article>
				</div>

				<div class="col-12 col-md-6 col-lg-4">
					<article class="service-card h-100">
						<div class="service-icon" aria-hidden="true">
							<i class="fa fa-cogs"></i>
						</div>
						<h3 class="service-title">Servicio Tecnico</h3>
						<p class="service-text">
							Diagnostico, cambio de pantalla, baterias y mantenimiento para mantener tu celular como nuevo.
						</p>
					</article>
				</div>

				<div class="col-12 col-md-6 col-lg-4">
					<article class="service-card h-100">
						<div class="service-icon" aria-hidden="true">
							<i class="fa fa-plug"></i>
						</div>
						<h3 class="service-title">Accesorios</h3>
						<p class="service-text">
							Fundas, cargadores, cables, audifonos y mas accesorios compatibles para proteger y potenciar tu equipo.
						</p>
					</article>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
.services-section {
	background:
		radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--accent-color) 18%, transparent), transparent 45%),
		var(--main-bg-color);
}

.services-title {
	color: var(--text-color);
	margin-bottom: 0.5rem;
}

.services-subtitle {
	color: color-mix(in srgb, var(--text-color) 78%, transparent);
	max-width: 760px;
	margin: 0 auto;
}

.service-card {
	background: var(--main-bg-color);
	border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
	border-radius: 14px;
	padding: 1.4rem;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.service-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
}

.service-icon {
	width: 54px;
	height: 54px;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 0.9rem;
	font-size: 1.45rem;
	color: var(--alternate-text-color);
	background: var(--accent-color);
}

.service-title {
	font-size: 1.1rem;
	margin-bottom: 0.45rem;
	color: var(--text-color);
}

.service-text {
	color: color-mix(in srgb, var(--text-color) 82%, transparent);
	margin: 0;
}
</style>
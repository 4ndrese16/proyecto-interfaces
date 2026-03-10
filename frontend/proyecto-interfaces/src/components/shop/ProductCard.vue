<template>
    <div class="card" style="width: 18rem;">
  <img src="@/assets/images/interfaces/xiaomi_15_ultra_product.png" class="card-img-top" alt="Xiaomi 15 Ultra">
  <div class="card-body">
    <h3 class="card-header">Producto</h3>
    <p class="card-text">lorem ipsum</p>
    <a href="#" class="btn btn-primary">Comprar</a>
  </div>
</div>
</template>

<style scoped>
    .card {
        background: var(--main-bg-color);
        color: var(--text-color);
        border: 1px solid var(--text-color);
    }

    .card-header {
        font-family: var(--font-);
        background: var(--secondary-color);
        color: var(--alternate-text-color);
    }

    .btn-primary {
        background: var(--accent-color);
        color: var(--alternate-text-color);
        border: none;
    }

    .btn-primary:hover {
        background: var(--alternate-text-color);
        color: var(--accent-color);
        opacity: 0.9;
    }
</style>
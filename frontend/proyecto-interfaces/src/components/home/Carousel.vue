<template>
  <section class="product-carousel-section py-4">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Productos Destacados</h2>
      </div>

      <swiper
        :modules="modules"
        :loop="true"
        :autoplay="{ delay: 3000, disableOnInteraction: false }"
        :space-between="16"
        :slides-per-view="1"
        :breakpoints="breakpoints"
        :navigation="true"
        :pagination="{ clickable: true }"
      >
        <swiper-slide v-for="item in products" :key="item.id">
          <div class="product-slide">
            <ProductCard />
          </div>
        </swiper-slide>
      </swiper>
    </div>
  </section>
</template>

<script setup>
import ProductCard from '@/components/shop/ProductCard.vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const modules = [Autoplay, Navigation, Pagination];

const breakpoints = {
  640: { slidesPerView: 2 },
  992: { slidesPerView: 3 }
};

const products = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 }
];
</script>

<style scoped>
.product-slide {
  display: flex;
  justify-content: center;
  padding-bottom: 8px;
}

.product-slide :deep(.card) {
  width: 100% !important;
  max-width: 18rem;
}

.product-carousel-section :deep(.swiper-button-prev),
.product-carousel-section :deep(.swiper-button-next) {
  color: var(--secondary-color);
}

.product-carousel-section :deep(.swiper-pagination-bullet-active) {
  background: var(--accent-color);
}

.product-carousel-section {
  background: var(--main-bg-color);
  color: var(--text-color);
  padding: 0;
}

.product-carousel-section .container {
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (max-width: 767.98px) {
  .product-carousel-section :deep(.swiper-button-prev),
  .product-carousel-section :deep(.swiper-button-next) {
    display: none;
  }

  .product-slide :deep(.card) {
    max-width: 100%;
  }
}

@media (min-width: 992px) {
  .product-carousel-section .container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
</style>
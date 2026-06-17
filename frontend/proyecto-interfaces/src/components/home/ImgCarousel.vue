<template>
  <section class="img-carousel-section py-4">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Galería de imágenes</h2>
      </div>

      <div v-if="images.length">
        <swiper
          :modules="modules"
          :loop="true"
          :autoplay="{ delay: 4000, disableOnInteraction: false }"
          :space-between="16"
          :slides-per-view="1"
          :breakpoints="breakpoints"
          :navigation="true"
          :pagination="{ clickable: true }"
        >
          <swiper-slide v-for="item in images" :key="item.id">
            <div class="slide-card">
              <img :src="item.image_path" :alt="item.alt_text || 'Imagen de carrusel'" />
            </div>
          </swiper-slide>
        </swiper>
      </div>

      <div v-else class="text-center text-muted py-5">
        No hay imágenes cargadas para el carrusel.
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { getCarouselImages } from '@/api/carouselImages';

const modules = [Autoplay, Navigation, Pagination];
const images = ref([]);

const breakpoints = {
  576: { slidesPerView: 1 },
  768: { slidesPerView: 2 },
  992: { slidesPerView: 3 }
};

onMounted(async () => {
  try {
    const result = await getCarouselImages();
    images.value = Array.isArray(result) ? result : [];
  } catch (_error) {
    images.value = [];
  }
});
</script>

<style scoped>
.img-carousel-section {
  background: var(--main-bg-color);
  color: var(--text-color);
}
.slide-card {
  border-radius: 14px;
  overflow: hidden;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
}
.slide-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-carousel-section :deep(.swiper-button-prev),
.img-carousel-section :deep(.swiper-button-next) {
  color: var(--accent-color);
}
.img-carousel-section :deep(.swiper-pagination-bullet-active) {
  background: var(--secondary-color);
}

@media (max-width: 576px) {
  .slide-card {
    height: 220px;
  }
}
</style>

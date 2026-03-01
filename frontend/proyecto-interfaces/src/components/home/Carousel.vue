<template>
  <swiper
    :slides-per-view="1"
    :loop="true"
    :autoplay="{ delay: 3000 }"
  >
    <swiper-slide v-for="(item, index) in testimonials" :key="index">
      <div class="testimonial-card">
        {{ item.text }}
      </div>
    </swiper-slide>
  </swiper>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'

const testimonials = [
  { text: "Excelente servicio técnico" },
  { text: "Compré mi celular aquí" }
]
</script>
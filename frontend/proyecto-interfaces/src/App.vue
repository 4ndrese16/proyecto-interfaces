<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import Loader from '@/components/layout/Loader.vue';

const route = useRoute();
const isLoading = ref(true);
let timerId = null;

function triggerLoader(duration = 450) {
  isLoading.value = true;
  if (timerId) clearTimeout(timerId);
  timerId = setTimeout(() => {
    isLoading.value = false;
  }, duration);
}

onMounted(() => {
  triggerLoader(800);
});

watch(() => route.fullPath, () => {
  triggerLoader(450);
});

onBeforeUnmount(() => {
  if (timerId) clearTimeout(timerId);
});
</script>

<template>
  <Loader v-if="isLoading" />
  <RouterView />
</template>

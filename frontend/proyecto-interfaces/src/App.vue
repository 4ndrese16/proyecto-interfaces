<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useUiStore } from '@/stores/uiStore';
import TangramLoader from '@/components/layout/TangramLoader.vue';

const route = useRoute();
const uiStore = useUiStore();
const isLoading = ref(uiStore.loaderEnabled);

function onLoaderLoaded() {
  isLoading.value = false;
}

onMounted(() => {
  isLoading.value = uiStore.loaderEnabled;
});

watch(() => route.fullPath, () => {
  isLoading.value = uiStore.loaderEnabled;
});
</script>

<template>
  <TangramLoader v-if="uiStore.loaderEnabled && isLoading" @loaded="onLoaderLoaded" />
  <RouterView v-if="!isLoading || !uiStore.loaderEnabled" />
</template>

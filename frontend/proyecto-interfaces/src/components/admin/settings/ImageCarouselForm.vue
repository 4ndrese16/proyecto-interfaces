<template>
  <div class="image-carousel-admin card p-4">
    <h4>Administrar Carrusel de Imágenes</h4>

    <div v-if="errorMessage" class="alert alert-danger mt-3">{{ errorMessage }}</div>
    <div v-if="successMessage" class="alert alert-success mt-3">{{ successMessage }}</div>

    <form @submit.prevent="submitImage" class="mt-4">
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label">Selecciona imagen</label>
          <input class="form-control" type="file" accept=".jpg,.jpeg,.png,.webp" @change="handleImageSelected" />
          <small class="text-muted d-block mt-1">Dimensiones máximas: {{ MAX_WIDTH }} x {{ MAX_HEIGHT }} px</small>
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">Texto alternativo</label>
          <input class="form-control" type="text" v-model="altText" placeholder="Descripción breve para accesibilidad" />
        </div>
      </div>

      <div v-if="previewSrc" class="preview-section mt-4">
        <h6>Previsualización</h6>
        <div class="preview-grid">
          <div class="preview-image">
            <img :src="croppedPreview || previewSrc" alt="Vista previa de la imagen" />
          </div>
          <div class="preview-info">
            <p><strong>Dimensiones actuales:</strong> {{ previewDimensions }}</p>
            <p v-if="oversize" class="text-warning">
              La imagen supera las dimensiones máximas. Puedes recortarla al centro para ajustarla.
            </p>
            <p v-else class="text-success">La imagen cumple con las dimensiones máximas.</p>

            <div class="d-flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="cropImage"
                :disabled="!oversize || cropping"
              >
                {{ cropping ? 'Recortando...' : 'Recortar al centro' }}
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="openCropModal"
                :disabled="!previewSrc || cropping"
              >
                Recorte libre
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="resetCrop"
                :disabled="!croppedPreview"
              >
                Restaurar original
              </button>
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-primary mt-3" type="submit" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Guardar imagen' }}
      </button>
    </form>

    <div v-if="cropModalOpen" class="crop-modal-backdrop" @mousedown.self="closeCropModal">
      <div class="crop-modal" ref="cropContainer">
        <div class="crop-header d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">Recorte libre</h5>
            <p class="small text-muted mb-0">Arrastra la caja para moverla, ajusta el tamaño con el control.</p>
          </div>
          <button type="button" class="btn-close" @click="closeCropModal" aria-label="Cerrar"></button>
        </div>

        <div class="crop-body">
          <div class="crop-preview-frame">
            <img :src="previewSrc" ref="cropperImage" class="cropper-source-image" />
          </div>

          <div class="crop-controls mt-3">
            <p class="small text-muted">
              Ajusta el área de recorte directamente sobre la imagen. El resultado se redimensionará a {{ TARGET_WIDTH }} x {{ TARGET_HEIGHT }} px.
            </p>
            <div class="d-flex flex-wrap gap-2 mt-3">
              <button type="button" class="btn btn-primary" @click="applyFreeCrop" :disabled="freeCropping">
                {{ freeCropping ? 'Aplicando...' : 'Aplicar recorte' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="resetFreeCrop" :disabled="freeCropping">
                Reiniciar recorte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <hr class="my-4" />

    <div>
      <h5 class="mb-3">Imágenes cargadas</h5>
      <div v-if="images.length" class="row g-3">
        <div v-for="image in images" :key="image.id" class="col-12 col-md-4">
          <div class="card image-card">
            <img :src="image.image_path" :alt="image.alt_text || 'Imagen de carrusel'" class="card-img-top" />
            <div class="card-body py-2 px-3">
              <p class="card-text text-truncate mb-2">{{ image.alt_text || 'Sin texto alternativo' }}</p>
              <button class="btn btn-sm btn-outline-danger w-100" @click="removeImage(image.id)">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-muted">No hay imágenes cargadas aún.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import Cropper from 'cropperjs/dist/cropper.js';
import 'cropperjs/dist/cropper.css';
import { getCarouselImages, addCarouselImage, deleteCarouselImage } from '@/api/carouselImages';

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 700;
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 700;

const selectedFile = ref(null);
const previewSrc = ref('');
const previewDimensionsMeta = ref({ width: 0, height: 0 });
const imageNatural = ref({ width: 0, height: 0 });
const cropRect = ref({ x: 0, y: 0, width: 0, height: 0 });
const cropModalOpen = ref(false);
const cropContainer = ref(null);
const cropperImage = ref(null);
const cropperInstance = ref(null);
const cropDragging = ref(false);
const cropResizing = ref(false);
const cropStartPointer = ref({ x: 0, y: 0 });
const cropStartRect = ref({ x: 0, y: 0, width: 0, height: 0 });
const freeCropping = ref(false);
const croppedBlob = ref(null);
const croppedPreview = ref('');
const altText = ref('');
const saving = ref(false);
const cropping = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const images = ref([]);

const oversize = computed(() => {
  return previewDimensionsMeta.value.width > MAX_WIDTH || previewDimensionsMeta.value.height > MAX_HEIGHT;
});

const previewDimensions = computed(() => {
  const width = previewDimensionsMeta.value.width || 0;
  const height = previewDimensionsMeta.value.height || 0;
  return `${width} x ${height}`;
});

const cropAspect = computed(() => TARGET_WIDTH / TARGET_HEIGHT);
const maxCropWidth = computed(() => Math.min(imageNatural.value.width, MAX_WIDTH));
const maxCropHeight = computed(() => Math.min(imageNatural.value.height, MAX_HEIGHT));

const cropBoxStyle = computed(() => {
  const container = cropContainer.value;
  const containerWidth = container?.clientWidth || 1;
  const scale = imageNatural.value.width ? containerWidth / imageNatural.value.width : 1;
  return {
    width: `${cropRect.value.width * scale}px`,
    height: `${cropRect.value.height * scale}px`,
    transform: `translate(${cropRect.value.x * scale}px, ${cropRect.value.y * scale}px)`
  };
});

const loadImages = async () => {
  try {
    const result = await getCarouselImages();
    images.value = Array.isArray(result) ? result : [];
  } catch (_error) {
    images.value = [];
  }
};

const resetSelection = () => {
  selectedFile.value = null;
  previewSrc.value = '';
  previewDimensionsMeta.value = { width: 0, height: 0 };
  imageNatural.value = { width: 0, height: 0 };
  cropRect.value = { x: 0, y: 0, width: 0, height: 0 };
  cropModalOpen.value = false;
  croppedBlob.value = null;
  if (croppedPreview.value) {
    URL.revokeObjectURL(croppedPreview.value);
    croppedPreview.value = '';
  }
  altText.value = '';
  errorMessage.value = '';
  successMessage.value = '';
};

const initializeCropRect = () => {
  const ratio = cropAspect.value;
  let width = Math.min(imageNatural.value.width, MAX_WIDTH);
  let height = Math.round(width / ratio);

  if (height > imageNatural.value.height) {
    height = Math.min(imageNatural.value.height, MAX_HEIGHT);
    width = Math.round(height * ratio);
  }

  cropRect.value = {
    width,
    height,
    x: Math.round((imageNatural.value.width - width) / 2),
    y: Math.round((imageNatural.value.height - height) / 2)
  };
};

const handleImageSelected = async (event) => {
  resetSelection();
  const file = event.target.files?.[0] || null;
  if (!file) {
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errorMessage.value = 'El formato de la imagen no es válido. Usa JPG, PNG o WEBP.';
    return;
  }

  selectedFile.value = file;
  previewSrc.value = URL.createObjectURL(file);

  const image = new Image();
  image.src = previewSrc.value;
  await image.decode();
  previewDimensionsMeta.value = {
    width: image.naturalWidth,
    height: image.naturalHeight
  };
  imageNatural.value = {
    width: image.naturalWidth,
    height: image.naturalHeight
  };
  resetFreeCrop();
  initializeCropRect();
};

const cropImage = async () => {
  if (!previewSrc.value || !selectedFile.value) return;
  cropping.value = true;
  errorMessage.value = '';

  try {
    const image = new Image();
    image.src = previewSrc.value;
    await image.decode();

    const ratio = TARGET_WIDTH / TARGET_HEIGHT;
    let cropWidth = image.naturalWidth;
    let cropHeight = image.naturalHeight;

    if (cropWidth / cropHeight > ratio) {
      cropWidth = Math.floor(cropHeight * ratio);
    } else {
      cropHeight = Math.floor(cropWidth / ratio);
    }

    const cropX = Math.max(0, Math.floor((image.naturalWidth - cropWidth) / 2));
    const cropY = Math.max(0, Math.floor((image.naturalHeight - cropHeight) / 2));

    const canvas = document.createElement('canvas');
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, selectedFile.value.type || 'image/jpeg', 0.92));
    if (!blob) {
      throw new Error('No se pudo generar la imagen recortada.');
    }

    croppedBlob.value = blob;
    if (croppedPreview.value) {
      URL.revokeObjectURL(croppedPreview.value);
    }
    croppedPreview.value = URL.createObjectURL(blob);
  } catch (error) {
    errorMessage.value = error?.message || 'Error al recortar la imagen.';
  } finally {
    cropping.value = false;
  }
};

const resetCrop = () => {
  if (croppedPreview.value) {
    URL.revokeObjectURL(croppedPreview.value);
    croppedPreview.value = '';
  }
  croppedBlob.value = null;
  resetFreeCrop();
};

const submitImage = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!selectedFile.value) {
    errorMessage.value = 'Selecciona una imagen antes de guardar.';
    return;
  }

  const fileToUpload = croppedBlob.value
    ? new File([croppedBlob.value], selectedFile.value.name, { type: croppedBlob.value.type })
    : selectedFile.value;

  const formData = new FormData();
  formData.append('image', fileToUpload);
  formData.append('alt_text', altText.value || '');

  saving.value = true;
  try {
    await addCarouselImage(formData);
    successMessage.value = 'Imagen guardada correctamente.';
    await loadImages();
    resetSelection();
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error?.message || 'Error al guardar la imagen.';
  } finally {
    saving.value = false;
  }
};

const openCropModal = async () => {
  if (!previewSrc.value || !selectedFile.value) return;
  cropModalOpen.value = true;

  await nextTick();
  initializeCropper();
};

const initializeCropper = () => {
  if (!cropperImage.value) return;
  if (cropperInstance.value) {
    cropperInstance.value.destroy();
  }

  cropperInstance.value = new Cropper(cropperImage.value, {
    aspectRatio: cropAspect.value,
    viewMode: 1,
    autoCropArea: 0.8,
    responsive: true,
    background: true,
    movable: true,
    zoomable: true,
    dragMode: 'move',
    cropBoxResizable: true,
    minCropBoxWidth: 200,
    minCropBoxHeight: 120,
    ready() {
      const initialData = cropperInstance.value.getData();
      if (initialData.width === 0 || initialData.height === 0) {
        cropperInstance.value.setCropBoxData({ width: imageNatural.value.width * 0.8, height: imageNatural.value.height * 0.8 });
      }
    }
  });
};

const closeCropModal = () => {
  cropModalOpen.value = false;
  if (cropperInstance.value) {
    const instance = getCropperInstance();
    instance?.destroy?.();
    cropperInstance.value = null;
  }
  cropDragging.value = false;
  cropResizing.value = false;
};

const resetFreeCrop = () => {
  const instance = getCropperInstance();
  if (instance?.reset) {
    instance.reset();
  } else {
    cropRect.value = { x: 0, y: 0, width: 0, height: 0 };
  }
};

const getCropperInstance = () => {
  if (!cropperInstance.value) return null;
  if (typeof cropperInstance.value.getCroppedCanvas === 'function') return cropperInstance.value;
  if (cropperInstance.value.default && typeof cropperInstance.value.default.getCroppedCanvas === 'function') return cropperInstance.value.default;
  if (cropperInstance.value.cropper && typeof cropperInstance.value.cropper.getCroppedCanvas === 'function') return cropperInstance.value.cropper;
  return null;
};

const onCropPointerDown = (event) => {
  cropDragging.value = true;
  cropResizing.value = false;
  cropStartPointer.value = { x: event.clientX, y: event.clientY };
  cropStartRect.value = { ...cropRect.value };
  window.addEventListener('pointermove', onCropPointerMove);
  window.addEventListener('pointerup', onCropPointerUp);
};

const onResizePointerDown = (event) => {
  cropResizing.value = true;
  cropDragging.value = false;
  cropStartPointer.value = { x: event.clientX, y: event.clientY };
  cropStartRect.value = { ...cropRect.value };
  window.addEventListener('pointermove', onCropPointerMove);
  window.addEventListener('pointerup', onCropPointerUp);
};

const onCropPointerMove = (event) => {
  if (!cropModalOpen.value || (!cropDragging.value && !cropResizing.value)) return;
  const container = cropContainer.value;
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const scale = imageNatural.value.width ? containerRect.width / imageNatural.value.width : 1;

  const dx = Math.round((event.clientX - cropStartPointer.value.x) / scale);
  const dy = Math.round((event.clientY - cropStartPointer.value.y) / scale);

  if (cropDragging.value) {
    let nextX = cropStartRect.value.x + dx;
    let nextY = cropStartRect.value.y + dy;
    nextX = Math.max(0, Math.min(nextX, imageNatural.value.width - cropRect.value.width));
    nextY = Math.max(0, Math.min(nextY, imageNatural.value.height - cropRect.value.height));
    cropRect.value.x = nextX;
    cropRect.value.y = nextY;
  }

  if (cropResizing.value) {
    const nextWidth = Math.max(200, Math.min(maxCropWidth.value, cropStartRect.value.width + dx));
    const nextHeight = Math.round(nextWidth / cropAspect.value);
    if (nextHeight <= imageNatural.value.height && nextHeight <= maxCropHeight.value) {
      cropRect.value.width = nextWidth;
      cropRect.value.height = nextHeight;
    }
  }
};

const onCropPointerUp = () => {
  cropDragging.value = false;
  cropResizing.value = false;
  window.removeEventListener('pointermove', onCropPointerMove);
  window.removeEventListener('pointerup', onCropPointerUp);
};

const adjustCropHeight = () => {
  cropRect.value.height = Math.round(cropRect.value.width / cropAspect.value);
  if (cropRect.value.height > maxCropHeight.value) {
    cropRect.value.height = maxCropHeight.value;
    cropRect.value.width = Math.round(cropRect.value.height * cropAspect.value);
  }
};

const adjustCropWidth = () => {
  cropRect.value.width = Math.round(cropRect.value.height * cropAspect.value);
  if (cropRect.value.width > maxCropWidth.value) {
    cropRect.value.width = maxCropWidth.value;
    cropRect.value.height = Math.round(cropRect.value.width / cropAspect.value);
  }
};

const applyFreeCrop = async () => {
  if (!previewSrc.value || !selectedFile.value || !cropperInstance.value) return;
  const cropper = getCropperInstance();
  if (!cropper) {
    errorMessage.value = 'El recortador no está inicializado.';
    return;
  }

  freeCropping.value = true;
  errorMessage.value = '';

  try {
    const canvas = cropper.getCroppedCanvas({
      width: TARGET_WIDTH,
      height: TARGET_HEIGHT,
      imageSmoothingQuality: 'high'
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, selectedFile.value.type || 'image/jpeg', 0.92));
    if (!blob) {
      throw new Error('No se pudo generar la imagen recortada.');
    }

    croppedBlob.value = blob;
    if (croppedPreview.value) {
      URL.revokeObjectURL(croppedPreview.value);
    }
    croppedPreview.value = URL.createObjectURL(blob);
    closeCropModal();
  } catch (error) {
    errorMessage.value = error?.message || 'Error al aplicar el recorte libre.';
  } finally {
    freeCropping.value = false;
  }
};

const removeImage = async (id) => {
  try {
    await deleteCarouselImage(id);
    await loadImages();
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error?.message || 'Error al eliminar la imagen.';
  }
};

onMounted(loadImages);
</script>

<style scoped>
.image-carousel-admin {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
}
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.preview-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1rem;
  align-items: start;
}
.preview-image {
  width: 100%;
  min-height: 180px;
  background: var(--main-bg-color);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-image img {
  width: 100%;
  object-fit: contain;
}
.image-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
}
.image-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.crop-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1.5rem;
}

.crop-modal {
  width: min(95%, 1080px);
  max-height: 90vh;
  background: #ffffff;
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.18);
  overflow: auto;
}

.crop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.crop-body {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr;
  gap: 1rem;
}

.crop-preview-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f5f5f5;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.crop-source-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.crop-box {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.95);
  background: rgba(30, 144, 255, 0.15);
  box-shadow: 0 0 0 1px rgba(30, 144, 255, 0.5);
  cursor: move;
  touch-action: none;
}

.resize-handle {
  position: absolute;
  right: -10px;
  bottom: -10px;
  width: 18px;
  height: 18px;
  background: #1e90ff;
  border-radius: 50%;
  border: 2px solid #ffffff;
  cursor: nwse-resize;
}

.crop-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.crop-controls label {
  font-weight: 600;
}

.d-flex.flex-wrap.gap-2.mt-3 {
  gap: 0.75rem;
}

.crop-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.crop-actions button {
  min-width: 110px;
}

@media (max-width: 900px) {
  .crop-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }
}
</style>

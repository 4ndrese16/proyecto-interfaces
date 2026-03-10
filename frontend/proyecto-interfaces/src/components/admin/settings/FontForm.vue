<template>
  <div class="font-form">
    <form @submit.prevent="save">
      <div class="row">
        <div class="col-12 col-md-6">
          <div class="mb-3">
            <label class="form-label">Nombre del set tipografico</label>
            <input type="text" class="form-control" v-model.trim="form.name" placeholder="Ej: Elegante Serif" />
          </div>

          <div class="mb-3">
            <label class="form-label">Fuente para títulos y subtítulos (.ttf)</label>
            <input type="file" accept=".ttf" class="form-control" @change="onFileChange($event, 'title')" :disabled="isEditing" />
            <small v-if="isEditing" class="text-muted">Deshabilitado: en esta pantalla solo se editan tamaños.</small>
          </div>

          <div class="mb-3">
            <label class="form-label">Fuente para cuerpo (párrafos, botones) (.ttf)</label>
            <input type="file" accept=".ttf" class="form-control" @change="onFileChange($event, 'body')" :disabled="isEditing" />
            <small v-if="isEditing" class="text-muted">Deshabilitado: en esta pantalla solo se editan tamaños.</small>
          </div>

          <div class="mb-3">
            <label class="form-label">Tamaños (px)</label>
            <div class="row g-2">
              <div class="col-4">
                <input type="number" class="form-control" v-model.number="form.h1_size" min="8" />
                <small class="text-muted">Título (h1)</small>
              </div>
              <div class="col-4">
                <input type="number" class="form-control" v-model.number="form.h2_size" min="8" />
                <small class="text-muted">Subtítulos (h2)</small>
              </div>
              <div class="col-4">
                <input type="number" class="form-control" v-model.number="form.p_size" min="8" />
                <small class="text-muted">Párrafo / Botón</small>
              </div>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-primary save" :disabled="saving" type="submit">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              Guardar tipografía
            </button>
            <button class="btn btn-outline-secondary reset" type="button" @click="reset"
              :disabled="saving">Reset</button>
          </div>

          <div v-if="serverError" class="alert alert-danger mt-3">{{ serverError }}</div>
          <div v-if="successMessage" class="alert alert-success mt-3">{{ successMessage }}</div>
        </div>

        <div class="col-12 col-md-6 mt-3 mt-md-0">
          <div class="preview-card p-3 rounded" :style="previewCardStyle()">
            <h1 :style="previewTitleStyle()">Ejemplo de título</h1>
            <h2 :style="previewSubtitleStyle()">Subtítulo de ejemplo</h2>
            <p :style="previewParagraphStyle()">Este es un párrafo de ejemplo para ver el tamaño y la familia
              tipográfica seleccionada.</p>
            <button class="btn mt-3" :style="previewButtonStyle()">Botón</button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { computed, ref, reactive, watch } from 'vue';
import { createTypography, updateTypography, getActive } from '../../../api/typography';

export default {
  name: 'FontForm',
  props: {
    editingTypography: {
      type: Object,
      default: null
    }
  },
  emits: ['saved'],
  setup(props, { emit }) {
    const isEditing = computed(() => !!props.editingTypography?.id);

    const form = reactive({
      id: null,
      name: '',
      h1_size: 24,
      h2_size: 18,
      p_size: 15,
      font_title_file: null,
      font_body_file: null,
      font_title_name: 'TitleFont',
      font_body_name: 'BodyFont'
    });

    const saving = ref(false);
    const serverError = ref(null);
    const successMessage = ref(null);

    // dynamically inject @font-face rules when user uploads fonts
    function registerFont(name, dataUrl) {
      if (!dataUrl) return;
      const styleId = `font-${name}`;
      let styleTag = document.getElementById(styleId);
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `@font-face { font-family: "${name}"; src: url(${dataUrl}); }`;
    }

    function onFileChange(e, which) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.ttf')) {
        serverError.value = 'Solo se permiten archivos .ttf';
        setTimeout(() => (serverError.value = null), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (which === 'title') {
          form.font_title_file = file;
          form.font_title_name = file.name.replace(/\.ttf$/i, '') || 'TitleFont';
          registerFont(form.font_title_name, reader.result);
        } else {
          form.font_body_file = file;
          form.font_body_name = file.name.replace(/\.ttf$/i, '') || 'BodyFont';
          registerFont(form.font_body_name, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }

    const previewCardStyle = () => ({ background: 'var(--main-bg-color)', color: 'var(--text-color)' });
    const previewTitleStyle = () => ({ fontFamily: form.font_title_name, fontSize: `${form.h1_size}px` });
    const previewSubtitleStyle = () => ({ fontFamily: form.font_title_name, fontSize: `${form.h2_size}px` });
    const previewParagraphStyle = () => ({ fontFamily: form.font_body_name, fontSize: `${form.p_size}px` });
    const previewButtonStyle = () => ({ background: 'var(--accent-color)', color: 'var(--alternate-text-color)', fontFamily: form.font_body_name, fontSize: `${form.p_size}px` });

    async function loadActive() {
      try {
        const active = await getActive();
        if (active) {
          form.h1_size = parseInt(active.h1_size) || form.h1_size;
          form.h2_size = parseInt(active.h2_size) || form.h2_size;
          form.p_size = parseInt(active.p_size) || form.p_size;
          form.font_title_name = active.font_title_name || form.font_title_name;
          form.font_body_name = active.font_body_name || form.font_body_name;
        }
      } catch (err) {
        console.error('Failed to load active typography', err);
      }
    }

    loadActive();

    watch(
      () => props.editingTypography,
      (font) => {
        if (!font || !font.id) {
          form.id = null;
          form.name = '';
          form.font_title_file = null;
          form.font_body_file = null;
          return;
        }

        form.id = font.id;
        form.name = font.name || '';
        form.h1_size = parseInt(font.h1_size, 10) || form.h1_size;
        form.h2_size = parseInt(font.h2_size, 10) || form.h2_size;
        form.p_size = parseInt(font.p_size, 10) || form.p_size;
        form.font_title_name = font.font_title_name || form.font_title_name;
        form.font_body_name = font.font_body_name || form.font_body_name;
        form.font_title_file = null;
        form.font_body_file = null;
      },
      { immediate: true }
    );

    async function save() {
      saving.value = true;
      serverError.value = null;
      try {
        const payload = new FormData();
        payload.append('name', form.name || '');
        payload.append('h1_size', String(form.h1_size));
        payload.append('h2_size', String(form.h2_size));
        payload.append('p_size', String(form.p_size));
        payload.append('font_title_name', form.font_title_name);
        payload.append('font_body_name', form.font_body_name);

        if (form.font_title_file) {
          payload.append('title_file', form.font_title_file);
        }

        if (form.font_body_file) {
          payload.append('body_file', form.font_body_file);
        }

        if (isEditing.value && props.editingTypography?.id) {
          await updateTypography(props.editingTypography.id, payload);
        } else {
          await createTypography(payload);
        }

        successMessage.value = 'Tipografía guardada correctamente';
        emit('saved');
        setTimeout(() => (successMessage.value = null), 3000);
      } catch (err) {
        serverError.value = err?.response?.data?.message || err?.message || String(err);
      } finally {
        saving.value = false;
      }
    }

    function reset() {
      if (isEditing.value && props.editingTypography?.id) {
        form.id = props.editingTypography.id;
        form.name = props.editingTypography.name || '';
        form.h1_size = parseInt(props.editingTypography.h1_size, 10) || 24;
        form.h2_size = parseInt(props.editingTypography.h2_size, 10) || 18;
        form.p_size = parseInt(props.editingTypography.p_size, 10) || 15;
      } else {
        form.id = null;
        form.name = '';
        form.h1_size = 24;
        form.h2_size = 18;
        form.p_size = 15;
      }

      form.font_title_file = null;
      form.font_body_file = null;
      // optionally unregister injected fonts
    }

    return {
      isEditing,
      form,
      onFileChange,
      save,
      reset,
      saving,
      serverError,
      successMessage,
      previewCardStyle,
      previewTitleStyle,
      previewSubtitleStyle,
      previewParagraphStyle,
      previewButtonStyle
    };
  }
};
</script>

<style scoped>
.preview-card {
  border-radius: 6px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
}

.save {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  border: none;
}

.save:hover {
  background: var(--accent-color);
  filter: brightness(0.9);
  border: none;
  color: var(--alternate-text-color);
}

.reset {
  border: 1px solid var(--text-color);
  color: var(--text-color);
  background: var(--main-bg-color);
}

.reset:hover {
  background: var(--secondary-color);
  color: var(--alternate-text-color);
  border: 1px solid var(--alternate-text-color);
}

.form-control {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}

#file-upload-button {
  background: var(--main-bg-color) !important;
  color: var(--text-color) !important;
  border: 1px solid var(--text-color) !important;
}
</style>

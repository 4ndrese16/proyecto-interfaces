<template>
  <div class="font-form">
    <form @submit.prevent="save">
      <div class="row">
        <div class="col-12 col-md-6">
          <div class="mb-3">
            <label class="form-label">Fuente para títulos (.ttf)</label>
            <input type="file" accept=".ttf" class="form-control" @change="onFileChange($event, 'title')" />
          </div>

          <div class="mb-3">
            <label class="form-label">Fuente para cuerpo (subtítulos, párrafos, botones) (.ttf)</label>
            <input type="file" accept=".ttf" class="form-control" @change="onFileChange($event, 'body')" />
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
            <button class="btn btn-primary" :disabled="saving" type="submit">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              Guardar tipografía
            </button>
            <button class="btn btn-outline-secondary" type="button" @click="reset" :disabled="saving">Reset</button>
          </div>

          <div v-if="serverError" class="alert alert-danger mt-3">{{ serverError }}</div>
          <div v-if="successMessage" class="alert alert-success mt-3">{{ successMessage }}</div>
        </div>

        <div class="col-12 col-md-6 mt-3 mt-md-0">
          <div class="preview-card p-3 rounded" :style="previewCardStyle()">
            <h1 :style="previewTitleStyle()">Ejemplo de título</h1>
            <h2 :style="previewSubtitleStyle()">Subtítulo de ejemplo</h2>
            <p :style="previewParagraphStyle()">Este es un párrafo de ejemplo para ver el tamaño y la familia tipográfica seleccionada.</p>
            <button class="btn mt-3" :style="previewButtonStyle()">Botón</button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { createTypography, updateTypography, getActive } from '../../../api/typography';

export default {
  name: 'FontForm',
  setup() {
    const form = reactive({
      id: null,
      h1_size: 24,
      h2_size: 18,
      p_size: 15,
      // store data URLs for fonts temporarily
      font_title_data: null,
      font_body_data: null,
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
          form.font_title_data = reader.result;
          registerFont(form.font_title_name, form.font_title_data);
        } else {
          form.font_body_data = reader.result;
          registerFont(form.font_body_name, form.font_body_data);
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
          form.id = active.id || null;
          form.h1_size = parseInt(active.h1_size) || form.h1_size;
          form.h2_size = parseInt(active.h2_size) || form.h2_size;
          form.p_size = parseInt(active.p_size) || form.p_size;
          // if backend provides font data or paths, you'd register them here
        }
      } catch (err) {
        // ignore load errors
      }
    }

    loadActive();

    async function save() {
      saving.value = true;
      serverError.value = null;
      try {
        const payload = {
          h1_size: String(form.h1_size),
          h2_size: String(form.h2_size),
          p_size: String(form.p_size),
          font_title_name: form.font_title_name,
          font_body_name: form.font_body_name,
          font_title_data: form.font_title_data,
          font_body_data: form.font_body_data
        };

        let res;
        if (form.id) {
          res = await updateTypography(form.id, payload);
        } else {
          res = await createTypography(payload);
        }

        successMessage.value = 'Tipografía guardada correctamente';
        setTimeout(() => (successMessage.value = null), 3000);
      } catch (err) {
        serverError.value = err && err.message ? err.message : String(err);
      } finally {
        saving.value = false;
      }
    }

    function reset() {
      form.h1_size = 24;
      form.h2_size = 18;
      form.p_size = 15;
      form.font_title_data = null;
      form.font_body_data = null;
      // optionally unregister injected fonts
    }

    return {
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
.preview-card { border-radius: 6px; box-shadow: 0 1px 6px rgba(0,0,0,0.08); }
</style>

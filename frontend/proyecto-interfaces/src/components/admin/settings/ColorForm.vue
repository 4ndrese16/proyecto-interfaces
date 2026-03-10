<template>
  <div class="color-form">
    <form @submit.prevent="save">
      <!-- Alerts -->
      <div v-if="serverError" class="alert alert-danger" role="alert">
        {{ serverError }}
      </div>
      <div v-if="successMessage" class="alert alert-success" role="alert">
        {{ successMessage }}
      </div>
      <div class="row">
        <!-- Form controls -->
        <div class="col-12 col-md-6">
          <div class="mb-3">
            <label class="form-label">Name</label>
            <input class="form-control" v-model="form.name" placeholder="Palette name" />
          </div>

          <div class="row">
            <div class="col-6 col-sm-4 mb-3" v-for="(label, key) in colorFields" :key="key">
              <label class="form-label" :for="key">{{ label }}</label>
              <div class="d-flex align-items-center">
                <input type="color" class="form-control form-control-color p-0" :id="key" v-model="form[key]"
                  @input="onColorChange(key, $event.target.value)"
                  style="width:48px;height:38px;border:none;padding:0;margin-right:8px; border: 1px solid var(--text-color)" />
                <input class="form-control form-control-sm" v-model="form[key]"
                  @input="onColorChange(key, $event.target.value)" />
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-success save" type="submit" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Guardar paleta
            </button>
            <button class="btn btn-outline-secondary reset" type="button" @click="reset" :disabled="saving">Reset</button>
          </div>

          <!-- is_public control removed per request: table-only workflow -->
        </div>

        <!-- Preview -->
        <div class="col-12 col-md-6 mt-4 mt-md-0">
          <div class="preview-container p-3" :style="{ background: form.main_bg_color }">
            <div class="card preview-card p-2 mb-3 rounded"
              :style="{background: form.main_bg_color, color: form.text_color}">
              <div class="card-body">
                <h3 class="card-header preview-header p-2 mb-3 rounded"
                :style="{background: form.secondary_color, color: form.alternate_text_color}">Preview</h3>
                <p class="card-text">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nesciunt assumenda eveniet natus itaque doloribus quasi quae sit ea hic tempore.</p>
                <a href="#" class="btn"
                :style="{background: form.accent_color, color: form.alternate_text_color}">Botón</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { getDefault, getById, createPalette, updatePalette } from '../../../api/colorPalette';

export default {
  name: 'ColorForm',
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    // optional base URL override for the palettes API; if not provided the API module will read from env
    apiBase: {
      type: String,
      default: undefined
    },
    // optional: load an explicit palette by id on mount
    paletteId: {
      type: [String, Number],
      default: null
    },
    // optional: when true, try to load the default palette from the backend
    loadDefault: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'save', 'saved', 'error'],
  data() {
    return {
      // map of the five color fields matching the CSS variables in style.css
      colorFields: {
        main_bg_color: 'Main background',
        secondary_color: 'Secondary color',
        accent_color: 'Accent color',
        text_color: 'Text color',
        alternate_text_color: 'Alternate text color'
      },
      form: {
        id: this.modelValue.id || null,
        name: this.modelValue.name || '',
        // is_public removed - public handling is not part of the form per new UX
        // defaults from src/assets/css/style.css :root
        main_bg_color: this.modelValue.main_bg_color || '#ffffff',
        secondary_color: this.modelValue.secondary_color || '#252525',
        accent_color: this.modelValue.accent_color || '#03cafc',
        text_color: this.modelValue.text_color || '#000000',
        alternate_text_color: this.modelValue.alternate_text_color || '#ffffff'
      },
      loading: false,
      saving: false,
      serverError: null,
      successMessage: null
    };
  },
  created() {
    // On creation, optionally load palette from backend
    if (this.paletteId) {
      this.fetchById(this.paletteId);
    } else if (this.loadDefault) {
      this.fetchDefault();
    }
  },
  watch: {
    form: {
      handler(newVal) {
        // emit model update on every change so parent can v-model-bind if desired
        this.$emit('update:modelValue', { ...newVal });
      },
      deep: true
    },
    modelValue: {
      handler(val) {
        // when parent updates modelValue externally, sync into form
        if (!val) return;
        Object.keys(this.form).forEach(k => {
          if (val[k] !== undefined) this.form[k] = val[k];
        });
      },
      deep: true
    }
    ,
    paletteId: {
      handler(id) {
        if (!id) return;
        this.fetchById(id);
      }
    }
  },
  computed: {
    // prefer the explicit alternate_text_color supplied by the palette for reversed text
    buttonTextColor() {
      return this.form.alternate_text_color || this.contrastColor(this.form.accent_color);
    }
  },
  methods: {
    onColorChange(key, value) {
      // ensure hex format for color inputs and keep text inputs in sync
      if (typeof value !== 'string') return;
      this.form[key] = value;
    },
    // choose black or white depending on background luminance (fallback)
    contrastColor(hex) {
      try {
        const h = String(hex || '').replace('#', '');
        if (h.length !== 6) return '#000000';
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        // relative luminance
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luminance > 0.6 ? '#000000' : '#ffffff';
      } catch (e) {
        return '#000000';
      }
    },
    async save() {
      this.saving = true;
      this.serverError = null;
      const payload = { ...this.form };
      const id = payload.id;
      delete payload.id;

      try {
        const json = id
          ? await updatePalette(id, payload, this.apiBase)
          : await createPalette(payload, this.apiBase);
        if (json && typeof json === 'object') {
          Object.keys(json).forEach(k => { if (this.form.hasOwnProperty(k)) this.form[k] = json[k]; });
          if (json.id) this.form.id = json.id;
        }

        // success: clear server error, show success message and emit
        this.serverError = null;
        this.successMessage = json && json.name ? `Paleta "${json.name}" guardada` : 'Paleta guardada correctamente';
        // auto-hide success message after 3s
        setTimeout(() => { this.successMessage = null; }, 3000);

        this.$emit('saved', json);
        this.$emit('save', json);
      } catch (err) {
        this.successMessage = null;
        this.serverError = err && err.message ? err.message : String(err);
        this.$emit('error', this.serverError);
      } finally {
        this.saving = false;
      }
    },
    async fetchDefault() {
      this.loading = true;
      this.serverError = null;
      try {
        const json = await getDefault(this.apiBase);
        if (json) {
          Object.keys(this.form).forEach(k => {
            if (k in json) this.form[k] = json[k];
          });
          if (json.id) this.form.id = json.id;
        }
      } catch (err) {
        this.serverError = err && err.message ? err.message : String(err);
        this.$emit('error', this.serverError);
      } finally {
        this.loading = false;
      }
    },
    async fetchById(id) {
      if (!id) return;
      this.loading = true;
      this.serverError = null;
      try {
        const json = await getById(id, this.apiBase);
        if (json) {
          Object.keys(this.form).forEach(k => {
            if (k in json) this.form[k] = json[k];
          });
          if (json.id) this.form.id = json.id;
        }
      } catch (err) {
        this.serverError = err && err.message ? err.message : String(err);
        this.$emit('error', this.serverError);
      } finally {
        this.loading = false;
      }
    },
    reset() {
      this.form = {
        name: '',
        main_bg_color: '#ffffff',
        secondary_color: '#252525',
        accent_color: '#03cafc',
        text_color: '#000000',
        alternate_text_color: '#ffffff'
      };
    }
  }
};
</script>

<style scoped>
.preview-container {
  border-radius: 8px;
}

.preview-header {
  border-radius: 6px;
}

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

.form-control{
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}

/* Small adjustments to keep color inputs tidy */
input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
}

@media (max-width: 575.98px) {
  .preview-container {
    margin-top: 12px;
  }
}
</style>

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
            <label class="form-label">Nombre</label>
            <input class="form-control" v-model.trim="form.name" placeholder="Nombre de la Paleta" required />
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
import { getById, createPalette, updatePalette } from '../../../api/colorPalette';

const getCssVarValue = (varName, fallback) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
};

const buildThemeDefaults = () => ({
  main_bg_color: getCssVarValue('--main-bg-color', '#ffffff'),
  secondary_color: getCssVarValue('--secondary-color', '#252525'),
  accent_color: getCssVarValue('--accent-color', '#03cafc'),
  text_color: getCssVarValue('--text-color', '#000000'),
  alternate_text_color: getCssVarValue('--alternate-text-color', '#ffffff')
});

export default {
  name: 'ColorForm',
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    apiBase: {
      type: String,
      default: undefined
    },
    paletteId: {
      type: [String, Number],
      default: null
    }
  },
  emits: ['update:modelValue', 'save', 'saved', 'error'],
  data() {
    const defaults = buildThemeDefaults();
    return {
      colorFields: {
        main_bg_color: 'Fondo principal',
        secondary_color: 'Color secundario',
        accent_color: 'Color de contraste',
        text_color: 'Color del texto',
        alternate_text_color: 'Color alternativo del texto'
      },
      form: {
        id: this.modelValue.id || null,
        name: this.modelValue.name || '',
        main_bg_color: this.modelValue.main_bg_color || defaults.main_bg_color,
        secondary_color: this.modelValue.secondary_color || defaults.secondary_color,
        accent_color: this.modelValue.accent_color || defaults.accent_color,
        text_color: this.modelValue.text_color || defaults.text_color,
        alternate_text_color: this.modelValue.alternate_text_color || defaults.alternate_text_color
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
    }
  },
  watch: {
    form: {
      handler(newVal) {
        this.$emit('update:modelValue', { ...newVal });
      },
      deep: true
    },
    modelValue: {
      handler(val) {
        if (!val) return;
        Object.keys(this.form).forEach(k => {
          if (val[k] !== undefined) this.form[k] = val[k];
        });
      },
      deep: true
    },
    paletteId: {
      handler(id) {
        if (id) {
          this.fetchById(id);
          return;
        }

        this.reset();
      }
    }
  },
  methods: {
    createEmptyForm() {
      const defaults = buildThemeDefaults();
      return {
        id: null,
        name: '',
        main_bg_color: defaults.main_bg_color,
        secondary_color: defaults.secondary_color,
        accent_color: defaults.accent_color,
        text_color: defaults.text_color,
        alternate_text_color: defaults.alternate_text_color
      };
    },
    onColorChange(key, value) {
      if (typeof value !== 'string') return;
      this.form[key] = value;
    },
    async save() {
      this.saving = true;
      this.serverError = null;

      if (!String(this.form.name || '').trim()) {
        this.saving = false;
        this.serverError = 'El nombre de la paleta es obligatorio';
        return;
      }

      const payload = { ...this.form };
      const id = payload.id;
      const isEditing = !!id;
      delete payload.id;

      try {
        const json = id
          ? await updatePalette(id, payload, this.apiBase)
          : await createPalette(payload, this.apiBase);

        if (json && typeof json === 'object') {
          Object.keys(json).forEach(k => {
            if (Object.prototype.hasOwnProperty.call(this.form, k)) this.form[k] = json[k];
          });
          if (json.id) this.form.id = json.id;
        }

        this.serverError = null;
        this.successMessage = json && json.name ? `Paleta "${json.name}" guardada` : 'Paleta guardada correctamente';
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);

        this.$emit('saved', json);
        this.$emit('save', json);

        if (!isEditing) {
          this.reset();
        }
      } catch (err) {
        this.successMessage = null;
        this.serverError = err && err.message ? err.message : String(err);
        this.$emit('error', this.serverError);
      } finally {
        this.saving = false;
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
      this.form = this.createEmptyForm();
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

.form-control {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}

.form-label {
  color: var(--text-color);
}
</style>

<template>
  <div class="palette-table">
    <div class="row">
      <!-- Palettes list -->
      <div class="col-12 col-lg-8">
        <div class="row g-3">
          <div v-for="p in palettes" :key="p.id" class="col-6 col-sm-4 col-md-3">
            <div class="card h-100">
              <div class="card-body p-2 d-flex flex-column align-items-center text-center">
                <h6 class="card-title small mb-2">{{ p.name }}</h6>
                <div class="swatches d-flex gap-2 flex-wrap justify-content-center mb-2">
                  <span v-for="(key, idx) in swatchKeys" :key="idx" class="swatch" :title="key" :style="{ background: p[key] }"></span>
                </div>
                <button class="btn btn-sm btn-outline-primary mt-auto" @click="selectPalettePreview(p)">Ver</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selection panel -->
      <div class="col-12 col-lg-4 mt-3 mt-lg-0">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Selecciones rápidas</h5>

            <div class="mb-3">
              <label class="form-label">Default</label>
              <select class="form-select" v-model.number="selected.default" @change="onSelectionChange('default')">
                <option :value="null">-- Ninguna --</option>
                <option v-for="p in palettes" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <small v-if="previewFor('default')" class="d-block mt-2">Preview:</small>
              <div v-if="previewFor('default')" class="preview-mini border rounded p-2 mt-1" :style="miniStyle(previewFor('default'))"></div>
            </div>

            <div class="mb-3">
              <label class="form-label">Modo oscuro</label>
              <select class="form-select" v-model.number="selected.dark" @change="onSelectionChange('dark')">
                <option :value="null">-- Ninguna --</option>
                <option v-for="p in palettes" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <small v-if="previewFor('dark')" class="d-block mt-2">Preview:</small>
              <div v-if="previewFor('dark')" class="preview-mini border rounded p-2 mt-1" :style="miniStyle(previewFor('dark'))"></div>
            </div>

            <div class="mb-3">
              <label class="form-label">Apta para daltónicos</label>
              <select class="form-select" v-model.number="selected.daltonic" @change="onSelectionChange('daltonic')">
                <option :value="null">-- Ninguna --</option>
                <option v-for="p in palettes" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <small v-if="previewFor('daltonic')" class="d-block mt-2">Preview:</small>
              <div v-if="previewFor('daltonic')" class="preview-mini border rounded p-2 mt-1" :style="miniStyle(previewFor('daltonic'))"></div>
            </div>

            <div class="d-flex gap-2">
              <button class="btn btn-primary" @click="emitSelections">Guardar selecciones</button>
              <button class="btn btn-outline-secondary" @click="clearSelections">Limpiar</button>
            </div>
            <div v-if="error" class="alert alert-danger mt-2" role="alert">{{ error }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Large preview area for currently selected palettes -->
    <div class="row mt-4">
      <div class="col-12">
        <h5>Previews seleccionadas</h5>
      </div>
      <div class="col-12 d-flex flex-wrap gap-3">
        <div v-for="(key, label) in selectionLabels" :key="key" class="card p-3" style="min-width:220px; max-width:33%;">
          <div class="card-body">
            <h6 class="card-title">{{ label }}</h6>
            <div v-if="selected[key]" class="p-3 rounded" :style="previewStyleById(selected[key])">
              <h6>{{ paletteById(selected[key])?.name }}</h6>
              <p class="small">Ejemplo de cómo se vería esta paleta.</p>
              <button class="btn btn-sm" :style="{ background: paletteById(selected[key])?.accent_color, color: paletteById(selected[key])?.alternate_text_color || '#fff' }">Botón</button>
            </div>
            <div v-else class="text-muted">No seleccionada</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getPublic, getAll } from '../../../api/colorPalette';

export default {
  name: 'PaletteTable',
  props: {
    apiBase: { type: String, default: undefined },
    // if adminMode true, use getAll (requires auth); otherwise use public palettes
    adminMode: { type: Boolean, default: false }
  },
  emits: ['update:selections', 'saved'],
  data() {
    return {
      palettes: [],
      loading: false,
      error: null,
      // selections store selected palette ids
      selected: {
        default: null,
        dark: null,
        daltonic: null
      },
      swatchKeys: ['main_bg_color', 'secondary_color', 'accent_color', 'text_color', 'alternate_text_color']
    };
  },
  computed: {
    selectionLabels() {
      return { default: 'Default', dark: 'Modo oscuro', daltonic: 'Apta para daltónicos' };
    }
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = null;
      try {
        const list = this.adminMode ? await getAll(this.apiBase) : await getPublic(this.apiBase);
        this.palettes = list || [];
      } catch (err) {
        this.error = err && err.message ? err.message : String(err);
      } finally {
        this.loading = false;
      }
    },
    paletteById(id) {
      return this.palettes.find(p => p.id === id) || null;
    },
    miniStyle(p) {
      // p may be palette object or id
      const pal = typeof p === 'object' ? p : this.paletteById(p);
      if (!pal) return {};
      return { background: pal.main_bg_color, color: pal.text_color };
    },
    previewFor(type) {
      const id = this.selected[type];
      return id ? this.paletteById(id) : null;
    },
    previewStyleById(id) {
      const p = this.paletteById(id);
      if (!p) return {};
      return { background: p.main_bg_color, color: p.text_color, border: `1px solid rgba(0,0,0,0.06)` };
    },
    selectPalettePreview(p) {
      // quick set default selection to the clicked palette
      this.selected.default = p.id;
      this.emitSelections();
    },
    onSelectionChange(type) {
      // ensure selections are distinct
      const ids = [this.selected.default, this.selected.dark, this.selected.daltonic].filter(Boolean);
      const duplicates = ids.length !== new Set(ids).size;
      if (duplicates) {
        this.error = 'Las selecciones deben ser paletas distintas.';
        // revert the change by clearing the last changed selection
        this.$nextTick(() => { this.selected[type] = null; });
        setTimeout(() => { this.error = null; }, 3000);
        return;
      }
      this.error = null;
      this.emitSelections();
    },
    emitSelections() {
      this.$emit('update:selections', { ...this.selected });
      this.$emit('saved', { ...this.selected });
    },
    clearSelections() {
      this.selected = { default: null, dark: null, daltonic: null };
      this.emitSelections();
    }
  }
};
</script>

<style scoped>
.swatch {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0,0,0,0.08);
}
.preview-mini {
  min-height: 36px;
}
@media (max-width: 767.98px) {
  .card[style*="max-width"] { max-width: 100% !important; }
}
</style>

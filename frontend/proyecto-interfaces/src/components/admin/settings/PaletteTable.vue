<template>
  <div class="palette-table">
    <div class="row">
      <!-- Palettes list -->
      <div class="col-12">
        <div class="table-responsive">
          <table ref="dataTable" class="table table-striped table-hover table-sm mb-0" style="width:100%">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Colores</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in palettes" :key="p.id"
                  :class="{ 'selected-default': isDefault(p.id), 'selected-dark': isDark(p.id), 'selected-daltonic': isDaltonic(p.id) }">
                <td>
                  {{ p.name }}
                </td>
                <td>
                  <div class="d-flex gap-2 align-items-center flex-wrap">
                    <span v-for="(key, idx) in swatchKeys" :key="idx" class="swatch" :title="key" :style="{ background: p[key] }"></span>
                  </div>
                </td>
                <td>
                  <div class="action-btns d-flex flex-wrap gap-1" role="group">
                      <button class="btn btn-sm btn-outline-primary" @click="$emit('edit', p)" :disabled="isPending(p,'default') || isPending(p,'dark') || isPending(p,'daltonic')">Editar</button>
                      <button class="btn btn-sm btn-outline-danger" @click="remove(p)" :disabled="isSelected(p.id) || !adminMode || isPending(p,'delete')">
                        <span v-if="isPending(p,'delete')" class="spinner-border spinner-border-sm me-1 text-white" role="status" aria-hidden="true"></span>
                        Eliminar
                      </button>
                      <button :class="['btn','btn-sm', isDefault(p.id) ? 'btn-success' : 'btn-outline-secondary']" @click="setAsDefault(p.id)" :disabled="isPending(p,'default')">
                        <span v-if="isPending(p,'default')" class="spinner-border spinner-border-sm me-1" :class="spinnerClass(p,'default')" role="status" aria-hidden="true"></span>
                        Default
                      </button>
                      <button :class="['btn','btn-sm', isDark(p.id) ? 'btn-success' : 'btn-outline-secondary']" @click="setAsDark(p.id)" :disabled="isPending(p,'dark') || isDefault(p.id)" :title="isDefault(p.id) ? 'No se puede marcar Dark: paleta por defecto' : ''">
                        <span v-if="isPending(p,'dark')" class="spinner-border spinner-border-sm me-1" :class="spinnerClass(p,'dark')" role="status" aria-hidden="true"></span>
                        Dark
                      </button>
                      <button :class="['btn','btn-sm', isDaltonic(p.id) ? 'btn-success' : 'btn-outline-secondary']" @click="setAsDaltonic(p.id)" :disabled="isPending(p,'daltonic') || isDefault(p.id)" :title="isDefault(p.id) ? 'No se puede marcar Daltonic: paleta por defecto' : ''">
                        <span v-if="isPending(p,'daltonic')" class="spinner-border spinner-border-sm me-1" :class="spinnerClass(p,'daltonic')" role="status" aria-hidden="true"></span>
                        Daltonic
                      </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- selection panel removed - actions are managed directly from the table -->
    </div>

    <!-- large selection previews removed -->
  </div>
  <!-- Confirm delete modal -->
  <div class="modal fade" tabindex="-1" role="dialog" :class="{ show: showConfirm }" :style="{ display: showConfirm ? 'block' : 'none' }" ref="confirmModal">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirmar eliminación</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="cancelDelete"></button>
        </div>
        <div class="modal-body">
          <p>¿Estás seguro de que quieres eliminar la paleta <strong>{{ pendingDelete?.name }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancelDelete">Cancelar</button>
          <button type="button" class="btn btn-danger" @click="confirmDelete">Eliminar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div v-if="showingToast" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1060;">
    <div class="toast show align-items-center text-white bg-" :class="{'bg-success': toastType==='success', 'bg-danger': toastType==='danger', 'bg-info': toastType==='info'}" role="alert">
      <div class="d-flex">
        <div class="toast-body">{{ toastMessage }}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="showingToast=false"></button>
      </div>
    </div>
  </div>
</template>

<script>
import { getPublic, getAll, deletePalette, getDefault, getById, setDefaultPalette, setDarkPalette, setDaltonicPalette } from '../../../api/colorPalette';
import { useColorStore } from '@/stores/colorStore'
import 'datatables.net-dt/css/dataTables.dataTables.min.css';
import 'datatables.net-dt';

export default {
  name: 'PaletteTable',
  props: {
    apiBase: { type: String, default: undefined },
    // if adminMode true, use getAll (requires auth); otherwise use public palettes
    adminMode: { type: Boolean, default: false }
  },
  // emits removed - table will act directly via API and reload
  data() {
    return {
      palettes: [],
      loading: false,
      error: null,
      defaultId: null,
      darkId: null,
      daltonicId: null,
      // modal & toast state
      pendingDelete: null,
      showConfirm: false,
      showingToast: false,
      toastMessage: '',
      toastType: 'info',
      swatchKeys: ['main_bg_color', 'secondary_color', 'accent_color', 'text_color', 'alternate_text_color'],
      // per-row pending actions map: { [id]: { default: bool, dark: bool, daltonic: bool, delete: bool } }
      pendingMap: {}
    };
  },

  created() {
    this.load();
    // initialize paletas store adminMode flag
    try {
      const pal = useColorStore();
      pal.adminMode = this.adminMode;
    } catch (e) {}
    // fetch default from server
    getDefault(this.apiBase).then(d => { if (d && d.id) this.defaultId = d.id; }).catch(() => {});
  },
  mounted() {
    // try to initialize jQuery DataTable if available
    this.$nextTick(() => {
      try {
        if (window.$ && window.$.fn && window.$.fn.dataTable) {
          this._dt = window.$(this.$refs.dataTable).DataTable();
        }
      } catch (e) {
        // ignore
      }
    });
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = null;
      try {
        const list = this.adminMode ? await getAll(this.apiBase) : await getPublic(this.apiBase);
        this.palettes = list || [];
        // normalize flags so a single palette cannot have multiple roles simultaneously
        this.palettes = this.normalizeSelectionFlags(this.palettes);
        // pick up server-side selected flags
        try {
          const d = this.palettes.find(p => p.is_dark) || null;
          const dal = this.palettes.find(p => p.is_daltonic) || null;
          this.darkId = d ? d.id : null;
          this.daltonicId = dal ? dal.id : null;
          const serverDefault = this.palettes.find(p => p.is_default) || null;
          this.defaultId = serverDefault ? serverDefault.id : null;
        } catch (e) {}
        // ensure at least one default in admin mode when there's exactly one palette
          try {
            if (this.adminMode && this.palettes.length === 1 && !this.defaultId) {
              const pal = useColorStore();
              pal.adminMode = this.adminMode;
              await pal.setDefault(this.palettes[0].id);
              // reload list
              const list2 = await getAll(this.apiBase);
              this.palettes = list2 || [];
              this.palettes = this.normalizeSelectionFlags(this.palettes);
              const serverDefault2 = this.palettes.find(p => p.is_default) || null;
              this.defaultId = serverDefault2 ? serverDefault2.id : null;
            }
          } catch (e) {}
        // reload datatable if present
        this.$nextTick(() => {
          try {
            if (this._dt && window.$ && window.$.fn && window.$.fn.dataTable) {
              this._dt.clear();
              this._dt.rows.add(this.palettes);
              this._dt.draw();
            }
          } catch (e) {}
        });
      } catch (err) {
        this.error = err && err.message ? err.message : String(err);
      } finally {
        this.loading = false;
      }
    },
    isSelected(id) {
      // prefer the in-memory palette flags so badges/buttons reflect optimistic changes
      const p = this.palettes.find(x => x.id === id);
      if (p) return !!(p.is_default || p.is_dark || p.is_daltonic);
      return this.defaultId === id || this.darkId === id || this.daltonicId === id;
    },
    isDefault(id) {
      const p = this.palettes.find(x => x.id === id);
      if (p) return !!p.is_default;
      return this.defaultId === id;
    },
    isDark(id) {
      const p = this.palettes.find(x => x.id === id);
      if (p) return !!p.is_dark;
      return this.darkId === id;
    },
    isDaltonic(id) {
      const p = this.palettes.find(x => x.id === id);
      if (p) return !!p.is_daltonic;
      return this.daltonicId === id;
    },
    // pending helpers
    setPending(id, action, value = true) {
      if (!id) return;
      if (!this.pendingMap[id]) this.$set ? this.$set(this.pendingMap, id, {}) : (this.pendingMap[id] = {});
      this.pendingMap[id][action] = value;
    },
    isPending(p, action) {
      if (!p || !p.id) return false;
      const m = this.pendingMap[p.id];
      return !!(m && m[action]);
    },
    // ensure each palette has at most one selection flag set
    normalizeSelectionFlags(list) {
      if (!Array.isArray(list)) return list;
      return list.map(p => {
        // If multiple flags true, enforce precedence: default > dark > daltonic
        const hasDefault = !!p.is_default;
        const hasDark = !!p.is_dark;
        const hasDal = !!p.is_daltonic;
        if ((hasDefault ? 1 : 0) + (hasDark ? 1 : 0) + (hasDal ? 1 : 0) <= 1) return p;
        // choose precedence
        if (hasDefault) return { ...p, is_default: true, is_dark: false, is_daltonic: false };
        if (hasDark) return { ...p, is_default: false, is_dark: true, is_daltonic: false };
        return { ...p, is_default: false, is_dark: false, is_daltonic: true };
      });
    },
    spinnerClass(p, action) {
      // decide spinner color: white for active (green) buttons, dark otherwise
      if (action === 'default') return this.isDefault(p.id) ? 'text-white' : 'text-dark';
      if (action === 'dark') return this.isDark(p.id) ? 'text-white' : 'text-dark';
      if (action === 'daltonic') return this.isDaltonic(p.id) ? 'text-dark' : 'text-dark';
      return 'text-dark';
    },
    async setAsDefault(id) {
      if (!this.adminMode) return;
      // For Default we do NOT allow clearing the only/default palette.
      // Clicking Default always sets that palette as the default (no toggle-off).
      if (this.defaultId === id) {
        this.showToast('La paleta ya es la por defecto', 'info');
        return;
      }

      // optimistic update
      const backup = this.palettes.map(p => ({ id: p.id, is_default: p.is_default, is_dark: p.is_dark, is_daltonic: p.is_daltonic }));
      this.setPending(id, 'default', true);
      try {
        // set this as default and ensure this palette doesn't keep other roles
        this.palettes = this.palettes.map(p => ({
          ...p,
          is_default: p.id === id,
          is_dark: p.id === id ? false : p.is_dark,
          is_daltonic: p.id === id ? false : p.is_daltonic
        }));
        this.defaultId = id;

        await setDefaultPalette(id, this.apiBase);

        // normalize per-palette flags
        this.palettes = this.normalizeSelectionFlags(this.palettes);

        // sync global store so AppHeader updates in real-time; prefer reload to guarantee server truth
        try {
          const store = useColorStore();
          if (store && store.load) await store.load(false);
          if (store && store.currentMode === 'default') store.applyMode('default');
        } catch (e) {}

        this.showToast('Default actualizado', 'success');
      } catch (err) {
        this.showToast((err && err.message) || 'Error actualizando default', 'danger');
        // revert local state from backup
        this.palettes = this.palettes.map(p => {
          const b = backup.find(x => x.id === p.id);
          return b ? { ...p, is_default: b.is_default, is_dark: b.is_dark, is_daltonic: b.is_daltonic } : p;
        });
        try { await this.load(); } catch (e) {}
      } finally {
        this.setPending(id, 'default', false);
      }
    },

    async setAsDark(id) {
      if (!this.adminMode) return;
      // Prevent marking a palette as Dark if it is currently the Default palette
      if (this.isDefault(id)) {
        this.showToast('No puedes marcar como Dark una paleta que es Default. Cambia la paleta por defecto primero.', 'danger');
        return;
      }
      const wasDark = this.darkId === id;
      try {
        if (wasDark) {
          this.palettes = this.palettes.map(p => ({ ...p, is_dark: p.id === id ? false : p.is_dark }));
          this.darkId = null;
        } else {
          this.palettes = this.palettes.map(p => ({ ...p, is_dark: p.id === id, is_default: p.id === id ? false : p.is_default, is_daltonic: p.id === id ? false : p.is_daltonic }));
          this.darkId = id;
        }

        this.setPending(id, 'dark', true);
        await setDarkPalette(id, this.apiBase);

        // update global store and normalize per-palette flags
        try {
          const store = useColorStore();
          store.palettes = store.palettes.map(sp => {
            if (sp.id === id) {
              return !wasDark ? { ...sp, is_dark: true, is_default: false, is_daltonic: false } : { ...sp, is_dark: false };
            }
            return sp;
          }).map(p => {
            const hasDefault = !!p.is_default;
            const hasDark = !!p.is_dark;
            const hasDal = !!p.is_daltonic;
            if ((hasDefault ? 1 : 0) + (hasDark ? 1 : 0) + (hasDal ? 1 : 0) <= 1) return p;
            if (hasDefault) return { ...p, is_default: true, is_dark: false, is_daltonic: false };
            if (hasDark) return { ...p, is_default: false, is_dark: true, is_daltonic: false };
            return { ...p, is_default: false, is_dark: false, is_daltonic: true };
          });
          store.darkId = store.palettes.find(p => p.is_dark)?.id || null;
          if (store.currentMode === 'dark') store.applyMode('dark');
          // to be sure header reflects server state, reload the selected palettes
          if (store && store.load) await store.load(false);
        } catch (e) {}

        this.showToast(wasDark ? 'Modo oscuro despejado' : 'Modo oscuro actualizado', 'success');
      } catch (err) {
        this.showToast((err && err.message) || 'Error actualizando modo oscuro', 'danger');
        try { await this.load(); } catch (e) { }
      } finally {
        this.setPending(id, 'dark', false);
      }
    },

    async setAsDaltonic(id) {
      if (!this.adminMode) return;
      // Prevent marking a palette as Daltonic if it is currently the Default palette
      if (this.isDefault(id)) {
        this.showToast('No puedes marcar como Daltonic una paleta que es Default. Cambia la paleta por defecto primero.', 'danger');
        return;
      }
      const wasDal = this.daltonicId === id;
      try {
        if (wasDal) {
          this.palettes = this.palettes.map(p => ({ ...p, is_daltonic: p.id === id ? false : p.is_daltonic }));
          this.daltonicId = null;
        } else {
          this.palettes = this.palettes.map(p => ({ ...p, is_daltonic: p.id === id, is_default: p.id === id ? false : p.is_default, is_dark: p.id === id ? false : p.is_dark }));
          this.daltonicId = id;
        }

        this.setPending(id, 'daltonic', true);
        await setDaltonicPalette(id, this.apiBase);

        // update global store and normalize per-palette flags
        try {
          const store = useColorStore();
          store.palettes = store.palettes.map(sp => {
            if (sp.id === id) {
              return !wasDal ? { ...sp, is_daltonic: true, is_default: false, is_dark: false } : { ...sp, is_daltonic: false };
            }
            return sp;
          }).map(p => {
            const hasDefault = !!p.is_default;
            const hasDark = !!p.is_dark;
            const hasDal = !!p.is_daltonic;
            if ((hasDefault ? 1 : 0) + (hasDark ? 1 : 0) + (hasDal ? 1 : 0) <= 1) return p;
            if (hasDefault) return { ...p, is_default: true, is_dark: false, is_daltonic: false };
            if (hasDark) return { ...p, is_default: false, is_dark: true, is_daltonic: false };
            return { ...p, is_default: false, is_dark: false, is_daltonic: true };
          });
          store.daltonicId = store.palettes.find(p => p.is_daltonic)?.id || null;
          if (store.currentMode === 'daltonic') store.applyMode('daltonic');
          // ensure header reads server truth
          if (store && store.load) await store.load(false);
        } catch (e) {}

        this.showToast(wasDal ? 'Modo daltonic despejado' : 'Modo daltonic actualizado', 'success');
      } catch (err) {
        this.showToast((err && err.message) || 'Error actualizando modo daltonic', 'danger');
        try { await this.load(); } catch (e) { }
      } finally {
        this.setPending(id, 'daltonic', false);
      }
    },

    remove(p) {
      if (!this.adminMode) return;
      if (this.isSelected(p.id)) {
        this.error = 'No se puede eliminar una paleta seleccionada.';
        setTimeout(() => { this.error = null; }, 3000);
        return;
      }
      // show confirm modal
      this.pendingDelete = p;
      this.showConfirm = true;
    },

    async confirmDelete() {
      if (!this.pendingDelete) return;
      const del = this.pendingDelete;
      const id = del.id;
      try {
        this.setPending(id, 'delete', true);
        await this.$apiDelete(id);
        // remove from local list without reordering
        this.palettes = this.palettes.filter(p => p.id !== id);
        // clear any selection ids if they matched
        if (this.defaultId === id) this.defaultId = null;
        if (this.darkId === id) this.darkId = null;
        if (this.daltonicId === id) this.daltonicId = null;
        // update global store so header updates
        try {
          const store = useColorStore();
          store.palettes = store.palettes.filter(p => p.id !== id);
          if (store.defaultId === id) store.defaultId = store.palettes.find(p => p.is_default)?.id || null;
          if (store.darkId === id) store.darkId = store.palettes.find(p => p.is_dark)?.id || null;
          if (store.daltonicId === id) store.daltonicId = store.palettes.find(p => p.is_daltonic)?.id || null;
          // reload selected to ensure header accuracy
          if (store && store.load) await store.load(false);
        } catch (e) {}
        this.showToast('Paleta eliminada', 'success');
        this.pendingDelete = null;
        this.showConfirm = false;
      } catch (err) {
        this.showToast((err && err.message) || 'Error eliminando paleta', 'danger');
      } finally {
        this.setPending(id, 'delete', false);
      }
    },

    cancelDelete() {
      this.pendingDelete = null;
      this.showConfirm = false;
    },

    showToast(message, type = 'info') {
      this.toastMessage = message;
      this.toastType = type;
      this.showingToast = true;
      setTimeout(() => { this.showingToast = false; }, 3000);
    },
    // small wrappers to call API helpers (injected via import at top)
    async $apiDelete(id) { return await deletePalette(id, this.apiBase); },
    async $apiSetDefault(id) { return await setDefaultPalette(id, this.apiBase); },
    // previously selection helpers removed - table now controls selections via API
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

/* Responsive adjustments for small screens */
@media (max-width: 575.98px) {
  .swatch { width: 28px; height: 28px; }
  /* Make action buttons wrap and become block-like for easier tapping */
  .action-btns { gap: .35rem; }
  .action-btns .btn { flex: 1 1 48%; min-width: 0; }
}

@media (min-width: 576px) and (max-width: 991.98px) {
  /* medium screens - slightly smaller swatches */
  .swatch { width: 30px; height: 30px; }
  .action-btns .btn { flex: 0 1 auto; }
}


.btn-success {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  box-shadow: none;
}

.btn-success:hover {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  filter: brightness(0.9);
  
}

.btn-outline-secondary {
  color: var(--text-color);
  border: 1px solid var(--text-color);
  background: var(--main-bg-color);
}

.btn-outline-secondary:hover {
  background: var(--secondary-color);
  color: var(--alternate-text-color);
  border: 1px solid var(--alternate-text-color);
}

.btn-outline-primary {
  border: 1px solid var(--accent-color);
  background-color: var(--main-bg-color);
  color: var(--accent-color);
}

.btn-outline-primary:hover {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  border: 1px solid var(--accent-color);
}

.btn-outline-danger, .btn-outline-danger:disabled {
  border: 1px solid var(--alternate-text-color);
  background-color: var(--secondary-color);
  color: var(--alternate-text-color);
}

.btn-outline-danger:hover {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}
</style>

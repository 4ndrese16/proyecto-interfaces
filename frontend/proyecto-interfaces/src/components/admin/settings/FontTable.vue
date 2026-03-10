<template>
  <div class="font-table">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5>Sets de tipografías</h5>
      <button class="btn btn-sm btn-outline-primary" @click="loadAll" :disabled="loading">Recargar</button>
    </div>

    <div v-if="loading" class="text-center py-4">Cargando...</div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="!loading && items.length === 0" class="text-muted">No hay sets de tipografías guardados.</div>

    <div v-if="items.length" class="table-responsive">
      <table ref="dataTable" class="table table-striped table-sm align-middle" style="width:100%">
        <thead>
          <tr>
            <th>Seleccionar</th>
            <th>Nombre / ID</th>
            <th>Tamaños (h1 / h2 / p)</th>
            <th>Vista previa</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td style="width:120px;">
              <div class="form-check">
                <input class="form-check-input" type="radio" :name="'active-font'" :id="`font-${item.id}`" :checked="item.id === activeId" @change="selectActive(item.id)" :disabled="settingActive" />
                <label class="form-check-label" :for="`font-${item.id}`">Activo</label>
              </div>
            </td>
            <td>
              <div><strong>{{ item.name || ('Set #' + item.id) }}</strong></div>
              <div class="text-muted small">{{ item.font_title_name || 'Título' }} / {{ item.font_body_name || 'Cuerpo' }}</div>
            </td>
            <td>
              <div>{{ item.h1_size }}px / {{ item.h2_size }}px / {{ item.p_size }}px</div>
            </td>
            <td style="min-width:240px;">
              <div class="preview-sm p-2 rounded" :style="previewStyle(item)">
                <div :style="previewTitleStyle(item)">Título</div>
                <div :style="previewSubtitleStyle(item)">Subtítulo</div>
                <div :style="previewParagraphStyle(item)" class="mt-1">Párrafo de ejemplo</div>
              </div>
            </td>
            <td style="width:150px;">
              <button class="btn btn-sm btn-outline-secondary me-2" @click="edit(item)">Editar</button>
              <button class="btn btn-sm btn-danger" @click="remove(item)" :disabled="deletingId===item.id">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal fade" tabindex="-1" role="dialog" :class="{ show: showConfirm }" :style="{ display: showConfirm ? 'block' : 'none' }">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmar eliminacion</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="cancelDelete"></button>
          </div>
          <div class="modal-body">
            <p>Quieres eliminar <strong>{{ pendingDelete?.name || ('Set #' + pendingDelete?.id) }}</strong>?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancelDelete">Cancelar</button>
            <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="deletingId===pendingDelete?.id">Eliminar</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1060;">
      <div class="toast show align-items-center text-white" :class="toast.type === 'danger' ? 'bg-danger' : toast.type === 'success' ? 'bg-success' : 'bg-info'" role="alert">
        <div class="d-flex">
          <div class="toast-body">{{ toast.message }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="toast.show=false"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useFontStore } from '@/stores/fontStore';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';
import 'datatables.net-dt';

const API_ROOT = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.API_URL))
  || (typeof process !== 'undefined' && process.env.API_URL)
  || '';

const API_ORIGIN = API_ROOT
  ? API_ROOT.replace(/\/api\/?$/, '').replace(/\/$/, '')
  : '';

export default {
  name: 'FontTable',
  emits: ['edit', 'updated', 'delete'],
  setup(props, { emit }) {
    const fontStore = useFontStore();
    const items = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const activeId = ref(null);
    const settingActive = ref(false);
    const deletingId = ref(null);
    const pendingDelete = ref(null);
    const showConfirm = ref(false);
    const dataTable = ref(null);
    let dt = null;
    const toast = ref({ show: false, message: '', type: 'info' });

    async function loadAll() {
      loading.value = true;
      error.value = null;
      try {
        await fontStore.load(true);
        items.value = Array.isArray(fontStore.items) ? [...fontStore.items] : [];
        activeId.value = fontStore.activeId;
        // register fonts for preview if data provided
        items.value.forEach(registerFontsForItem);
        redrawDataTable();
      } catch (err) {
        error.value = (err && err.message) || 'Error cargando sets de tipografías';
      } finally {
        loading.value = false;
      }
    }

    function registerFontsForItem(item) {
      try {
        const titleSource = resolveFontSource(item.font_title_data, item.font_title_path);
        const bodySource = resolveFontSource(item.font_body_data, item.font_body_path);

        if (titleSource) {
          const titleName = `${item.font_title_name || 'TitleFont'}-${item.id}`;
          addFontToDocument(titleName, titleSource, `font-title-${item.id}`);
          item._registeredTitle = titleName;
        }

        if (bodySource) {
          const bodyName = `${item.font_body_name || 'BodyFont'}-${item.id}`;
          addFontToDocument(bodyName, bodySource, `font-body-${item.id}`);
          item._registeredBody = bodyName;
        }
      } catch (e) {
        // ignore registration errors
      }
    }

    function resolveFontSource(dataValue, pathValue) {
      if (dataValue) return dataValue;
      if (!pathValue) return null;

      if (/^https?:\/\//i.test(pathValue)) return pathValue;
      if (pathValue.startsWith('/')) {
        return API_ORIGIN ? `${API_ORIGIN}${pathValue}` : pathValue;
      }
      return API_ORIGIN ? `${API_ORIGIN}/${pathValue}` : `/${pathValue}`;
    }

    function addFontToDocument(name, dataUrl, styleId) {
      if (!dataUrl) return;
      if (document.getElementById(styleId)) return;
      const tag = document.createElement('style');
      tag.id = styleId;
      tag.innerHTML = `@font-face { font-family: "${name}"; src: url(${dataUrl}); }`;
      document.head.appendChild(tag);
    }

    function previewStyle(item) {
      return { background: 'var(--main-bg-color)', color: 'var(--text-color)' };
    }

    function previewTitleStyle(item) {
      const family = item._registeredTitle || item.font_title_name || 'inherit';
      return { fontFamily: family, fontSize: (item.h1_size ? item.h1_size + 'px' : '20px'), fontWeight: '600' };
    }

    function previewSubtitleStyle(item) {
      const family = item._registeredTitle || item.font_title_name || 'inherit';
      return { fontFamily: family, fontSize: (item.h2_size ? item.h2_size + 'px' : '16px'), color: 'rgba(0,0,0,0.7)' };
    }

    function previewParagraphStyle(item) {
      const family = item._registeredBody || item.font_body_name || 'inherit';
      return { fontFamily: family, fontSize: (item.p_size ? item.p_size + 'px' : '14px') };
    }

    async function selectActive(id) {
      if (settingActive.value) return;
      settingActive.value = true;
      try {
        await fontStore.setAsActive(id);
        activeId.value = id;
        items.value = Array.isArray(fontStore.items) ? [...fontStore.items] : items.value;
        redrawDataTable();
        emit('updated', { activeId: id });
        showToast('Tipografia activa actualizada', 'success');
      } catch (err) {
        error.value = (err && err.message) || 'Error al seleccionar tipografía activa';
      } finally {
        settingActive.value = false;
      }
    }

    function edit(item) {
      emit('edit', item);
    }

    function remove(item) {
      pendingDelete.value = item;
      showConfirm.value = true;
    }

    async function confirmDelete() {
      if (!pendingDelete.value) return;
      const targetId = pendingDelete.value.id;

      deletingId.value = targetId;
      error.value = null;
      try {
        await fontStore.remove(targetId);
        items.value = items.value.filter((x) => x.id !== targetId);
        activeId.value = fontStore.activeId;
        emit('delete', { id: targetId });
        emit('updated', { activeId: activeId.value });
        showToast('Tipografia eliminada', 'success');
      } catch (err) {
        error.value = (err && err.message) || 'Error eliminando tipografia';
      } finally {
        deletingId.value = null;
        pendingDelete.value = null;
        showConfirm.value = false;
        redrawDataTable();
      }
    }

    function cancelDelete() {
      pendingDelete.value = null;
      showConfirm.value = false;
    }

    function showToast(message, type = 'info') {
      toast.value = { show: true, message, type };
      setTimeout(() => {
        toast.value.show = false;
      }, 2600);
    }

    function initDataTable() {
      try {
        if (window.$ && window.$.fn && window.$.fn.dataTable && dataTable.value) {
          dt = window.$(dataTable.value).DataTable();
        }
      } catch (e) {
        // ignore datatable init issues; plain table remains functional
      }
    }

    function redrawDataTable() {
      if (!dt) return;
      try {
        dt.destroy();
        dt = null;
      } catch (e) {
        // ignore
      }

      setTimeout(() => {
        initDataTable();
      }, 0);
    }

    onMounted(() => {
      loadAll();
      setTimeout(() => {
        initDataTable();
      }, 0);
    });

    onBeforeUnmount(() => {
      try {
        if (dt) dt.destroy();
      } catch (e) {
        // ignore
      }
    });

    return {
      items,
      loading,
      error,
      activeId,
      selectActive,
      previewStyle,
      previewTitleStyle,
      previewSubtitleStyle,
      previewParagraphStyle,
      edit,
      remove,
      loadAll,
      settingActive,
      deletingId,
      pendingDelete,
      showConfirm,
      confirmDelete,
      cancelDelete,
      dataTable,
      toast
    };
  }
};
</script>

<style scoped>
.preview-sm { border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }

.btn-outline-secondary, .btn-outline-primary {
  border: 1px solid var(--accent-color);
  background-color: var(--main-bg-color);
  color: var(--accent-color);
}

.btn-outline-secondary:hover, .btn-outline-primary:hover {
  background: var(--accent-color);
  color: var(--alternate-text-color);
  border: 1px solid var(--accent-color);
}

.btn-danger {
  border: 1px solid var(--alternate-text-color);
  background-color: var(--secondary-color);
  color: var(--alternate-text-color);
}

.btn-danger:hover {
  background: var(--main-bg-color);
  color: var(--text-color);
  border: 1px solid var(--text-color);
}
</style>

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
      <table :key="tableRenderKey" ref="dataTable" class="table table-striped table-sm align-middle" style="width:100%">
        <thead>
          <tr>
            <th>Seleccionar</th>
            <th>Nombre / ID</th>
            <th>Tamaños (h1 / h2 / p)</th>
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
              <div :style="nameStyle(item)"><strong>{{ item.name || ('Set #' + item.id) }}</strong></div>
              <div class="text-muted small">{{ item.font_title_name || 'Título' }} / {{ item.font_body_name || 'Cuerpo' }}</div>
            </td>
            <td>
              <div>{{ item.h1_size }}px / {{ item.h2_size }}px / {{ item.p_size }}px</div>
            </td>
            <td style="width:150px;">
              <button class="btn btn-sm btn-outline-secondary me-2" @click="edit(item)">Editar</button>
              <button class="btn btn-sm btn-danger" @click="remove(item)" :disabled="deletingId===item.id || items.length <= 1 || item.id === activeId">Eliminar</button>
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
import DataTable from 'datatables.net-dt';

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
    const mountedReady = ref(false);
    const tableRenderKey = ref(0);
    let dt = null;
    const toast = ref({ show: false, message: '', type: 'info' });

    async function loadAll() {
      loading.value = true;
      error.value = null;
      try {
        await fontStore.load(true);
        items.value = Array.isArray(fontStore.items) ? [...fontStore.items] : [];
        activeId.value = fontStore.activeId;

        items.value.forEach(registerFontsForItem);
        if (mountedReady.value) {
          rebuildDataTable();
        }
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

    function nameStyle(item) {
      const family = item._registeredTitle || item.font_title_name || 'inherit';
      return { fontFamily: family, fontSize: (item.h2_size ? item.h2_size + 'px' : '16px') };
    }

    async function selectActive(id) {
      if (settingActive.value) return;
      settingActive.value = true;
      try {
        await fontStore.setAsActive(id);
        activeId.value = id;
        items.value = Array.isArray(fontStore.items) ? [...fontStore.items] : items.value;
        rebuildDataTable();
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
      if (items.value.length <= 1) {
        showToast('Debe existir al menos un set tipografico', 'info');
        return;
      }

      if (item.id === activeId.value) {
        showToast('No puedes eliminar la tipografia activa. Selecciona otra primero.', 'info');
        return;
      }

      pendingDelete.value = item;
      showConfirm.value = true;
    }

    async function confirmDelete() {
      if (!pendingDelete.value) return;
      if (items.value.length <= 1) {
        showToast('Debe existir al menos un set tipografico', 'info');
        pendingDelete.value = null;
        showConfirm.value = false;
        return;
      }
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
        rebuildDataTable();
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
        if (!dataTable.value) return;
        dt = new DataTable(dataTable.value, {
          searching: true,
          lengthChange: true,
          info: true,
          paging: true,
          ordering: false,
          pageLength: 10,
          lengthMenu: [5, 10, 25, 50],
          language: {
            search: 'Buscar:',
            lengthMenu: 'Mostrar _MENU_ registros',
            info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
            infoEmpty: 'Mostrando 0 a 0 de 0 registros',
            zeroRecords: 'No se encontraron resultados',
            paginate: {
              first: 'Primero',
              last: 'Ultimo',
              next: 'Siguiente',
              previous: 'Anterior'
            }
          }
        });
      } catch (e) {

      }
    }

    function rebuildDataTable() {
      try {
        if (dt) {
          dt.destroy();
          dt = null;
        }
      } catch (e) {
        // ignore
      }

      tableRenderKey.value += 1;

      setTimeout(() => {
        initDataTable();
      }, 0);
    }

    onMounted(() => {
      loadAll();
      mountedReady.value = true;
      setTimeout(() => {
        if (items.value.length) initDataTable();
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
      nameStyle,
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
      tableRenderKey,
      toast
    };
  }
};
</script>

<style scoped>
.btn-outline-secondary, .btn-outline-primary, .btn-secondary {
  border: 1px solid var(--accent-color);
  background-color: var(--main-bg-color);
  color: var(--accent-color);
}

.btn-outline-secondary:hover, .btn-secondary:hover {
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

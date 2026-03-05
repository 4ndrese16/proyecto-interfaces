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
      <table class="table table-striped table-sm align-middle">
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getAll, getActive, setActive } from '../../../api/typography';

export default {
  name: 'FontTable',
  emits: ['edit', 'updated'],
  setup(props, { emit }) {
    const items = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const activeId = ref(null);
    const settingActive = ref(false);
    const deletingId = ref(null);

    async function loadAll() {
      loading.value = true;
      error.value = null;
      try {
        const res = await getAll();
        items.value = Array.isArray(res) ? res : [];
        // try to get active
        try {
          const a = await getActive();
          activeId.value = a && a.id ? a.id : null;
        } catch (err) {
          // ignore
        }
        // register fonts for preview if data provided
        items.value.forEach(registerFontsForItem);
      } catch (err) {
        error.value = (err && err.message) || 'Error cargando sets de tipografías';
      } finally {
        loading.value = false;
      }
    }

    function registerFontsForItem(item) {
      try {
        if (item.font_title_data) {
          const titleName = `${item.font_title_name || 'TitleFont'}-${item.id}`;
          addFontToDocument(titleName, item.font_title_data, `font-title-${item.id}`);
          item._registeredTitle = titleName;
        }
        if (item.font_body_data) {
          const bodyName = `${item.font_body_name || 'BodyFont'}-${item.id}`;
          addFontToDocument(bodyName, item.font_body_data, `font-body-${item.id}`);
          item._registeredBody = bodyName;
        }
      } catch (e) {
        // ignore registration errors
      }
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
        await setActive(id);
        activeId.value = id;
        emit('updated', { activeId: id });
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
      // deletion not implemented in API helper yet; emit for parent to handle or implement later
      emit('delete', item);
    }

    onMounted(() => {
      loadAll();
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
      deletingId
    };
  }
};
</script>

<style scoped>
.preview-sm { border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
</style>

<template>
    <AppHeader />
    <div class="container-fluid py-4">
        <div class="row">
            <!-- Sidebar / Tabs -->
            <div class="col-12 col-lg-3 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">Admin Dashboard</h5>
                        <p class="small text-muted">Selecciona un módulo</p>
                        <ul class="nav nav-pills flex-column mt-3" role="tablist">
                            <li class="nav-item mb-2" role="presentation">
                                <button :class="['nav-link', activeTab === 'config' ? 'active' : '']" @click="activeTab = 'config'" type="button">Configuraciones</button>
                                <!-- Submenu shown when Configuraciones active -->
                                <ul v-if="activeTab === 'config'" class="nav flex-column small mt-2 ms-2">
                                    <li class="nav-item mb-1">
                                        <button :class="['nav-link p-1', subTab === 'palette' ? 'active' : '']" @click="subTab = 'palette'" type="button">Paleta de colores</button>
                                    </li>
                                    <!-- future submenu items -->
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="col-12 col-lg-9">
                <div class="card">
                    <div class="card-body">
                        <div v-show="activeTab === 'config'">
                            <h4 class="mb-3">Configuraciones</h4>

                            <div v-show="subTab === 'palette'">
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <ColorForm />
                                    </div>
                                    <div class="col-12">
                                        <PaletteTable />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import ColorForm from '@/components/admin/settings/ColorForm.vue';
import PaletteTable from '@/components/admin/settings/PaletteTable.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import App from '@/App.vue';

// default tab on load: configuraciones and default submenu
const activeTab = ref('config');
const subTab = ref('palette');
</script>
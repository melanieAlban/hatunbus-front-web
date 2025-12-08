<template>
  <div class="buses-view">
    <header class="page-header">
      <div class="header-left">
        <h2>Buses</h2>
        <input class="search" v-model="query" placeholder="Buscar bus..." />
      </div>
      <div class="header-right">
        <Button label="Gestionar Grupos" icon="pi pi-sitemap" @click="showGroupManager = true" class="p-button-outlined" />
        <Button label="Templates" icon="pi pi-th-large" @click="showTemplateManager = true" class="p-button-outlined" />
      </div>
    </header>

    <BusList :query="query" @view="onView" @edit="onEdit" @delete="onDelete" @refresh="refreshBuses" />

    <BusDetail
      :visible="!!viewing"
      :bus="viewing"
      @update:visible="val => { if (!val) viewing = null }"
    />

    <BusForm
      :model="editing"
      :visible="!!editing"
      @update:visible="val => { if (!val) editing = null }"
      @submit="(payload, file, maintenanceData) => update(payload as UpdateBusPayload, file, maintenanceData)"
      @cancel="() => (editing = null)"
    />

    <BusGroupManager
      :visible="showGroupManager"
      @update:visible="val => (showGroupManager = val)"
      @refresh="refreshBuses"
    />

    <TemplateManager
      :visible="showTemplateManager"
      @update:visible="val => (showTemplateManager = val)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import BusList from '../components/BusList.vue'
import BusForm from '../components/BusForm.vue'
import BusDetail from '../components/BusDetail.vue'
import BusGroupManager from '../components/BusGroupManager.vue'
import TemplateManager from '../components/TemplateManager.vue'
import { useBusStore } from '../store/useBusStore'
import { useCooperativeStore } from '../../cooperatives/store/useCooperativeStore'
import { useAuthStore } from '../../auth/store/useAuthStore'
import * as service from '../services/busService'
import type { BusDto, UpdateBusPayload } from '../interfaces/bus.interface'
import { confirm, success, error as notifyError } from '../../../lib/notifier'

const store = useBusStore()
const coopStore = useCooperativeStore()
const authStore = useAuthStore()
const query = ref('')
const editing = ref<BusDto | null>(null)
const viewing = ref<BusDto | null>(null)
const showGroupManager = ref(false)
const showTemplateManager = ref(false)
const cooperatives = ref<any[]>([])
const selectedCoop = ref<string | null>(null)

onMounted(async () => {
  await refreshBuses()
})

async function onCooperativeChange(id: string | null) {
  selectedCoop.value = id
  await refreshBuses()
}

function onView(item: BusDto) {
  viewing.value = item
}

function onEdit(item: BusDto) {
  editing.value = item
}

async function update(payload: UpdateBusPayload, file?: File, maintenanceData?: any) {
  if (!editing.value?.id) return
  try {
    let updated: BusDto | null = null
    if (file) {
      if (typeof store.updateMultipart === 'function') {
        updated = await store.updateMultipart(editing.value.id, payload, file)
      } else {
        updated = await service.updateBus(editing.value.id, payload, file)
      }
    } else {
      updated = await store.update(editing.value.id, payload)
    }

    // Si hay datos de mantenimiento, crear el registro
    if (updated && maintenanceData) {
      try {
        await service.createMaintenanceRecord(updated.id, maintenanceData)
      } catch (errMaint) {
        console.warn('[BusesView] could not create maintenance record', errMaint)
      }
    }

    editing.value = null
    success('Bus actualizado', payload.plate || '')
  } catch (e) {
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'Error actualizando bus')
  }
}

async function onDelete(item: BusDto) {
  const ok = await confirm({ 
    title: 'Eliminar bus', 
    message: `¿Eliminar bus ${item.plate}?`, 
    acceptLabel: 'Eliminar', 
    rejectLabel: 'Cancelar' 
  })
  if (!ok) return
  try {
    await store.remove(item.id)
    success('Bus eliminado', item.plate || item.id || '')
  } catch (e) {
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'No se pudo eliminar')
  }
}

async function refreshBuses() {
  // Cargar cooperativas y buses
  try {
    await coopStore.fetchAll()
    cooperatives.value = coopStore.items || []

    if (authStore.user?.role === 'COOPERATIVE' && authStore.user?.cooperativeId) {
      selectedCoop.value = authStore.user.cooperativeId
      await store.fetchByCooperative(authStore.user.cooperativeId)
    } else {
      // admin / clerk: si hay selección específica, respeta; sino trae todos
      if (!selectedCoop.value || selectedCoop.value === 'ALL') {
        selectedCoop.value = 'ALL'
        const ids = cooperatives.value.map((c: any) => c.id)
        await store.fetchByCooperatives(ids)
      } else {
        await store.fetchByCooperative(selectedCoop.value)
      }
    }
  } catch (e: any) {
    console.error('[BusesView] error loading buses/cooperativas:', e)
    const errorMsg = e?.response?.data?.message || e?.message || 'Error cargando datos'
    notifyError('Error al cargar', errorMsg)
  }
}
</script>

<style scoped>
.buses-view {
  padding: 1rem;
}

.page-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 1rem; 
  gap: 1rem;
}

.header-left { 
  display: flex; 
  align-items: center; 
  gap: 1rem;
}

.header-left h2 { 
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--app-text);
}

.search { 
  padding: 0.6rem 0.8rem; 
  border-radius: 8px; 
  border: 1px solid var(--gray-light); 
  min-width: 240px;
}

.header-right { 
  display: flex; 
  align-items: center; 
  gap: 1rem;
}

.btn-primary { 
  background: var(--app-accent); 
  color: white; 
  border: none; 
  padding: 0.5rem 0.9rem; 
  border-radius: 8px; 
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>

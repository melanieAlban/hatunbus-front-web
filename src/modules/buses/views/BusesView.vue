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
        <button class="btn-primary" @click="showCreate = true">+ Crear Bus</button>
      </div>
    </header>

    <BusList :query="query" @view="onView" @edit="onEdit" @delete="onDelete" />

    <BusDetail
      :visible="!!viewing"
      :bus="viewing"
      @update:visible="val => { if (!val) viewing = null }"
    />

    <BusForm
      :visible="showCreate"
      @update:visible="val => (showCreate = val)"
      @submit="(payload, file, driverId) => create(payload as CreateBusRequest, file, driverId)"
      @cancel="() => (showCreate = false)"
    />

    <BusForm
      :model="editing"
      :visible="!!editing"
      @update:visible="val => { if (!val) editing = null }"
      @submit="(payload, file, driverId) => update(payload as UpdateBusPayload, file, driverId)"
      @cancel="() => (editing = null)"
    />

    <BusGroupManager
      :visible="showGroupManager"
      @update:visible="val => (showGroupManager = val)"
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
import type { BusDto, CreateBusRequest, UpdateBusPayload } from '../interfaces/bus.interface'
import { confirm, success, error as notifyError } from '../../../lib/notifier'

const store = useBusStore()
const coopStore = useCooperativeStore()
const authStore = useAuthStore()
const query = ref('')
const showCreate = ref(false)
const editing = ref<BusDto | null>(null)
const viewing = ref<BusDto | null>(null)
const showGroupManager = ref(false)
const showTemplateManager = ref(false)
const cooperatives = ref<any[]>([])
const selectedCoop = ref<string | null>(null)

onMounted(async () => {
  // Cargar cooperativas y buses
  try {
    await coopStore.fetchAll()
    cooperatives.value = coopStore.items || []
    
    // Si es usuario COOPERATIVE, cargar solo sus buses
    if (authStore.user?.role === 'COOPERATIVE' && authStore.user?.cooperativeId) {
      await store.fetchByCooperative(authStore.user.cooperativeId)
    } else if (cooperatives.value.length > 0) {
      // Para ADMIN, mostrar todas las cooperativas
      selectedCoop.value = 'ALL'
      const ids = cooperatives.value.map((c: any) => c.id)
      await store.fetchByCooperatives(ids)
      console.log('[BusesView] buses cargados:', JSON.parse(JSON.stringify(store.items)))
    }
  } catch (e: any) {
    console.error('[BusesView] error loading cooperativas:', e)
    const errorMsg = e?.response?.data?.message || e?.message || 'Error cargando datos'
    notifyError('Error al cargar', errorMsg)
  }
})

async function onCooperativeChange(id: string | null) {
  selectedCoop.value = id
  if (!id) {
    store.items = []
    return
  }

  if (id === 'ALL') {
    const ids = cooperatives.value.map((c: any) => c.id)
    await store.fetchByCooperatives(ids)
  } else {
    await store.fetchByCooperative(id)
  }
}

async function create(payload: CreateBusRequest, file?: File, driverId?: string | null) {
  try {
    console.log('[BusesView] create received payload:', payload, 'file:', !!file, 'driverId:', driverId)
    let created: BusDto | null = null
    if (file) {
      // backend expects multipart/form-data for create with file
      if (typeof store.createMultipart === 'function') {
        created = await store.createMultipart(payload, file)
      } else {
        // fallback: call service directly
        created = await service.createBus(payload, file)
      }
    } else {
      created = await store.create(payload)
    }

    // If a driver was selected in the form, assign it using the dedicated endpoint
    if (created && driverId) {
      try {
        await service.assignDriver(created.id, driverId)
      } catch (errAssign) {
        console.warn('[BusesView] could not assign driver after create', errAssign)
      }
    }

    showCreate.value = false
    success('Bus creado', `Placa: ${payload.plate}`)
  } catch (e) {
    console.error('[BusesView] create error:', e)
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'Error creando bus')
  }
}

function onView(item: BusDto) {
  viewing.value = item
}

function onEdit(item: BusDto) {
  editing.value = item
}

async function update(payload: UpdateBusPayload, file?: File, driverId?: string | null) {
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

    // If a driver was selected, assign it
    if (updated && driverId) {
      try {
        await service.assignDriver(updated.id, driverId)
      } catch (errAssign) {
        console.warn('[BusesView] could not assign driver after update', errAssign)
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

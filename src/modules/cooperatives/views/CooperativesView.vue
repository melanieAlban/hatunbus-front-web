<template>
  <div class="cooperatives-view">
    <header class="page-header">
      <div class="header-left">
        <h2>Gestión de Cooperativas</h2>
        <input class="search" v-model="query" placeholder="Buscar cooperativa..." />
      </div>
      <div class="header-right">
        
        <button class="btn-primary" @click="showCreate = true">+ Crear Cooperativa</button>
      </div>
    </header>

    <CooperativeList :query="query" @edit="onEdit" @delete="onDelete" />

    <CooperativeForm
      :visible="showCreate"
      @update:visible="val => (showCreate = val)"
      @submit="create"
      @cancel="() => (showCreate = false)"
    />

    <CooperativeForm
      :model="editing"
      :visible="!!editing"
      @update:visible="val => { if (!val) editing = null }"
      @submit="update"
      @cancel="() => (editing = null)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import CooperativeList from '../components/CooperativeList.vue'
import CooperativeForm from '../components/CooperativeForm.vue'
import { useCooperativeStore } from '../store/useCooperativeStore'
import * as service from '../services/cooperativeService'
import { confirm, success, error as notifyError } from '../../../lib/notifier'

const store = useCooperativeStore()
const query = ref('')
const showCreate = ref(false)
const editing = ref<any | null>(null)

onMounted(() => {
  store.fetchAll()
})

async function create(payload: any, file?: File) {
  try {
    console.log('[CooperativesView] create received payload:', payload, 'file:', !!file)
    if (file) {
      // backend expects multipart/form-data for create with file
      if (typeof store.createMultipart === 'function') {
        await store.createMultipart(payload, file)
      } else {
        // fallback: call service directly (avoids runtime crash if HMR didn't update the store)
        await service.createCooperativeMultipart(payload, file)
      }
    } else {
      await store.create(payload)
    }
    showCreate.value = false
    success('Cooperativa creada', payload.name || '')
  } catch (e) {
    console.error('[CooperativesView] create error:', e)
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'Error creando cooperativa')
  }
}

function onEdit(item: any) {
  editing.value = item
}

async function update(payload: any, file?: File) {
  if (!editing.value?.id) return
  try {
    if (file) {
      if (typeof store.updateMultipart === 'function') {
        await store.updateMultipart(editing.value.id, payload, file)
      } else {
        await service.updateCooperativeMultipart(editing.value.id, payload, file)
      }
    } else {
      await store.update(editing.value.id, payload)
    }
    editing.value = null
    success('Cooperativa actualizada', payload.name || '')
  } catch (e) {
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'Error actualizando cooperativa')
  }
}

async function onDelete(item: any) {
  const ok = await confirm({ title: 'Eliminar cooperativa', message: `¿Eliminar ${item.name}?`, acceptLabel: 'Eliminar', rejectLabel: 'Cancelar' })
  if (!ok) return
  try {
    await store.remove(item.id)
    success('Cooperativa eliminada', item.name || '')
  } catch (e) {
    const err: any = e
    notifyError('Error eliminando', err?.response?.data?.message || err?.message || 'No se pudo eliminar')
  }
}

const userAvatar = computed(() => null)
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; gap:1rem }
.header-left { display:flex; align-items:center; gap:1rem }
.header-left h2 { margin:0 }
.search { padding:0.6rem 0.8rem; border-radius:8px; border:1px solid var(--gray-light); min-width:320px }
.header-right { display:flex; align-items:center; gap:1rem }
.btn-primary { background: var(--app-accent); color: white; border: none; padding:0.5rem 0.9rem; border-radius:8px; cursor:pointer }
.user-mini { display:flex; align-items:center; gap:0.6rem; color:var(--gray-dark) }
.avatar { width:40px; height:40px; border-radius:50% }
.drawer { position:fixed; right:1rem; top:4rem; width:420px; background:white; padding:1rem; box-shadow:0 6px 18px rgba(0,0,0,0.08); z-index:40 }
</style>

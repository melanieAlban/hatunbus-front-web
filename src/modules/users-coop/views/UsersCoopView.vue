<template>
  <div class="users-view">
    <header class="page-header">
      <div class="header-left">
        <h2>Usuarios</h2>
        <input class="search" v-model="query" placeholder="Buscar usuario..." />
      </div>
      <div class="header-right">
        <button class="btn-primary" @click="showCreate = true">+ Crear Usuario</button>
      </div>
    </header>

    <UserList :query="query" @edit="onEdit" @delete="onDelete" />

    <UserForm
      :visible="showCreate"
      @update:visible="val => (showCreate = val)"
      @submit="create"
      @cancel="() => (showCreate = false)"
    />

    <UserForm
      :model="editing"
      :visible="!!editing"
      @update:visible="val => { if (!val) editing = null }"
      @submit="update"
      @cancel="() => (editing = null)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UserList from '../components/UserList.vue'
import UserForm from '../components/UserForm.vue'
import { useUserStore } from '../store/useUserStore'
import { useCooperativeStore } from '../../cooperatives/store/useCooperativeStore'
import * as service from '../services/userService'
import * as driverService from '../../conductores/services/driverService'
import { confirm, success, error as notifyError } from '../../../lib/notifier'

const store = useUserStore()
const coopStore = useCooperativeStore()
const query = ref('')
const showCreate = ref(false)
const editing = ref<any | null>(null)
const cooperatives = ref<any[]>([])
const selectedCoop = ref<string | null>(null)

  onMounted(async () => {
    // Cargar cooperativas y pedir usuarios por cooperativa (comportamiento por defecto)
    try {
      await coopStore.fetchAll()
      cooperatives.value = coopStore.items || []
      if (cooperatives.value.length > 0) {
        // por defecto mostrar todas las cooperativas
        selectedCoop.value = 'ALL'
        const ids = cooperatives.value.map((c: any) => c.id)
        await store.fetchByCooperatives(ids)
        // eslint-disable-next-line no-console
        console.log('[UsersCoopView] usuarios cargados (by cooperatives):', JSON.parse(JSON.stringify(store.items)))
      }
    } catch (e) {
      console.error('[UsersCoopView] error loading cooperativas:', e)
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

async function create(payload: any) {
  try {
    // Si el payload tiene estructura { user, driver }, es un DRIVER con datos de licencia
    if (payload.user && payload.driver) {
      // Paso 1: Crear el usuario
      const createdUser = await store.create(payload.user)
      console.log('[UsersCoopView] Usuario DRIVER creado:', createdUser)
      
      // Paso 2: Crear el conductor con los datos de licencia
      const driverPayload = {
        userId: createdUser.id,
        cooperativeId: payload.driver.cooperativeId || payload.user.cooperativeId,
        licenseNumber: payload.driver.licenseNumber,
        licenseType: payload.driver.licenseType,
        issueDate: payload.driver.issueDate,
        expirationDate: payload.driver.expirationDate,
      }
      console.log('[UsersCoopView] Creando conductor con payload:', driverPayload)
      await driverService.createDriver(driverPayload)
      
      showCreate.value = false
      success('Conductor creado', `${createdUser.firstNames} ${createdUser.lastNames}`)
    } else {
      // Crear usuario normal (no DRIVER o sin campos de licencia)
      await store.create(payload)
      showCreate.value = false
      success('Usuario creado', payload.firstNames || '')
    }
  } catch (e) {
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'Error creando usuario')
  }
}

async function onEdit(item: any) {
  // Si el usuario es DRIVER, obtener también los datos del conductor (licencia, fechas, etc.)
  if (item.role === 'DRIVER') {
    try {
      const driverData = await driverService.getDriverByUserId(item.id)
      console.log('[UsersCoopView] Driver data fetched for user:', driverData)
      // Combinar datos del usuario con datos del conductor
      editing.value = {
        ...item,
        licenseNumber: driverData.licenseNumber || '',
        licenseType: driverData.licenseType || null,
        issueDate: driverData.issueDate || null,
        expirationDate: driverData.expirationDate || null,
        driverId: driverData.id, // Guardar el ID del driver para actualizaciones
      }
    } catch (e) {
      console.warn('[UsersCoopView] Could not fetch driver data, using user only:', e)
      editing.value = item
    }
  } else {
    editing.value = item
  }
}

async function update(payload: any) {
  if (!editing.value?.id) return
  try {
    // Si el payload tiene estructura { user, driver }, es un DRIVER con datos de licencia
    if (payload.user && payload.driver) {
      // Paso 1: Actualizar el usuario
      await store.update(editing.value.id, payload.user)
      console.log('[UsersCoopView] Usuario DRIVER actualizado')
      
      // Paso 2: Actualizar el conductor si existe driverId
      if (editing.value.driverId) {
        const driverPayload = {
          licenseNumber: payload.driver.licenseNumber,
          licenseType: payload.driver.licenseType,
          issueDate: payload.driver.issueDate,
          expirationDate: payload.driver.expirationDate,
          cooperativeId: payload.driver.cooperativeId,
        }
        console.log('[UsersCoopView] Actualizando conductor con payload:', driverPayload)
        await driverService.updateDriver(editing.value.driverId, driverPayload)
      }
      
      editing.value = null
      success('Conductor actualizado', `${payload.user.firstNames || ''} ${payload.user.lastNames || ''}`.trim())
    } else {
      // Actualizar usuario normal
      await store.update(editing.value.id, payload)
      editing.value = null
      success('Usuario actualizado', payload.firstNames || '')
    }
  } catch (e) {
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'Error actualizando usuario')
  }
}

async function onDelete(item: any) {
  const fullName = `${item.firstNames || ''} ${item.lastNames || ''}`.trim()
  const ok = await confirm({ title: 'Desactivar usuario', message: `¿Desactivar ${fullName || item.email || item.id}?`, acceptLabel: 'Desactivar', rejectLabel: 'Cancelar' })
  if (!ok) return
  try {
    // Usamos el endpoint de desactivación existente en backend
    await store.deactivate(item.id)
    success('Usuario desactivado', fullName || item.email || item.id || '')
  } catch (e) {
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'No se pudo desactivar')
  }
}
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; gap:1rem }
.header-left { display:flex; align-items:center; gap:1rem }
.header-left h2 { margin:0 }
.search { padding:0.6rem 0.8rem; border-radius:8px; border:1px solid var(--gray-light); min-width:240px }
.header-right { display:flex; align-items:center; gap:1rem }
.btn-primary { background: var(--app-accent); color: white; border: none; padding:0.5rem 0.9rem; border-radius:8px; cursor:pointer }
</style>

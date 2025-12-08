<template>
  <div class="drivers-view">
    <h2>Conductores</h2>

    <div class="toolbar">
      <Button label="Nuevo conductor" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DriverList @edit="onEdit" @delete="onDelete" />

    <!-- Modal único para crear/editar conductor (reutiliza UserForm) -->
    <UserForm
      :visible="visibleUserForm"
      :model="editingUserModel"
      :allowedRoles="allowedRoles"
      fixedRole="DRIVER"
      :includeDriverFields="true"
      :cooperativeId="null"
      @update:visible="val => (visibleUserForm = val)"
      @submit="createUser"
      @cancel="onCancelUserForm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import DriverList from '../components/DriverList.vue'
import UserForm from '../../users-coop/components/UserForm.vue'
import { useDriverStore } from '../store/useDriverStore'
import * as driverService from '../services/driverService'
import { useCooperativeStore } from '../../cooperatives/store/useCooperativeStore'
import { confirm, success, warn, error as notifyError } from '../../../lib/notifier'
import { useUserStore } from '../../users-coop/store/useUserStore'

const store = useDriverStore()
const userStore = useUserStore()
const coopStore = useCooperativeStore()
const cooperatives = ref<any[]>([])

const visibleUserForm = ref(false)
// Nuevo: edición usando el UserForm
const editingUser = ref(false)
const editingUserModel = ref(null as any)
const editingDriverId = ref<string | null>(null)

function openCreate() {
  // Abrir el formulario de creación de usuario (roles limitados)
  editingUser.value = false
  editingUserModel.value = null
  editingDriverId.value = null
  visibleUserForm.value = true
}

onMounted(async () => {
  try {
    await coopStore.fetchAll()
    cooperatives.value = coopStore.items || []
    if (cooperatives.value.length > 0) {
      // merge drivers from all cooperatives
      const lists = await Promise.all(cooperatives.value.map((c: any) => driverService.listByCooperative(c.id).catch(() => [])))
      const merged: any[] = []
      const seen = new Set<string>()
      for (const list of lists) {
        for (const d of list) {
          if (!seen.has(d.id)) {
            merged.push(d)
            seen.add(d.id)
          }
        }
      }
      store.items = merged as any
    } else {
      // no cooperatives; limpiar
      store.items = []
    }
  } catch (e) {
    console.error('[DriversView] error loading cooperativas/drivers', e)
  }
})

// Roles permitidos en el formulario de creación desde esta vista
const allowedRoles = [
  { label: 'Oficinista', value: 'CLERK' },
  { label: 'Conductor', value: 'DRIVER' }
]

async function onEdit(item: any) {
  // Cuando editamos un conductor, abrir el UserForm (que ahora incluye campos de conductor)
  console.log('[DriversView] onEdit - item received:', JSON.parse(JSON.stringify(item)))
  try {
    editingUser.value = true
    editingDriverId.value = item.id

    // Obtener datos completos del conductor desde el backend (para tener licenseNumber, etc.)
    let driverData: any = null
    try {
      driverData = await store.fetchById(item.id)
      console.log('[DriversView] driverData fetched:', JSON.parse(JSON.stringify(driverData)))
    } catch (e) {
      console.log('[DriversView] driverData fetch failed, using item:', e)
      driverData = item
    }

    // Obtener datos completos del usuario si es posible
    let userModel: any = null
    try {
      userModel = await userStore.fetchById(driverData.userId || item.userId)
      console.log('[DriversView] userModel fetched:', JSON.parse(JSON.stringify(userModel)))
    } catch (e) {
      console.log('[DriversView] userModel fetch failed, building partial model')
      // Si falla fetch, construir un modelo parcial desde el item
      userModel = {
        id: driverData.userId || item.userId,
        firstNames: (driverData.userName || item.userName || '').split(' ').slice(0, -1).join(' '),
        lastNames: (driverData.userName || item.userName || '').split(' ').slice(-1).join(' '),
        email: item.email || null,
        phone: item.phone || null,
        role: 'DRIVER',
        cooperativeId: driverData.cooperativeId || item.cooperativeId || null,
        active: typeof driverData.active === 'boolean' ? driverData.active : true,
      }
    }

    // Crear copia plana del userModel para evitar problemas con Proxy
    const userCopy = userModel ? JSON.parse(JSON.stringify(userModel)) : {}
    
    // Añadir campos de driver al modelo para que UserForm los muestre
    // Los campos del driver deben sobrescribir cualquier valor del usuario
    const combined = {
      ...userCopy,
      // Campos específicos del conductor (del DriverDto obtenido del backend)
      licenseNumber: driverData.licenseNumber || '',
      licenseType: driverData.licenseType || null,
      issueDate: driverData.issueDate || null,
      expirationDate: driverData.expirationDate || null,
      cooperativeId: driverData.cooperativeId || userCopy.cooperativeId || null,
    }

    console.log('[DriversView] combined model for UserForm:', combined)
    editingUserModel.value = combined
    // Abrir modal de UserForm en modo edición con role fijo
    visibleUserForm.value = true
  } catch (e) {
    console.error('Error preparando edición de conductor', e)
  }
}

async function refreshDriverInStore(driverId: string | null) {
  if (!driverId) return
  try {
    const latest = await store.fetchById(driverId)
    if (!latest) return
    // replace or add in store.items
    const idx = store.items.findIndex((d: any) => d.id === latest.id)
    if (idx >= 0) store.items.splice(idx, 1, latest as any)
    else store.items.unshift(latest as any)
    console.log('[DriversView] refreshed driver in store:', latest)
  } catch (e) {
    console.warn('[DriversView] could not refresh driver', driverId, e)
  }
}

async function onDelete(item: any) {
  const fullName = item.userName || item.licenseNumber || item.id
  const ok = await confirm({ title: 'Eliminar conductor', message: `¿Eliminar ${fullName}?`, acceptLabel: 'Eliminar', rejectLabel: 'Cancelar' })
  if (!ok) return
  try {
    await store.remove(item.id)
    success('Conductor eliminado', fullName)
  } catch (e: any) {
    notifyError('Error', e?.response?.data?.message || e?.message || 'No se pudo eliminar')
  }
}

function onCancelUserForm() {
  visibleUserForm.value = false
  editingUser.value = false
  editingUserModel.value = null
  editingDriverId.value = null
}

// Crear usuario desde el modal reutilizado
async function createUser(payload: any) {
  try {
    // Si estamos en modo edición (editar usuario/conductor)
    if (editingUser.value && editingUserModel.value) {
      let userPayload = payload
      let driverPayload = null
      if (payload && payload.user) {
        userPayload = payload.user
        driverPayload = payload.driver || null
      }

      // Actualizar usuario
      let updatedUser: any = null
      try {
        console.log('[DriversView] updating user payload:', JSON.parse(JSON.stringify(userPayload)))
        updatedUser = await userStore.update(editingUserModel.value.id, userPayload)
        console.log('[DriversView] updated user response:', JSON.parse(JSON.stringify(updatedUser)))
        // Comprobar si el servidor aplicó los cambios que enviamos
        try {
          const sent = userPayload || {}
          const received = updatedUser || {}
          const fieldsToCheck = ['firstNames', 'lastNames', 'idCard', 'email', 'phone', 'birthDate', 'gender']
          const mismatches: string[] = []
          for (const f of fieldsToCheck) {
            if (typeof (sent as any)[f] !== 'undefined') {
              const s = (sent as any)[f] == null ? '' : String((sent as any)[f]).trim()
              const r = (received as any)[f] == null ? '' : String((received as any)[f]).trim()
              if (s !== r) mismatches.push(f)
            }
          }
          if (mismatches.length > 0) {
            warn('Aviso', `Algunos campos no fueron actualizados por el servidor: ${mismatches.join(', ')}`)
          }
        } catch (e) { /* no bloquear flujo por esta verificación */ }
        // Si viene driverPayload, actualizar o crear driver
        if (driverPayload) {
          const dp: any = driverPayload
          if (editingDriverId.value) {
            console.log('[DriversView] updating driver id', editingDriverId.value, 'payload:', JSON.parse(JSON.stringify({
              licenseNumber: dp.licenseNumber,
              licenseType: dp.licenseType,
              issueDate: dp.issueDate,
              expirationDate: dp.expirationDate,
              cooperativeId: dp.cooperativeId || updatedUser.cooperativeId || userPayload.cooperativeId || null,
              active: typeof dp.active === 'boolean' ? dp.active : true,
            })))
            await store.update(editingDriverId.value, {
              licenseNumber: dp.licenseNumber,
              licenseType: dp.licenseType,
              issueDate: dp.issueDate,
              expirationDate: dp.expirationDate,
              cooperativeId: dp.cooperativeId || updatedUser.cooperativeId || userPayload.cooperativeId || null,
              active: typeof dp.active === 'boolean'
                ? dp.active
                : (typeof userPayload.active === 'boolean' ? userPayload.active : true),
            })
            console.log('[DriversView] driver update completed')
            // garantizar que la UI refleje el estado real del backend
            await refreshDriverInStore(editingDriverId.value)
          } else {
            console.log('[DriversView] creating driver payload:', JSON.parse(JSON.stringify({
              userId: updatedUser.id,
              licenseNumber: dp.licenseNumber,
              licenseType: dp.licenseType,
              issueDate: dp.issueDate,
              expirationDate: dp.expirationDate,
              cooperativeId: dp.cooperativeId || updatedUser.cooperativeId || userPayload.cooperativeId || null,
            })))
            await store.create({
              userId: updatedUser.id,
              licenseNumber: dp.licenseNumber,
              licenseType: dp.licenseType,
              issueDate: dp.issueDate,
              expirationDate: dp.expirationDate,
              cooperativeId: dp.cooperativeId || updatedUser.cooperativeId || userPayload.cooperativeId || null,
            } as any)
            console.log('[DriversView] driver create completed')
          }
          }
          visibleUserForm.value = false
          editingUser.value = false
          editingUserModel.value = null
          editingDriverId.value = null
          success('Conductor actualizado', `${updatedUser.firstNames || ''} ${updatedUser.lastNames || ''}`.trim())
          // refrescar lista de conductores de la cooperativa para asegurar consistencia
          try {
            const coopId = updatedUser.cooperativeId || userPayload.cooperativeId || null
            if (coopId) await store.fetchByCooperative(coopId)
          } catch (e) { /* ignore */ }
      } catch (e) {
          const err: any = e
          notifyError('Error', err?.response?.data?.message || err?.message || 'Error actualizando conductor')
      }
        // Si no venían campos de driver pero el usuario es DRIVER y existe un driver asociado,
        // sincronizar el estado activo del driver para que la tabla muestre el cambio.
        if (!driverPayload && editingDriverId.value && typeof userPayload.active !== 'undefined') {
          try {
            // Si el usuario fue desactivado, usar el endpoint específico de desactivar conductor
            if (userPayload.active === false) {
              await store.deactivate(editingDriverId.value)
            } else {
              // si fue reactivado, intentamos actualizar el campo active en el conductor
              await store.update(editingDriverId.value, {
                active: true,
              })
            }
            // Asegurar que la UI refleje el estado real del backend
            await refreshDriverInStore(editingDriverId.value)
          } catch (e) {
            // no bloquear la UX por este fallo, mostrar notificación
            const err2: any = e
            notifyError('Error', err2?.response?.data?.message || err2?.message || 'No se pudo sincronizar estado del conductor')
          }
        }
      return
    }

    // Si no estamos editando: creación normal
    // Soportar payload combinado { user, driver } cuando el form incluye campos de conductor
    let userPayload = payload
    let driverPayload = null
    if (payload && payload.user) {
      userPayload = payload.user
      driverPayload = payload.driver || null
    }

    const created = await userStore.create(userPayload)

    // Si viene driverPayload, crear el driver asociado automáticamente
    if (driverPayload) {
      const dp: any = driverPayload
      const newDriver = {
        userId: (created as any).id,
        cooperativeId: dp?.cooperativeId || created.cooperativeId || userPayload.cooperativeId || null,
        licenseNumber: dp?.licenseNumber || '',
        licenseType: dp?.licenseType || null,
        issueDate: dp?.issueDate || null,
        expirationDate: dp?.expirationDate || null,
      }
      console.log('[DriversView] Creating driver with payload:', JSON.stringify(newDriver))
      try {
        await store.create(newDriver)
        success('Conductor creado', created.firstNames ? `${created.firstNames} ${created.lastNames}` : '')
        // refrescar lista para asegurar que la tabla muestre el cambio
        try { const coopId2 = dp.cooperativeId || (created as any).cooperativeId || userPayload.cooperativeId || null; if (coopId2) await store.fetchByCooperative(coopId2) } catch (e) {}
      } catch (e: any) {
        // Si falla la creación del driver, mostrar error
        notifyError('Error', e?.response?.data?.message || e?.message || 'Error creando conductor')
      }
    } else {
      success('Usuario creado', `${created.firstNames || ''} ${created.lastNames || ''}`.trim())
    }
    
    visibleUserForm.value = false
    editingUser.value = false
    editingUserModel.value = null
    editingDriverId.value = null
  } catch (e) {
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'Error creando usuario/conductor')
  }
}
</script>

<style scoped>
.drivers-view { padding:1rem }
.toolbar { display:flex; justify-content:flex-end; align-items:center; gap:0.5rem; margin-bottom:1rem }
</style>

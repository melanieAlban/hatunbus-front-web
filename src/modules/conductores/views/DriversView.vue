<template>
  <div class="drivers-view">
    <h2>Conductores</h2>

    <div class="toolbar">
      <Button label="Nuevo conductor" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DriverList @edit="onEdit" @delete="onDelete" />

    <!-- Modal para crear usuario (reutiliza UserForm) -->
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

    <!-- Dialog para editar/crear detalles del conductor (DriverForm) -->
    <Dialog v-model:visible="visibleDriverForm" :modal="true" :style="{ width: '720px' }" @hide="onHideDriverForm">
      <template #header>
        <h3>{{ editingDriver ? 'Editar conductor' : 'Crear conductor' }}</h3>
      </template>
      <DriverForm :model="editingModel" @submit="onSubmitDriver" @cancel="onHideDriverForm" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import DriverList from '../components/DriverList.vue'
import DriverForm from '../components/DriverForm.vue'
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
const visibleDriverForm = ref(false)
const editingDriver = ref(false)
const editingModel = ref(null as any)
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
  try {
    editingUser.value = true
    editingDriverId.value = item.id

    // Obtener datos completos del usuario si es posible
    let userModel: any = null
    try {
      userModel = await userStore.fetchById(item.userId)
    } catch (e) {
      // Si falla fetch, construir un modelo parcial desde el item
      userModel = {
        id: item.userId,
        firstNames: (item.userName || '').split(' ').slice(0, -1).join(' '),
        lastNames: (item.userName || '').split(' ').slice(-1).join(' '),
        email: item.email || null,
        phone: item.phone || null,
        role: 'DRIVER',
        cooperativeId: item.cooperativeId || null,
        active: typeof item.active === 'boolean' ? item.active : true,
      }
    }

    // Añadir campos de driver al modelo para que UserForm los muestre
    const combined = Object.assign({}, userModel, {
      licenseNumber: item.licenseNumber || '',
      licenseType: item.licenseType || null,
      issueDate: item.issueDate || null,
      expirationDate: item.expirationDate || null,
      cooperativeId: item.cooperativeId || userModel?.cooperativeId || null,
    })

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

function onHideDriverForm() {
  visibleDriverForm.value = false
}

function onHide() {
  visibleUserForm.value = false
}

async function onSubmitDriver(payload: any) {
  try {
    if (editingModel.value?.id) {
      await store.update(editingModel.value.id, payload)
    } else {
      await store.create(payload)
    }
    visibleDriverForm.value = false
    // asegurar que la UI se sincronice con el backend para este driver
    try { await refreshDriverInStore(editingModel.value?.id || null) } catch (e) {}
  } catch (e) {
    // error handled in store
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
              userId: updatedUser.id,
              licenseNumber: dp.licenseNumber,
              licenseType: dp.licenseType,
              issueDate: dp.issueDate,
              expirationDate: dp.expirationDate,
              cooperativeId: dp.cooperativeId || updatedUser.cooperativeId || userPayload.cooperativeId || null,
              active: typeof dp.active === 'boolean' ? dp.active : true,
            })))
            await store.update(editingDriverId.value, {
              userId: updatedUser.id,
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
              active: typeof dp.active === 'boolean'
                ? dp.active
                : (typeof userPayload.active === 'boolean' ? userPayload.active : true),
            })
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
                userId: updatedUser.id,
                active: true,
              } as any)
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
    visibleUserForm.value = false

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
        active: typeof dp?.active === 'boolean' ? dp.active : (typeof (created as any).active === 'boolean' ? (created as any).active : true),
      }
      try {
        await store.create(newDriver)
        success('Conductor creado', created.firstNames ? `${created.firstNames} ${created.lastNames}` : '')
        // refrescar lista para asegurar que la tabla muestre el cambio
        try { const coopId2 = dp.cooperativeId || (created as any).cooperativeId || userPayload.cooperativeId || null; if (coopId2) await store.fetchByCooperative(coopId2) } catch (e) {}
      } catch (e) {
        // Si falla la creación del driver, abrir el DriverForm para permitir completar manualmente
        const dp2: any = driverPayload
        editingModel.value = {
          userId: (created as any).id,
          cooperativeId: newDriver.cooperativeId,
          licenseNumber: dp2?.licenseNumber || '',
          licenseType: dp2?.licenseType || null,
          issueDate: dp2?.issueDate || null,
          expirationDate: dp2?.expirationDate || null,
        }
        visibleDriverForm.value = true
      }
    } else {
      // comportamiento anterior: si es role DRIVER, abrir formulario para completar datos
      if ((created as any).role === 'DRIVER' || userPayload.role === 'DRIVER') {
        editingModel.value = {
          userId: (created as any).id,
          cooperativeId: (created as any).cooperativeId || userPayload.cooperativeId || null,
          licenseNumber: '',
          licenseType: null,
          issueDate: null,
          expirationDate: null,
          // active: true, // Removed as per the requirement
        }
        editingDriver.value = false
        visibleDriverForm.value = true
        success('Usuario creado', `${created.firstNames || ''} ${created.lastNames || ''}`.trim())
      }
    }
  } catch (e) {
    const err: any = e
    notifyError('Error', err?.response?.data?.message || err?.message || 'Error creando usuario/conductor')
  }
}

// Nota: la vista no carga por defecto hasta que se invoque fetch desde un padre o se agregue lógica
</script>

<style scoped>
.drivers-view { padding:1rem }
.toolbar { display:flex; justify-content:flex-end; align-items:center; gap:0.5rem; margin-bottom:1rem }
</style>

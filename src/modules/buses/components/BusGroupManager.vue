<template>
  <Dialog
    v-model:visible="visibleLocal"
    modal
    :style="{ width: '900px', maxHeight: '90vh' }"
    :dismissableMask="true"
    class="group-manager-dialog"
    @update:visible="onVisibleChange"
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-sitemap icon-header"></i>
        <h2 class="dialog-title">Gestión de Grupos de Buses</h2>
      </div>
    </template>

    <div class="group-manager-content">
      <div class="action-bar">
        <Button
          label=" Crear Nuevo Grupo"
          icon="pi pi-plus"
          @click="showCreateGroup = true"
        />
      </div>

      <!-- Lista de grupos -->
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spinner pi-spin"></i>
        <span>Cargando grupos...</span>
      </div>

      <div v-else-if="groups.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>No hay grupos creados</p>
        <Button
          label="Crear Primer Grupo"
          icon="pi pi-plus"
          @click="showCreateGroup = true"
        />
      </div>

      <div v-else class="groups-grid">
        <div v-for="group in groups" :key="group.id" class="group-card">
          <div class="group-header">
            <h3>{{ group.name }}</h3>
            <Tag :value="group.active ? 'Activo' : 'Inactivo'" 
                 :severity="group.active ? 'success' : 'danger'" />
          </div>
          
          <p class="group-description">{{ group.description || 'Sin descripción' }}</p>
          
          <div class="group-info">
            <div class="info-item">
              <i class="pi pi-th-large"></i>
              <span>{{ group.template ? group.template.name : 'Sin template' }}</span>
            </div>
            <div class="info-item">
              <i class="pi pi-users"></i>
              <span>{{ getRealSeatCount(group.template) }} asientos</span>
            </div>
            <div class="info-item">
              <i class="pi pi-car"></i>
              <span>{{ group.busCount || 0 }} buses</span>
            </div>
          </div>
          
          <div class="group-actions">
            <Button
              label="Ver Buses"
              icon="pi pi-eye"
              @click="viewGroupBuses(group)"
              class="p-button-text p-button-sm"
            />
            <Button
              label="Agregar Bus"
              icon="pi pi-plus"
              @click="addBusToGroup(group)"
              class="p-button-text p-button-sm"
            />
            <Button
              label="Agregar Existente"
              icon="pi pi-download"
              @click="addExistingBusToGroup(group)"
              class="p-button-text p-button-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          @click="onVisibleChange(false)"
          class="p-button-text"
        />
      </div>
    </template>
  </Dialog>

  <BusGroupForm
    :visible="showCreateGroup"
    @update:visible="(val) => (showCreateGroup = val)"
    @created="onGroupCreated"
  />

  <Dialog v-model:visible="showViewBuses" modal :style="{ width: '800px' }" :dismissableMask="true">
    <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
        <div>
          <i class="pi pi-car" style="margin-right:8px"></i>
          <strong>Buses del grupo</strong>
        </div>
        <div>{{ selectedGroupForAdd ? selectedGroupForAdd.name : '' }}</div>
      </div>
    </template>

    <div style="padding:1rem">
      <div v-if="loadingGroupBuses" class="loading-state">
        <i class="pi pi-spinner pi-spin"></i>
        <span>Cargando buses...</span>
      </div>

      <div v-else-if="groupBuses.length === 0" style="text-align:center;padding:2rem;color:var(--gray-medium)">
        No hay buses en este grupo
      </div>

      <div v-else>
        <div v-for="b in groupBuses" :key="b.id" style="padding:0.5rem;border-bottom:1px solid var(--gray-light);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div><strong>{{ b.plate }}</strong> - Unidad #{{ b.unitNumber || '-' }}</div>
            <div style="font-size:0.9rem;color:var(--gray-medium)">{{ b.chassisBrand }} / {{ b.bodyBrand }}</div>
          </div>
          <div style="display:flex;gap:0.5rem">
            <Button class="p-button-text p-button-rounded" icon="pi pi-eye" aria-label="Ver" @click="() => openBusDetail(b)"></Button>
            <Button class="p-button-text p-button-rounded" :icon="b.status === 'ACTIVE' ? 'pi pi-power-off' : 'pi pi-power-on'" aria-label="Activar/Desactivar" @click="() => toggleBusStatus(b)"></Button>
            <Button class="p-button-text p-button-rounded" icon="pi pi-trash" aria-label="Eliminar" @click="() => deleteBusFromGroup(b)"></Button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:1rem">
        <Button label="Cerrar" icon="pi pi-times" class="p-button-text" @click="showViewBuses = false" />
      </div>
    </template>
  </Dialog>

  <BusForm
    :visible="showAddBus"
    :fixedTemplateId="selectedGroupForAdd ? (selectedGroupForAdd.templateId || (selectedGroupForAdd.template && selectedGroupForAdd.template.id)) : null"
    @update:visible="(val) => (showAddBus = val)"
    @submit="onCreateBusFromGroup"
    @cancel="() => { showAddBus = false; selectedGroupForAdd = null }"
  />

  <Dialog v-model:visible="showAddExisting" modal :style="{ width: '800px' }" :dismissableMask="true">
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
        <div>
          <i class="pi pi-download" style="margin-right:8px"></i>
          <strong>Agregar Bus Existente</strong>
        </div>
        <div>{{ selectedGroupForAdd ? selectedGroupForAdd.name : '' }}</div>
      </div>
    </template>

    <div style="padding:1rem">
      <div v-if="loadingAvailableBuses" class="loading-state">
        <i class="pi pi-spinner pi-spin"></i>
        <span>Cargando buses disponibles...</span>
      </div>

      <div v-else-if="availableBuses.length === 0" style="text-align:center;padding:2rem;color:var(--gray-medium)">
        No hay buses disponibles que coincidan con el template del grupo
      </div>

      <div v-else>
        <div v-for="b in availableBuses" :key="b.id" style="padding:0.5rem;border-bottom:1px solid var(--gray-light);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div><strong>{{ b.plate }}</strong> - Unidad #{{ b.unitNumber || '-' }}</div>
            <div style="font-size:0.9rem;color:var(--gray-medium)">{{ b.chassisBrand }} / {{ b.bodyBrand }}</div>
          </div>
          <div>
            <Button class="p-button-text" icon="pi pi-plus" label="Agregar" @click="() => assignExistingBus(b)"></Button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:1rem">
        <Button label="Cerrar" icon="pi pi-times" class="p-button-text" @click="() => { showAddExisting = false; selectedGroupForAdd = null }" />
      </div>
    </template>
  </Dialog>

  <BusDetail :visible="showBusDetail" :bus="selectedBus" @update:visible="(v)=>{ showBusDetail=v; if(!v) selectedBus=null }" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import BusGroupForm from './BusGroupForm.vue'
import BusForm from './BusForm.vue'
import BusDetail from './BusDetail.vue'
import * as busService from '../services/busService'
import { success } from '@/lib/notifier'
import type { BusGroupDto } from '../interfaces/template.interface'
import * as busGroupService from '../services/busGroupService'
import * as templateService from '../services/templateService'
import { error as notifyError } from '@/lib/notifier'
import { useAuthStore } from '@/modules/auth/store/useAuthStore'

function getRealSeatCount(template: any): number {
  // Mostrar seatCount de BD cuando el template es del sistema
  if (template && template.seatCount != null && (template.cooperativeId === null || template.cooperativeId === undefined)) {
    return template.seatCount
  }
  if (!template || !template.seatConfiguration) return template?.seatCount || 0
  return Object.values(template.seatConfiguration).filter(v => ['NORMAL','VIP','SEMI_BED','BED'].includes(v)).length
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const authStore = useAuthStore()
const visibleLocal = ref(props.visible)
const loading = ref(false)
const groups = ref<BusGroupDto[]>([])
const showCreateGroup = ref(false)
const showAddBus = ref(false)
const selectedGroupForAdd = ref<BusGroupDto | null>(null)
const showViewBuses = ref(false)
const groupBuses = ref<any[]>([])
const loadingGroupBuses = ref(false)
const showBusDetail = ref(false)
const selectedBus = ref<any | null>(null)
const showAddExisting = ref(false)
const availableBuses = ref<any[]>([])
const loadingAvailableBuses = ref(false)

watch(() => props.visible, (val) => {
  visibleLocal.value = val
  if (val) {
    loadGroups()
  }
})

onMounted(() => {
  if (props.visible) {
    loadGroups()
  }
})

function onVisibleChange(val: boolean) {
  emit('update:visible', val)
}

async function loadGroups() {
  loading.value = true
  try {
    // Try the most appropriate endpoint first, but fallback if authorization differs
    if (authStore.user?.cooperativeId) {
      console.log('[BusGroupManager] Loading groups for cooperative', authStore.user.cooperativeId)
      try {
        groups.value = await busGroupService.listGroupsByCooperative(authStore.user.cooperativeId)
        console.log('[BusGroupManager] Loaded groups count:', groups.value?.length)
        // If groups have templateId but no embedded template object, fetch them so UI shows template name
        await Promise.all(groups.value.map(async (g: any) => {
          if (!g.template && (g.templateId || g.template?.id)) {
            try {
              const tplId = g.templateId || (g.template && g.template.id)
              if (tplId) {
                const tpl = await templateService.getById(tplId)
                g.template = tpl
              }
            } catch (e) {
              console.warn('[BusGroupManager] Could not fetch template for group', g.id, e)
            }
          }
        }))
        // Populate bus counts in background
        populateGroupCounts(groups.value)
      } catch (innerErr: any) {
        console.warn('[BusGroupManager] listGroupsByCooperative failed, trying admin listGroups as fallback', innerErr)
        // If fallback available (token may be admin), try admin list
        groups.value = await busGroupService.listGroups()
        console.log('[BusGroupManager] Fallback loaded groups count:', groups.value?.length)
        await Promise.all(groups.value.map(async (g: any) => {
          if (!g.template && (g.templateId || g.template?.id)) {
            try {
              const tplId = g.templateId || (g.template && g.template.id)
              if (tplId) {
                const tpl = await templateService.getById(tplId)
                g.template = tpl
              }
            } catch (e) {
              console.warn('[BusGroupManager] Could not fetch template for group', g.id, e)
            }
          }
        }))
        populateGroupCounts(groups.value)
      }
    } else {
      console.log('[BusGroupManager] Loading all groups (admin)')
      try {
        groups.value = await busGroupService.listGroups()
        console.log('[BusGroupManager] Loaded groups count:', groups.value?.length)
        await Promise.all(groups.value.map(async (g: any) => {
          if (!g.template && (g.templateId || g.template?.id)) {
            try {
              const tplId = g.templateId || (g.template && g.template.id)
              if (tplId) {
                const tpl = await templateService.getById(tplId)
                g.template = tpl
              }
            } catch (e) {
              console.warn('[BusGroupManager] Could not fetch template for group', g.id, e)
            }
          }
        }))
        populateGroupCounts(groups.value)
      } catch (innerErr: any) {
        console.warn('[BusGroupManager] listGroups failed, trying cooperative-specific endpoint as fallback', innerErr)
        if (authStore.user?.cooperativeId) {
          groups.value = await busGroupService.listGroupsByCooperative(authStore.user.cooperativeId)
          console.log('[BusGroupManager] Fallback loaded groups count:', groups.value?.length)
        } else {
          throw innerErr
        }
      }
    }
  } catch (err: any) {
    console.error('[BusGroupManager] Error loading groups:', err)
    // Extra info when axios error
    if (err?.response) {
      console.error('Status:', err.response.status, 'Data:', err.response.data)
    }
    groups.value = []
    notifyError('Error', 'No se pudieron cargar los grupos. Revisa la consola o la red.')
  } finally {
    loading.value = false
  }
}

async function onGroupCreated() {
  await loadGroups()
}

// Populate bus counts for groups by requesting listByGroup and using its length.
// Runs in background and updates `groups` array as results arrive.
function populateGroupCounts(groupList: any[]) {
  if (!groupList || !groupList.length) return
  groupList.forEach(async (g: any) => {
    try {
      const buses = await busService.listByGroup(g.id)
      const idx = groups.value.findIndex((x: any) => x.id === g.id)
      if (idx !== -1) groups.value[idx].busCount = (buses || []).length
    } catch (e) {
      console.warn('[BusGroupManager] Could not load count for group', g.id, e)
    }
  })
}

function viewGroupBuses(group: BusGroupDto) {
  // Cargar buses del grupo y mostrar diálogo
  loadingGroupBuses.value = true
  groupBuses.value = []
  showViewBuses.value = true
  try {
    busService.listByGroup(group.id).then(b => {
      groupBuses.value = b
      // update group's busCount to match actual list
      const idx = groups.value.findIndex((g: any) => g.id === group.id)
      if (idx !== -1) {
        groups.value[idx].busCount = (b || []).length
      }
    }).catch(err => {
      console.error('[BusGroupManager] Error loading group buses:', err)
      notifyError('Error', 'No se pudieron cargar los buses del grupo')
    }).finally(() => {
      loadingGroupBuses.value = false
    })
  } catch (err) {
    loadingGroupBuses.value = false
    console.error('[BusGroupManager] Error:', err)
  }
}

function addBusToGroup(group: BusGroupDto) {
  selectedGroupForAdd.value = group
  showAddBus.value = true
}

function addExistingBusToGroup(group: BusGroupDto) {
  selectedGroupForAdd.value = group
  showAddExisting.value = true
  loadAvailableBuses(group)
}

async function loadAvailableBuses(group: BusGroupDto) {
  loadingAvailableBuses.value = true
  availableBuses.value = []
  try {
    const coopId = authStore.user?.cooperativeId || group.cooperativeId
    const buses = await busService.listByCooperative(coopId)
    // Filter: same template and not already in a group
    availableBuses.value = (buses || []).filter((b: any) => {
      const tpl = b.busTemplateId || (b.busTemplate && b.busTemplate.id)
      const inGroup = (b as any).busGroupId || (b.busGroup && b.busGroup.id)
      return tpl === group.templateId && !inGroup
    })
  } catch (err) {
    console.error('[BusGroupManager] Error loading available buses:', err)
    notifyError('Error', 'No se pudieron cargar los buses disponibles')
  } finally {
    loadingAvailableBuses.value = false
  }
}

async function assignExistingBus(bus: any) {
  if (!selectedGroupForAdd.value) return
  try {
    await busService.assignToGroup(bus.id, selectedGroupForAdd.value.id)
    success('Bus agregado', `Bus ${bus.plate} agregado al grupo`)
    // update local group's busCount for immediate feedback
    const gid = selectedGroupForAdd.value.id
    const idx = groups.value.findIndex((g: any) => g.id === gid)
    if (idx !== -1) {
      groups.value[idx].busCount = (groups.value[idx].busCount || 0) + 1
    }
    // refresh groups in background to keep in sync
    loadGroups().catch((e) => console.warn('[BusGroupManager] background loadGroups failed', e))
    showAddExisting.value = false
    selectedGroupForAdd.value = null
  } catch (err: any) {
    console.error('[BusGroupManager] Error assigning bus to group:', err)
    notifyError('Error', err?.response?.data?.message || 'No se pudo agregar el bus al grupo')
  }
}

function openBusDetail(bus: any) {
  selectedBus.value = bus
  showBusDetail.value = true
}

async function toggleBusStatus(bus: any) {
  try {
    const target = bus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await busService.changeStatus(bus.id, target)
    // update local copies
    const gbIdx = groupBuses.value.findIndex((x: any) => x.id === bus.id)
    if (gbIdx !== -1) groupBuses.value[gbIdx].status = target
    const gIdx = groups.value.findIndex((g: any) => g.id === selectedGroupForAdd.value?.id)
    if (gIdx !== -1) {
      // busCount unaffected by status
    }
    // if detail open, update selectedBus
    if (selectedBus.value && selectedBus.value.id === bus.id) selectedBus.value.status = target
    success('Estado actualizado', `Bus ${bus.plate} ahora ${target}`)
  } catch (err: any) {
    console.error('[BusGroupManager] Error changing bus status:', err)
    notifyError('Error', err?.response?.data?.message || 'No se pudo cambiar el estado del bus')
  }
}

async function deleteBusFromGroup(bus: any) {
  try {
    const ok = window.confirm(`¿Eliminar el bus ${bus.plate}? Esta acción es irreversible.`)
    if (!ok) return
    await busService.deleteBus(bus.id)
    // remove from local list
    groupBuses.value = groupBuses.value.filter((b: any) => b.id !== bus.id)
    // decrement group's busCount
    const gid = selectedGroupForAdd.value?.id
    const idx = groups.value.findIndex((g: any) => g.id === gid)
    if (idx !== -1) groups.value[idx].busCount = Math.max(0, (groups.value[idx].busCount || 1) - 1)
    // close detail if it was open for this bus
    if (selectedBus.value && selectedBus.value.id === bus.id) {
      showBusDetail.value = false
      selectedBus.value = null
    }
    success('Bus eliminado', `Bus ${bus.plate} eliminado correctamente`)
  } catch (err: any) {
    console.error('[BusGroupManager] Error deleting bus:', err)
    notifyError('Error', err?.response?.data?.message || 'No se pudo eliminar el bus')
  }
}

async function onCreateBusFromGroup(payload: any, file?: File) {
  if (!selectedGroupForAdd.value) {
    notifyError('Error', 'Grupo no seleccionado')
    return
  }

  try {
    const created = await busService.createFromGroup(selectedGroupForAdd.value.id, payload, file)
    success('Bus creado', `Bus ${created.plate} agregado al grupo`)
    // update local group's busCount for immediate feedback
    const gid = selectedGroupForAdd.value.id
    const idx = groups.value.findIndex((g: any) => g.id === gid)
    if (idx !== -1) {
      groups.value[idx].busCount = (groups.value[idx].busCount || 0) + 1
    }
    // refresh groups in background
    loadGroups().catch((e) => console.warn('[BusGroupManager] background loadGroups failed', e))
    showAddBus.value = false
    selectedGroupForAdd.value = null
  } catch (err: any) {
    console.error('[BusGroupManager] Error creating bus in group:', err)
    notifyError('Error', err?.response?.data?.message || 'No se pudo crear el bus en el grupo')
  }
}
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-header {
  font-size: 1.5rem;
  color: var(--app-accent);
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.group-manager-content {
  padding: 1rem 0;
  min-height: 400px;
}

.action-bar {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: var(--gray-medium);
}

.loading-state i, .empty-state i {
  font-size: 3rem;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.group-card {
  padding: 1.5rem;
  border: 1px solid var(--gray-light);
  border-radius: 12px;
  background: white;
  transition: all 0.2s ease;
}

.group-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.group-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--app-text);
}

.group-description {
  margin: 0.5rem 0 1rem 0;
  font-size: 0.98rem;
  color: var(--app-text);
  min-height: 2.5rem;
  line-height: 1.3;
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--app-text);
}

.info-item i {
  color: var(--app-accent);
}

.group-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-light);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

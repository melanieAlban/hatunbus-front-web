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
          label="+ Crear Nuevo Grupo"
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
              <span>{{ group.template.name }}</span>
            </div>
            <div class="info-item">
              <i class="pi pi-users"></i>
              <span>{{ group.template.seatCount }} asientos</span>
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
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import BusGroupForm from './BusGroupForm.vue'
import type { BusGroupDto } from '../interfaces/template.interface'
import * as busGroupService from '../services/busGroupService'
import { error as notifyError } from '@/lib/notifier'
import { useAuthStore } from '@/modules/auth/store/useAuthStore'

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
    if (authStore.user?.cooperativeId) {
      groups.value = await busGroupService.listGroupsByCooperative(authStore.user.cooperativeId)
    } else {
      groups.value = await busGroupService.listGroups()
    }
  } catch (err: any) {
    console.error('[BusGroupManager] Error loading groups:', err)
    notifyError('Error', 'No se pudieron cargar los grupos')
  } finally {
    loading.value = false
  }
}

async function onGroupCreated() {
  await loadGroups()
}

function viewGroupBuses(group: BusGroupDto) {
  console.log('View buses for group:', group)
  // TODO: Implementar vista de buses del grupo
}

function addBusToGroup(group: BusGroupDto) {
  console.log('Add bus to group:', group)
  // TODO: Implementar agregar bus al grupo
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
  font-size: 0.875rem;
  color: var(--gray-medium);
  min-height: 2.5rem;
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

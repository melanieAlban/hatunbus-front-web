<template>
  <Dialog
    v-model:visible="visibleLocal"
    modal
    :style="{ width: '800px', maxHeight: '90vh' }"
    :dismissableMask="true"
    class="template-manager-dialog"
    @update:visible="onVisibleChange"
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-th-large icon-header"></i>
        <h2 class="dialog-title">Gestión de Templates</h2>
      </div>
    </template>

    <div class="template-manager-content">
      <div class="action-bar">
        <Button
          label="Crear Template Personalizado"
          icon="pi pi-plus"
          @click="showCreateTemplate = true"
        />
      </div>

      <!-- Tabs para templates -->
      <TabView>
        <TabPanel header="Templates del Sistema" value="0">
          <div v-if="loadingSystem" class="loading-state">
            <i class="pi pi-spinner pi-spin"></i>
            <span>Cargando templates del sistema...</span>
          </div>
          <div v-else-if="systemTemplates.length === 0" class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>No hay templates del sistema disponibles</p>
            <small>Los templates del sistema son predefinidos por la plataforma</small>
          </div>
          <div v-else class="templates-grid">
            <div v-for="template in systemTemplates" :key="template.id" class="template-card">
              <h4>{{ template.name }}</h4>
              <p>{{ template.description || 'Sin descripción' }}</p>
              <BusTemplatePreview 
                :seatConfiguration="template.seatConfiguration" 
                :rows="calculateRows(template.seatConfiguration)"
              />
              <div class="template-stats">
                <span><i class="pi pi-ticket"></i> {{ template.seatCount }} asientos</span>
                <span v-if="getVipCount(template) > 0"><i class="pi pi-star"></i> {{ getVipCount(template) }} VIP</span>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Mis Templates" value="1">
          <div v-if="loadingCustom" class="loading-state">
            <i class="pi pi-spinner pi-spin"></i>
            <span>Cargando tus templates...</span>
          </div>
          <div v-else-if="customTemplates.length === 0" class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>No tienes templates personalizados</p>
            <Button label="Crear Primer Template" icon="pi pi-plus" @click="showCreateTemplate = true" />
          </div>
          <div v-else class="templates-grid">
            <div v-for="template in customTemplates" :key="template.id" class="template-card">
              <h4>{{ template.name }}</h4>
              <p>{{ template.description || 'Sin descripción' }}</p>
              <BusTemplatePreview 
                :seatConfiguration="template.seatConfiguration" 
                :rows="calculateRows(template.seatConfiguration)"
              />
              <div class="template-stats">
                <span><i class="pi pi-ticket"></i> {{ template.seatCount }} asientos</span>
                <span v-if="getVipCount(template) > 0"><i class="pi pi-star"></i> {{ getVipCount(template) }} VIP</span>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
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

  <TemplateForm
    :visible="showCreateTemplate"
    @update:visible="(val) => (showCreateTemplate = val)"
    @created="onTemplateCreated"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import TemplateForm from './TemplateForm.vue'
import BusTemplatePreview from '@/components/ui/BusTemplatePreview.vue'
import type { BusTemplateDto } from '../interfaces/template.interface'
import * as templateService from '../services/templateService'
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
const loadingSystem = ref(false)
const loadingCustom = ref(false)
const systemTemplates = ref<BusTemplateDto[]>([])
const allTemplates = ref<BusTemplateDto[]>([])
const showCreateTemplate = ref(false)

const customTemplates = computed(() => {
  return allTemplates.value.filter(t => t.cooperativeId === authStore.user?.cooperativeId)
})

watch(() => props.visible, (val) => {
  visibleLocal.value = val
  if (val) {
    loadTemplates()
  }
})

onMounted(() => {
  if (props.visible) {
    loadTemplates()
  }
})

function onVisibleChange(val: boolean) {
  emit('update:visible', val)
}

async function loadTemplates() {
  loadingSystem.value = true
  loadingCustom.value = true
  
  try {
    console.log('[TemplateManager] Cargando templates del sistema...')
    systemTemplates.value = await templateService.listSystemTemplates()
    console.log('[TemplateManager] Templates del sistema cargados:', systemTemplates.value)
    
    if (authStore.user?.cooperativeId) {
      console.log('[TemplateManager] Cargando templates para cooperativa:', authStore.user.cooperativeId)
      allTemplates.value = await templateService.listAvailableForCooperative(
        authStore.user.cooperativeId
      )
      console.log('[TemplateManager] Templates disponibles:', allTemplates.value)
      console.log('[TemplateManager] Templates personalizados (filtrados):', customTemplates.value)
    } else {
      console.warn('[TemplateManager] No hay cooperativeId en el usuario')
    }
  } catch (err: any) {
    console.error('[TemplateManager] Error loading templates:', err)
    notifyError('Error', 'No se pudieron cargar los templates')
  } finally {
    loadingSystem.value = false
    loadingCustom.value = false
  }
}

async function onTemplateCreated() {
  await loadTemplates()
}

function getVipCount(template: BusTemplateDto): number {
  if (!template.seatConfiguration) return 0
  return Object.values(template.seatConfiguration).filter(type => type === 'VIP').length
}

function calculateRows(seatConfiguration?: Record<string, any>): number {
  if (!seatConfiguration) return 10
  
  let maxRow = 10
  for (const key in seatConfiguration) {
    const cell = seatConfiguration[key]
    if (cell?.row && cell.row > maxRow) {
      maxRow = cell.row
    }
  }
  
  return maxRow
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

.template-manager-content {
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

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.template-card {
  padding: 1rem;
  border: 1px solid var(--gray-light);
  border-radius: 8px;
  background: white;
}

.template-card h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.template-card p {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #495057;
  min-height: 2.5rem;
}

.template-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--app-text);
  margin-top: 1rem;
}

.template-stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.template-stats i {
  font-size: 0.75rem;
}

.empty-state small {
  font-size: 0.875rem;
  color: var(--gray-medium);
  margin-top: 0.5rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

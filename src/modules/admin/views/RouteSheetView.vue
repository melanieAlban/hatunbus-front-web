<template>
  <div class="route-sheet-view">
    <header class="page-header">
      <div class="header-left">
        <h2>Gestión de Hojas de Ruta</h2>
        <p class="subtitle">Crea, visualiza y gestiona las hojas de ruta por grupo de buses</p>
      </div>
    </header>

    <TabView class="route-tabs">
      <!-- Tab 1: Ver Hojas de Ruta -->
      <TabPanel value="list">
        <template #header>
          <div class="tab-header">
            <i class="pi pi-list"></i>
            <span>Ver Hojas de Ruta</span>
          </div>
        </template>
        <RouteSheetList ref="routeSheetListRef" />
      </TabPanel>

      <!-- Tab 2: Crear Hoja de Ruta -->
      <TabPanel value="create">
        <template #header>
          <div class="tab-header">
            <i class="pi pi-plus-circle"></i>
            <span>Crear Hoja de Ruta</span>
          </div>
        </template>

        <div class="create-panel">
          <!-- Wizard Card -->
          <div class="wizard-card">
            <div class="wizard-header">
              <div>
                <p class="eyebrow">Generador de Hoja de Ruta</p>
                <h3>Auto-encadenado + Rotación</h3>
                <p class="description">
                  Valida la interconexión de frecuencias y genera la hoja de ruta completa.
                </p>
              </div>
              <Button
                icon="pi pi-refresh"
                label="Limpiar"
                text
                size="small"
                @click="resetAll"
                :disabled="wizardStore.chainLoading || isGenerating"
              />
            </div>

            <!-- Paso 1: Configuración -->
            <div class="config-section">
              <h4><i class="pi pi-cog"></i> Configuración</h4>

              <div class="field">
                <label><i class="pi pi-users"></i> Grupo de Buses</label>
                <Dropdown
                  v-model="selectedGroupId"
                  :options="busGroups"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Selecciona un grupo"
                  :showClear="true"
                  class="w-full"
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value">
                      <strong>{{ getBusGroupName(slotProps.value) }}</strong>
                      <small class="group-info-inline"> · {{ getBusGroupInfo(slotProps.value) }}</small>
                    </div>
                    <span v-else>{{ slotProps.placeholder }}</span>
                  </template>
                  <template #option="slotProps">
                    <div class="group-option">
                      <div>
                        <strong>{{ slotProps.option.name }}</strong>
                        <Tag :value="slotProps.option.active ? 'Activo' : 'Inactivo'"
                             :severity="slotProps.option.active ? 'success' : 'danger'"
                             class="ml-2" />
                      </div>
                      <small>{{ slotProps.option.busCount || 0 }} buses · {{ slotProps.option.template?.name || 'N/A' }}</small>
                    </div>
                  </template>
                </Dropdown>
                <small class="field-help">
                  <i class="pi pi-info-circle"></i>
                  El grupo determina qué buses participarán en la rotación
                </small>
              </div>

              <div class="field">
                <label><i class="pi pi-sitemap"></i> Frecuencias a Asignar</label>
                <div class="frequency-selector" @click="showFrequencyModal = true">
                  <div class="frequency-selector-content">
                    <div v-if="selectedFrequencyIds.length === 0" class="frequency-placeholder">
                      <i class="pi pi-sitemap"></i>
                      <span>Click para seleccionar frecuencias</span>
                    </div>
                    <div v-else class="frequency-selected">
                      <div class="frequency-chips">
                        <Tag
                          v-for="id in selectedFrequencyIds.slice(0, 3)"
                          :key="id"
                          :value="getFrequencyLabel(id)"
                          class="frequency-chip"
                        />
                        <Tag
                          v-if="selectedFrequencyIds.length > 3"
                          :value="`+${selectedFrequencyIds.length - 3} más`"
                          severity="info"
                        />
                      </div>
                      <span class="frequency-count">{{ selectedFrequencyIds.length }} seleccionadas</span>
                    </div>
                  </div>
                  <i class="pi pi-pencil"></i>
                </div>
                <small class="field-help">
                  <i class="pi pi-info-circle"></i>
                  Las frecuencias se auto-ordenarán según su conexión física
                </small>
              </div>

              <div class="field">
                <label><i class="pi pi-calendar"></i> Fecha de Inicio</label>
                <Calendar
                  v-model="wizardStartDate"
                  dateFormat="yy-mm-dd"
                  :showIcon="true"
                  class="w-full"
                />
                <small class="field-help">
                  <i class="pi pi-info-circle"></i>
                  Fecha de inicio de la rotación
                </small>
              </div>

              <div class="actions">
                <Button
                  icon="pi pi-link"
                  label="Verificar Encadenado"
                  severity="primary"
                  @click="onVerifyChain"
                  :loading="wizardStore.chainLoading"
                  :disabled="!canVerifyChain || isGenerating"
                />
              </div>
            </div>

            <!-- Paso 2: Cadena -->
            <ChainResult
              :orderedChain="wizardStore.orderedChain"
              :discardedFrequencies="wizardStore.discardedFrequencies"
              :isValid="wizardStore.isChainValid"
              :loading="wizardStore.chainLoading"
            />

            <!-- Botón de Generar -->
            <div v-if="canGenerate" class="generate-section">
              <div class="generate-card">
                <div>
                  <h4><i class="pi pi-check-circle"></i> Cadena Confirmada</h4>
                  <p>El encadenado de frecuencias es válido. Genera la hoja de ruta ahora.</p>
                </div>
                <Button
                  icon="pi pi-save"
                  label="Generar Hoja de Ruta"
                  severity="success"
                  size="large"
                  @click="generateRouteSheet"
                  :loading="isGenerating"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Modal de Selección de Frecuencias -->
        <FrequencySelectionModal
          v-model:visible="showFrequencyModal"
          v-model="selectedFrequencyIds"
          :frequencies="availableFrequencies"
          :loading="frequencyStore.loading"
        />
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Tag from 'primevue/tag'
import { confirm, error as notifyError, success } from '../../../lib/notifier'
import { useAuthStore } from '../../auth/store/useAuthStore'
import { useRouteWizardStore } from '../../routes/store/useRouteWizardStore'
import { useFrequencyStore } from '../../cooperatives/store/useFrequencyStore'
import type { BusGroupDto } from '../../buses/interfaces/template.interface'
import type { FrequencyDto } from '../../routes/interfaces/route.interface'
import { listGroupsByCooperative } from '../../buses/services/busGroupService'
import { generateForBusGroup } from '../../../services/routeSheetService'
import RouteSheetList from '../components/RouteSheetList.vue'
import ChainResult from '../../routes/components/ChainResult.vue'
import FrequencySelectionModal from '../components/FrequencySelectionModal.vue'

const auth = useAuthStore()
const wizardStore = useRouteWizardStore()
const frequencyStore = useFrequencyStore()
const routeSheetListRef = ref<InstanceType<typeof RouteSheetList> | null>(null)

const busGroups = ref<BusGroupDto[]>([])
const availableFrequencies = computed(() => frequencyStore.availableFrequencies)
const selectedGroupId = ref<string | null>(null)
const selectedFrequencyIds = ref<string[]>([])
const wizardStartDate = ref<Date>(new Date())
const showFrequencyModal = ref(false)
const isGenerating = ref(false)

const canVerifyChain = computed(() =>
  !!selectedGroupId.value &&
  selectedFrequencyIds.value.length > 0
)

const canGenerate = computed(() =>
  canVerifyChain.value &&
  wizardStore.isChainValid &&
  wizardStore.orderedChain.length > 0
)

onMounted(async () => {
  await loadContext()
})

async function loadContext() {
  if (!auth.user?.cooperativeId) return

  try {
    const [groups] = await Promise.all([
      listGroupsByCooperative(auth.user.cooperativeId),
      frequencyStore.fetchAvailable(auth.user.cooperativeId)
    ])
    busGroups.value = groups
  } catch (err: any) {
    console.error('[RouteSheetView] Error loading context:', err)
    notifyError('Error', err?.response?.data?.message || 'No se pudo cargar el contexto')
  }
}

async function onVerifyChain() {
  if (!canVerifyChain.value) {
    notifyError('Falta información', 'Selecciona grupo y frecuencias')
    return
  }

  try {
    await wizardStore.verifyChain(selectedFrequencyIds.value)
    if (wizardStore.isChainValid) {
      success('Cadena válida', 'El orden sugerido está listo para generar la hoja de ruta')
    }
  } catch (err) {
    // El store ya notifica errores
  }
}

async function generateRouteSheet() {
  if (!canGenerate.value) return

  const confirmed = await confirm({
    title: 'Confirmar generación',
    message: 'Se generará la hoja de ruta con la rotación planificada.\n¿Continuar?',
    acceptLabel: 'Sí, generar',
    rejectLabel: 'Cancelar'
  })

  if (!confirmed) return

  isGenerating.value = true
  try {
    const request = {
      startDate: formatDateForApi(wizardStartDate.value),
      busGroupId: selectedGroupId.value!,
      frequencies: wizardStore.orderedChain.map(freq => ({
        frequencyId: String(freq.id),
        operatingDays: undefined
      }))
    }

    const response = await generateForBusGroup(request)
    const count = response.generatedTripsCount || 0
    success('Hoja de Ruta Generada', `La hoja de ruta se creó exitosamente. Se generaron ${count} viajes.`)

    // Limpiar wizard
    resetAll()

    // Refrescar listado sin requerir click manual
    await routeSheetListRef.value?.reload?.()
  } catch (err: any) {
    console.error('[RouteSheetView] Error generando hoja:', err)
    
    // Manejar específicamente el error 409 (conflicto de solapamiento)
    if (err?.response?.status === 409) {
      const errorMessage = err.response.data?.message || 'Ya existe una hoja de ruta que se solapa con el rango de fechas seleccionado'
      notifyError('Solapamiento de Fechas', errorMessage)
    } else {
      notifyError('Error', err?.response?.data?.message || 'No se pudo generar la hoja de ruta')
    }
  } finally {
    isGenerating.value = false
  }
}

function resetAll() {
  selectedGroupId.value = null
  selectedFrequencyIds.value = []
  wizardStartDate.value = new Date()
  wizardStore.resetAll()
}

function formatDateForApi(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getBusGroupName(id: string): string {
  return busGroups.value.find(g => g.id === id)?.name || 'Desconocido'
}

function getBusGroupInfo(id: string): string {
  const group = busGroups.value.find(g => g.id === id)
  if (!group) return ''
  return `${group.busCount || 0} buses`
}

function getFrequencyLabel(id: string): string {
  const freq = availableFrequencies.value.find(f => f.id === id)
  if (!freq) return `Frecuencia ${id}`

  if (freq.name) {
    return freq.name
  }

  if (freq.segments && freq.segments.length) {
    const sorted = [...freq.segments].sort((a, b) => (a.segmentOrder || 0) - (b.segmentOrder || 0))
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    if (first && last) {
      return `${first.routeOrigin || 'Origen'} → ${last.routeDestination || 'Destino'}`
    }
  }

  return `Frecuencia ${id}`
}
</script>

<style scoped>
.route-sheet-view {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.header-left h2 {
  margin: 0 0 0.5rem 0;
  color: var(--app-text);
  font-size: 2rem;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-panel {
  padding: 1rem 0;
}

.wizard-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.eyebrow {
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  color: #3b82f6;
  font-weight: 600;
}

.wizard-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--app-text);
}

.description {
  margin: 0;
  color: #64748b;
  font-size: 0.9375rem;
}

.config-section {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.config-section h4 {
  margin: 0 0 1.5rem 0;
  color: var(--app-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--app-text);
}

.field-help {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.field-help i {
  color: #3b82f6;
}

.w-full {
  width: 100%;
}

.group-info-inline {
  color: #64748b;
}

.group-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.group-option small {
  color: #64748b;
}

.frequency-selector {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 56px;
}

.frequency-selector:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.frequency-selector-content {
  flex: 1;
}

.frequency-placeholder {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
}

.frequency-selected {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.frequency-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.frequency-chip {
  font-size: 0.875rem;
}

.frequency-count {
  color: #64748b;
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.generate-section {
  margin-top: 2rem;
}

.generate-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #22c55e;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.generate-card h4 {
  margin: 0 0 0.5rem 0;
  color: #166534;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.generate-card h4 i {
  color: #22c55e;
}

.generate-card p {
  margin: 0;
  color: #166534;
}

@media (max-width: 768px) {
  .wizard-header {
    flex-direction: column;
    gap: 1rem;
  }

  .generate-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

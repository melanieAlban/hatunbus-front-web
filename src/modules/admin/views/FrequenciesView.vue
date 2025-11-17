<template>
  <div class="frequencies-view">
    <header class="page-header">
      <div class="header-left">
        <h2>Gestión de Frecuencias</h2>
        <p class="subtitle">Selecciona las frecuencias de la ANT que deseas activar para tu cooperativa</p>
      </div>
      <div class="header-right">
        <button 
          class="btn-info" 
          @click="showInfoModal = true"
        >
          <i class="pi pi-info-circle"></i>
          Información
        </button>
        <button 
          v-if="auth.user?.cooperativeId && selectedFrequencies.length > 0" 
          class="btn-secondary" 
          @click="onSaveFrequencies"
          :disabled="isSaving"
        >
          <i class="pi pi-check"></i>
          {{ isSaving ? 'Guardando...' : 'Guardar Selección' }}
        </button>
        <button 
          v-if="auth.user?.cooperativeId && selectedFrequencies.length > 0" 
          class="btn-success" 
          @click="onGenerateAutomatic"
          :disabled="isGenerating"
        >
          <i class="pi pi-cog"></i>
          {{ isGenerating ? 'Generando...' : 'Generar Hoja de Ruta y Viajes' }}
        </button>
      </div>
    </header>

    <div class="content-card">
      <div v-if="!auth.user?.cooperativeId" class="warning-message">
        <i class="pi pi-exclamation-triangle"></i>
        <div>
          <p>No se pudo obtener información de la cooperativa.</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">
            Usuario: {{ auth.user?.email || 'No disponible' }} |
            Rol: {{ auth.user?.role || 'No disponible' }} |
            CooperativeId: {{ auth.user?.cooperativeId || 'NULL' }}
          </p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">
            Por favor, contacta al administrador para que te asigne una cooperativa.
          </p>
        </div>
      </div>

      <div v-else>
        <div class="cooperative-info">
          <div class="info-badge">
            <i class="pi pi-building"></i>
            <div class="info-content">
              <span class="info-label">Cooperativa:</span>
              <span class="info-value">{{ auth.user.cooperativeName || 'Sin nombre' }}</span>
            </div>
          </div>
        </div>

        <!-- Estado de carga -->
        <div v-if="store.loading" class="loading-state">
          <i class="pi pi-spinner pi-spin loading-icon"></i>
          <span>Cargando frecuencias...</span>
        </div>

        <!-- Mensaje de error -->
        <div v-else-if="store.error" class="error-message">
          <i class="pi pi-exclamation-triangle error-icon"></i>
          <span>{{ store.error }}</span>
        </div>

        <!-- Tabla de frecuencias -->
        <div v-else class="table-wrapper">
          <DataTable
            v-model:selection="selectedFrequencies"
            :value="store.availableFrequencies"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20]"
            class="frequency-table"
            responsiveLayout="scroll"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem" />

            <Column field="name" header="Frecuencia" :sortable="true">
              <template #body="slotProps">
                <div class="frequency-name">
                  <i class="pi pi-clock"></i>
                  <span>{{ slotProps.data.name || 'Sin nombre' }}</span>
                </div>
              </template>
            </Column>

            <Column field="operatingDays" header="Días Operativos" :sortable="false">
              <template #body="slotProps">
                <div class="days-container">
                  <span v-for="day in slotProps.data.operatingDays" :key="day" class="day-badge">
                    {{ translateDay(day) }}
                  </span>
                </div>
              </template>
            </Column>

            <Column field="segments" header="Rutas/Segmentos" :sortable="false">
              <template #body="slotProps">
                <div class="segments-container">
                  <div v-for="segment in slotProps.data.segments" :key="segment.id" class="segment-item">
                    <i class="pi pi-map-marker segment-icon"></i>
                    <span class="segment-route">{{ segment.routeOrigin }} → {{ segment.routeDestination }}</span>
                    <span class="segment-time">({{ segment.departureTime }})</span>
                  </div>
                  <span v-if="!slotProps.data.segments || slotProps.data.segments.length === 0" class="no-segments">
                    Sin segmentos
                  </span>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- Modal de Información -->
    <Dialog
      v-model:visible="showInfoModal"
      :style="{ width: '600px', maxWidth: '90vw' }"
      :modal="true"
      :draggable="false"
      header="Información sobre Frecuencias"
    >
      <div class="info-modal-content">
        <ul class="info-list">
          <li>
            <i class="pi pi-check-circle"></i>
            <span>Las frecuencias son proporcionadas por la ANT (Agencia Nacional de Tránsito)</span>
          </li>
          <li>
            <i class="pi pi-check-circle"></i>
            <span>Puedes seleccionar múltiples frecuencias para tu cooperativa</span>
          </li>
          <li>
            <i class="pi pi-check-circle"></i>
            <span>Cada frecuencia incluye información sobre días operativos y rutas</span>
          </li>
          <li>
            <i class="pi pi-check-circle"></i>
            <span>Solo las frecuencias seleccionadas estarán activas para tu cooperativa</span>
          </li>
          <li>
            <i class="pi pi-cog"></i>
            <span><strong>Generar Hoja de Ruta y Viajes:</strong> Este botón creará automáticamente una hoja de ruta basada en las frecuencias seleccionadas y generará los viajes correspondientes para tu cooperativa</span>
          </li>
        </ul>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../auth/store/useAuthStore'
import { useFrequencyStore } from '../../cooperatives/store/useFrequencyStore'
import type { FrequencyWithSegmentsDto } from '../../cooperatives/interfaces/frequency.interface'
import { success, error as notifyError, confirm } from '../../../lib/notifier'
import { generateAutomaticRouteSheet } from '../../../services/routeSheetService'
import { generateTripsFromRouteSheet } from '../../../services/tripService'

// PrimeVue Components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'

const auth = useAuthStore()
const store = useFrequencyStore()
const selectedFrequencies = ref<FrequencyWithSegmentsDto[]>([])
const isSaving = ref(false)
const isGenerating = ref(false)
const showInfoModal = ref(false)

onMounted(async () => {
  if (auth.user?.cooperativeId) {
    try {
      await store.fetchAvailable(auth.user.cooperativeId)
      // Pre-select already selected frequencies
      selectedFrequencies.value = store.availableFrequencies.filter(f => f.selected)
    } catch (error: any) {
      notifyError('Error', error?.message || 'Error al cargar frecuencias')
    }
  }
})

async function onSaveFrequencies() {
  if (!auth.user?.cooperativeId) return

  isSaving.value = true
  try {
    const frequencyIds = selectedFrequencies.value.map(f => f.id)
    await store.updateSelection(auth.user.cooperativeId, frequencyIds)
    success('Frecuencias actualizadas', 'Las frecuencias han sido actualizadas correctamente')
  } catch (error: any) {
    notifyError('Error', error?.message || 'Error al actualizar frecuencias')
  } finally {
    isSaving.value = false
  }
}

async function onGenerateAutomatic() {
  if (!auth.user?.cooperativeId) return

  const confirmed = await confirm({
    title: 'Generar Hoja de Ruta y Viajes',
    message: `Este proceso realizará las siguientes acciones:\n\n1. Generará automáticamente una hoja de ruta para tu cooperativa basándose en las frecuencias seleccionadas (válida por 2 meses)\n2. Creará los viajes correspondientes para los próximos 60 días según la hoja de ruta generada\n3. Los viajes se generarán solo para los días operativos configurados en cada frecuencia\n\n¿Deseas continuar?`,
    acceptLabel: 'Sí, Generar',
    rejectLabel: 'Cancelar'
  })

  if (!confirmed) return

  isGenerating.value = true
  try {
    // Primero guardamos las frecuencias seleccionadas
    const frequencyIds = selectedFrequencies.value.map(f => f.id)
    await store.updateSelection(auth.user.cooperativeId, frequencyIds)

    // Luego generamos la hoja de ruta automática
    const routeSheet = await generateAutomaticRouteSheet(auth.user.cooperativeId)
    
    // Finalmente generamos los viajes
    const trips = await generateTripsFromRouteSheet(auth.user.cooperativeId)

    success(
      'Generación exitosa', 
      `Se ha generado la hoja de ruta y ${trips.length} viaje${trips.length !== 1 ? 's' : ''} correctamente`
    )
  } catch (error: any) {
    notifyError(
      'Error en la generación', 
      error?.response?.data?.message || error?.message || 'No se pudo completar el proceso de generación'
    )
  } finally {
    isGenerating.value = false
  }
}

const translateDay = (day: string): string => {
  const translations: Record<string, string> = {
    MONDAY: 'Lun',
    TUESDAY: 'Mar',
    WEDNESDAY: 'Mié',
    THURSDAY: 'Jue',
    FRIDAY: 'Vie',
    SATURDAY: 'Sáb',
    SUNDAY: 'Dom'
  }
  return translations[day] || day
}
</script>

<style scoped>
.frequencies-view {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-left h2 {
  margin: 0 0 0.5rem 0;
  color: var(--app-text);
  font-size: 1.75rem;
}

.subtitle {
  margin: 0;
  color: #000;
  font-size: 0.95rem;
}

.header-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.content-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.warning-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #fff9db;
  border: 1px solid #ffd43b;
  border-radius: 8px;
  color: #e67700;
}

.warning-message i {
  font-size: 1.5rem;
}

.cooperative-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--surface-50);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-badge > i {
  font-size: 1.25rem;
  color: var(--app-accent);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.7rem;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--app-text);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--gray-medium);
  font-size: 1rem;
}

.loading-icon {
  font-size: 1.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #c32020;
  margin-top: 1rem;
}

.error-icon {
  font-size: 1.25rem;
}

.table-wrapper {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.frequency-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: var(--app-text);
}

.days-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.day-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--surface-50);
  border: 1px solid var(--gray-light);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--app-text);
}

.resolution-text {
  color: var(--gray-medium);
  font-size: 0.875rem;
}

.segments-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.segment-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: var(--surface-50);
  border-radius: 4px;
  font-size: 0.875rem;
}

.segment-icon {
  color: var(--app-accent);
  font-size: 0.875rem;
}

.segment-route {
  font-weight: 500;
  color: var(--app-text);
}

.segment-time {
  color: #000;
  font-size: 0.8rem;
}

.no-segments {
  color: var(--gray-medium);
  font-style: italic;
  font-size: 0.875rem;
}

.btn-secondary,
.btn-success,
.btn-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.btn-info:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: var(--app-accent);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-secondary:disabled,
.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.info-modal-content {
  padding: 0.5rem 0;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  line-height: 1.6;
  color: var(--app-text);
}

.info-list li:last-child {
  margin-bottom: 0;
}

.info-list li i {
  color: #3b82f6;
  font-size: 1.1rem;
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.info-list li span {
  flex: 1;
}

/* Override PrimeVue DataTable styles */
:deep(.frequency-table) {
  font-size: 0.875rem;
}

:deep(.frequency-table .p-datatable-header) {
  background: var(--beige-bone);
  border: 1px solid var(--gray-light);
}

:deep(.frequency-table .p-datatable-thead > tr > th) {
  background: var(--beige-bone);
  color: var(--app-text);
  font-weight: 600;
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-light);
}

:deep(.frequency-table .p-datatable-tbody > tr) {
  transition: background-color 0.2s;
}

:deep(.frequency-table .p-datatable-tbody > tr:hover) {
  background: rgba(0, 0, 0, 0.02);
}

:deep(.frequency-table .p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-light);
}

:deep(.p-checkbox .p-checkbox-box) {
  border-color: var(--app-accent);
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: var(--app-accent);
  border-color: var(--app-accent);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    flex-direction: column;
  }

  .cooperative-info {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .btn-secondary,
  .btn-success,
  .btn-info {
    justify-content: center;
  }
}
</style>

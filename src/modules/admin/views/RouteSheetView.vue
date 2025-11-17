<template>
  <div class="route-sheet-view">
    <header class="page-header">
      <div class="header-left">
        <h2>Hoja de Ruta</h2>
        <p class="subtitle">Gestiona y visualiza la hoja de ruta de tu cooperativa</p>
      </div>
      <div class="header-right">
        <button 
          v-if="auth.user?.cooperativeId" 
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
            Por favor, contacta al administrador para que te asigne una cooperativa.
          </p>
        </div>
      </div>

      <div v-else>
        <!-- Filtros de fecha -->
        <div class="filters-section">
          <div class="filter-group">
            <label>Fecha Inicio:</label>
            <Calendar 
              v-model="startDate" 
              dateFormat="yy-mm-dd" 
              :showIcon="true"
              :minDate="minDate"
              :maxDate="maxDate"
            />
          </div>
          <div class="filter-group">
            <label>Fecha Fin:</label>
            <Calendar 
              v-model="endDate" 
              dateFormat="yy-mm-dd" 
              :showIcon="true"
              :minDate="minDate"
              :maxDate="maxDate"
            />
          </div>
          <button class="btn-primary" @click="loadMatrix" :disabled="loading">
            <i class="pi pi-search"></i>
            Buscar
          </button>
        </div>

        <!-- Estado de carga -->
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spinner pi-spin loading-icon"></i>
          <span>Cargando hoja de ruta...</span>
        </div>

        <!-- Mensaje de error -->
        <div v-else-if="error" class="error-message">
          <i class="pi pi-exclamation-triangle error-icon"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Matriz de hoja de ruta -->
        <div v-if="matrix && matrix.rows && matrix.rows.length > 0" class="matrix-wrapper">
          <h3 class="matrix-title">
            <i class="pi pi-calendar"></i>
            Hoja de Trabajo - {{ formatMatrixDate(matrix.startDate) }}
          </h3>

          <DataTable
            :value="matrix.rows"
            :scrollable="true"
            scrollHeight="600px"
            :stripedRows="true"
          >
            <Column field="frequencyName" header="FRECUENCIA" frozen style="min-width: 250px">
              <template #body="slotProps">
                <div>
                  <div class="route-path">
                    <template v-for="(segment, idx) in slotProps.data.segments" :key="segment.frequencySegmentId">
                      {{ segment.origin }}
                      <i class="pi pi-arrow-right"></i>
                      <span v-if="idx === slotProps.data.segments.length - 1">{{ segment.destination }}</span>
                    </template>
                  </div>
                </div>
              </template>
            </Column>

            <Column
              v-for="date in matrix.dates"
              :key="date"
              :header="formatDateHeader(date)"
              style="min-width: 80px"
            >
              <template #body="slotProps">
                <Tag
                  v-if="slotProps.data.assignments && slotProps.data.assignments[date]"
                  :value="slotProps.data.assignments[date].busUnitNumber"
                  :severity="getTagSeverity(slotProps.data.assignments[date].status)"
                  rounded
                />
                <span v-else class="text-gray">-</span>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Sin datos -->
        <div v-else class="no-data-message">
          <i class="pi pi-info-circle"></i>
          <p>No hay hoja de ruta generada. Haz clic en "Generar Hoja de Ruta y Viajes" para crear una.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../auth/store/useAuthStore'
import { useFrequencyStore } from '../../cooperatives/store/useFrequencyStore'
import { success, error as notifyError, confirm } from '../../../lib/notifier'
import { generateAutomaticRouteSheet } from '../../../services/routeSheetService'
import { generateTripsFromRouteSheet } from '../../../services/tripService'
import { getRouteSheetMatrix } from '../../../services/routeSheetMatrixService'
import type { RouteSheetMatrixDto } from '../../../types'

// PrimeVue Components
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const auth = useAuthStore()
const frequencyStore = useFrequencyStore()
const isGenerating = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const matrix = ref<RouteSheetMatrixDto | null>(null)
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)


// Calcular fecha mínima (hoy) y máxima (2 meses desde hoy)
const minDate = new Date()
const maxDate = new Date()
maxDate.setMonth(maxDate.getMonth() + 2)

// Función para determinar el color del Tag según el estado
function getTagSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'IN_PROGRESS':
      return 'info'
    case 'SCHEDULED':
      return 'warn'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'secondary'
  }
}

onMounted(async () => {
  if (auth.user?.cooperativeId) {
    await loadMatrix()
  }
})

async function loadMatrix() {
  if (!auth.user?.cooperativeId) return

  loading.value = true
  error.value = null
  try {
    const startDateStr = startDate.value ? formatDateForApi(startDate.value) : undefined
    const endDateStr = endDate.value ? formatDateForApi(endDate.value) : undefined
    
    matrix.value = await getRouteSheetMatrix(
      auth.user.cooperativeId,
      startDateStr,
      endDateStr
    )
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || 'Error al cargar la matriz de hoja de ruta'
    console.error('Error loading matrix:', err)
  } finally {
    loading.value = false
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
    // Generar la hoja de ruta automática
    const routeSheet = await generateAutomaticRouteSheet(auth.user.cooperativeId)
    
    // Generar los viajes
    const trips = await generateTripsFromRouteSheet(auth.user.cooperativeId)

    success(
      'Generación exitosa', 
      `Se ha generado la hoja de ruta y ${trips.length} viaje${trips.length !== 1 ? 's' : ''} correctamente`
    )

    // Recargar la matriz
    await loadMatrix()
  } catch (err: any) {
    notifyError(
      'Error en la generación', 
      err?.response?.data?.message || err?.message || 'No se pudo completar el proceso de generación'
    )
  } finally {
    isGenerating.value = false
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short' 
  })
}

function formatMatrixDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
  
  const dayName = days[date.getDay()] || 'LUNES'
  const day = String(date.getDate()).padStart(2, '0')
  const month = (months[date.getMonth()] || 'ENE').toUpperCase()
  
  return `${dayName} ${day} DE ${month}`
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  const day = String(date.getDate()).padStart(2, '0')
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const month = months[date.getMonth()]
  
  return `${day}-${month}`
}

function formatDateForApi(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getOrigin(routeName: string): string {
  const parts = routeName.split('-')
  return parts[0]?.trim() || ''
}

function getDestination(routeName: string): string {
  const parts = routeName.split('-')
  return parts[1]?.trim() || ''
}

function getCellClasses(row: any, date: string): string[] {
  const classes = ['assignment-cell']

  const assignment = row.assignments?.[date]

  if (!assignment) {
    classes.push('no-assignment-cell')
    return classes
  }

  // Add status-based classes
  switch (assignment.status) {
    case 'SCHEDULED':
      classes.push('scheduled-cell')
      break
    case 'IN_PROGRESS':
      classes.push('in-progress-cell')
      break
    case 'COMPLETED':
      classes.push('completed-cell')
      break
    case 'CANCELLED':
      classes.push('cancelled-cell')
      break
  }

  return classes
}
</script>

<style scoped>
.route-sheet-view {
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
  padding: 2rem;
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

.filters-section {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
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

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--gray-medium);
}

.no-data-message i {
  font-size: 3rem;
}

.matrix-wrapper {
  margin-top: 1.5rem;
}

.matrix-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray {
  color: #6b7280;
}

.route-path {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.route-path .pi-arrow-right {
  font-size: 0.7rem;
  margin: 0 0.25rem;
}

.btn-primary,
.btn-success {
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

.btn-primary {
  background: var(--app-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
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

.btn-primary:disabled,
.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    flex-direction: column;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary,
  .btn-success {
    justify-content: center;
  }
}
</style>

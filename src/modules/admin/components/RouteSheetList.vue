<template>
  <div class="route-sheet-list">
    <div class="list-header">
      <div class="header-info">
        <h3>Hojas de Ruta Generadas</h3>
        <p class="subtitle">Visualiza y gestiona las hojas de ruta creadas por grupos de buses</p>
      </div>
      <button class="btn-primary" @click="refreshList" :disabled="loading">
        <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        Actualizar
      </button>
    </div>

    <div class="filters-bar">
      <div class="filter-group">
        <label>Grupo de Buses</label>
        <Dropdown
          v-model="selectedGroupFilter"
          :options="groupFilterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos los grupos"
          class="filter-dropdown"
        />
      </div>
      <div class="filter-group">
        <label>Estado</label>
        <Dropdown
          v-model="selectedStatusFilter"
          :options="statusFilterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos los estados"
          class="filter-dropdown"
        />
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spinner pi-spin"></i>
      <span>Cargando hojas de ruta...</span>
    </div>

    <div v-else-if="error" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="filteredRouteSheets.length === 0" class="empty-state">
      <i class="pi pi-inbox"></i>
      <p>No hay hojas de ruta generadas</p>
      <p class="hint">Usa el tab "Crear Hoja de Ruta" para generar una nueva</p>
    </div>

    <div v-else class="route-sheets-grid">
      <div
        v-for="sheet in filteredRouteSheets"
        :key="sheet.id"
        class="route-sheet-card"
      >
        <div class="card-header">
          <div class="card-title">
            <h4>{{ sheet.name }}</h4>
            <Tag
              :value="getStatusLabel(sheet.status)"
              :severity="getStatusSeverity(sheet.status)"
            />
          </div>
          <div class="card-meta">
            <span class="meta-item">
              <i class="pi pi-calendar"></i>
              {{ formatDate(sheet.startDate) }} - {{ formatDate(sheet.endDate) }}
            </span>
            <span class="meta-item">
              <i class="pi pi-sitemap"></i>
              {{ sheet.generationMode === 'AUTOMATIC' ? 'Automática' : 'Manual' }}
            </span>
          </div>
        </div>

        <div class="card-stats">
          <div class="stat-item">
            <div class="stat-value">{{ getDurationDays(sheet) }}</div>
            <div class="stat-label">Días</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ sheet.detailCount || '-' }}</div>
            <div class="stat-label">Detalles</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatDateTime(sheet.createdAt) }}</div>
            <div class="stat-label">Creado</div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-ghost btn-sm" @click="viewDetails(sheet)">
            <i class="pi pi-eye"></i>
            Ver Detalles
          </button>
          <button class="btn-ghost btn-sm" @click="viewMatrix(sheet)">
            <i class="pi pi-table"></i>
            Ver Matriz
          </button>
          <button
            v-if="sheet.status === 'ACTIVE'"
            class="btn-ghost btn-sm btn-warning"
            @click="changeStatus(sheet, 'INACTIVE')"
          >
            <i class="pi pi-pause"></i>
            Desactivar
          </button>
          <button
            v-else
            class="btn-ghost btn-sm btn-success"
            @click="changeStatus(sheet, 'ACTIVE')"
          >
            <i class="pi pi-play"></i>
            Activar
          </button>
          <button class="btn-ghost btn-sm btn-danger" @click="deleteSheet(sheet)">
            <i class="pi pi-trash"></i>
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog para ver matriz -->
    <Dialog
      v-model:visible="showMatrixDialog"
      modal
      :style="{ width: '95vw', maxWidth: '1400px', maxHeight: '90vh' }"
      header="Matriz de Rotación"
    >
      <div v-if="selectedSheet" class="matrix-content">
        <div class="matrix-header-info">
          <h3>{{ selectedSheet.name }}</h3>
          <div class="matrix-meta">
            <span><i class="pi pi-calendar"></i> {{ formatDate(selectedSheet.startDate) }} - {{ formatDate(selectedSheet.endDate) }}</span>
            <Tag :value="getDurationDays(selectedSheet) + ' días'" severity="info" />
          </div>
        </div>

        <div v-if="loadingMatrix" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Generando matriz...</span>
        </div>

        <div v-else-if="matrixError" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ matrixError }}</span>
        </div>

        <div v-else-if="matrixData" class="matrix-grid-wrapper">
          <div class="matrix-grid" :style="gridStyles">
            <!-- Header Row -->
            <div class="header-cell sticky-col" style="grid-column: 1;">Hora</div>
            <div class="header-cell sticky-col" style="grid-column: 2;">Ruta</div>
            <div
              v-for="(date, idx) in matrixData.dates"
              :key="date"
              class="header-cell date-header"
              :style="{ gridColumn: idx + 3 }"
            >
              {{ formatMatrixDate(date) }}
            </div>

            <!-- Data Rows -->
            <template v-for="(row, rowIdx) in matrixData.rows" :key="rowIdx">
              <div
                class="data-cell sticky-col time-label"
                :style="{ gridColumn: 1, gridRow: rowIdx + 2 }"
                :class="{ 'rest-row': row.type === 'REST' }"
              >
                {{ row.meta }}
              </div>
              <div
                class="data-cell sticky-col route-label"
                :style="{ gridColumn: 2, gridRow: rowIdx + 2 }"
                :class="{ 'rest-row': row.type === 'REST' }"
              >
                {{ row.label }}
              </div>
              <div
                v-for="(date, dateIdx) in matrixData.dates"
                :key="date"
                class="data-cell assignment-cell"
                :style="{ gridColumn: dateIdx + 3, gridRow: rowIdx + 2 }"
                :class="[getCellClass(row.cells[date]), { 'rest-cell': row.type === 'REST' }]"
              >
                <div class="bus-numbers">
                  <span
                    v-for="bus in row.cells[date]?.buses || []"
                    :key="bus"
                    class="bus-number"
                  >
                    {{ bus }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Dialog para ver detalles -->
    <Dialog
      v-model:visible="showDetailsDialog"
      modal
      :style="{ width: '1000px', maxHeight: '90vh' }"
      header="Detalles de Hoja de Ruta"
    >
      <div v-if="selectedSheet" class="details-content">
        <div class="details-header">
          <h3>{{ selectedSheet.name }}</h3>
          <Tag
            :value="getStatusLabel(selectedSheet.status)"
            :severity="getStatusSeverity(selectedSheet.status)"
          />
        </div>

        <div class="details-info">
          <div class="info-row">
            <span class="info-label">Período:</span>
            <span class="info-value">
              {{ formatDate(selectedSheet.startDate) }} - {{ formatDate(selectedSheet.endDate) }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Modo:</span>
            <span class="info-value">
              {{ selectedSheet.generationMode === 'AUTOMATIC' ? 'Automática' : 'Manual' }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Creado:</span>
            <span class="info-value">{{ formatDateTime(selectedSheet.createdAt) }}</span>
          </div>
        </div>

        <div v-if="loadingDetails" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Cargando detalles...</span>
        </div>

        <div v-else-if="sheetDetails.length === 0" class="empty-state">
          <i class="pi pi-info-circle"></i>
          <p>No hay detalles disponibles</p>
        </div>

        <DataTable v-else :value="sheetDetails" :scrollable="true" scrollHeight="400px">
          <Column field="routeName" header="Ruta" style="min-width: 200px"></Column>
          <Column field="routeOrigin" header="Origen" style="min-width: 150px"></Column>
          <Column field="routeDestination" header="Destino" style="min-width: 150px"></Column>
          <Column field="departureTime" header="Hora" style="min-width: 100px"></Column>
          <Column field="busPlate" header="Bus" style="min-width: 120px"></Column>
          <Column field="driverName" header="Conductor" style="min-width: 200px"></Column>
        </DataTable>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/store/useAuthStore'
import { success, error as notifyError, confirm } from '@/lib/notifier'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import apiClient from '@/services/apiClient'

interface RouteSheetDto {
  id: string
  cooperativeId: string
  name: string
  startDate: string
  endDate: string
  generationMode: 'AUTOMATIC' | 'MANUAL'
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  detailCount?: number
}

interface RouteSheetDetailDto {
  id: string
  routeSheetId: string
  frequencySegmentId: string
  routeName: string
  routeOrigin: string
  routeDestination: string
  departureTime: string
  frequencyName: string
  segmentOrder: number
  busId: string
  busPlate: string
  busBrand: string
  primaryDriverId: string
  driverName: string
  driverLicense: string
  operatingDays: string[]
  createdAt: string
}

const auth = useAuthStore()

const loading = ref(false)
const error = ref<string | null>(null)
const routeSheets = ref<RouteSheetDto[]>([])
const selectedGroupFilter = ref<string | null>(null)
const selectedStatusFilter = ref<string | null>(null)
const showDetailsDialog = ref(false)
const selectedSheet = ref<RouteSheetDto | null>(null)
const loadingDetails = ref(false)
const sheetDetails = ref<RouteSheetDetailDto[]>([])
const showMatrixDialog = ref(false)
const loadingMatrix = ref(false)
const matrixError = ref<string | null>(null)
const matrixData = ref<any>(null)

const groupFilterOptions = ref([
  { label: 'Todos los grupos', value: null },
])

const statusFilterOptions = ref([
  { label: 'Todos los estados', value: null },
  { label: 'Activas', value: 'ACTIVE' },
  { label: 'Inactivas', value: 'INACTIVE' },
  { label: 'Archivadas', value: 'ARCHIVED' },
])

const filteredRouteSheets = computed(() => {
  let filtered = routeSheets.value

  if (selectedStatusFilter.value) {
    filtered = filtered.filter(sheet => sheet.status === selectedStatusFilter.value)
  }

  return filtered
})

onMounted(() => {
  loadRouteSheets()
})

async function loadRouteSheets() {
  if (!auth.user?.cooperativeId) return

  loading.value = true
  error.value = null
  try {
    const response = await apiClient.get(`/hojas-ruta/cooperativa/${auth.user.cooperativeId}`)
    routeSheets.value = response.data
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Error al cargar las hojas de ruta'
    console.error('Error loading route sheets:', err)
  } finally {
    loading.value = false
  }
}

async function refreshList() {
  await loadRouteSheets()
  success('Lista actualizada', 'Las hojas de ruta se han actualizado correctamente')
}

async function viewDetails(sheet: RouteSheetDto) {
  selectedSheet.value = sheet
  showDetailsDialog.value = true
  loadingDetails.value = true

  try {
    const response = await apiClient.get(`/hojas-ruta/${sheet.id}/detalles`)
    sheetDetails.value = response.data
  } catch (err: any) {
    notifyError('Error', 'No se pudieron cargar los detalles')
    console.error('Error loading details:', err)
  } finally {
    loadingDetails.value = false
  }
}

async function viewMatrix(sheet: RouteSheetDto) {
  selectedSheet.value = sheet
  showMatrixDialog.value = true
  loadingMatrix.value = true
  matrixError.value = null

  try {
    // Cargar los detalles de la hoja de ruta
    const response = await apiClient.get(`/hojas-ruta/${sheet.id}/detalles`)
    const details: RouteSheetDetailDto[] = response.data

    // Construir matriz a partir de los detalles
    matrixData.value = buildMatrixFromDetails(details, sheet)
  } catch (err: any) {
    matrixError.value = err?.response?.data?.message || 'No se pudo cargar la matriz'
    console.error('Error loading matrix:', err)
  } finally {
    loadingMatrix.value = false
  }
}

function buildMatrixFromDetails(details: RouteSheetDetailDto[], sheet: RouteSheetDto) {
  // Generar rango de fechas
  const start = new Date(sheet.startDate + 'T00:00:00')
  const end = new Date(sheet.endDate + 'T00:00:00')
  const dates: string[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }

  // Agrupar por PARADA (cada segmento individual)
  const stopMap = new Map<string, {
    label: string
    meta: string
    type: string
    departureTime: string
    cells: Record<string, { type: string, buses: number[] }>
  }>()

  // Recopilar todos los buses únicos
  const allBuses = new Set<number>()

  for (const detail of details) {
    // Clave única por segmento: hora + origen + destino
    const time = detail.departureTime || '00:00'
    const key = `${time}_${detail.routeOrigin}_${detail.routeDestination}`

    if (!stopMap.has(key)) {
      stopMap.set(key, {
        label: `${detail.routeOrigin} - ${detail.routeDestination}`,
        meta: time.substring(0, 5), // HH:MM
        type: 'TRIP',
        departureTime: time,
        cells: {}
      })
    }

    const row = stopMap.get(key)!

    // Inicializar celdas
    for (const date of dates) {
      if (!row.cells[date]) {
        row.cells[date] = { type: 'TRIP', buses: [] }
      }
    }

    // Agregar bus (número de unidad) según operatingDays
    const busNumber = detail.busUnitNumber
    if (busNumber) {
      allBuses.add(busNumber)

      for (const date of dates) {
        const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
        const dayMap: Record<string, string> = {
          'MON': 'MONDAY', 'TUE': 'TUESDAY', 'WED': 'WEDNESDAY',
          'THU': 'THURSDAY', 'FRI': 'FRIDAY', 'SAT': 'SATURDAY', 'SUN': 'SUNDAY'
        }
        const fullDay = dayMap[dayOfWeek]

        if (detail.operatingDays && detail.operatingDays.includes(fullDay)) {
          if (!row.cells[date].buses.includes(busNumber)) {
            row.cells[date].buses.push(busNumber)
          }
        }
      }
    }
  }

  // Ordenar filas por hora de salida
  const sortedRows = Array.from(stopMap.values()).sort((a, b) =>
    a.departureTime.localeCompare(b.departureTime)
  )

  // Agregar fila de PARADA
  const paradaRow = {
    label: 'PARADA',
    meta: 'Descanso',
    type: 'REST',
    departureTime: '99:99',
    cells: {} as Record<string, { type: string, buses: number[] }>
  }

  // Inicializar celdas de parada
  for (const date of dates) {
    paradaRow.cells[date] = { type: 'REST', buses: [] }

    // Buses que están en parada = buses que NO aparecen en ninguna parada ese día
    const busesWorkingToday = new Set<number>()
    for (const row of sortedRows) {
      if (row.cells[date]) {
        row.cells[date].buses.forEach(bus => busesWorkingToday.add(bus))
      }
    }

    // Agregar buses en descanso
    allBuses.forEach(bus => {
      if (!busesWorkingToday.has(bus)) {
        paradaRow.cells[date].buses.push(bus)
      }
    })
  }

  sortedRows.push(paradaRow)

  return {
    dates,
    rows: sortedRows
  }
}

const gridStyles = computed(() => {
  const numCols = (matrixData.value?.dates.length || 0) + 2
  return {
    gridTemplateColumns: `80px 280px repeat(${matrixData.value?.dates.length || 0}, 120px)`
  }
})

function getCellClass(cell: any) {
  if (!cell || !cell.buses || cell.buses.length === 0) return 'cell-empty'
  return 'cell-has-buses'
}

function formatMatrixDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
}

async function changeStatus(sheet: RouteSheetDto, newStatus: string) {
  try {
    await apiClient.patch(`/hojas-ruta/${sheet.id}/estado?estado=${newStatus}`)
    success('Estado actualizado', `Hoja de ruta ${newStatus === 'ACTIVE' ? 'activada' : 'desactivada'}`)
    await loadRouteSheets()
  } catch (err: any) {
    notifyError('Error', err?.response?.data?.message || 'No se pudo cambiar el estado')
  }
}

async function deleteSheet(sheet: RouteSheetDto) {
  const confirmed = await confirm({
    title: 'Eliminar Hoja de Ruta',
    message: `¿Estás seguro de eliminar "${sheet.name}"? Esta acción no se puede deshacer.`,
    acceptLabel: 'Sí, Eliminar',
    rejectLabel: 'Cancelar',
  })

  if (!confirmed) return

  try {
    await apiClient.delete(`/hojas-ruta/${sheet.id}`)
    success('Eliminada', 'Hoja de ruta eliminada correctamente')
    await loadRouteSheets()
  } catch (err: any) {
    notifyError('Error', err?.response?.data?.message || 'No se pudo eliminar la hoja de ruta')
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Activa',
    INACTIVE: 'Inactiva',
    ARCHIVED: 'Archivada',
  }
  return map[status] || status
}

function getStatusSeverity(status: string): 'success' | 'danger' | 'warning' | 'info' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    ARCHIVED: 'danger',
  }
  return map[status] || 'info'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDurationDays(sheet: RouteSheetDto): number {
  const start = new Date(sheet.startDate + 'T00:00:00')
  const end = new Date(sheet.endDate + 'T00:00:00')
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
}
</script>

<style scoped>
.route-sheet-list {
  padding: 1rem 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.header-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--app-text);
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9375rem;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--app-text);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: #64748b;
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
}

.empty-state .hint {
  font-size: 0.875rem;
  color: #94a3b8;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
}

.route-sheets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.route-sheet-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.route-sheet-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: 1.25rem;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.card-title h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--app-text);
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.meta-item i {
  color: #3b82f6;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8125rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-ghost:hover {
  background: #f8fafc;
  color: #1e293b;
}

.btn-sm {
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
}

.btn-warning {
  color: #f59e0b;
}

.btn-success {
  color: #10b981;
}

.btn-danger {
  color: #ef4444;
}

.details-content {
  padding: 1rem 0;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.details-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--app-text);
}

.details-info {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #64748b;
}

.info-value {
  color: var(--app-text);
}

/* Matrix styles */
.matrix-content {
  padding: 1rem 0;
}

.matrix-header-info {
  margin-bottom: 1.5rem;
}

.matrix-header-info h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--app-text);
}

.matrix-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9375rem;
  color: #64748b;
}

.matrix-meta i {
  color: #3b82f6;
}

.matrix-grid-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 65vh;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}

.matrix-grid {
  display: grid;
  gap: 0;
  min-width: min-content;
}

.header-cell {
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  padding: 0.875rem 1rem;
  font-weight: 700;
  font-size: 0.875rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 2px solid #3b82f6;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.header-cell.sticky-col {
  left: 0;
  z-index: 4;
}

.header-cell:nth-child(2) {
  left: 80px;
}

.date-header {
  min-width: 120px;
  text-transform: capitalize;
  font-size: 0.8125rem;
}

.data-cell {
  padding: 0.5rem;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  font-size: 0.875rem;
}

.data-cell.sticky-col {
  position: sticky;
  background: #f8fafc;
  font-weight: 600;
  z-index: 2;
  justify-content: flex-start;
  padding-left: 0.75rem;
}

.data-cell.sticky-col:nth-child(1) {
  left: 0;
}

.data-cell.sticky-col:nth-child(2) {
  left: 80px;
}

.time-label {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.route-label {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
}

.rest-row {
  background: #fef3c7 !important;
  color: #92400e;
  font-weight: 700;
}

.assignment-cell {
  transition: all 0.15s ease;
}

.assignment-cell:hover {
  background: #f1f5f9;
}

.cell-empty {
  background: #fafafa;
}

.rest-cell {
  background: #fef3c7 !important;
}

.bus-numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
  align-items: center;
}

.bus-number {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8125rem;
  min-width: 32px;
  text-align: center;
}

@media (max-width: 768px) {
  .route-sheets-grid {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-direction: column;
  }

  .list-header {
    flex-direction: column;
  }
}
</style>

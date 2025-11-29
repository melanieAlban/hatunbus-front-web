<template>
  <div class="passenger-report">
    <Card class="report-card">
      <template #title>Buscar viajes</template>
      <template #content>
        <div class="filter-grid">
          <label class="input-group">
            <span>Fecha inicio</span>
            <input type="date" v-model="startDate" :disabled="loadingTrips" />
          </label>
          <label class="input-group">
            <span>Fecha fin</span>
            <input type="date" v-model="endDate" :disabled="loadingTrips" />
          </label>
          <label class="input-group">
            <span>Bus o placa</span>
            <InputText v-model="busFilter" placeholder="Ej. PBA-1234" :disabled="loadingTrips" />
          </label>
          <label class="input-group">
            <span>Estado</span>
            <Dropdown
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona un estado"
              :disabled="loadingTrips"
            />
          </label>
          <Button
            label="Buscar"
            icon="pi pi-search"
            :loading="loadingTrips"
            @click="loadTrips"
          />
        </div>
        <small class="hint">
          Puedes filtrar por rango de fechas, bus o estado. Selecciona un viaje para generar el reporte en PDF.
        </small>
      </template>
    </Card>

    <Card class="report-card">
      <template #title>Resultados</template>
      <template #content>
        <div v-if="loadingTrips" class="loading-box">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Cargando viajes...</span>
        </div>
        <div v-else-if="filteredTrips.length === 0" class="empty-box">
          <i class="pi pi-calendar-times empty-icon"></i>
          <span>No se encontraron viajes con los filtros seleccionados.</span>
        </div>
        <div v-else class="table-wrapper trips">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ruta</th>
                <th>Bus</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trip in filteredTrips" :key="trip.id">
                <td>
                  <div class="trip-date">
                    <strong>{{ trip.scheduledDate || formatDate(trip.scheduledDepartureTime) }}</strong>
                    <small>{{ formatTime(trip.scheduledDepartureTime) }}</small>
                  </div>
                </td>
                <td>
                  <div class="trip-route">
                    <span>{{ trip.routeOrigin }} → {{ trip.routeDestination }}</span>
                    <small>{{ trip.routeName }}</small>
                  </div>
                </td>
                <td>
                  <div class="trip-bus">
                    <strong>{{ trip.busPlate }}</strong>
                    <small v-if="trip.busUnitNumber">Unidad {{ trip.busUnitNumber }}</small>
                  </div>
                </td>
                <td>
                  <Tag :value="getStatusText(trip.status)" :severity="getTripStatusSeverity(trip.status)" />
                </td>
                <td>
                  <Button
                    label="Detalles"
                    icon="pi pi-users"
                    size="small"
                    @click="loadReport(trip.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <Message v-if="errorMessage" severity="warn">{{ errorMessage }}</Message>

    <Dialog
      v-model:visible="showModal"
      modal
      :header="report?.routeName || 'Detalles del Viaje'"
      :style="{ width: '95vw', maxWidth: '1400px' }"
      :breakpoints="{ '960px': '98vw' }"
    >
      <div v-if="report" class="modal-content">
        <div class="two-panel-layout">
          <!-- Panel Izquierdo: Información del Viaje -->
          <div class="info-panel">
            <h3 class="panel-title">Información del Viaje</h3>
            
            <div class="info-group">
              <div class="info-item">
                <i class="pi pi-calendar"></i>
                <div class="info-details">
                  <span class="info-label">Fecha y Hora</span>
                  <span class="info-value">{{ formatDate(report.scheduledDepartureTime) }}</span>
                  <span class="info-extra">{{ formatTime(report.scheduledDepartureTime) }}</span>
                </div>
              </div>

              <div class="info-item">
                <i class="pi pi-user"></i>
                <div class="info-details">
                  <span class="info-label">Conductor</span>
                  <span class="info-value">{{ report.driverName || 'Sin asignar' }}</span>
                </div>
              </div>

              <div class="info-item">
                <i class="pi pi-car"></i>
                <div class="info-details">
                  <span class="info-label">Bus</span>
                  <span class="info-value">{{ report.busPlate }}</span>
                  <span class="info-extra" v-if="report.busUnitNumber">Unidad {{ report.busUnitNumber }}</span>
                </div>
              </div>
            </div>

            <div class="stats-group">
              <div class="stat-card">
                <i class="pi pi-users"></i>
                <div class="stat-content">
                  <span class="stat-label">Ocupación</span>
                  <span class="stat-value">{{ report.occupiedSeats }}/{{ report.totalSeats }}</span>
                  <span class="stat-extra">{{ report.occupancyRate }}% ocupado</span>
                </div>
              </div>

              <div class="stat-card">
                <i class="pi pi-dollar"></i>
                <div class="stat-content">
                  <span class="stat-label">Ingresos</span>
                  <span class="stat-value">${{ report.totalRevenue?.toFixed(2) }}</span>
                  <span class="stat-extra">{{ report.passengers.length }} boletos</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel Derecho: Lista de Pasajeros -->
          <div class="passengers-panel">
            <h3 class="panel-title">Pasajeros ({{ report.passengers.length }})</h3>
            
            <div v-if="report.passengers.length === 0" class="empty-box">
              <i class="pi pi-inbox"></i>
              <span>Sin pasajeros registrados</span>
            </div>

            <div v-else class="passengers-list">
              <div v-for="(passenger, idx) in report.passengers" :key="idx" class="passenger-card">
                <div class="passenger-header">
                  <span class="seat-badge">{{ passenger.seatNumber || '-' }}</span>
                  <strong class="passenger-name">{{ passenger.passengerName || 'Sin nombre' }}</strong>
                  <Tag 
                    :value="getPassengerStatusText(passenger.status)" 
                    :severity="getPassengerStatusSeverity(passenger.status)"
                    class="passenger-status"
                  />
                </div>
                <div class="passenger-details">
                  <span><i class="pi pi-id-card"></i> {{ passenger.passengerIdCard || 'Sin documento' }}</span>
                  <span><i class="pi pi-phone"></i> {{ passenger.passengerPhone || passenger.passengerEmail || 'Sin contacto' }}</span>
                  <span><i class="pi pi-map-marker"></i> {{ passenger.originStop || report.routeOrigin }} → {{ passenger.destinationStop || report.routeDestination }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import { fetchTripReport, fetchTripsByDateRange } from '../../../services/reportService'
import type { TripReportDto, TripSummaryDto } from '../../../services/reportService'
import { useCooperativeCustomization } from '../../../composables/useCooperativeCustomization'

const { colors } = useCooperativeCustomization()

const today = new Date()
const sevenDays = new Date()
sevenDays.setDate(today.getDate() + 7)

const startDate = ref(today.toISOString().substring(0, 10))
const endDate = ref(sevenDays.toISOString().substring(0, 10))
const busFilter = ref('')
const statusFilter = ref('COMPLETED') // Por defecto mostrar solo viajes completados

const loading = ref(false)
const loadingTrips = ref(false)
const showModal = ref(false)
const report = ref<TripReportDto | null>(null)
const errorMessage = ref<string | null>(null)
const trips = ref<TripSummaryDto[]>([])

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Programado', value: 'SCHEDULED' },
  { label: 'En curso', value: 'IN_PROGRESS' },
  { label: 'Completado', value: 'COMPLETED' },
  { label: 'Cancelado', value: 'CANCELED' },
]

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Programado',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELED: 'Cancelado',
}

const getStatusText = (status?: string) => statusLabels[status ?? ''] || status || 'Sin estado'

function getTripStatusSeverity(status: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  if (!status) return 'secondary'
  const severityMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    SCHEDULED: 'info',
    IN_PROGRESS: 'warn',
    COMPLETED: 'success',
    CANCELED: 'danger',
  }
  return severityMap[status] || 'secondary'
}

const filteredTrips = computed(() => {
  return trips.value.filter((trip) => {
    const matchesBus = busFilter.value
      ? (trip.busPlate || '').toLowerCase().includes(busFilter.value.toLowerCase())
      : true
    const matchesStatus = statusFilter.value ? trip.status === statusFilter.value : true
    return matchesBus && matchesStatus
  })
})

function formatDate(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatTime(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function getPassengerStatusText(status: string | undefined): string {
  if (!status) return 'Desconocido'
  const statusMap: Record<string, string> = {
    PAID: 'Pagado',
    USED: 'Abordó',
    PENDING_PAYMENT: 'Pendiente de pago',
    CANCELLED: 'Cancelado',
    EXPIRED: 'Expirado',
  }
  return statusMap[status] || status
}

function getPassengerStatusSeverity(status: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  if (!status) return 'secondary'
  const severityMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    PAID: 'info',
    USED: 'success',
    PENDING_PAYMENT: 'warn',
    CANCELLED: 'danger',
    EXPIRED: 'danger',
  }
  return severityMap[status] || 'secondary'
}

async function loadTrips() {
  if (!startDate.value || !endDate.value) return
  loadingTrips.value = true
  try {
    trips.value = await fetchTripsByDateRange(startDate.value, endDate.value)
  } catch (error) {
    trips.value = []
  } finally {
    loadingTrips.value = false
  }
}

async function loadReport(id: string) {
  loading.value = true
  errorMessage.value = null
  try {
    const data = await fetchTripReport(id)
    data.passengers = data.passengers || []
    report.value = data
    showModal.value = true
  } catch (error: any) {
    report.value = null
    errorMessage.value = error?.response?.data?.message || 'No se pudo obtener el reporte para ese viaje.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTrips()
})

function downloadPdf() {
  if (!report.value) return
  const doc = report.value
  const popup = window.open('', '_blank', 'width=900,height=650')
  if (!popup) return

  const passengerRows = doc.passengers.map((p, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${p.seatNumber || ''}</td>
      <td>${p.passengerName || ''}</td>
      <td>${p.passengerIdCard || ''}</td>
      <td>${p.passengerPhone || ''}</td>
      <td>${p.passengerType || ''}</td>
      <td>${p.originStop || doc.routeOrigin || ''}</td>
      <td>${p.destinationStop || doc.routeDestination || ''}</td>
      <td>${p.status || ''}</td>
    </tr>
  `).join('')

  popup.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Reporte de Pasajeros</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color:#111827; }
          .header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb; padding-bottom:16px; margin-bottom:24px; }
          .logo { height:60px; object-fit:contain; }
          .summary { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; margin-bottom:24px; }
          .summary-item { padding:8px 12px; background:#f3f4f6; border-radius:8px; }
          .summary-item span { display:block; font-size:12px; color:#6b7280; text-transform:uppercase; }
          .summary-item strong { display:block; font-size:14px; color:#111827; margin-top:4px; }
          table { width:100%; border-collapse:collapse; margin-top:16px; }
          th, td { border:1px solid #e5e7eb; padding:8px; font-size:12px; }
          th { background:#f3f4f6; text-align:left; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Reporte de Pasajeros</h1>
            <p>${doc.routeOrigin || ''} → ${doc.routeDestination || ''}</p>
            <small>Generado el ${formatDate(doc.generatedAt)} ${formatTime(doc.generatedAt)}</small>
          </div>
          ${doc.cooperativeLogo ? `<img src="${doc.cooperativeLogo}" class="logo" />` : ''}
        </div>

        <div class="summary">
          <div class="summary-item">
            <span>Cooperativa</span>
            <strong>${doc.cooperativeName || 'N/A'}</strong>
          </div>
          <div class="summary-item">
            <span>Conductor</span>
            <strong>${doc.driverName || 'No asignado'}</strong>
          </div>
          <div class="summary-item">
            <span>Bus</span>
            <strong>${doc.busPlate || ''} ${doc.busUnitNumber ? '(Unidad ' + doc.busUnitNumber + ')' : ''}</strong>
          </div>
          <div class="summary-item">
            <span>Salida Programada</span>
            <strong>${formatDate(doc.scheduledDepartureTime)} ${formatTime(doc.scheduledDepartureTime)}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Asiento</th>
              <th>Pasajero</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Tipo</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${passengerRows}
          </tbody>
        </table>
      </body>
    </html>
  `)
  popup.document.close()
  popup.focus()
  popup.print()
}
</script>

<style scoped>
.passenger-report {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.report-card {
  background: white;
}

.detail-card {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: end;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hint {
  color: #6b7280;
  font-size: 0.875rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.title-block h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #6b7280;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.modal-content {
  padding: 0;
  max-height: 75vh;
  overflow: hidden;
}

.two-panel-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 0;
  height: 75vh;
}

.info-panel {
  background: #f8f9fa;
  border-right: 1px solid #e2e8f0;
  padding: 1.5rem;
  overflow-y: auto;
}

.passengers-panel {
  padding: 1.5rem;
  overflow-y: auto;
  background: white;
}

.panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--coop-primary-color, #8B7355);
  opacity: 0.85;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border-left: 3px solid var(--coop-primary-color, #8B7355);
}

.info-item i {
  font-size: 1.25rem;
  color: var(--coop-primary-color, #8B7355);
  opacity: 0.7;
  margin-top: 0.25rem;
}

.info-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #718096;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: #2d3748;
  font-weight: 600;
}

.info-extra {
  font-size: 0.875rem;
  color: #718096;
}

.stats-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-card {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid rgba(var(--coop-primary-color, 139, 115, 85), 0.2);
}

.stat-card i {
  font-size: 1.5rem;
  color: var(--coop-primary-color, #8B7355);
  opacity: 0.6;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #718096;
  font-weight: 600;
}

.stat-value {
  font-size: 1.25rem;
  color: #2d3748;
  font-weight: 700;
}

.stat-extra {
  font-size: 0.8rem;
  color: #718096;
}

.passengers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.passenger-card {
  background: #f8f9fa;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.passenger-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: var(--coop-primary-color, #8B7355);
  border-left-width: 3px;
}

.passenger-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.passenger-name {
  flex: 1;
  font-size: 1rem;
  color: #2d3748;
}

.passenger-status {
  font-size: 0.75rem;
}

.passenger-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
  padding-left: 2.5rem;
}

.passenger-details span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.passenger-details i {
  font-size: 0.75rem;
  color: #718096;
  width: 16px;
}

.seat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 0.5rem;
  background: var(--coop-primary-color, #8B7355);
  color: white;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.875rem;
}

/* Estilos para la tabla de búsqueda de viajes */
.table-wrapper.trips table {
  min-width: 720px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th,
td {
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  text-align: left;
}

th {
  background: #f8f9fa;
  border-bottom: 2px solid rgba(139, 115, 85, 0.3);
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 700;
  color: #2d3748;
  letter-spacing: 0.3px;
}

tbody tr {
  transition: background-color 0.15s ease;
}

tbody tr:hover {
  background-color: #f7fafc;
}

.mt-3 {
  margin-top: 0.75rem;
}

.loading-box,
.empty-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #718096;
}
.empty-icon {
  font-size: 1.5rem;
  color: #9ca3af;
}
.trip-date,
.trip-route,
.trip-bus {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.trip-date small,
.trip-route small,
.trip-bus small {
  color: #6b7280;
  font-size: 0.8rem;
}
</style>

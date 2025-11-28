<template>
  <div class="reports-page">
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
            <select v-model="statusFilter" :disabled="loadingTrips">
              <option value="">Todos</option>
              <option value="SCHEDULED">Programado</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="COMPLETED">Completado</option>
              <option value="CANCELED">Cancelado</option>
            </select>
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
                  <Tag :value="getStatusText(trip.status)" severity="info" />
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

    <Card v-if="report" class="report-card">
      <template #title>
        <div class="header-content">
          <div class="title-block">
            <h2>{{ report.routeName }}</h2>
            <p class="subtitle">
              {{ report.routeOrigin }} &rarr; {{ report.routeDestination }}
            </p>
          </div>
          <div class="actions">
            <Button
              icon="pi pi-download"
              label="Descargar PDF"
              severity="secondary"
              @click="downloadPdf"
            />
          </div>
        </div>
      </template>
      <template #content>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Cooperativa</span>
            <span class="value">{{ report.cooperativeName || 'N/A' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Conductor</span>
            <span class="value">{{ report.driverName || 'No asignado' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Bus</span>
            <span class="value">
              {{ report.busPlate }}
              <span v-if="report.busUnitNumber"> · Unidad {{ report.busUnitNumber }}</span>
            </span>
          </div>
          <div class="summary-item">
            <span class="label">Fecha/Hora</span>
            <span class="value">{{ formatDate(report.scheduledDepartureTime) }} · {{ formatTime(report.scheduledDepartureTime) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Ocupación</span>
            <span class="value">
              {{ report.occupiedSeats }}/{{ report.totalSeats }} ({{ report.occupancyRate }}%)
            </span>
          </div>
          <div class="summary-item">
            <span class="label">Ingresos</span>
            <span class="value">\${{ report.totalRevenue?.toFixed(2) }}</span>
          </div>
        </div>

        <div class="passenger-list">
          <h3>Pasajeros ({{ report.passengers.length }})</h3>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Asiento</th>
                  <th>Pasajero</th>
                  <th>Documento</th>
                  <th>Contacto</th>
                  <th>Tipo</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(passenger, idx) in report.passengers" :key="idx">
                  <td>{{ passenger.seatNumber || 'N/A' }}</td>
                  <td>{{ passenger.passengerName }}</td>
                  <td>{{ passenger.passengerIdCard }}</td>
                  <td>
                    <div class="contact-data">
                      <span v-if="passenger.passengerPhone">{{ passenger.passengerPhone }}</span>
                      <span v-if="passenger.passengerEmail">{{ passenger.passengerEmail }}</span>
                    </div>
                  </td>
                  <td>{{ passenger.passengerType }}</td>
                  <td>{{ passenger.originStop || report.routeOrigin }}</td>
                  <td>{{ passenger.destinationStop || report.routeDestination }}</td>
                  <td>
                    <Tag :value="passenger.status" severity="info" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { fetchTripReport, fetchTripsByDateRange } from '../../../services/reportService'
import type { TripReportDto, TripSummaryDto } from '../../../services/reportService'

const today = new Date()
const sevenDays = new Date()
sevenDays.setDate(today.getDate() + 7)

const startDate = ref(today.toISOString().substring(0, 10))
const endDate = ref(sevenDays.toISOString().substring(0, 10))
const busFilter = ref('')
const statusFilter = ref('')

const loading = ref(false)
const loadingTrips = ref(false)
const report = ref<TripReportDto | null>(null)
const errorMessage = ref<string | null>(null)
const trips = ref<TripSummaryDto[]>([])

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Programado',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELED: 'Cancelado',
}

const getStatusText = (status?: string) => statusLabels[status ?? ''] || status || 'Sin estado'

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
  } catch (error: any) {
    report.value = null
    errorMessage.value = error?.response?.data?.message || 'No se pudo obtener el reporte para ese viaje.'
  } finally {
    loading.value = false
  }
}

loadTrips()

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
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.report-card {
  background: white;
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
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.subtitle {
  color: #6b7280;
  margin: 0;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.summary-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
}
.label {
  text-transform: uppercase;
  font-size: 0.75rem;
  color: #6b7280;
}
.value {
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
}
.passenger-list h3 {
  margin-bottom: 0.75rem;
}
.table-wrapper {
  overflow-x: auto;
}
.table-wrapper.trips table {
  min-width: 720px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #e5e7eb;
  padding: 0.6rem;
  font-size: 0.9rem;
  text-align: left;
}
th {
  background: #f3f4f6;
  text-transform: uppercase;
  font-size: 0.75rem;
}
.contact-data {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  padding: 1rem;
  color: #6b7280;
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

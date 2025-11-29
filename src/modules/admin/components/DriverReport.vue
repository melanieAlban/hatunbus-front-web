<template>
  <div class="driver-report">
    <!-- Filtros -->
    <Card class="filter-card">
      <template #content>
        <div class="filter-grid">
          <div class="filter-item">
            <label for="startDate">Fecha Inicio</label>
            <Calendar 
              id="startDate" 
              v-model="startDate" 
              dateFormat="yy-mm-dd"
              placeholder="Seleccionar fecha"
              showIcon
            />
          </div>

          <div class="filter-item">
            <label for="endDate">Fecha Fin</label>
            <Calendar 
              id="endDate" 
              v-model="endDate" 
              dateFormat="yy-mm-dd"
              placeholder="Seleccionar fecha"
              showIcon
            />
          </div>

          <div class="filter-item">
            <label for="driver">Conductor (Opcional)</label>
            <Dropdown
              id="driver"
              v-model="selectedDriverId"
              :options="availableDrivers"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos los conductores"
              showClear
              filter
            />
          </div>

          <div class="filter-actions">
            <Button 
              label="Generar Reporte" 
              icon="pi pi-search" 
              @click="loadReport"
              :loading="loading"
            />
            <Button 
              label="Descargar PDF" 
              icon="pi pi-file-pdf" 
              severity="danger"
              @click="downloadPdf"
              :disabled="!reportData || reportData.drivers.length === 0"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Resumen general -->
    <Card v-if="reportData" class="summary-card">
      <template #title>Resumen General</template>
      <template #content>
        <div class="summary-grid">
          <div class="summary-item">
            <i class="pi pi-users"></i>
            <div class="summary-content">
              <span class="summary-label">Total Conductores</span>
              <span class="summary-value">{{ reportData.totalDrivers }}</span>
            </div>
          </div>
          <div class="summary-item">
            <i class="pi pi-car"></i>
            <div class="summary-content">
              <span class="summary-label">Total Viajes</span>
              <span class="summary-value">{{ reportData.totalTrips }}</span>
            </div>
          </div>
          <div class="summary-item">
            <i class="pi pi-user"></i>
            <div class="summary-content">
              <span class="summary-label">Total Pasajeros</span>
              <span class="summary-value">{{ reportData.totalPassengers }}</span>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Tabla de conductores -->
    <Card v-if="reportData && reportData.drivers.length > 0" class="table-card">
      <template #title>Reporte por Conductor</template>
      <template #content>
        <DataTable 
          :value="reportData.drivers" 
          :paginator="true" 
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          responsiveLayout="scroll"
          stripedRows
          sortField="totalTrips"
          :sortOrder="-1"
        >
          <Column field="driverName" header="Conductor" sortable>
            <template #body="slotProps">
              <div class="driver-info">
                <strong>{{ slotProps.data.driverName }}</strong>
                <small>{{ slotProps.data.cedula }}</small>
              </div>
            </template>
          </Column>
          <Column field="cooperativeName" header="Cooperativa" sortable />
          <Column field="totalTrips" header="Viajes" sortable />
          <Column field="totalPassengers" header="Pasajeros" sortable />
          <Column field="averagePassengersPerTrip" header="Promedio Pasajeros" sortable>
            <template #body="slotProps">
              {{ slotProps.data.averagePassengersPerTrip.toFixed(1) }}
            </template>
          </Column>
          <Column field="totalIncome" header="Ingresos" sortable>
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.totalIncome) }}
            </template>
          </Column>
          <Column field="totalExpenses" header="Gastos" sortable>
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.totalExpenses) }}
            </template>
          </Column>
          <Column field="netBalance" header="Balance Neto" sortable>
            <template #body="slotProps">
              <span :class="slotProps.data.netBalance >= 0 ? 'positive-balance' : 'negative-balance'">
                {{ formatCurrency(slotProps.data.netBalance) }}
              </span>
            </template>
          </Column>
          <Column header="Rutas Frecuentes">
            <template #body="slotProps">
              <div class="routes-list">
                <div v-for="route in slotProps.data.mostFrequentRoutes" :key="route.routeName" class="route-item">
                  <Tag severity="info">{{ route.routeName }} ({{ route.tripCount }})</Tag>
                </div>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Mensaje si no hay datos -->
    <Card v-if="reportData && reportData.drivers.length === 0" class="empty-card">
      <template #content>
        <div class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>No se encontraron datos para el período seleccionado</p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchDriversReport, type DriversReportResponseDto } from '../../../services/reportService'
import Card from 'primevue/card'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import apiClient from '../../../services/apiClient'

const toast = useToast()

// Filtros
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)
const selectedDriverId = ref<string | null>(null)
const availableDrivers = ref<Array<{ label: string; value: string }>>([])

// Datos
const reportData = ref<DriversReportResponseDto | null>(null)
const loading = ref(false)

onMounted(async () => {
  await loadDriversList()
  await loadReport()
})

async function loadDriversList() {
  try {
    const { data } = await apiClient.get('/conductores')
    console.log('Conductores cargados:', data)
    availableDrivers.value = data.map((driver: any) => ({
      label: driver.userName || 'Sin nombre',
      value: driver.id
    }))
  } catch (error) {
    console.error('Error al cargar conductores:', error)
  }
}

async function loadReport() {
  loading.value = true
  try {
    const start = startDate.value ? formatDate(startDate.value) : undefined
    const end = endDate.value ? formatDate(endDate.value) : undefined
    
    console.log('Cargando reporte con fechas:', { start, end, driverId: selectedDriverId.value })
    
    reportData.value = await fetchDriversReport(start, end, selectedDriverId.value || undefined)
    
    console.log('Reporte cargado:', reportData.value)
    
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Reporte generado correctamente',
      life: 3000
    })
  } catch (error: any) {
    console.error('Error al cargar reporte:', error)
    console.error('Detalles del error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    })
    
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error
      || error.message 
      || 'Error al generar el reporte'
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result || !result[1] || !result[2] || !result[3]) {
    return [0, 123, 255]
  }
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}

async function downloadPdf() {
  if (!reportData.value || reportData.value.drivers.length === 0) return

  const doc = new jsPDF()
  const primaryColor = '#007bff'
  const primaryRgb = hexToRgb(primaryColor)
  const cooperativeName = reportData.value.drivers[0]?.cooperativeName || 'HatunBus'

  let yPosition = 20

  // Header con línea
  doc.setDrawColor(...primaryRgb)
  doc.setLineWidth(0.5)
  doc.line(14, yPosition, 196, yPosition)
  yPosition += 8

  // Logo (opcional)
  try {
    const logoSrc = '/logo.png'
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        const aspectRatio = img.width / img.height
        const maxSize = 30
        let width = maxSize
        let height = maxSize
        
        if (aspectRatio > 1) {
          height = maxSize / aspectRatio
        } else {
          width = maxSize * aspectRatio
        }
        
        doc.addImage(img, 'PNG', 170, yPosition - 3, width, height)
        resolve(true)
      }
      img.onerror = reject
      img.src = logoSrc
    })
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error)
  }

  // Título
  doc.setFontSize(16)
  doc.setTextColor(...primaryRgb)
  doc.text(normalizeText('REPORTE DE CONDUCTORES'), 14, yPosition)
  yPosition += 10

  // Período
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  let periodo = 'Todos los registros'
  if (startDate.value && endDate.value) {
    periodo = `Periodo: ${formatDate(startDate.value)} al ${formatDate(endDate.value)}`
  }
  doc.text(normalizeText(periodo), 14, yPosition)
  yPosition += 10

  // Resumen general
  doc.setFillColor(240, 240, 240)
  doc.rect(14, yPosition, 182, 25, 'F')
  
  doc.setFontSize(12)
  doc.setTextColor(...primaryRgb)
  doc.text('Resumen General', 18, yPosition + 8)
  
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(`Total Conductores: ${reportData.value.totalDrivers}`, 18, yPosition + 15)
  doc.text(`Total Viajes: ${reportData.value.totalTrips}`, 85, yPosition + 15)
  doc.text(`Total Pasajeros: ${reportData.value.totalPassengers}`, 152, yPosition + 15)
  
  yPosition += 32

  // Título de la tabla
  doc.setFontSize(12)
  doc.setTextColor(...primaryRgb)
  doc.text('Detalle por Conductor', 14, yPosition)
  yPosition += 5

  // Preparar datos de la tabla
  const tableData = reportData.value.drivers.map(driver => [
    normalizeText(driver.driverName),
    driver.totalTrips.toString(),
    driver.totalPassengers.toString(),
    driver.averagePassengersPerTrip.toFixed(1),
    formatCurrency(driver.totalIncome),
    formatCurrency(driver.totalExpenses),
    formatCurrency(driver.netBalance)
  ])

  // Tabla con autoTable
  autoTable(doc, {
    startY: yPosition,
    head: [[
      normalizeText('Conductor'),
      'Viajes',
      'Pasajeros',
      'Promedio',
      'Ingresos',
      'Gastos',
      'Balance'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [60, 60, 60]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 14, right: 14 }
  })

  // Footer
  yPosition = 280
  doc.setDrawColor(...primaryRgb)
  doc.setLineWidth(0.3)
  doc.line(14, yPosition, 196, yPosition)
  
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(normalizeText(`© ${new Date().getFullYear()} ${cooperativeName}`), 105, yPosition + 5, { align: 'center' })

  // Guardar PDF
  let fileName = 'Reporte_Conductores.pdf'
  if (startDate.value && endDate.value) {
    fileName = `Reporte_Conductores_${formatDate(startDate.value)}_${formatDate(endDate.value)}.pdf`
  }
  doc.save(fileName)
}
</script>

<style scoped>
.driver-report {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-card {
  background: var(--surface-card);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.summary-card {
  background: var(--surface-card);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.summary-item i {
  font-size: 2rem;
  color: var(--primary-color);
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.table-card {
  background: var(--surface-card);
}

.driver-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.driver-info strong {
  color: var(--text-color);
}

.driver-info small {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.positive-balance {
  color: #22c55e;
  font-weight: 600;
}

.negative-balance {
  color: #ef4444;
  font-weight: 600;
}

.routes-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.route-item {
  font-size: 0.85rem;
}

.empty-card {
  background: var(--surface-card);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1.1rem;
}
</style>

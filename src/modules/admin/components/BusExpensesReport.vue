<template>
  <div class="bus-expenses-report">
    <Card class="report-card">
      <template #title>Filtrar viajes completados</template>
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
            <span>Conductor</span>
            <InputText v-model="driverFilter" placeholder="Nombre del conductor" :disabled="loadingTrips" />
          </label>
          <label class="input-group">
            <span>Bus/Placa</span>
            <InputText v-model="busFilter" placeholder="Ej. ABC-1234" :disabled="loadingTrips" />
          </label>
          <Button
            label="Buscar"
            icon="pi pi-search"
            :loading="loadingTrips"
            @click="loadTrips"
          />
        </div>
        <small class="hint">
          Mostrando solo viajes con gastos registrados. Usa los filtros para refinar la búsqueda.
        </small>
      </template>
    </Card>

    <Card class="report-card">
      <template #title>Viajes Completados ({{ filteredTrips.length }})</template>
      <template #content>
        <div v-if="loadingTrips" class="loading-box">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Cargando viajes...</span>
        </div>
        <div v-else-if="filteredTrips.length === 0" class="empty-box">
          <i class="pi pi-inbox empty-icon"></i>
          <span>No se encontraron viajes con los filtros seleccionados.</span>
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ruta</th>
                <th>Bus</th>
                <th>Conductor</th>
                <th>Total Gastos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trip in filteredTrips" :key="trip.id">
                <td>
                  <div class="trip-date">
                    <strong>{{ formatDate(trip.scheduledDate) }}</strong>
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
                <td>{{ trip.driverName || 'No asignado' }}</td>
                <td>
                  <span v-if="trip.totalExpenses !== undefined" class="expense-amount">
                    ${{ trip.totalExpenses.toFixed(2) }}
                  </span>
                  <span v-else class="text-muted">Calculando...</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <Button
                      label="Ver"
                      icon="pi pi-eye"
                      size="small"
                      severity="secondary"
                      @click="viewExpenseDetails(trip)"
                    />
                    <Button
                      label="PDF"
                      icon="pi pi-file-pdf"
                      size="small"
                      severity="danger"
                      @click="downloadExpensePdf(trip)"
                      :disabled="!trip.totalExpenses || trip.totalExpenses === 0"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <!-- Modal de detalles -->
    <Dialog v-model:visible="showDetailsDialog" :header="dialogTitle" :style="{ width: '90vw', maxWidth: '1200px' }" modal>
      <div v-if="loadingExpenses" class="loading-box">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando gastos...</span>
      </div>
      <div v-else-if="selectedTripExpenses.length === 0" class="empty-box">
        <i class="pi pi-inbox empty-icon"></i>
        <span>Este viaje no tiene gastos registrados.</span>
      </div>
      <div v-else>
        <!-- Resumen del viaje -->
        <div class="trip-summary">
          <h3>Resumen del Viaje</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Fecha</span>
              <span class="value">{{ formatDate(selectedTrip?.scheduledDate) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Ruta</span>
              <span class="value">{{ selectedTrip?.routeName }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Bus</span>
              <span class="value">{{ selectedTrip?.busPlate }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Conductor</span>
              <span class="value">{{ selectedTrip?.driverName }}</span>
            </div>
          </div>
        </div>

        <!-- Resumen por categoría -->
        <div class="category-summary">
          <h3>Total por Categoría</h3>
          <div class="category-cards">
            <div v-for="cat in expensesByCategory" :key="cat.category" class="category-card">
              <div class="category-icon" :style="{ backgroundColor: getCategoryColor(cat.category) }">
                <i :class="getCategoryIcon(cat.category)"></i>
              </div>
              <div class="category-info">
                <span class="category-name">{{ getCategoryLabel(cat.category) }}</span>
                <span class="category-amount">${{ cat.total.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista detallada de gastos -->
        <div class="expenses-detail">
          <h3>Detalle de Gastos ({{ selectedTripExpenses.length }})</h3>
          <div class="expenses-list">
            <div v-for="expense in selectedTripExpenses" :key="expense.id" class="expense-card">
              <div class="expense-header">
                <div class="expense-category" :style="{ backgroundColor: getCategoryColor(expense.category) }">
                  <i :class="getCategoryIcon(expense.category)"></i>
                  <span>{{ getCategoryLabel(expense.category) }}</span>
                </div>
                <div class="expense-amount-large">${{ expense.amount.toFixed(2) }}</div>
              </div>
              <div class="expense-body">
                <p class="expense-description">{{ expense.description }}</p>
                <div class="expense-meta">
                  <small>{{ formatDateTime(expense.createdAt) }}</small>
                  <small v-if="expense.receiptImageBase64" class="has-receipt">
                    <i class="pi pi-image"></i> Recibo adjunto
                  </small>
                </div>
              </div>
              <div v-if="expense.receiptImageBase64" class="expense-receipt">
                <img :src="'data:image/jpeg;base64,' + expense.receiptImageBase64" alt="Recibo" @click="viewImage(expense.receiptImageBase64)" />
              </div>
            </div>
          </div>
        </div>

        <div class="total-summary">
          <strong>Total de Gastos:</strong>
          <span class="total-amount">${{ selectedTrip?.totalExpenses?.toFixed(2) || '0.00' }}</span>
        </div>
      </div>
    </Dialog>

    <!-- Modal para ver imagen completa -->
    <Dialog v-model:visible="showImageDialog" header="Recibo" :style="{ width: '80vw', maxWidth: '800px' }" modal>
      <img v-if="currentImage" :src="'data:image/jpeg;base64,' + currentImage" alt="Recibo" style="width: 100%; height: auto;" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { fetchTripsByDateRange, fetchCompletedTrips } from '../../../services/reportService'
import { fetchExpensesByTrip, fetchTotalExpensesByTrip } from '../../../services/expenseService'
import type { TripSummaryDto } from '../../../services/reportService'
import type { TripExpenseDto } from '../../../services/expenseService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface TripWithExpenses extends TripSummaryDto {
  totalExpenses?: number
}

const startDate = ref('')
const endDate = ref('')
const driverFilter = ref('')
const busFilter = ref('')

const loadingTrips = ref(false)
const loadingExpenses = ref(false)
const trips = ref<TripWithExpenses[]>([])
const selectedTrip = ref<TripWithExpenses | null>(null)
const selectedTripExpenses = ref<TripExpenseDto[]>([])
const showDetailsDialog = ref(false)
const showImageDialog = ref(false)
const currentImage = ref<string | null>(null)

const categoryLabels: Record<string, string> = {
  FUEL: 'Gasolina',
  TOLL: 'Peajes',
  MEALS: 'Viáticos',
  MAINTENANCE: 'Mantenimiento',
  PARKING: 'Estacionamiento',
  OTHER: 'Otros',
}

const categoryColors: Record<string, string> = {
  FUEL: '#E97451',
  TOLL: '#16A34A',
  MEALS: '#2563EB',
  MAINTENANCE: '#7C3AED',
  PARKING: '#EC4899',
  OTHER: '#6B7280',
}

const categoryIcons: Record<string, string> = {
  FUEL: 'pi pi-bolt',
  TOLL: 'pi pi-car',
  MEALS: 'pi pi-shopping-bag',
  MAINTENANCE: 'pi pi-wrench',
  PARKING: 'pi pi-map-marker',
  OTHER: 'pi pi-ellipsis-h',
}

const getCategoryLabel = (category: string) => categoryLabels[category] || category
const getCategoryColor = (category: string) => categoryColors[category] || '#6B7280'
const getCategoryIcon = (category: string) => categoryIcons[category] || 'pi pi-circle'

const dialogTitle = computed(() => {
  if (!selectedTrip.value) return 'Detalles de Gastos'
  return `Gastos - ${selectedTrip.value.routeOrigin} → ${selectedTrip.value.routeDestination}`
})

const filteredTrips = computed(() => {
  return trips.value.filter((trip) => {
    // Solo mostrar viajes con gastos
    const hasExpenses = (trip.totalExpenses ?? 0) > 0
    
    const matchesDriver = driverFilter.value
      ? (trip.driverName || '').toLowerCase().includes(driverFilter.value.toLowerCase())
      : true
    const matchesBus = busFilter.value
      ? (trip.busPlate || '').toLowerCase().includes(busFilter.value.toLowerCase())
      : true
    
    return hasExpenses && matchesDriver && matchesBus
  })
})

const expensesByCategory = computed(() => {
  const categories: Record<string, number> = {}
  selectedTripExpenses.value.forEach(expense => {
    if (!categories[expense.category]) {
      categories[expense.category] = 0
    }
    categories[expense.category]! += expense.amount
  })
  return Object.entries(categories).map(([category, total]) => ({ category, total }))
})

function formatDate(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(value?: string) {
  if (!value) return 'N/A'
  return `${formatDate(value)} ${formatTime(value)}`
}

async function loadTrips() {
  loadingTrips.value = true
  try {
    let data
    if (startDate.value && endDate.value) {
      // Si hay fechas, filtrar por rango
      console.log('Buscando viajes con fechas:', startDate.value, endDate.value)
      data = await fetchTripsByDateRange(startDate.value, endDate.value)
      // Filtrar solo completados
      data = data.filter(trip => trip.status === 'COMPLETED')
    } else {
      // Si no hay fechas, traer TODOS los viajes completados directamente
      console.log('Cargando TODOS los viajes COMPLETED...')
      data = await fetchCompletedTrips()
    }
    
    console.log('Viajes COMPLETED obtenidos:', data.length, data)
    trips.value = data
    
    // Cargar totales de gastos para cada viaje
    await Promise.all(
      trips.value.map(async (trip) => {
        try {
          trip.totalExpenses = await fetchTotalExpensesByTrip(trip.id)
        } catch {
          trip.totalExpenses = 0
        }
      })
    )
    
    console.log('Viajes con gastos cargados:', trips.value)
  } catch (error) {
    console.error('Error cargando viajes:', error)
    trips.value = []
  } finally {
    loadingTrips.value = false
  }
}

async function viewExpenseDetails(trip: TripWithExpenses) {
  selectedTrip.value = trip
  loadingExpenses.value = true
  showDetailsDialog.value = true
  
  try {
    selectedTripExpenses.value = await fetchExpensesByTrip(trip.id)
  } catch (error) {
    selectedTripExpenses.value = []
  } finally {
    loadingExpenses.value = false
  }
}

function viewImage(imageBase64: string) {
  currentImage.value = imageBase64
  showImageDialog.value = true
}

function getLogoSrc(logo?: string | number[]): string | null {
  if (!logo) return null
  
  // Si es un string, asumimos que ya está en base64 o es una URL
  if (typeof logo === 'string') {
    if (logo.startsWith('data:')) return logo
    if (logo.startsWith('http')) return logo
    return `data:image/png;base64,${logo}`
  }
  
  // Si es un array de números (byte[]), convertir a base64
  if (Array.isArray(logo)) {
    const uint8Array = new Uint8Array(logo)
    let binary = ''
    uint8Array.forEach(byte => binary += String.fromCharCode(byte))
    const base64 = btoa(binary)
    return `data:image/png;base64,${base64}`
  }
  
  return null
}

async function downloadExpensePdf(trip: TripWithExpenses) {
  const logoSrc = getLogoSrc(trip.cooperativeLogo as any)
  const primaryColor = trip.cooperativePrimaryColor || '#2563eb'
  const secondaryColor = trip.cooperativeSecondaryColor || '#1d4ed8'

  // Convertir hex a RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1]!, 16),
      parseInt(result[2]!, 16),
      parseInt(result[3]!, 16)
    ] : [37, 99, 235]
  }

  const primaryRgb = hexToRgb(primaryColor)
  const secondaryRgb = hexToRgb(secondaryColor)

  // Cargar gastos
  const expenses = await fetchExpensesByTrip(trip.id)
  
  const expensesByCategory: Record<string, { items: TripExpenseDto[], total: number }> = {}
  let total = 0

  expenses.forEach(expense => {
    if (!expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] = { items: [], total: 0 }
    }
    expensesByCategory[expense.category]!.items.push(expense)
    expensesByCategory[expense.category]!.total += expense.amount
    total += expense.amount
  })

  // Crear PDF con diseño profesional
  const doc = new jsPDF()
  let yPosition = 15

  // ===== ENCABEZADO MINIMALISTA =====
  // Línea superior con color sutil de la cooperativa
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
  doc.setLineWidth(2)
  doc.line(15, yPosition, 195, yPosition)
  
  yPosition += 8

  // Logo (si existe) - ajustado para que quepa en el PDF
  if (logoSrc) {
    try {
      const img = new Image()
      img.src = logoSrc
      
      // Calcular tamaño manteniendo proporciones con límite de 30px
      const maxSize = 30
      let logoWidth = maxSize
      let logoHeight = maxSize
      
      if (img.width && img.height) {
        const aspectRatio = img.width / img.height
        if (aspectRatio > 1) {
          // Horizontal: ajustar altura
          logoHeight = maxSize / aspectRatio
        } else {
          // Vertical: ajustar ancho
          logoWidth = maxSize * aspectRatio
        }
      }
      
      doc.addImage(logoSrc, 'PNG', 170, yPosition - 3, logoWidth, logoHeight)
    } catch (e) {
      console.error('Error al cargar logo:', e)
    }
  }
  
  // Nombre de la cooperativa
  const cooperativeName = (trip.cooperativeName || 'COOPERATIVA DE TRANSPORTE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(cooperativeName, 15, yPosition + 2)
  
  // Título del documento
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('REPORTE DE GASTOS OPERACIONALES', 15, yPosition + 10)
  
  // Ruta
  const routeText = `${trip.routeOrigin || ''} - ${trip.routeDestination || ''}`
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(routeText, 15, yPosition + 17)

  yPosition += 28

  // ===== INFORMACIÓN DEL VIAJE EN TABLA =====
  const driverName = (trip.driverName || 'No asignado').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const routeName = (trip.routeName || 'N/A').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const finishedDate = trip.actualArrivalTime ? `${formatDate(trip.actualArrivalTime)} ${formatTime(trip.actualArrivalTime)}` : 'En curso'
  
  autoTable(doc, {
    startY: yPosition,
    head: [[
      { content: 'INFORMACION DEL VIAJE', colSpan: 4, styles: { fillColor: [248, 250, 252], textColor: primaryRgb, fontSize: 10, fontStyle: 'bold', halign: 'left' } }
    ]],
    body: [
      [
        { content: 'Fecha', styles: { fontStyle: 'bold', textColor: [100, 116, 139], fontSize: 8 } },
        { content: formatDate(trip.scheduledDate), styles: { fontSize: 9 } },
        { content: 'Hora Salida', styles: { fontStyle: 'bold', textColor: [100, 116, 139], fontSize: 8 } },
        { content: formatTime(trip.scheduledDepartureTime), styles: { fontSize: 9 } }
      ],
      [
        { content: 'Conductor', styles: { fontStyle: 'bold', textColor: [100, 116, 139], fontSize: 8 } },
        { content: driverName, styles: { fontSize: 9 } },
        { content: 'Bus', styles: { fontStyle: 'bold', textColor: [100, 116, 139], fontSize: 8 } },
        { content: trip.busPlate || 'N/A', styles: { fontSize: 9 } }
      ],
      [
        { content: 'Ruta', styles: { fontStyle: 'bold', textColor: [100, 116, 139], fontSize: 8 } },
        { content: routeName, styles: { fontSize: 9 } },
        { content: 'Finalizado', styles: { fontStyle: 'bold', textColor: [100, 116, 139], fontSize: 8 } },
        { content: finishedDate, styles: { fontSize: 9 } }
      ]
    ],
    theme: 'plain',
    styles: {
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 65 },
      2: { cellWidth: 30 },
      3: { cellWidth: 65 }
    }
  })

  yPosition = (doc as any).lastAutoTable.finalY + 12

  // ===== TÍTULO DE GASTOS =====
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('DETALLE DE GASTOS', 15, yPosition)
  
  // Línea decorativa con color cooperativa
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
  doc.setLineWidth(0.5)
  doc.line(15, yPosition + 2, 65, yPosition + 2)

  yPosition += 8

  // Preparar datos para la tabla
  const tableData: any[] = []
  
  Object.entries(expensesByCategory).forEach(([category, data]) => {
    // Fila de categoría
    tableData.push([
      { content: getCategoryLabel(category), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: '', styles: { fillColor: [241, 245, 249] } },
      { content: `$${data.total.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' } }
    ])
    
    // Filas de items
    data.items.forEach(item => {
      const expenseDate = item.createdAt ? `${formatDate(item.createdAt)} ${formatTime(item.createdAt)}` : '-'
      tableData.push([
        { content: '    ' + (item.description || 'Sin descripción'), styles: { textColor: [71, 85, 105] } },
        { content: expenseDate, styles: { halign: 'center', fontSize: 8, textColor: [100, 116, 139] } },
        { content: `$${item.amount.toFixed(2)}`, styles: { halign: 'right' } }
      ])
    })
  })

  // Tabla con diseño profesional y minimalista
  autoTable(doc, {
    startY: yPosition,
    head: [[
      { content: 'Categoria / Descripcion', styles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 9 } },
      { content: 'Fecha / Hora', styles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 9, halign: 'center' } },
      { content: 'Monto (USD)', styles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 9, halign: 'right' } }
    ]],
    body: tableData,
    foot: [[
      { content: 'TOTAL GENERAL', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: primaryRgb, fontSize: 10 } },
      { content: `$${total.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: primaryRgb, fontSize: 11, halign: 'right' } }
    ]],
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [71, 85, 105],
      lineWidth: 0.1,
      lineColor: [203, 213, 225]
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 }
    }
  })

  // ===== LÍNEAS DE FIRMA =====
  const finalY = (doc as any).lastAutoTable.finalY + 20
  
  // Verificar si hay espacio suficiente, si no, agregar nueva página
  if (finalY > 240) {
    doc.addPage()
    yPosition = 20
  } else {
    yPosition = finalY
  }

  // Título de firmas
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('FIRMAS DE RESPONSABILIDAD', 15, yPosition)
  
  yPosition += 15

  // Líneas de firma
  const signatureY = yPosition + 20
  
  // Firma del conductor
  doc.setLineWidth(0.3)
  doc.setDrawColor(100, 116, 139)
  doc.line(20, signatureY, 90, signatureY)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('CONDUCTOR', 55, signatureY + 5, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  const normalizedDriver = (trip.driverName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  doc.text(normalizedDriver, 55, signatureY + 10, { align: 'center' })
  
  // Firma del administrador/supervisor
  doc.setLineWidth(0.3)
  doc.setDrawColor(100, 116, 139)
  doc.line(120, signatureY, 190, signatureY)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text('ADMINISTRADOR / SUPERVISOR', 155, signatureY + 5, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Nombre y firma', 155, signatureY + 10, { align: 'center' })

  // ===== FOOTER =====
  const footerY = signatureY + 25
  
  // Línea final con color de cooperativa
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
  doc.setLineWidth(0.5)
  doc.line(15, footerY, 195, footerY)
  
  const footerCoopName = (trip.cooperativeName || 'Cooperativa de Transporte').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`© ${new Date().getFullYear()} ${footerCoopName}`, 105, footerY + 4, { align: 'center' })

  // Descargar PDF
  doc.save(`Gastos_${trip.busPlate}_${formatDate(trip.scheduledDate).replace(/\//g, '-')}.pdf`)
}

onMounted(() => {
  loadTrips()
})
</script>

<style scoped>
.bus-expenses-report {
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
  font-size: 0.875rem;
}
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}
th, td {
  border: 1px solid #e5e7eb;
  padding: 0.75rem;
  font-size: 0.9rem;
  text-align: left;
}
th {
  background: #f3f4f6;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
}
.loading-box,
.empty-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #6b7280;
}
.empty-icon {
  font-size: 2rem;
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
.expense-amount {
  font-weight: 700;
  color: #16a34a;
  font-size: 1.05rem;
}
.text-muted {
  color: #9ca3af;
  font-size: 0.85rem;
}
.action-buttons {
  display: flex;
  gap: 0.5rem;
}
.trip-summary {
  margin-bottom: 2rem;
}
.trip-summary h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #111827;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
}
.summary-item {
  display: flex;
  flex-direction: column;
}
.label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.value {
  font-size: 1rem;
  color: #111827;
  font-weight: 600;
  margin-top: 0.25rem;
}
.category-summary {
  margin-bottom: 2rem;
}
.category-summary h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #111827;
}
.category-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}
.category-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}
.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}
.category-info {
  display: flex;
  flex-direction: column;
}
.category-name {
  font-size: 0.85rem;
  color: #6b7280;
}
.category-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}
.expenses-detail {
  margin-bottom: 2rem;
}
.expenses-detail h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #111827;
}
.expenses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.expense-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
.expense-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
}
.expense-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}
.expense-amount-large {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}
.expense-body {
  padding: 1rem;
}
.expense-description {
  margin: 0 0 0.5rem 0;
  color: #111827;
}
.expense-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6b7280;
  font-size: 0.85rem;
}
.has-receipt {
  color: #16a34a;
  font-weight: 600;
}
.expense-receipt {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}
.expense-receipt img {
  width: 200px;
  height: auto;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.expense-receipt img:hover {
  transform: scale(1.05);
}
.total-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 1.2rem;
}
.total-amount {
  font-size: 1.8rem;
  font-weight: 700;
  color: #16a34a;
}
</style>

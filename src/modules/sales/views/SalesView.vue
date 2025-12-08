<template>
  <div class="sales-view">
    <div class="sales-header">
      <h1><i class="pi pi-shopping-cart"></i> Gestión de Ventas</h1>
      <p>Consulta y administra todas las compras realizadas</p>
    </div>

    <!-- Filtros -->
    <Card class="filters-card">
      <template #content>
        <div class="filters">
          <div class="filter-group">
            <label>Buscar</label>
            <InputText 
              v-model="searchQuery" 
              placeholder="ID, pasajero, cédula..." 
              class="filter-input"
            />
          </div>
          
          <div class="filter-group">
            <label>Estado</label>
            <Dropdown 
              v-model="filterStatus" 
              :options="statusOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Todos"
              class="filter-input"
            />
          </div>
          
          <div class="filter-group">
            <label>Tipo</label>
            <Dropdown 
              v-model="filterType" 
              :options="typeOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Todos"
              class="filter-input"
            />
          </div>
          
          <div class="filter-group">
            <label>Fecha</label>
            <Calendar 
              v-model="filterDate" 
              dateFormat="dd/mm/yy" 
              placeholder="Seleccionar fecha"
              :showIcon="true"
              class="filter-input"
            />
          </div>

          <div class="filter-actions">
            <Button 
              label="Limpiar" 
              icon="pi pi-filter-slash" 
              @click="clearFilters"
              outlined
            />
            <Button 
              label="Actualizar" 
              icon="pi pi-refresh" 
              @click="loadPurchases"
              :loading="loading"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Estadísticas Rápidas -->
    <div class="stats-grid">
      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon" style="background: #dbeafe;">
              <i class="pi pi-shopping-cart" style="color: #3b82f6;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Ventas</span>
              <span class="stat-value">{{ filteredPurchases.length }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon" style="background: #dcfce7;">
              <i class="pi pi-check-circle" style="color: #22c55e;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Confirmadas</span>
              <span class="stat-value">{{ confirmedCount }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon" style="background: #fef3c7;">
              <i class="pi pi-clock" style="color: #f59e0b;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Pendientes</span>
              <span class="stat-value">{{ pendingCount }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon" style="background: #dcfce7;">
              <i class="pi pi-dollar" style="color: #22c55e;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Ingresos</span>
              <span class="stat-value">${{ totalRevenue.toFixed(2) }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Tabla de Ventas -->
    <Card class="table-card">
      <template #content>
        <DataTable 
          :value="filteredPurchases" 
          :loading="loading"
          paginator 
          :rows="10" 
          :rowsPerPageOptions="[5, 10, 20, 50]"
          responsiveLayout="scroll"
          stripedRows
          class="sales-table"
          :globalFilterFields="['id', 'buyerUserId', 'tickets']"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>No se encontraron ventas</p>
            </div>
          </template>

          <Column field="id" header="CEDULA" :sortable="true">
            <template #body="{ data }">
              {{ getPassengerIdCards(data.tickets) }}
            </template>
          </Column>

          <Column field="purchaseDate" header="Fecha" :sortable="true">
            <template #body="{ data }">
              <div class="date-cell">
                <i class="pi pi-calendar"></i>
                {{ formatDate(data.purchaseDate) }}
              </div>
            </template>
          </Column>

          <Column header="Pasajeros">
            <template #body="{ data }">
              <div class="passengers-cell">
                <Tag :value="data.tickets.length" severity="info" />
                <span class="passenger-names">
                  {{ getPassengerNames(data.tickets) }}
                </span>
              </div>
            </template>
          </Column>

          <Column field="purchaseType" header="Tipo" :sortable="true">
            <template #body="{ data }">
              <Tag 
                :value="data.purchaseType === 'ONLINE' ? 'En Línea' : 'Presencial'" 
                :severity="data.purchaseType === 'ONLINE' ? 'info' : 'success'"
              />
            </template>
          </Column>

          <Column field="payment.paymentMethod" header="Pago" :sortable="true">
            <template #body="{ data }">
              <div class="payment-cell">
                <i :class="getPaymentIcon(data.payment?.paymentMethod)"></i>
                {{ getPaymentLabel(data.payment?.paymentMethod) }}
              </div>
            </template>
          </Column>

          <Column field="totalAmount" header="Total" :sortable="true">
            <template #body="{ data }">
              <div class="amount-cell">
                <span class="amount">${{ data.totalAmount.toFixed(2) }}</span>
                <span v-if="data.totalDiscount > 0" class="discount">
                  -${{ data.totalDiscount.toFixed(2) }}
                </span>
              </div>
            </template>
          </Column>

          <Column field="status" header="Estado" :sortable="true">
            <template #body="{ data }">
              <Tag 
                :value="getStatusLabel(data.status)" 
                :severity="getStatusSeverity(data.status)"
              />
            </template>
          </Column>

          <Column header="Acciones" :frozen="true" alignFrozen="right">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button 
                  icon="pi pi-eye" 
                  @click="viewPurchase(data)"
                  v-tooltip.top="'Ver detalles'"
                  rounded
                  text
                />
                <Button 
                  icon="pi pi-print" 
                  @click="printPurchase(data)"
                  v-tooltip.top="'Imprimir boletos'"
                  rounded
                  text
                  severity="success"
                />
                <Button 
                  v-if="data.status === 'PENDING' || data.status === 'CONFIRMED'"
                  icon="pi pi-ban" 
                  @click="confirmCancelPurchase(data)"
                  v-tooltip.top="'Cancelar compra'"
                  rounded
                  text
                  severity="danger"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Diálogo de Detalles -->
    <PurchaseDetailsDialog 
      :purchase="selectedPurchase"
      :show="showDetailsDialog"
      @update:show="showDetailsDialog = $event"
    />

    <!-- Diálogo de Confirmación de Cancelación -->
    <Dialog 
      v-model:visible="showCancelDialog" 
      modal 
      header="Confirmar Cancelación"
      :style="{ width: '450px' }"
    >
      <div class="cancel-dialog-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: #f59e0b;"></i>
        <p>¿Está seguro de que desea cancelar esta compra?</p>
        <p><strong>ID:</strong> {{ purchaseToCancel?.id.substring(0, 8) }}</p>
        <p><strong>Total:</strong> ${{ purchaseToCancel?.totalAmount.toFixed(2) }}</p>
        <p class="warning-text">Esta acción no se puede deshacer.</p>
      </div>
      <template #footer>
        <Button label="No, Volver" icon="pi pi-times" @click="showCancelDialog = false" outlined />
        <Button label="Sí, Cancelar Compra" icon="pi pi-check" @click="cancelPurchase" severity="danger" :loading="cancelling" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import { useSaleStore } from '../store/useSaleStore'
import { useAuthStore } from '../../auth/store/useAuthStore'
import PurchaseDetailsDialog from '../components/PurchaseDetailsDialog.vue'
import type { PurchaseDto } from '../interfaces/sale.interface'
import { success, error as notifyError } from '../../../lib/notifier'
import QRCode from 'qrcode'

const saleStore = useSaleStore()
const authStore = useAuthStore()

const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const filterType = ref('')
const filterDate = ref<Date | null>(null)
const selectedPurchase = ref<PurchaseDto | null>(null)
const showDetailsDialog = ref(false)
const showCancelDialog = ref(false)
const purchaseToCancel = ref<PurchaseDto | null>(null)
const cancelling = ref(false)

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'Pagada', value: 'PAID' },
  { label: 'Confirmada', value: 'CONFIRMED' },
  { label: 'Cancelada', value: 'CANCELLED' },
  { label: 'Expirada', value: 'EXPIRED' }
]

const typeOptions = [
  { label: 'Todos', value: '' },
  { label: 'En Línea', value: 'ONLINE' },
  { label: 'Presencial', value: 'IN_PERSON' }
]

const filteredPurchases = computed(() => {
  let result = saleStore.purchases

  // Filtro por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.id.toLowerCase().includes(query) ||
      p.buyerUserId.toLowerCase().includes(query) ||
      p.tickets.some(t => 
        t.passengerName.toLowerCase().includes(query) ||
        t.passengerIdCard.includes(query)
      )
    )
  }

  // Filtro por estado
  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }

  // Filtro por tipo
  if (filterType.value) {
    result = result.filter(p => p.purchaseType === filterType.value)
  }

  // Filtro por fecha
  if (filterDate.value) {
    const filterDateStr = filterDate.value.toISOString().split('T')[0]
    result = result.filter(p => {
      const purchaseDateStr = Array.isArray(p.purchaseDate) 
        ? `${p.purchaseDate[0]}-${String(p.purchaseDate[1]).padStart(2, '0')}-${String(p.purchaseDate[2]).padStart(2, '0')}`
        : new Date(p.purchaseDate).toISOString().split('T')[0]
      return purchaseDateStr === filterDateStr
    })
  }

  return result
})

// Confirmados = compras con status PAID o CONFIRMED (ambos son ventas pagadas)
const confirmedCount = computed(() => 
  filteredPurchases.value.filter(p => 
    (p.status as string) === 'PAID' || (p.status as string) === 'CONFIRMED'
  ).length
)

// Pendientes = ventas con status PENDING
const pendingCount = computed(() => 
  filteredPurchases.value.filter(p => p.status === 'PENDING').length
)

// Ingresos = suma del totalAmount de TODAS las ventas (sin filtrar por estado)
const totalRevenue = computed(() => 
  filteredPurchases.value.reduce((sum, p) => sum + p.totalAmount, 0)
)

async function loadPurchases() {
  loading.value = true
  try {
    const user = authStore.user
    
    if (!user) {
      notifyError('Usuario no autenticado')
      return
    }
    
    // Si es COOPERATIVE o CLERK, cargar todas las ventas de la cooperativa
    if ((user.role === 'COOPERATIVE' || user.role === 'CLERK') && user.cooperativeId) {
      await saleStore.fetchPurchasesByCooperative(user.cooperativeId)
    } else {
      // Si es CLIENT u otro rol, cargar solo sus propias compras
      await saleStore.fetchPurchasesByUser(user.id)
    }
  } catch (err: any) {
    notifyError(err.message || 'Error al cargar las ventas')
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  searchQuery.value = ''
  filterStatus.value = ''
  filterType.value = ''
  filterDate.value = null
}

function viewPurchase(purchase: PurchaseDto) {
  selectedPurchase.value = purchase
  showDetailsDialog.value = true
}

function formatDateTime(datetime: string | any[]): string {
  if (!datetime) return ''
  
  if (Array.isArray(datetime)) {
    const [year, month, day, hour, minute] = datetime
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  
  const date = new Date(datetime)
  return date.toLocaleString('es-EC', { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTime(datetime: string | any[] | undefined): string {
  if (!datetime) return ''
  
  if (Array.isArray(datetime)) {
    if (datetime.length >= 5) {
      const hour = String(datetime[3]).padStart(2, '0')
      const minute = String(datetime[4]).padStart(2, '0')
      return `${hour}:${minute}`
    }
    return ''
  }
  
  const datetimeStr = String(datetime)
  if (datetimeStr.includes(':') && !datetimeStr.includes('T') && !datetimeStr.includes(' ')) {
    const parts = datetimeStr.split(':')
    return `${parts[0]}:${parts[1]}`
  }
  
  const date = new Date(datetimeStr)
  return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function getPassengerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'ADULT': 'Adulto',
    'CHILD': 'Menor',
    'SENIOR': 'Tercera Edad',
    'DISABLED': 'Discapacitado'
  }
  return labels[type] || type
}

async function printPurchase(purchase: PurchaseDto) {
  if (!purchase) return
  
  // Generar QR codes primero
  const qrCodes: Record<string, string> = {}
  for (const ticket of purchase.tickets) {
    if (ticket.qrCode) {
      try {
        const qrDataUrl = await QRCode.toDataURL(ticket.qrCode, {
          width: 300,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        qrCodes[ticket.id] = qrDataUrl
      } catch (err) {
        console.error('Error generando QR para ticket', ticket.id, err)
      }
    }
  }
  
  // Crear ventana de impresión
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) return
  
  // Generar HTML para cada ticket
  let ticketsHtml = ''
  purchase.tickets.forEach((ticket, index) => {
    const qrSrc = qrCodes[ticket.id] || ''
    
    ticketsHtml += `
      <div class="print-ticket" ${index < purchase.tickets.length - 1 ? 'style="page-break-after: always;"' : ''}>
        <div class="print-header">
          <h1>HATUNBUS</h1>
          <p>Sistema de Transporte Interprovincial</p>
        </div>

        <div class="print-ticket-type">
          <h2>BOLETO DE VIAJE</h2>
          <span class="ticket-number">Boleto #${ticket.id?.substring(0, 8)}</span>
        </div>

        <div class="print-qr">
          <img src="${qrSrc}" alt="QR Code" />
          <p class="qr-instruction">Presente este código al abordar</p>
        </div>

        <div class="print-section">
          <h3>Información del Pasajero</h3>
          <div class="print-row">
            <span class="label">Nombre:</span>
            <span class="value">${ticket.passengerName}</span>
          </div>
          <div class="print-row">
            <span class="label">Cédula:</span>
            <span class="value">${ticket.passengerIdCard}</span>
          </div>
          <div class="print-row">
            <span class="label">Tipo:</span>
            <span class="value">${getPassengerTypeLabel(ticket.passengerType)}</span>
          </div>
        </div>

        <div class="print-section">
          <h3>Detalles del Viaje</h3>
          <div class="print-row">
            <span class="label">Asiento:</span>
            <span class="value seat-number">${ticket.seatNumber}</span>
          </div>
          <div class="print-row">
            <span class="label">Ruta:</span>
            <span class="value">${ticket.routeName || 'N/A'}</span>
          </div>
          <div class="print-row">
            <span class="label">Origen:</span>
            <span class="value">${ticket.routeOrigin || 'N/A'}</span>
          </div>
          <div class="print-row">
            <span class="label">Destino:</span>
            <span class="value">${ticket.routeDestination || 'N/A'}</span>
          </div>
          <div class="print-row">
            <span class="label">Fecha:</span>
            <span class="value">${formatDate(ticket.scheduledDepartureTime)}</span>
          </div>
          <div class="print-row">
            <span class="label">Hora de Salida:</span>
            <span class="value">${formatTime(ticket.scheduledDepartureTime)}</span>
          </div>
          <div class="print-row">
            <span class="label">Bus:</span>
            <span class="value">${ticket.busUnitNumber ? `Unidad ${ticket.busUnitNumber}` : ''}${ticket.busUnitNumber && ticket.busPlate ? ' - ' : ''}${ticket.busPlate || (!ticket.busUnitNumber ? 'N/A' : '')}</span>
          </div>
          ${ticket.cooperativeName ? `
          <div class="print-row">
            <span class="label">Cooperativa:</span>
            <span class="value">${ticket.cooperativeName}</span>
          </div>
          ` : ''}
        </div>

        <div class="print-section">
          <h3>Información de Pago</h3>
          <div class="print-row">
            <span class="label">Precio Base:</span>
            <span class="value">$${ticket.basePrice?.toFixed(2)}</span>
          </div>
          ${ticket.discount > 0 ? `
          <div class="print-row">
            <span class="label">Descuento:</span>
            <span class="value discount-text">-$${ticket.discount?.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="print-row total-row">
            <span class="label">Total Pagado:</span>
            <span class="value">$${ticket.finalPrice?.toFixed(2)}</span>
          </div>
        </div>

        <div class="print-footer">
          <p>Fecha de Emisión: ${formatDateTime(purchase.purchaseDate)}</p>
          <p class="terms">* Conserve este boleto durante todo el viaje</p>
          <p class="terms">* No se aceptan reembolsos una vez iniciado el viaje</p>
        </div>
      </div>
    `
  })
  
  // Escribir documento completo
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Boletos - HATUNBUS</title>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          background: white;
          padding: 0;
          margin: 0;
        }
        
        .print-ticket {
          width: 8cm;
          margin: 0 auto;
          background: white;
          padding: 0.5cm;
          border: 1px dashed #999;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 0.4rem;
          padding-bottom: 0.3rem;
          border-bottom: 1px solid #000;
        }
        
        .print-header h1 {
          font-size: 1.2rem;
          color: #000;
          font-weight: bold;
          letter-spacing: 2px;
          margin: 0;
        }
        
        .print-header p {
          margin-top: 0.1rem;
          font-size: 0.6rem;
          color: #333;
        }
        
        .print-ticket-type {
          text-align: center;
          margin: 0.3rem 0;
          padding: 0.3rem;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        
        .print-ticket-type h2 {
          font-size: 0.9rem;
          color: #000;
          font-weight: bold;
          margin: 0;
        }
        
        .ticket-number {
          display: block;
          margin-top: 0.1rem;
          font-size: 0.55rem;
          color: #666;
        }
        
        .print-qr {
          text-align: center;
          margin: 0.4rem auto;
          padding: 0.3rem;
          border: 1px dashed #666;
        }
        
        .print-qr img {
          width: 100px;
          height: 100px;
          border: 1px solid #000;
        }
        
        .qr-instruction {
          margin-top: 0.2rem;
          font-size: 0.5rem;
          color: #000;
          font-weight: bold;
        }
        
        .print-section {
          margin: 0.3rem 0;
          padding: 0.2rem 0;
          border-top: 1px dashed #999;
        }
        
        .print-section h3 {
          margin: 0 0 0.2rem 0;
          font-size: 0.65rem;
          color: #000;
          font-weight: bold;
          text-transform: uppercase;
          text-decoration: underline;
        }
        
        .print-row {
          display: flex;
          justify-content: space-between;
          padding: 0.15rem 0;
          font-size: 0.6rem;
          line-height: 1.2;
        }
        
        .print-row .label {
          font-weight: bold;
          color: #000;
        }
        
        .print-row .value {
          color: #000;
          text-align: right;
          max-width: 60%;
          word-wrap: break-word;
        }
        
        .seat-number {
          font-size: 0.8rem !important;
          font-weight: bold !important;
          color: #000 !important;
          text-decoration: underline;
        }
        
        .discount-text {
          color: #000 !important;
          font-weight: bold;
        }
        
        .total-row {
          border-top: 1px double #000 !important;
          margin-top: 0.2rem;
          padding-top: 0.3rem !important;
          font-weight: bold !important;
        }
        
        .total-row .label,
        .total-row .value {
          font-size: 0.7rem !important;
          font-weight: bold !important;
          color: #000 !important;
        }
        
        .print-footer {
          margin-top: 0.4rem;
          padding-top: 0.3rem;
          border-top: 1px solid #000;
          text-align: center;
          font-size: 0.5rem;
        }
        
        .print-footer p {
          margin: 0.1rem 0;
          color: #000;
          line-height: 1.3;
        }
        
        .terms {
          font-size: 0.45rem !important;
          color: #666 !important;
          font-style: italic;
          margin-top: 0.3rem !important;
          line-height: 1.2;
        }
        
        @media print {
          body {
            padding: 0;
            margin: 0;
          }
          
          .print-ticket {
            margin: 0 auto;
            page-break-inside: avoid;
            border: none;
          }
          
          @page {
            margin: 0.3cm;
            size: 8cm auto;
          }
        }
      </style>
    </head>
    <body>
      ${ticketsHtml}
      <` + `script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }, 250);
        };
      </` + `script>
    </body>
    </html>
  `)
  
  printWindow.document.close()
}

function confirmCancelPurchase(purchase: PurchaseDto) {
  purchaseToCancel.value = purchase
  showCancelDialog.value = true
}

async function cancelPurchase() {
  if (!purchaseToCancel.value) return
  
  cancelling.value = true
  try {
    await saleStore.cancelPurchase(purchaseToCancel.value.id)
    success('Compra cancelada exitosamente')
    showCancelDialog.value = false
    purchaseToCancel.value = null
  } catch (err: any) {
    notifyError(err.message || 'Error al cancelar la compra')
  } finally {
    cancelling.value = false
  }
}

function formatDate(date: string | any[] | undefined): string {
  if (!date) return 'N/A'
  if (Array.isArray(date)) {
    const [year, month, day] = date
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  }
  return new Date(date).toLocaleDateString('es-EC')
}

function getPassengerNames(tickets: any[]): string {
  if (tickets.length === 0) return ''
  if (tickets.length === 1) return tickets[0].passengerName
  return `${tickets[0].passengerName} +${tickets.length - 1}`
}

function getPassengerIdCards(tickets: any[]): string {
  if (tickets.length === 0) return ''
  if (tickets.length === 1) return tickets[0].passengerIdCard
  return `${tickets[0].passengerIdCard} +${tickets.length - 1}`
}

function getPaymentIcon(method?: string): string {
  const icons: Record<string, string> = {
    'CASH': 'pi pi-money-bill',
    'TRANSFER': 'pi pi-building-columns',
    'CARD': 'pi pi-credit-card'
  }
  return method ? icons[method] || 'pi pi-question' : 'pi pi-question'
}

function getPaymentLabel(method?: string): string {
  const labels: Record<string, string> = {
    'CASH': 'Efectivo',
    'TRANSFER': 'Transferencia',
    'CARD': 'Tarjeta'
  }
  return method ? labels[method] || 'N/A' : 'N/A'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'Pendiente',
    'PAID': 'Pagada',
    'CONFIRMED': 'Confirmada',
    'CANCELLED': 'Cancelada',
    'EXPIRED': 'Expirada'
  }
  return labels[status] || status
}

function getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
  const severities: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    'PENDING': 'warning',
    'PAID': 'success',
    'CONFIRMED': 'success',
    'CANCELLED': 'danger',
    'EXPIRED': 'info'
  }
  return severities[status] || 'info'
}

onMounted(() => {
  loadPurchases()
})
</script>

<style scoped>
.sales-view {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.sales-header {
  margin-bottom: 2rem;
}

.sales-header h1 {
  margin: 0;
  color: #1e293b;
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sales-header p {
  margin: 0.5rem 0 0 0;
  color: #64748b;
  font-size: 1rem;
}

.filters-card {
  margin-bottom: 1.5rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
}

.filter-input {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.stat-value {
  color: #1e293b;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
}

.table-card {
  background: white;
}

.sales-table {
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.empty-state p {
  font-size: 1.125rem;
  margin: 0;
}

.id-cell {
  font-family: monospace;
  color: #64748b;
  font-size: 0.875rem;
}

.date-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
}

.passengers-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.passenger-names {
  color: #475569;
  font-size: 0.875rem;
}

.payment-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
}

.amount-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.amount {
  font-weight: 600;
  color: #22c55e;
  font-size: 1rem;
}

.discount {
  color: #f59e0b;
  font-size: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.cancel-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  text-align: center;
}

.cancel-dialog-content p {
  margin: 0;
  color: #475569;
}

.warning-text {
  color: #ef4444 !important;
  font-weight: 600;
  font-size: 0.875rem;
}
</style>

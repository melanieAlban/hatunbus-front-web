<template>
  <div>
    <Dialog 
      v-model:visible="visible" 
      modal 
      :closable="false"
      :style="{ width: '90vw', maxWidth: '1200px' }"
      class="purchase-success-dialog"
    >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-check-circle" style="color: #22c55e; font-size: 2rem; margin-right: 1rem;"></i>
        <div>
          <h2>¡Compra Realizada Exitosamente!</h2>
          <p class="purchase-id">ID de Compra: {{ purchase?.id }}</p>
        </div>
      </div>
    </template>

    <div v-if="purchase" class="purchase-details">
      <!-- Información General -->
      <Card class="info-card">
        <template #title>Información de la Compra</template>
        <template #content>
          <div class="info-grid">
            <div class="info-item">
              <label>Fecha de Compra:</label>
              <span>{{ formatDateTime(purchase.purchaseDate) }}</span>
            </div>
            <div class="info-item">
              <label>Total:</label>
              <span class="amount">${{ purchase.totalAmount?.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <label>Descuento:</label>
              <span class="discount">-${{ purchase.totalDiscount?.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <label>Método de Pago:</label>
              <span>{{ getPaymentMethodLabel(purchase.payment?.paymentMethod) }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Boletos -->
      <Card class="tickets-card">
        <template #title>Boletos Emitidos ({{ purchase.tickets?.length }})</template>
        <template #content>
          <div class="tickets-grid">
            <div 
              v-for="ticket in purchase.tickets" 
              :key="ticket.id"
              class="ticket-item"
            >
              <div class="ticket-header">
                <div class="ticket-header-left">
                  <h3>Asiento {{ ticket.seatNumber }}</h3>
                  <Tag :value="ticket.passengerType" severity="info" />
                </div>
                <img 
                  v-if="ticket.cooperativeLogo" 
                  :src="ticket.cooperativeLogo" 
                  alt="Logo cooperativa" 
                  class="ticket-logo"
                />
              </div>
              
              <div class="ticket-info">
                <div class="ticket-row">
                  <i class="pi pi-user"></i>
                  <span>{{ ticket.passengerName }}</span>
                </div>
                <div class="ticket-row">
                  <i class="pi pi-id-card"></i>
                  <span>{{ ticket.passengerIdCard }}</span>
                </div>
                <div class="ticket-row" v-if="ticket.passengerEmail">
                  <i class="pi pi-envelope"></i>
                  <span>{{ ticket.passengerEmail }}</span>
                </div>
                <div class="ticket-row" v-if="ticket.passengerPhone">
                  <i class="pi pi-phone"></i>
                  <span>{{ ticket.passengerPhone }}</span>
                </div>
              </div>

              <Divider />

              <div class="ticket-route">
                <div class="route-point">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ ticket.routeOrigin }}</span>
                </div>
                <i class="pi pi-arrow-right"></i>
                <div class="route-point">
                  <i class="pi pi-flag"></i>
                  <span>{{ ticket.routeDestination }}</span>
                </div>
              </div>

              <div class="ticket-datetime">
                <div>
                  <i class="pi pi-calendar"></i>
                  {{ formatDate(ticket.scheduledDepartureTime) }}
                </div>
                <div>
                  <i class="pi pi-clock"></i>
                  {{ formatTime(ticket.scheduledDepartureTime) }}
                </div>
              </div>

              <!-- Información del conductor -->
              <div v-if="ticket.driverName || ticket.mainDriverName" class="ticket-driver">
                <i class="pi pi-user"></i>
                <span>Conductor: <strong>{{ ticket.driverName || ticket.mainDriverName }}</strong></span>
              </div>

              <Divider />

              <div class="ticket-price">
                <div class="price-row">
                  <span>Precio Base:</span>
                  <span>${{ ticket.basePrice?.toFixed(2) }}</span>
                </div>
                <div class="price-row discount" v-if="ticket.discount > 0">
                  <span>Descuento:</span>
                  <span>-${{ ticket.discount?.toFixed(2) }}</span>
                </div>
                <div class="price-row total">
                  <span>Total:</span>
                  <span>${{ ticket.finalPrice?.toFixed(2) }}</span>
                </div>
              </div>

              <!-- QR Code Preview -->
              <div class="qr-preview" v-if="ticket.qrCode">
                <img :data-ticket-id="ticket.id" alt="QR Code" />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Imprimir Boletos" 
          icon="pi pi-print" 
          @click="printTickets"
          severity="success"
        />
        <Button 
          label="Nueva Venta" 
          icon="pi pi-plus" 
          @click="closeAndReset"
          outlined
        />
      </div>
    </template>
  </Dialog>

  <!-- Área de Impresión (oculta) -->
  <div id="print-area" class="print-area">
    <div v-if="purchase" class="print-container">
        <div 
          v-for="(ticket, index) in purchase.tickets" 
          :key="ticket.id"
          class="print-ticket"
          :class="{ 'page-break': index < purchase.tickets.length - 1 }"
        >
          <div class="print-header">
          <template v-if="ticket.cooperativeLogo">
            <img :src="ticket.cooperativeLogo" alt="Logo cooperativa" class="print-logo" />
          </template>
          <template v-else>
            <h1>HATUNBUS</h1>
          </template>
          <p>{{ ticket.cooperativeName || 'Sistema de Transporte Interprovincial' }}</p>
        </div>

        <div class="print-ticket-type">
          <h2>BOLETO DE VIAJE</h2>
          <span class="ticket-number">Boleto #{{ ticket.id?.substring(0, 8) }}</span>
        </div>

        <div class="print-qr">
          <img v-if="ticket.qrCode" :data-ticket-id="ticket.id" alt="QR Code" />
          <p class="qr-instruction">Presente este código al abordar</p>
        </div>

        <div class="print-section">
          <h3>Información del Pasajero</h3>
          <div class="print-row">
            <span class="label">Nombre:</span>
            <span class="value">{{ ticket.passengerName }}</span>
          </div>
          <div class="print-row">
            <span class="label">Cédula:</span>
            <span class="value">{{ ticket.passengerIdCard }}</span>
          </div>
          <div class="print-row">
            <span class="label">Tipo:</span>
            <span class="value">{{ getPassengerTypeLabel(ticket.passengerType) }}</span>
          </div>
        </div>

        <div class="print-section">
          <h3>Detalles del Viaje</h3>
          <div class="print-row">
            <span class="label">Asiento:</span>
            <span class="value seat-number">{{ ticket.seatNumber }}</span>
          </div>
          <div class="print-row">
            <span class="label">Ruta:</span>
            <span class="value">{{ ticket.routeName }}</span>
          </div>
          <div class="print-row">
            <span class="label">Origen:</span>
            <span class="value">{{ ticket.routeOrigin }}</span>
          </div>
          <div class="print-row">
            <span class="label">Destino:</span>
            <span class="value">{{ ticket.routeDestination }}</span>
          </div>
          <div class="print-row">
            <span class="label">Fecha:</span>
            <span class="value">{{ formatDate(ticket.scheduledDepartureTime) }}</span>
          </div>
          <div class="print-row">
            <span class="label">Hora de Salida:</span>
            <span class="value">{{ formatTime(ticket.scheduledDepartureTime) }}</span>
          </div>
          <div class="print-row">
            <span class="label">Bus:</span>
            <span class="value">
              Unidad: {{ ticket.busUnitNumber || 'N/A' }} | Placa: {{ ticket.busPlate || 'N/A' }}
            </span>
          </div>
          <div class="print-row" v-if="ticket.driverName || ticket.mainDriverName">
            <span class="label">Conductor:</span>
            <span class="value">{{ ticket.driverName || ticket.mainDriverName }}</span>
          </div>
          <div class="print-row" v-if="ticket.cooperativeName">
            <span class="label">Cooperativa:</span>
            <span class="value">{{ ticket.cooperativeName }}</span>
          </div>
        </div>

        <div class="print-section">
          <h3>Información de Pago</h3>
          <div class="print-row">
            <span class="label">Precio Base:</span>
            <span class="value">${{ ticket.basePrice?.toFixed(2) }}</span>
          </div>
          <div class="print-row" v-if="ticket.discount > 0">
            <span class="label">Descuento:</span>
            <span class="value discount-text">-${{ ticket.discount?.toFixed(2) }}</span>
          </div>
          <div class="print-row total-row">
            <span class="label">Total Pagado:</span>
            <span class="value">${{ ticket.finalPrice?.toFixed(2) }}</span>
          </div>
        </div>

        <div class="print-footer">
          <p>Fecha de Emisión: {{ formatDateTime(purchase.purchaseDate) }}</p>
          <p class="terms">* Conserve este boleto durante todo el viaje</p>
          <p class="terms">* No se aceptan reembolsos una vez iniciado el viaje</p>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'
import Dialog from 'primevue/dialog'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import type { PurchaseDto } from '../interfaces/ticket.interface'
import QRCode from 'qrcode'

const props = defineProps<{
  purchase: PurchaseDto | null
}>()

const emit = defineEmits<{
  close: []
  newSale: []
}>()

const visible = computed({
  get: () => !!props.purchase,
  set: (value) => {
    if (!value) emit('close')
  }
})

function formatDateTime(datetime?: string | any[]): string {
  if (!datetime) return ''
  
  if (Array.isArray(datetime)) {
    // [year, month, day, hour, minute, second]
    const [year, month, day, hour, minute] = datetime
    return `${day}/${month}/${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
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

function formatDate(datetime?: string | any[]): string {
  if (!datetime) return ''
  
  if (Array.isArray(datetime)) {
    const [year, month, day] = datetime
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  }
  
  const date = new Date(datetime)
  return date.toLocaleDateString('es-EC')
}

function formatTime(datetime?: string | any[]): string {
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

function getPaymentMethodLabel(method: string | undefined): string {
  const labels: Record<string, string> = {
    'CASH': 'Efectivo',
    'TRANSFER': 'Transferencia',
    'PAYPAL': 'PayPal',
    'CARD': 'Tarjeta'
  }
  return method ? labels[method] || method : 'N/A'
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

function getQrCodeSrc(qrCode?: string): string {
  if (!qrCode) return ''
  const cleanQr = qrCode.trim().replace(/\s+/g, '')
  if (cleanQr.startsWith('data:image')) return cleanQr
  return `data:image/png;base64,${cleanQr}`
}

// Watch para generar QR codes cuando cambie la compra
watch(() => props.purchase, async (newPurchase) => {
  if (newPurchase?.tickets) {
    // Debug: Ver los datos del ticket
    console.log('🎫 Datos de tickets:', newPurchase.tickets.map(t => ({
      id: t.id,
      busPlate: t.busPlate,
      busUnitNumber: t.busUnitNumber,
      cooperativeName: t.cooperativeName
    })))
    
    await nextTick()
    // Generar QR para cada ticket
    for (const ticket of newPurchase.tickets) {
      if (ticket.qrCode) {
        await generateQRImage(ticket.qrCode, ticket.id)
      }
    }
  }
}, { immediate: true })

async function generateQRImage(qrHash: string, ticketId: string) {
  try {
    // Generar imagen QR desde el hash
    const qrDataUrl = await QRCode.toDataURL(qrHash, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    // Actualizar todas las imágenes con este ticket ID
    const images = document.querySelectorAll(`img[data-ticket-id="${ticketId}"]`)
    images.forEach((img: any) => {
      img.src = qrDataUrl
    })
  } catch (err) {
    console.error('Error generando QR para ticket', ticketId, err)
  }
}

function printTickets() {
  if (!props.purchase) return
  
  // Crear ventana de impresión
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) return
  
  // Generar HTML para cada ticket
  let ticketsHtml = ''
  props.purchase.tickets.forEach((ticket, index) => {
    const qrImg = document.querySelector(`img[data-ticket-id="${ticket.id}"]`) as HTMLImageElement
    const qrSrc = qrImg?.src || ''
    const logoMarkup = ticket.cooperativeLogo
      ? `<img src="${ticket.cooperativeLogo}" class="print-logo" alt="Logo cooperativa" />`
      : '<h1>HATUNBUS</h1>'
    const subtitle = ticket.cooperativeName || 'Sistema de Transporte Interprovincial'
    
    ticketsHtml += `
      <div class="print-ticket" ${index < props.purchase!.tickets.length - 1 ? 'style="page-break-after: always;"' : ''}>
        <div class="print-header">
          ${logoMarkup}
          <p>${subtitle}</p>
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
            <span class="value">${ticket.routeName}</span>
          </div>
          <div class="print-row">
            <span class="label">Origen:</span>
            <span class="value">${ticket.routeOrigin}</span>
          </div>
          <div class="print-row">
            <span class="label">Destino:</span>
            <span class="value">${ticket.routeDestination}</span>
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
          <p>Fecha de Emisión: ${formatDateTime(props.purchase!.purchaseDate)}</p>
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
        
        .print-logo {
          max-height: 42px;
          width: auto;
          margin: 0 auto;
          display: block;
          object-fit: contain;
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

function closeAndReset() {
  emit('newSale')
  emit('close')
}
</script>

<style scoped>
.purchase-success-dialog {
  font-family: 'Inter', sans-serif;
}

.dialog-header {
  display: flex;
  align-items: center;
}

.dialog-header h2 {
  margin: 0;
  color: #1a1a1a;
}

.purchase-id {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.purchase-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-item span {
  font-size: 1rem;
  color: #1a1a1a;
  font-weight: 600;
}

.amount {
  color: #22c55e;
  font-size: 1.25rem !important;
}

.discount {
  color: #f59e0b;
}

.tickets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.ticket-item {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: #fafafa;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.ticket-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ticket-header h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 1.25rem;
}

.ticket-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
  padding: 6px;
  border: 1px solid #e5e7eb;
}

.ticket-info, .ticket-route, .ticket-datetime, .ticket-price {
  margin: 1rem 0;
}

.ticket-row, .route-point {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  color: #4b5563;
}

.ticket-row i {
  color: #9ca3af;
}

.ticket-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
}

.ticket-datetime {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.price-row.total {
  font-size: 1.125rem;
  font-weight: 700;
  color: #22c55e;
  border-top: 2px solid #e5e7eb;
  padding-top: 0.5rem;
  margin-top: 0.75rem;
}

.qr-preview {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
}

.qr-preview img {
  width: 150px;
  height: 150px;
}

.dialog-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Print Styles */
.print-area {
  display: none;
}

@media print {
  /* Ocultar todo el contenido normal */
  body > * {
    display: none !important;
  }

  /* Ocultar específicamente los elementos de PrimeVue */
  .p-dialog,
  .p-dialog-mask,
  .p-component-overlay {
    display: none !important;
  }
  
  /* Mostrar SOLO el área de impresión */
  body > #print-area {
    display: block !important;
  }

  #print-area {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    z-index: 99999 !important;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  .print-container {
    width: 100%;
    background: white;
  }

  .print-ticket {
    padding: 1.5cm;
    max-width: 21cm;
    margin: 0 auto;
    background: white;
    page-break-inside: avoid;
  }

  .page-break {
    page-break-after: always;
  }

  /* Header del boleto */
  .print-header {
    text-align: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 3px double #000;
  }

  .print-header h1 {
    margin: 0;
    font-size: 2.8rem;
    color: #000;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .print-logo {
    max-height: 64px;
    width: auto;
    margin: 0 auto;
    display: block;
    object-fit: contain;
  }

  .print-header p {
    margin: 0.5rem 0 0 0;
    font-size: 1.1rem;
    color: #333;
    font-weight: 600;
  }

  /* Tipo de boleto */
  .print-ticket-type {
    text-align: center;
    margin: 1.5rem 0;
    background: #f5f5f5;
    padding: 1rem;
    border: 2px solid #000;
    border-radius: 8px;
  }

  .print-ticket-type h2 {
    margin: 0;
    font-size: 2rem;
    color: #000;
    font-weight: 700;
    text-transform: uppercase;
  }

  .ticket-number {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #666;
    font-family: monospace;
  }

  /* QR Code */
  .print-qr {
    text-align: center;
    margin: 2rem auto;
    padding: 1.5rem;
    border: 3px dashed #000;
    border-radius: 12px;
    background: #fff;
    max-width: 280px;
  }

  .print-qr img {
    width: 220px;
    height: 220px;
    border: 2px solid #000;
    padding: 5px;
    background: white;
  }

  .qr-instruction {
    margin-top: 0.75rem;
    font-size: 0.95rem;
    color: #000;
    font-weight: 600;
  }

  /* Secciones */
  .print-section {
    margin: 1.5rem 0;
    padding: 1rem;
    background: #fafafa;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    page-break-inside: avoid;
  }

  .print-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.3rem;
    color: #000;
    font-weight: 700;
    text-transform: uppercase;
    border-bottom: 2px solid #000;
    padding-bottom: 0.5rem;
  }

  /* Filas de información */
  .print-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #ddd;
  }

  .print-row:last-child {
    border-bottom: none;
  }

  .print-row .label {
    font-weight: 600;
    color: #000;
    font-size: 1rem;
  }

  .print-row .value {
    color: #000;
    font-size: 1rem;
    text-align: right;
  }

  /* Número de asiento destacado */
  .seat-number {
    font-size: 1.8rem !important;
    font-weight: 900 !important;
    color: #22c55e !important;
    background: #f0fdf4;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 2px solid #22c55e;
  }

  /* Descuento */
  .discount-text {
    color: #f59e0b !important;
    font-weight: 700;
  }

  /* Fila de total */
  .total-row {
    border-bottom: none !important;
    border-top: 3px double #000 !important;
    margin-top: 0.5rem;
    padding-top: 1rem !important;
    background: #f0fdf4;
  }

  .total-row .label,
  .total-row .value {
    font-size: 1.3rem !important;
    font-weight: 900 !important;
    color: #22c55e !important;
  }

  /* Footer del boleto */
  .print-footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 3px double #000;
    text-align: center;
    font-size: 0.85rem;
  }

  .print-footer p {
    margin: 0.5rem 0;
    color: #000;
  }

  .print-footer strong {
    font-weight: 700;
  }

  .terms {
    font-size: 0.75rem;
    color: #666;
    margin-top: 1rem !important;
    font-style: italic;
    padding: 0.75rem;
    background: #f5f5f5;
    border-radius: 6px;
  }

  /* Eliminar márgenes de página */
  @page {
    margin: 1cm;
  }
}

@media screen {
  .print-area {
    display: none !important;
  }
}
</style>

<template>
  <div class="pending-payments-view">
    <div class="payments-header">
      <h1><i class="pi pi-money-bill"></i> Gestión de Pagos</h1>
      <p>Administra los pagos por transferencia bancaria</p>
    </div>

    <!-- Estadísticas Rápidas -->
    <div class="stats-grid">
      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon" style="background: #fef3c7;">
              <i class="pi pi-clock" style="color: #f59e0b;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Pendientes</span>
              <span class="stat-value">{{ pendingPayments.length }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon" style="background: #d1fae5;">
              <i class="pi pi-check-circle" style="color: #10b981;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Aprobados</span>
              <span class="stat-value">{{ approvedPayments.length }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon" style="background: #fee2e2;">
              <i class="pi pi-times-circle" style="color: #ef4444;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Rechazados</span>
              <span class="stat-value">{{ rejectedPayments.length }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon" style="background: #dbeafe;">
              <i class="pi pi-dollar" style="color: #3b82f6;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Monto Total</span>
              <span class="stat-value">${{ currentTabTotalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Pestañas de Pagos -->
    <Card class="table-card">
      <template #content>
        <TabView v-model:activeIndex="activeTab" @tab-change="onTabChange">
          <!-- Pestaña de Pendientes -->
          <TabPanel value="0">
            <template #header>
              <i class="pi pi-clock mr-2"></i>
              <span>Pendientes</span>
              <Tag v-if="pendingPayments.length > 0" :value="pendingPayments.length" severity="warning" class="ml-2" />
            </template>
            <DataTable 
              :value="pendingPayments" 
              :loading="loading"
              :rows="10"
              :paginator="true"
              responsiveLayout="scroll"
              stripedRows
              showGridlines
              emptyMessage="No hay pagos pendientes"
              class="payments-table"
            >
          <Column field="createdAt" header="Fecha" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdAt) }}
            </template>
          </Column>

          <Column field="userName" header="Pasajero" sortable>
            <template #body="slotProps">
              <div class="passenger-info">
                <strong>{{ slotProps.data.userName }}</strong>
                <small>{{ slotProps.data.userEmail }}</small>
              </div>
            </template>
          </Column>

          <Column field="tripInfo" header="Viaje">
            <template #body="slotProps">
              <div class="trip-info">
                <div><i class="pi pi-map-marker"></i> {{ slotProps.data.tripInfo.origin }} → {{ slotProps.data.tripInfo.destination }}</div>
                <small>{{ slotProps.data.tripInfo.date }} - {{ slotProps.data.tripInfo.time }}</small>
              </div>
            </template>
          </Column>

          <Column field="seats" header="Asientos">
            <template #body="slotProps">
              <Tag 
                v-for="seat in slotProps.data.seats" 
                :key="seat" 
                :value="seat" 
                severity="info"
                class="seat-tag"
              />
            </template>
          </Column>

          <Column field="totalAmount" header="Monto" sortable>
            <template #body="slotProps">
              <strong class="amount">${{ slotProps.data.totalAmount.toFixed(2) }}</strong>
            </template>
          </Column>

          <Column header="Acciones" :style="{width: '120px', textAlign: 'center'}">
            <template #body="slotProps">
              <Button 
                icon="pi pi-eye" 
                label="Ver"
                severity="info"
                size="small"
                @click="openDetailsDialog(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>
          </TabPanel>

          <!-- Pestaña de Aprobados -->
          <TabPanel value="1">
            <template #header>
              <i class="pi pi-check-circle mr-2"></i>
              <span>Aprobados</span>
              <Tag v-if="approvedPayments.length > 0" :value="approvedPayments.length" severity="success" class="ml-2" />
            </template>
            <DataTable 
              :value="approvedPayments" 
              :loading="loadingApproved"
              :rows="10"
              :paginator="true"
              responsiveLayout="scroll"
              stripedRows
              showGridlines
              emptyMessage="No hay pagos aprobados"
              class="payments-table"
            >
              <Column field="createdAt" header="Fecha Compra" sortable>
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.createdAt) }}
                </template>
              </Column>

              <Column field="approvalDate" header="Fecha Aprobación" sortable>
                <template #body="slotProps">
                  {{ slotProps.data.approvalDate ? formatDate(slotProps.data.approvalDate) : '-' }}
                </template>
              </Column>

              <Column field="userName" header="Pasajero" sortable>
                <template #body="slotProps">
                  <div class="passenger-info">
                    <strong>{{ slotProps.data.userName }}</strong>
                    <small>{{ slotProps.data.userEmail }}</small>
                  </div>
                </template>
              </Column>

              <Column field="tripInfo" header="Viaje">
                <template #body="slotProps">
                  <div class="trip-info">
                    <div><i class="pi pi-map-marker"></i> {{ slotProps.data.tripInfo.origin }} → {{ slotProps.data.tripInfo.destination }}</div>
                    <small>{{ slotProps.data.tripInfo.date }} - {{ slotProps.data.tripInfo.time }}</small>
                  </div>
                </template>
              </Column>

              <Column field="seats" header="Asientos">
                <template #body="slotProps">
                  <Tag 
                    v-for="seat in slotProps.data.seats" 
                    :key="seat" 
                    :value="seat" 
                    severity="info"
                    class="seat-tag"
                  />
                </template>
              </Column>

              <Column field="totalAmount" header="Monto" sortable>
                <template #body="slotProps">
                  <strong class="amount">${{ slotProps.data.totalAmount.toFixed(2) }}</strong>
                </template>
              </Column>

              <Column header="Acciones" :style="{width: '120px', textAlign: 'center'}">
                <template #body="slotProps">
                  <Button 
                    icon="pi pi-eye" 
                    label="Ver"
                    severity="success"
                    size="small"
                    @click="openDetailsDialog(slotProps.data)"
                  />
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- Pestaña de Rechazados -->
          <TabPanel value="2">
            <template #header>
              <i class="pi pi-times-circle mr-2"></i>
              <span>Rechazados</span>
              <Tag v-if="rejectedPayments.length > 0" :value="rejectedPayments.length" severity="danger" class="ml-2" />
            </template>
            <DataTable 
              :value="rejectedPayments" 
              :loading="loadingRejected"
              :rows="10"
              :paginator="true"
              responsiveLayout="scroll"
              stripedRows
              showGridlines
              emptyMessage="No hay pagos rechazados"
              class="payments-table"
            >
              <Column field="createdAt" header="Fecha Compra" sortable>
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.createdAt) }}
                </template>
              </Column>

              <Column field="rejectionDate" header="Fecha Rechazo" sortable>
                <template #body="slotProps">
                  {{ slotProps.data.rejectionDate ? formatDate(slotProps.data.rejectionDate) : '-' }}
                </template>
              </Column>

              <Column field="userName" header="Pasajero" sortable>
                <template #body="slotProps">
                  <div class="passenger-info">
                    <strong>{{ slotProps.data.userName }}</strong>
                    <small>{{ slotProps.data.userEmail }}</small>
                  </div>
                </template>
              </Column>

              <Column field="tripInfo" header="Viaje">
                <template #body="slotProps">
                  <div class="trip-info">
                    <div><i class="pi pi-map-marker"></i> {{ slotProps.data.tripInfo.origin }} → {{ slotProps.data.tripInfo.destination }}</div>
                    <small>{{ slotProps.data.tripInfo.date }} - {{ slotProps.data.tripInfo.time }}</small>
                  </div>
                </template>
              </Column>

              <Column field="seats" header="Asientos">
                <template #body="slotProps">
                  <Tag 
                    v-for="seat in slotProps.data.seats" 
                    :key="seat" 
                    :value="seat" 
                    severity="info"
                    class="seat-tag"
                  />
                </template>
              </Column>

              <Column field="totalAmount" header="Monto" sortable>
                <template #body="slotProps">
                  <strong class="amount">${{ slotProps.data.totalAmount.toFixed(2) }}</strong>
                </template>
              </Column>

              <Column field="rejectionReason" header="Motivo" :style="{minWidth: '200px'}">
                <template #body="slotProps">
                  <div class="rejection-reason">
                    <i class="pi pi-info-circle"></i>
                    <span>{{ slotProps.data.rejectionReason || 'Sin motivo especificado' }}</span>
                  </div>
                </template>
              </Column>

              <Column header="Acciones" :style="{width: '120px', textAlign: 'center'}">
                <template #body="slotProps">
                  <Button 
                    icon="pi pi-eye" 
                    label="Ver"
                    severity="danger"
                    size="small"
                    @click="openDetailsDialog(slotProps.data)"
                  />
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabView>
      </template>
    </Card>

    <!-- Dialog de Detalles con Comprobante -->
    <Dialog 
      v-model:visible="detailsDialogVisible" 
      header="Detalles del Pago"
      :modal="true"
      :style="{ width: '700px' }"
    >
      <div class="details-dialog-content" v-if="selectedPayment">
        <div class="details-grid">
          <!-- Información del Pasajero y Viaje -->
          <div class="info-section">
            <h3><i class="pi pi-user"></i> Información del Pasajero</h3>
            <div class="info-item">
              <span class="label">Nombre:</span>
              <span class="value">{{ selectedPayment.userName }}</span>
            </div>
            <div class="info-item">
              <span class="label">Email:</span>
              <span class="value">{{ selectedPayment.userEmail }}</span>
            </div>

            <h3 style="margin-top: 1.5rem;"><i class="pi pi-map-marker"></i> Información del Viaje</h3>
            <div class="info-item">
              <span class="label">Ruta:</span>
              <span class="value">{{ selectedPayment.tripInfo.origin }} → {{ selectedPayment.tripInfo.destination }}</span>
            </div>
            <div class="info-item">
              <span class="label">Fecha:</span>
              <span class="value">{{ selectedPayment.tripInfo.date }}</span>
            </div>
            <div class="info-item">
              <span class="label">Hora:</span>
              <span class="value">{{ selectedPayment.tripInfo.time }}</span>
            </div>
            <div class="info-item">
              <span class="label">Asientos:</span>
              <span class="value">
                <Tag 
                  v-for="seat in selectedPayment.seats" 
                  :key="seat" 
                  :value="seat" 
                  severity="info"
                  style="margin-right: 0.25rem;"
                />
              </span>
            </div>
            <div class="info-item">
              <span class="label">Monto Total:</span>
              <span class="value amount-highlight">${{ selectedPayment.totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Comprobante de Pago -->
          <div class="receipt-section">
            <h3><i class="pi pi-image"></i> Comprobante de Pago</h3>
            <div class="receipt-container">
              <img 
                v-if="selectedPayment.receiptUrl" 
                :src="selectedPayment.receiptUrl" 
                alt="Comprobante de pago"
                class="receipt-image"
                @click="openImageViewer"
                style="cursor: pointer;"
                title="Click para ampliar"
              />
              <div v-else class="no-receipt">
                <i class="pi pi-image"></i>
                <p>No hay comprobante adjunto</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección de Acciones - Solo para pagos pendientes -->
        <div class="actions-section" v-if="activeTab === 0">
          <div class="action-card approve-card" v-if="!showApproveForm && !showRejectForm">
            <Button 
              label="Aprobar Pago" 
              icon="pi pi-check" 
              severity="success"
              @click="showApproveForm = true"
              style="width: 100%;"
            />
          </div>
          
          <div class="action-card reject-card" v-if="!showApproveForm && !showRejectForm">
            <Button 
              label="Rechazar Pago" 
              icon="pi pi-times" 
              severity="danger"
              @click="showRejectForm = true"
              style="width: 100%;"
            />
          </div>

          <!-- Formulario de Aprobación -->
          <div class="approve-form" v-if="showApproveForm">
            <h4><i class="pi pi-check-circle"></i> Aprobar Pago</h4>
            <p class="confirmation-text">¿Estás seguro de que deseas aprobar este pago?</p>
            <div class="form-actions">
              <Button 
                label="Cancelar" 
                icon="pi pi-times" 
                @click="cancelApprove"
                text
              />
              <Button 
                label="Confirmar Aprobación" 
                icon="pi pi-check" 
                @click="confirmApprove"
                severity="success"
                :loading="approving"
              />
            </div>
          </div>

          <!-- Formulario de Rechazo -->
          <div class="reject-form" v-if="showRejectForm">
            <h4><i class="pi pi-times-circle"></i> Rechazar Pago</h4>
            <div class="form-field">
              <label>Motivo del rechazo *</label>
              <Textarea 
                v-model="rejectReason" 
                rows="2" 
                placeholder="Explica por qué se rechaza el pago..."
                style="width: 100%"
                :class="{ 'p-invalid': rejectReasonError }"
              />
              <small class="p-error" v-if="rejectReasonError">{{ rejectReasonError }}</small>
            </div>
            <div class="form-actions">
              <Button 
                label="Cancelar" 
                icon="pi pi-times" 
                @click="cancelReject"
                text
              />
              <Button 
                label="Confirmar Rechazo" 
                icon="pi pi-ban" 
                @click="confirmReject"
                severity="danger"
                :loading="rejecting"
              />
            </div>
          </div>
        </div>

        <!-- Información de estado para pagos aprobados o rechazados -->
        <div class="status-info" v-if="activeTab !== 0">
          <div class="status-badge" :class="{ 'approved': activeTab === 1, 'rejected': activeTab === 2 }">
            <i :class="activeTab === 1 ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
            <span v-if="activeTab === 1">Este pago ya ha sido aprobado</span>
            <span v-else>Este pago ha sido rechazado</span>
          </div>
          <div v-if="activeTab === 2 && selectedPayment.rejectionReason" class="rejection-info">
            <h4><i class="pi pi-info-circle"></i> Motivo del Rechazo</h4>
            <p>{{ selectedPayment.rejectionReason }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button 
          label="Cerrar" 
          icon="pi pi-times" 
          @click="closeDetailsDialog"
          text
        />
      </template>
    </Dialog>

    <!-- Visor de Imagen en Tamaño Completo -->
    <Dialog 
      v-model:visible="imageViewerVisible" 
      header="Comprobante de Pago"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '1200px' }"
      :dismissableMask="true"
    >
      <div class="image-viewer">
        <img 
          v-if="selectedPayment?.receiptUrl" 
          :src="selectedPayment.receiptUrl" 
          alt="Comprobante de pago"
          class="fullsize-image"
        />
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import type { PendingPayment } from '../interfaces/payment.interface'
import paymentService from '../services/paymentService'
import { usePendingPaymentsNotification } from '../../../composables/usePendingPaymentsNotification'

const toast = useToast()

// Composable de notificaciones para sincronizar
const { pendingCount, startPolling, stopPolling } = usePendingPaymentsNotification()

// Estado
const loading = ref(false)
const loadingApproved = ref(false)
const loadingRejected = ref(false)
const pendingPayments = ref<PendingPayment[]>([])
const approvedPayments = ref<PendingPayment[]>([])
const rejectedPayments = ref<PendingPayment[]>([])
const selectedPayment = ref<PendingPayment | null>(null)
const activeTab = ref(0)
let autoRefreshInterval: NodeJS.Timeout | null = null

// Dialog de Detalles
const detailsDialogVisible = ref(false)
const showApproveForm = ref(false)
const showRejectForm = ref(false)

// Visor de Imagen
const imageViewerVisible = ref(false)

// Aprobar/Rechazar
const approving = ref(false)
const rejecting = ref(false)
const rejectReason = ref('')
const rejectReasonError = ref('')

// Computed
const totalAmount = computed(() => {
  return pendingPayments.value.reduce((sum, payment) => sum + payment.totalAmount, 0)
})

const currentTabTotalAmount = computed(() => {
  if (activeTab.value === 0) {
    return pendingPayments.value.reduce((sum, payment) => sum + payment.totalAmount, 0)
  } else if (activeTab.value === 1) {
    return approvedPayments.value.reduce((sum, payment) => sum + payment.totalAmount, 0)
  } else {
    return rejectedPayments.value.reduce((sum, payment) => sum + payment.totalAmount, 0)
  }
})

// Métodos
const loadPendingPayments = async () => {
  try {
    loading.value = true
    pendingPayments.value = await paymentService.getPendingPayments()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cargar pagos pendientes',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const loadApprovedPayments = async () => {
  try {
    loadingApproved.value = true
    approvedPayments.value = await paymentService.getApprovedPayments()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cargar pagos aprobados',
      life: 3000
    })
  } finally {
    loadingApproved.value = false
  }
}

const loadRejectedPayments = async () => {
  try {
    loadingRejected.value = true
    rejectedPayments.value = await paymentService.getRejectedPayments()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cargar pagos rechazados',
      life: 3000
    })
  } finally {
    loadingRejected.value = false
  }
}

const onTabChange = (event: any) => {
  // Cargar datos según la pestaña seleccionada
  if (event.index === 0) {
    loadPendingPayments()
  } else if (event.index === 1) {
    loadApprovedPayments()
  } else if (event.index === 2) {
    loadRejectedPayments()
  }
}

const formatDate = (dateString: string | any) => {
  if (!dateString) return 'Fecha no disponible'
  
  try {
    let date: Date
    
    // Si es un array de LocalDateTime de Java [año, mes, día, hora, minuto, segundo, nano]
    if (Array.isArray(dateString)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateString
      date = new Date(year, month - 1, day, hour, minute, second)
    } 
    // Si es un string con formato LocalDateTime de Java (con espacios o T)
    else if (typeof dateString === 'string') {
      const cleanDate = dateString.replace(' ', 'T')
      date = new Date(cleanDate)
    }
    // Si ya es un objeto Date
    else if (dateString instanceof Date) {
      date = dateString
    }
    else {
      return 'Fecha inválida'
    }
    
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida después del parseo:', dateString)
      return 'Fecha inválida'
    }
    
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error al formatear fecha:', dateString, error)
    return 'Fecha inválida'
  }
}

// Dialog de Detalles
const openDetailsDialog = (payment: PendingPayment) => {
  selectedPayment.value = payment
  detailsDialogVisible.value = true
  showApproveForm.value = false
  showRejectForm.value = false
  rejectReason.value = ''
  rejectReasonError.value = ''
}

const closeDetailsDialog = () => {
  detailsDialogVisible.value = false
  selectedPayment.value = null
  showApproveForm.value = false
  showRejectForm.value = false
  rejectReason.value = ''
  rejectReasonError.value = ''
}

// Visor de Imagen
const openImageViewer = () => {
  imageViewerVisible.value = true
}

const closeImageViewer = () => {
  imageViewerVisible.value = false
}

// Aprobar
const cancelApprove = () => {
  showApproveForm.value = false
}

const confirmApprove = async () => {
  if (!selectedPayment.value) return
  
  try {
    approving.value = true
    
    await paymentService.approvePayment({
      purchaseId: selectedPayment.value.id
    })
    
    toast.add({
      severity: 'success',
      summary: 'Pago Aprobado',
      detail: 'El pago ha sido aprobado y los tickets han sido generados',
      life: 4000
    })
    
    closeDetailsDialog()
    // Recargar todas las listas
    await loadPendingPayments()
    await loadApprovedPayments()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al aprobar el pago',
      life: 3000
    })
  } finally {
    approving.value = false
  }
}

// Rechazar
const cancelReject = () => {
  showRejectForm.value = false
  rejectReason.value = ''
  rejectReasonError.value = ''
}

const confirmReject = async () => {
  if (!selectedPayment.value) return
  
  // Validar motivo
  if (!rejectReason.value.trim()) {
    rejectReasonError.value = 'El motivo del rechazo es obligatorio'
    return
  }
  
  try {
    rejecting.value = true
    
    await paymentService.rejectPayment({
      purchaseId: selectedPayment.value.id,
      reason: rejectReason.value
    })
    
    toast.add({
      severity: 'warn',
      summary: 'Pago Rechazado',
      detail: 'El pago ha sido rechazado y los asientos han sido liberados',
      life: 4000
    })
    
    closeDetailsDialog()
    // Recargar todas las listas
    await loadPendingPayments()
    await loadRejectedPayments()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al rechazar el pago',
      life: 3000
    })
  } finally {
    rejecting.value = false
  }
}

// Watch para detectar cambios en el contador de notificaciones
watch(pendingCount, async (newCount, oldCount) => {
  // Si el contador aumentó, hay nuevos pagos pendientes
  if (newCount > oldCount && newCount > 0) {
    console.log('🔔 Nuevo pago detectado, recargando lista...')
    await loadPendingPayments()
  }
})

onMounted(() => {
  // Cargar todos los datos inicialmente
  loadPendingPayments()
  loadApprovedPayments()
  loadRejectedPayments()
  
  // Auto-refrescar cada 30 segundos cuando está en la vista
  autoRefreshInterval = setInterval(() => {
    if (activeTab.value === 0) {
      loadPendingPayments()
    } else if (activeTab.value === 1) {
      loadApprovedPayments()
    } else if (activeTab.value === 2) {
      loadRejectedPayments()
    }
  }, 30000)
})

onUnmounted(() => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
})
</script>

<style scoped lang="scss">
.pending-payments-view {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.payments-header {
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    i {
      color: #f59e0b;
    }
  }
  
  p {
    color: #64748b;
    margin: 0;
    font-size: 1rem;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  border-radius: 12px;
  
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
    
    i {
      font-size: 1.75rem;
    }
  }
  
  .stat-info {
    display: flex;
    flex-direction: column;
    
    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }
    
    .stat-value {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1e293b;
    }
  }
}

.table-card {
  border-radius: 12px;
  
  .passenger-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    strong {
      color: #1e293b;
    }
    
    small {
      color: #64748b;
      font-size: 0.875rem;
    }
  }
  
  .trip-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    div {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1e293b;
    }
    
    small {
      color: #64748b;
      font-size: 0.875rem;
    }
  }
  
  .seat-tag {
    margin-right: 0.5rem;
    margin-bottom: 0.25rem;
  }
  
  .amount {
    color: #3b82f6;
    font-size: 1.125rem;
  }
  
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rejection-reason {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    color: #ef4444;
    font-size: 0.875rem;
    line-height: 1.4;

    i {
      margin-top: 0.2rem;
      flex-shrink: 0;
    }

    span {
      flex: 1;
    }
  }
}

.dialog-content {
  .confirmation-message {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #dbeafe;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    
    i {
      font-size: 2rem;
      color: #3b82f6;
    }
    
    p {
      margin: 0;
      font-weight: 600;
      color: #1e40af;
    }
    
    &.warning {
      background: #fef3c7;
      
      i {
        color: #f59e0b;
      }
      
      p {
        color: #92400e;
      }
    }
  }
  
  .payment-details {
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    
    p {
      margin: 0.5rem 0;
      color: #475569;
      
      strong {
        color: #1e293b;
      }
    }
  }
  
  .form-field {
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #1e293b;
    }
  }
}

// Estilos para el diálogo de detalles
.details-dialog-content {
  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .info-section {
    h3 {
      font-size: 1rem;
      color: #1e293b;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      i {
        color: #3b82f6;
      }
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e2e8f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .label {
        font-weight: 600;
        color: #64748b;
      }
      
      .value {
        color: #1e293b;
        text-align: right;
      }
      
      .amount-highlight {
        font-size: 1.25rem;
        font-weight: 700;
        color: #3b82f6;
      }
    }
  }
  
  .receipt-section {
    h3 {
      font-size: 1rem;
      color: #1e293b;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      i {
        color: #10b981;
      }
    }
    
    .receipt-container {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      background: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
      
      .receipt-image {
        max-width: 100%;
        max-height: 400px;
        border-radius: 4px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      
      .no-receipt {
        text-align: center;
        color: #94a3b8;
        
        i {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        
        p {
          margin: 0;
        }
      }
    }
  }
  
  .actions-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 2px solid #e2e8f0;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
    
    .approve-form,
    .reject-form {
      grid-column: 1 / -1;
      padding: 1rem;
      border-radius: 8px;
      background: #f8fafc;
      
      h4 {
        margin: 0 0 1rem 0;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        i {
          font-size: 1.25rem;
        }
      }

      .confirmation-text {
        margin: 0 0 1rem 0;
        color: #475569;
        font-size: 0.95rem;
      }
      
      .form-field {
        margin-bottom: 1rem;
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #1e293b;
        }
      }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    }
    
    .approve-form {
      border: 2px solid #10b981;
      
      h4 i {
        color: #10b981;
      }
    }
    
    .reject-form {
      border: 2px solid #ef4444;
      
      h4 i {
        color: #ef4444;
      }
    }
  }

  .status-info {
    padding-top: 1.5rem;
    border-top: 2px solid #e2e8f0;
    
    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 1rem;
      
      i {
        font-size: 1.5rem;
      }
      
      &.approved {
        background: #d1fae5;
        color: #065f46;
        border: 2px solid #10b981;
        
        i {
          color: #10b981;
        }
      }
      
      &.rejected {
        background: #fee2e2;
        color: #991b1b;
        border: 2px solid #ef4444;
        
        i {
          color: #ef4444;
        }
      }
    }
    
    .rejection-info {
      padding: 1rem;
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      
      h4 {
        margin: 0 0 0.75rem 0;
        color: #92400e;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        i {
          color: #f59e0b;
        }
      }
      
      p {
        margin: 0;
        color: #78350f;
        line-height: 1.6;
      }
    }
  }
}

// Visor de Imagen en Tamaño Completo
.image-viewer {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  border-radius: 8px;
  padding: 1rem;
  min-height: 400px;
  
  .fullsize-image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 4px;
  }
}
</style>

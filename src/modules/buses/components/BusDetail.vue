<template>
  <Dialog
    v-model:visible="visibleLocal"
    modal
    :style="{ width: '900px' }"
    :dismissableMask="true"
    class="bus-detail-dialog"
    @update:visible="onVisibleChange"
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-car icon-header"></i>
        <h2 class="dialog-title">Detalles del Bus</h2>
      </div>
    </template>

    <div v-if="bus" class="bus-detail-content">
      <!-- Sección: Información General -->
      <div class="detail-section">
        <div class="section-header">
          <i class="pi pi-info-circle"></i>
          <h3>Información General</h3>
        </div>
        
        <div class="info-grid">
          <div class="info-card">
            <label>Placa</label>
            <div class="info-value highlight">{{ bus.plate }}</div>
          </div>
          
          <div class="info-card">
            <label>Número de Unidad</label>
            <div class="info-value">{{ bus.unitNumber || 'N/A' }}</div>
          </div>
          
          <div class="info-card">
            <label>Estado</label>
            <div class="info-value">
              <span :class="['status-badge', `status-${bus.status?.toLowerCase()}`]">
                {{ statusLabel(bus.status) }}
              </span>
            </div>
          </div>
          
          <div class="info-card">
            <label>Número de Asientos</label>
            <div class="info-value">{{ bus.seatCount }}</div>
          </div>
        </div>
      </div>

      <!-- Sección: Especificaciones Técnicas -->
      <div class="detail-section">
        <div class="section-header">
          <i class="pi pi-cog"></i>
          <h3>Especificaciones Técnicas</h3>
        </div>
        
        <div class="info-grid">
          <div class="info-card">
            <label>Marca del Chasis</label>
            <div class="info-value">{{ bus.chassisBrand || 'N/A' }}</div>
          </div>
          
          <div class="info-card">
            <label>Número de Chasis</label>
            <div class="info-value">{{ bus.chassisNumber || 'N/A' }}</div>
          </div>
          
          <div class="info-card">
            <label>Marca de Carrocería</label>
            <div class="info-value">{{ bus.bodyBrand || 'N/A' }}</div>
          </div>
          
          <div class="info-card">
            <label>Número de Carrocería</label>
            <div class="info-value">{{ bus.bodyNumber || 'N/A' }}</div>
          </div>
        </div>
      </div>

      <!-- Sección: Foto del Bus -->
      <div class="detail-section" v-if="bus.photo">
        <div class="section-header">
          <i class="pi pi-image"></i>
          <h3>Fotografía</h3>
        </div>
        <div class="photo-container">
          <img :src="photoUrl" alt="Foto del bus" class="bus-photo" />
        </div>
      </div>

      <!-- Sección: Información de Mantenimiento Actual -->
      <div class="detail-section">
        <div class="section-header">
          <i class="pi pi-wrench"></i>
          <h3>Información de Mantenimiento</h3>
        </div>
        
        <div class="info-grid">
          <div class="info-card">
            <label>Kilometraje Total</label>
            <div class="info-value">{{ formatNumber(bus.totalKilometers) }} km</div>
          </div>
          
          <div class="info-card">
            <label>Último Mantenimiento</label>
            <div class="info-value">{{ formatDate(bus.lastMaintenanceDate) }}</div>
          </div>
          
          <div class="info-card">
            <label>Próximo Mantenimiento</label>
            <div class="info-value">{{ formatNumber(bus.nextMaintenanceKm) }} km</div>
          </div>
        </div>
      </div>

      <!-- Sección: Historial de Mantenimiento -->
      <div class="detail-section">
        <div class="section-header">
          <i class="pi pi-history"></i>
          <h3>Historial de Mantenimiento</h3>
        </div>
        
        <div v-if="loadingHistory" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Cargando historial...</span>
        </div>
        
        <div v-else-if="maintenanceHistory.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>No hay registros de mantenimiento</p>
        </div>
        
        <div v-else class="timeline">
          <div 
            v-for="(record, index) in maintenanceHistory" 
            :key="index"
            class="timeline-item"
          >
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-date">{{ formatDate(record.maintenanceDate) }}</span>
                <span class="timeline-km">{{ formatNumber(record.kilometersAtMaintenance) }} km</span>
              </div>
              <div class="timeline-body">
                <p class="timeline-type">{{ record.maintenanceType }}</p>
                <p class="timeline-description">{{ record.description }}</p>
                <p class="timeline-cost" v-if="record.cost">
                  Costo: ${{ formatNumber(record.cost) }}
                </p>
                <p class="timeline-workshop" v-if="record.workshop">
                  Taller: {{ record.workshop }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección: Fechas de Registro -->
      <div class="detail-section">
        <div class="info-grid">
          <div class="info-card">
            <label>Fecha de Registro</label>
            <div class="info-value">{{ formatDateTime(bus.createdAt) }}</div>
          </div>
          
          <div class="info-card">
            <label>Última Actualización</label>
            <div class="info-value">{{ formatDateTime(bus.updatedAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Cerrar" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="onClose"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import type { BusDto, MaintenanceRecordDto } from '../interfaces/bus.interface'
import { getMaintenanceRecords } from '../services/busService'

const props = defineProps<{
  visible: boolean
  bus: BusDto | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const visibleLocal = ref(props.visible)
const loadingHistory = ref(false)
const maintenanceHistory = ref<MaintenanceRecordDto[]>([])

watch(() => props.visible, (val) => {
  visibleLocal.value = val
  if (val && props.bus) {
    loadMaintenanceHistory()
  }
})

watch(() => props.bus, (val) => {
  if (val && visibleLocal.value) {
    loadMaintenanceHistory()
  }
})

const photoUrl = computed(() => {
  if (!props.bus?.photo) return ''
  // Si ya es una URL completa (data:image)
  if (typeof props.bus.photo === 'string' && props.bus.photo.startsWith('data:')) {
    return props.bus.photo
  }
  // Si es un array de bytes en base64
  if (typeof props.bus.photo === 'string') {
    return `data:image/png;base64,${props.bus.photo}`
  }
  return ''
})

function statusLabel(status: string | undefined): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    MAINTENANCE: 'Mantenimiento'
  }
  return labels[status || ''] || status || 'N/A'
}

function formatNumber(value: any): string {
  if (value == null) return 'N/A'
  const num = typeof value === 'number' ? value : parseFloat(value)
  return isNaN(num) ? 'N/A' : num.toLocaleString('es-ES', { maximumFractionDigits: 2 })
}

function formatDate(value: any): string {
  if (!value) return 'N/A'
  try {
    const date = new Date(value)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch {
    return 'N/A'
  }
}

function formatDateTime(value: any): string {
  if (!value) return 'N/A'
  try {
    const date = new Date(value)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

async function loadMaintenanceHistory() {
  if (!props.bus?.id) return
  
  loadingHistory.value = true
  try {
    const history = await getMaintenanceRecords(props.bus.id)
    maintenanceHistory.value = history
  } catch (error) {
    console.error('Error loading maintenance history:', error)
    maintenanceHistory.value = []
  } finally {
    loadingHistory.value = false
  }
}

function onVisibleChange(value: boolean) {
  emit('update:visible', value)
}

function onClose() {
  visibleLocal.value = false
  emit('update:visible', false)
}
</script>

<style scoped>
.bus-detail-dialog {
  font-family: 'Inter', sans-serif;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-header {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.dialog-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.bus-detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem 0;
}

.detail-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e9ecef;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #dee2e6;
}

.section-header i {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.section-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #495057;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.info-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.info-card label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: #212529;
}

.info-value.highlight {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-inactive {
  background: #f8d7da;
  color: #721c24;
}

.status-maintenance {
  background: #fff3cd;
  color: #856404;
}

.photo-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
}

.bus-photo {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-left: 1rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 24px;
  bottom: -24px;
  width: 2px;
  background: #dee2e6;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  border: 3px solid white;
  box-shadow: 0 0 0 2px var(--primary-color);
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-content {
  flex: 1;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f3f5;
}

.timeline-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-color);
}

.timeline-km {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
}

.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.timeline-type {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
}

.timeline-description {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
}

.timeline-cost {
  font-size: 0.875rem;
  font-weight: 600;
  color: #28a745;
  margin: 0;
}

.timeline-workshop {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
  margin: 0;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
  color: #6c757d;
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>

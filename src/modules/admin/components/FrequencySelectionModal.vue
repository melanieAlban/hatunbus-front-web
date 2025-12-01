<template>
  <Dialog
    v-model:visible="visibleLocal"
    modal
    :style="{ width: '900px', maxHeight: '90vh' }"
    :dismissableMask="true"
    class="frequency-selection-modal"
  >
    <template #header>
      <div class="modal-header">
        <i class="pi pi-sitemap"></i>
        <h2>Seleccionar Frecuencias</h2>
      </div>
    </template>

    <div class="modal-content">
      <div class="search-bar">
        <i class="pi pi-search"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por origen, destino o nombre..."
          class="search-input"
        />
      </div>

      <div class="selection-summary">
        <div class="summary-info">
          <i class="pi pi-check-circle"></i>
          <span>{{ selectedIds.length }} de {{ filteredFrequencies.length }} frecuencias seleccionadas</span>
        </div>
        <button class="btn-ghost btn-sm" @click="clearAll" v-if="selectedIds.length > 0">
          <i class="pi pi-times"></i>
          Limpiar selección
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="pi pi-spinner pi-spin"></i>
        <span>Cargando frecuencias...</span>
      </div>

      <div v-else-if="filteredFrequencies.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>{{ searchQuery ? 'No se encontraron frecuencias' : 'No hay frecuencias activas disponibles' }}</p>
      </div>

      <div v-else class="frequencies-list">
        <div
          v-for="freq in filteredFrequencies"
          :key="freq.id"
          :class="['frequency-card', { selected: isSelected(freq.id) }]"
          @click="toggleSelection(freq.id)"
        >
          <div class="frequency-checkbox">
            <Checkbox :modelValue="isSelected(freq.id)" :binary="true" />
          </div>

          <div class="frequency-content">
            <div class="frequency-header">
              <div class="frequency-title">
                <h4>{{ getFrequencyRouteLabel(freq) }}</h4>
                <Tag :value="freq.active ? 'Activa' : 'Inactiva'"
                     :severity="freq.active ? 'success' : 'danger'" />
              </div>
              <div class="frequency-meta">
                <span class="meta-item">
                  <i class="pi pi-file"></i>
                  {{ freq.name || freq.regulatoryResolution || 'Sin nombre' }}
                </span>
              </div>
            </div>

            <div class="frequency-details">
              <div class="detail-section">
                <div class="detail-label">
                  <i class="pi pi-calendar"></i>
                  Días Operativos
                </div>
                <div class="operating-days">
                  <span
                    v-for="day in freq.operatingDays"
                    :key="day"
                    class="day-badge"
                  >
                    {{ formatDayShort(day) }}
                  </span>
                </div>
              </div>

              <div class="detail-section">
                <div class="detail-label">
                  <i class="pi pi-map"></i>
                  Segmentos ({{ freq.segments?.length || 0 }})
                </div>
                <div class="segments-list">
                  <div
                    v-for="segment in getSortedSegments(freq)"
                    :key="segment.id"
                    class="segment-item"
                  >
                    <div class="segment-number">{{ segment.segmentOrder }}</div>
                    <div class="segment-info">
                      <div class="segment-route">
                        <strong>{{ segment.routeOrigin || 'Origen' }}</strong>
                        <i class="pi pi-arrow-right"></i>
                        <strong>{{ segment.routeDestination || 'Destino' }}</strong>
                      </div>
                      <div class="segment-meta">
                        <span class="segment-time">
                          <i class="pi pi-clock"></i>
                          {{ segment.departureTime }}
                        </span>
                        <span class="segment-duration" v-if="segment.estimatedDuration">
                          <i class="pi pi-stopwatch"></i>
                          {{ formatDuration(segment.estimatedDuration) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <button class="btn-ghost" @click="cancel">
          <i class="pi pi-times"></i>
          Cancelar
        </button>
        <button class="btn-primary" @click="confirm">
          <i class="pi pi-check"></i>
          Confirmar Selección ({{ selectedIds.length }})
        </button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import type { FrequencyWithSegmentsDto } from '@/modules/cooperatives/interfaces/frequency.interface'

const props = defineProps<{
  visible: boolean
  frequencies: FrequencyWithSegmentsDto[]
  modelValue: string[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:modelValue', value: string[]): void
}>()

const visibleLocal = ref(props.visible)
const selectedIds = ref<string[]>([...props.modelValue])
const searchQuery = ref('')

watch(() => props.visible, (val) => {
  visibleLocal.value = val
  if (val) {
    selectedIds.value = [...props.modelValue]
    searchQuery.value = ''
  }
})

watch(visibleLocal, (val) => {
  emit('update:visible', val)
})

const filteredFrequencies = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.frequencies
  }

  const query = searchQuery.value.toLowerCase().trim()
  return props.frequencies.filter(freq => {
    const routeLabel = getFrequencyRouteLabel(freq).toLowerCase()
    const name = (freq.name || freq.regulatoryResolution || '').toLowerCase()

    return routeLabel.includes(query) || name.includes(query)
  })
})

function getFrequencyRouteLabel(freq: FrequencyWithSegmentsDto): string {
  if (!freq.segments || freq.segments.length === 0) {
    return 'Sin segmentos'
  }

  const sorted = [...freq.segments].sort((a, b) =>
    (a.segmentOrder || 0) - (b.segmentOrder || 0)
  )

  const origin = sorted[0].routeOrigin || 'Origen'
  const destination = sorted[sorted.length - 1].routeDestination || 'Destino'

  return `${origin} → ${destination}`
}

function getSortedSegments(freq: FrequencyWithSegmentsDto) {
  if (!freq.segments) return []
  return [...freq.segments].sort((a, b) =>
    (a.segmentOrder || 0) - (b.segmentOrder || 0)
  )
}

function isSelected(id: string): boolean {
  return selectedIds.value.includes(id)
}

function toggleSelection(id: string) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function clearAll() {
  selectedIds.value = []
}

function cancel() {
  visibleLocal.value = false
}

function confirm() {
  emit('update:modelValue', selectedIds.value)
  visibleLocal.value = false
}

function formatDayShort(day: string): string {
  const map: Record<string, string> = {
    MONDAY: 'Lun',
    TUESDAY: 'Mar',
    WEDNESDAY: 'Mié',
    THURSDAY: 'Jue',
    FRIDAY: 'Vie',
    SATURDAY: 'Sáb',
    SUNDAY: 'Dom',
  }
  return map[day] || day.substring(0, 3)
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}
</script>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--app-text);
}

.modal-header i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.modal-content {
  padding: 0;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.search-bar i {
  color: #64748b;
  font-size: 1.125rem;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--app-text);
  outline: none;
}

.search-input::placeholder {
  color: #94a3b8;
}

.selection-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e40af;
  font-weight: 600;
}

.summary-info i {
  color: #3b82f6;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: #64748b;
}

.loading-state i,
.empty-state i {
  font-size: 2.5rem;
}

.frequencies-list {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.frequency-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.frequency-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.frequency-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.frequency-checkbox {
  padding-top: 0.25rem;
}

.frequency-content {
  flex: 1;
  min-width: 0;
}

.frequency-header {
  margin-bottom: 1rem;
}

.frequency-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.frequency-title h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--app-text);
}

.frequency-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #64748b;
  font-size: 0.875rem;
}

.meta-item i {
  font-size: 0.875rem;
}

.frequency-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-section {
  background: #f8fafc;
  padding: 0.875rem;
  border-radius: 8px;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--app-text);
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
}

.detail-label i {
  color: #3b82f6;
}

.operating-days {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.day-badge {
  background: #3b82f6;
  color: white;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.segments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.segment-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.segment-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.segment-info {
  flex: 1;
  min-width: 0;
}

.segment-route {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: var(--app-text);
  font-size: 0.9375rem;
}

.segment-route i {
  font-size: 0.75rem;
  color: #64748b;
}

.segment-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.segment-time,
.segment-duration {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #64748b;
  font-size: 0.8125rem;
}

.segment-time i,
.segment-duration i {
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
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

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
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

/* Scrollbar personalizado */
.frequencies-list::-webkit-scrollbar {
  width: 8px;
}

.frequencies-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.frequencies-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.frequencies-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

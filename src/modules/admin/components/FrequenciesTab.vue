<template>
  <div class="frequencies-tab">
    <div class="toolbar">
      <div class="filters">
        <Dropdown
          v-model="selectedRouteFilter"
          :options="routeFilterOptions"
          option-label="label"
          option-value="value"
          placeholder="Filtrar por ruta"
          :show-clear="true"
          class="filter-dropdown"
        />
        <Dropdown
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          placeholder="Estado"
          class="filter-dropdown"
        />
        <InputText
          v-model="searchText"
          placeholder="Buscar por resolución, origen o destino"
          class="search-input"
        />
      </div>
      <div class="toolbar-actions">
        <Button
          icon="pi pi-refresh"
          label="Refrescar"
          @click="loadFrequencies"
          :loading="loading"
          class="p-button-text"
        />
        <Button
          icon="pi pi-plus"
          label="Nueva Frecuencia"
          class="p-button-success"
          @click="createFrequency"
        />
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <Skeleton width="100%" height="3rem" v-for="n in 5" :key="`skeleton-${n}`" />
    </div>
    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <div>
        <p>{{ error }}</p>
        <Button label="Reintentar" icon="pi pi-refresh" class="p-button-text" @click="loadFrequencies" />
      </div>
    </div>
    <div v-else-if="filteredFrequencies.length === 0" class="empty-state">
      <i class="pi pi-calendar-times"></i>
      <p>No se encontraron frecuencias.</p>
    </div>
    <div v-else class="table-wrapper">
      <DataTable
        :value="filteredFrequencies"
        data-key="id"
        responsive-layout="scroll"
        :rows="10"
        :paginator="filteredFrequencies.length > 10"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        :rows-per-page-options="[10, 25, 50]"
      >
        <Column header="Ruta" :sortable="true">
          <template #body="{ data }">
            <div class="route-info">
              <span>{{ data.origin || '-' }} → {{ data.destination || '-' }}</span>
            </div>
          </template>
        </Column>
        <Column header="Segmentos" field="segments" :sortable="true">
          <template #body="{ data }">
            <Tag :value="`${data.segments?.length || 0} segmentos`" severity="info" />
          </template>
        </Column>
        <Column header="Estado" field="active" :sortable="true">
          <template #body="{ data }">
            <Tag :severity="data.active ? 'success' : 'danger'" :value="data.active ? 'Activa' : 'Inactiva'" />
          </template>
        </Column>
        <Column header="Resolución ANT" field="regulatoryResolution" :sortable="true">
          <template #body="{ data }">
            {{ data.regulatoryResolution || '-' }}
          </template>
        </Column>
        <Column header="Acciones" style="width: 180px;">
          <template #body="{ data }">
            <div class="row-actions">
              <Button
                icon="pi pi-eye"
                class="p-button-text"
                @click="viewFrequencyDetails(data)"
                v-tooltip.top="'Ver detalles'"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-text p-button-danger"
                @click="confirmDelete(data)"
                v-tooltip.top="'Eliminar'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Details Dialog -->
    <Dialog
      v-model:visible="detailsDialogVisible"
      modal
      header="Detalles de Frecuencia"
      :style="{ width: '700px' }"
    >
      <div v-if="selectedFrequency" class="frequency-details">
        <div class="detail-header">
          <h4>{{ selectedFrequency.regulatoryResolution }}</h4>
          <Tag
            :severity="selectedFrequency.active ? 'success' : 'danger'"
            :value="selectedFrequency.active ? 'Activa' : 'Inactiva'"
          />
        </div>
        <Divider />
        <div class="segments-list">
          <h5>Segmentos ({{ selectedFrequency.segments?.length || 0 }})</h5>
          <div
            v-for="segment in selectedFrequency.segments"
            :key="segment.id"
            class="segment-detail"
          >
            <div class="segment-header">
              <span class="segment-order">Orden {{ segment.segmentOrder }}</span>
              <span class="segment-route">{{ segment.routeOrigin }} → {{ segment.routeDestination }}</span>
            </div>
            <div class="segment-meta">
              <span><i class="pi pi-clock"></i> Salida: {{ segment.departureTime }}</span>
              <span><i class="pi pi-hourglass"></i> Duración: {{ segment.estimatedDuration }} min</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import { listAllFrequenciesByCooperative, deleteFrequency, deactivateFrequency } from '@/modules/routes/services/routeService'
import type { FrequencyDto } from '@/modules/routes/interfaces/route.interface'
import { confirm, success, error as notifyError } from '@/lib/notifier'

const props = defineProps<{
  cooperativeId: string | null
}>()

const emit = defineEmits<{
  createFrequency: []
}>()

const frequencies = ref<FrequencyDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedRouteFilter = ref<string | null>(null)
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const searchText = ref('')
const detailsDialogVisible = ref(false)
const selectedFrequency = ref<FrequencyDto | null>(null)
const sanitizedFrequencies = computed(() =>
  frequencies.value.map(stripCompositeSegments)
)

const statusOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Activas', value: 'active' },
  { label: 'Inactivas', value: 'inactive' }
]

const routeFilterOptions = computed(() => {
  const uniqueRoutes = new Set<string>()
  sanitizedFrequencies.value.forEach(freq => {
    if (freq.origin && freq.destination) {
      uniqueRoutes.add(`${freq.origin} → ${freq.destination}`)
    }
  })
  return [
    { label: 'Todas las rutas', value: null },
    ...Array.from(uniqueRoutes).map(route => ({ label: route, value: route }))
  ]
})

const filteredFrequencies = computed(() => {
  let result = sanitizedFrequencies.value

  // Filtro por estado
  if (statusFilter.value === 'active') {
    result = result.filter(f => f.active)
  } else if (statusFilter.value === 'inactive') {
    result = result.filter(f => !f.active)
  }

  // Filtro por ruta
  if (selectedRouteFilter.value) {
    result = result.filter(f => {
      const route = `${f.origin} → ${f.destination}`
      return route === selectedRouteFilter.value
    })
  }

  // Búsqueda por texto
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(f =>
      f.regulatoryResolution?.toLowerCase().includes(search) ||
      f.origin?.toLowerCase().includes(search) ||
      f.destination?.toLowerCase().includes(search)
    )
  }

  return result
})

async function loadFrequencies() {
  if (!props.cooperativeId) return

  loading.value = true
  error.value = null

  try {
    frequencies.value = await listAllFrequenciesByCooperative(props.cooperativeId)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error al cargar frecuencias'
    notifyError('Error', error.value)
  } finally {
    loading.value = false
  }
}

function viewFrequencyDetails(frequency: FrequencyDto) {
  selectedFrequency.value = stripCompositeSegments(frequency)
  detailsDialogVisible.value = true
}

async function confirmDelete(frequency: FrequencyDto) {
  const confirmed = await confirm(
    `¿Eliminar permanentemente la frecuencia ${frequency.regulatoryResolution}?`,
    'Confirmar eliminación'
  )

  if (!confirmed) return

  try {
    await deleteFrequency(frequency.id)
    success('Éxito', 'Frecuencia eliminada')
    await loadFrequencies()
  } catch (err: any) {
    notifyError('Error', err.response?.data?.message || 'Error al eliminar')
  }
}

function createFrequency() {
  emit('createFrequency')
}

defineExpose({
  reload: loadFrequencies,
})

function stripCompositeSegments(freq: FrequencyDto): FrequencyDto {
  return {
    ...freq,
    segments: (freq.segments || []).filter(segment => !isCompositeSegment(segment))
  }
}

function isCompositeSegment(segment: { segmentOrder?: number }) {
  return segment.segmentOrder !== undefined && segment.segmentOrder >= 900
}

watch(() => props.cooperativeId, (newId) => {
  if (newId) {
    loadFrequencies()
  } else {
    frequencies.value = []
  }
}, { immediate: true })
</script>

<style scoped>
.frequencies-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-dropdown {
  min-width: 200px;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

.table-wrapper {
  background: white;
  border: 1px solid var(--surface-border, #e2e8f0);
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.row-actions {
  display: flex;
  gap: 0.25rem;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-state {
  gap: 0.5rem;
}

.error-state i,
.empty-state i {
  font-size: 3rem;
  opacity: 0.3;
}

.route-info span {
  font-size: 0.95rem;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
}

.frequency-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header h4 {
  margin: 0;
  font-size: 1.25rem;
}

.segments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.segments-list h5 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color-secondary);
}

.segment-detail {
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  background: var(--surface-ground);
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.segment-order {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  font-weight: 600;
}

.segment-route {
  font-weight: 600;
}

.segment-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.segment-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>

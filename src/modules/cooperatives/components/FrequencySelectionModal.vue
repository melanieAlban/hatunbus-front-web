<template>
  <Dialog
    :visible="visible"
    @update:visible="onVisibleChange"
    :style="{ width: '70rem', maxWidth: '95vw' }"
    :breakpoints="{ '1199px': '75vw', '575px': '95vw' }"
    :modal="true"
    class="p-fluid frequency-selection-dialog"
    :draggable="false"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">
          <i class="pi pi-calendar mr-2"></i>
          Gestionar Frecuencias - {{ cooperativeName }}
        </span>
      </div>
    </template>

    <div class="frequency-selection-content">
      <!-- Estado de carga -->
      <div v-if="store.loading" class="loading-state">
        <i class="pi pi-spinner pi-spin loading-icon"></i>
        <span>Cargando frecuencias...</span>
      </div>

      <!-- Mensaje de error -->
      <div v-else-if="store.error" class="error-message">
        <i class="pi pi-exclamation-triangle error-icon"></i>
        <span>{{ store.error }}</span>
      </div>

      <!-- Tabla de frecuencias -->
      <div v-else class="table-wrapper">
        <DataTable
          v-model:selection="selectedFrequencies"
          :value="store.availableFrequencies"
          dataKey="id"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20]"
          class="frequency-table"
          responsiveLayout="scroll"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" />

          <Column field="name" header="Frecuencia" :sortable="true">
            <template #body="slotProps">
              <div class="frequency-name">
                <i class="pi pi-clock mr-2"></i>
                <span>{{ slotProps.data.name || 'Sin nombre' }}</span>
              </div>
            </template>
          </Column>

          <Column field="operatingDays" header="Días Operativos" :sortable="false">
            <template #body="slotProps">
              <div class="days-container">
                <span v-for="day in slotProps.data.operatingDays" :key="day" class="day-badge">
                  {{ translateDay(day) }}
                </span>
              </div>
            </template>
          </Column>

          <Column field="regulatoryResolution" header="Resolución ANT" :sortable="true">
            <template #body="slotProps">
              <span class="resolution-text">{{ slotProps.data.regulatoryResolution || 'N/A' }}</span>
            </template>
          </Column>

          <Column field="segments" header="Rutas/Segmentos" :sortable="false">
            <template #body="slotProps">
              <div class="segments-container">
                <div v-for="segment in slotProps.data.segments" :key="segment.id" class="segment-item">
                  <i class="pi pi-map-marker segment-icon"></i>
                  <span class="segment-route">{{ segment.routeOrigin }} → {{ segment.routeDestination }}</span>
                  <span class="segment-time">({{ segment.departureTime }})</span>
                </div>
                <span v-if="!slotProps.data.segments || slotProps.data.segments.length === 0" class="no-segments">
                  Sin segmentos
                </span>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          class="p-button-text"
          @click="onCancel"
          :disabled="isSaving"
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          @click="onSave"
          :loading="isSaving"
          :disabled="store.loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useFrequencyStore } from '../store/useFrequencyStore'
import type { FrequencyWithSegmentsDto } from '../interfaces/frequency.interface'

// PrimeVue Components
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import { error as notifyError } from '../../../lib/notifier'

const props = defineProps<{
  visible: boolean
  cooperativeId: string | null
  cooperativeName: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

const store = useFrequencyStore()
const selectedFrequencies = ref<FrequencyWithSegmentsDto[]>([])
const isSaving = ref(false)

// Cargar frecuencias cuando se abre el modal
watch(() => props.visible, async (isVisible) => {
  if (isVisible && props.cooperativeId) {
    try {
      await store.fetchAvailable(props.cooperativeId)
      // Pre-select already selected frequencies
      selectedFrequencies.value = store.availableFrequencies.filter(f => f.selected)
    } catch (error: any) {
      notifyError('Error', error?.message || 'Error al cargar frecuencias')
    }
  }
})

const onVisibleChange = (value: boolean) => {
  if (!value) {
    selectedFrequencies.value = []
  }
  emit('update:visible', value)
}

const onCancel = () => {
  selectedFrequencies.value = []
  emit('update:visible', false)
}

const onSave = async () => {
  if (!props.cooperativeId) return

  isSaving.value = true
  try {
    const frequencyIds = selectedFrequencies.value.map(f => f.id)
    await store.updateSelection(props.cooperativeId, frequencyIds)

    emit('saved')
    emit('update:visible', false)
  } catch (error: any) {
    notifyError('Error', error?.message || 'Error al actualizar frecuencias')
  } finally {
    isSaving.value = false
  }
}

const translateDay = (day: string): string => {
  const translations: Record<string, string> = {
    MONDAY: 'Lun',
    TUESDAY: 'Mar',
    WEDNESDAY: 'Mié',
    THURSDAY: 'Jue',
    FRIDAY: 'Vie',
    SATURDAY: 'Sáb',
    SUNDAY: 'Dom'
  }
  return translations[day] || day
}
</script>

<style scoped>
.frequency-selection-dialog {
  font-family: var(--font-family);
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--app-text);
  display: flex;
  align-items: center;
}

.frequency-selection-content {
  min-height: 400px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--gray-medium);
  font-size: 1rem;
}

.loading-icon {
  font-size: 1.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #c32020;
}

.error-icon {
  font-size: 1.25rem;
}

.table-wrapper {
  margin-top: 1rem;
}

.frequency-name {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: var(--app-text);
}

.days-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.day-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--surface-50);
  border: 1px solid var(--gray-light);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--app-text);
}

.resolution-text {
  color: var(--gray-medium);
  font-size: 0.875rem;
}

.segments-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.segment-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: var(--surface-50);
  border-radius: 4px;
  font-size: 0.875rem;
}

.segment-icon {
  color: var(--app-accent);
  font-size: 0.875rem;
}

.segment-route {
  font-weight: 500;
  color: var(--app-text);
}

.segment-time {
  color: var(--gray-medium);
  font-size: 0.8rem;
}

.no-segments {
  color: var(--gray-medium);
  font-style: italic;
  font-size: 0.875rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
}

/* Override PrimeVue DataTable styles */
:deep(.frequency-table) {
  font-size: 0.875rem;
}

:deep(.frequency-table .p-datatable-header) {
  background: var(--beige-bone);
  border: 1px solid var(--gray-light);
}

:deep(.frequency-table .p-datatable-thead > tr > th) {
  background: var(--beige-bone);
  color: var(--app-text);
  font-weight: 600;
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-light);
}

:deep(.frequency-table .p-datatable-tbody > tr) {
  transition: background-color 0.2s;
}

:deep(.frequency-table .p-datatable-tbody > tr:hover) {
  background: rgba(0, 0, 0, 0.02);
}

:deep(.frequency-table .p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-light);
}

:deep(.p-checkbox .p-checkbox-box) {
  border-color: var(--app-accent);
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: var(--app-accent);
  border-color: var(--app-accent);
}
</style>

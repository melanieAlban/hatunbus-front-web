<template>
  <Dialog
    v-model:visible="visibleLocal"
    modal
    :style="{ width: '95vw', maxWidth: '1400px', maxHeight: '95vh' }"
    :dismissableMask="true"
    class="template-dialog"
    @update:visible="onVisibleChange"
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-th-large icon-header"></i>
        <h2 class="dialog-title">Crear Template Personalizado</h2>
      </div>
    </template>

    <div class="template-form">
      <!-- Información básica -->
      <div class="form-section basic-info">
        <h3>Información Básica</h3>
        
        <div class="form-row">
          <div class="form-field">
            <label for="templateName">Nombre del Template *</label>
            <InputText
              id="templateName"
              v-model="formData.name"
              placeholder="Ej: Premium 36 con baño"
              maxlength="70"
              :class="{ 'p-invalid': errors.name }"
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>

          <div class="form-field">
            <label for="description">Descripción</label>
            <InputText
              id="description"
              v-model="formData.description"
              placeholder="Describe las características del template"
              maxlength="150"
            />
          </div>
        </div>
      </div>

      <!-- Diseñador Visual de Bus -->
      <div class="form-section designer-section">
        <h3>Diseño Visual del Bus</h3>
        <p class="help-text">
          <i class="pi pi-info-circle"></i>
          <strong>Arrastra y suelta</strong> las herramientas sobre las celdas, o haz <strong>clic</strong> en una herramienta y luego en una celda. El <strong>pasillo central está fijo</strong> (2 asientos | pasillo | 2 asientos). Click derecho en asiento cambia tipo.
        </p>
        
        <BusLayoutDesigner 
          :initialRows="10"
          :initialCols="4"
          :initialSeats="seatLayoutItems"
          @update:seats="onSeatsUpdated"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="onCancel"
          class="p-button-text"
        />
        <Button
          label="Crear Template"
          icon="pi pi-check"
          @click="onCreate"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import BusLayoutDesigner from './BusLayoutDesigner.vue'
import { SeatType } from '../interfaces/template.interface'
import type { CreateBusTemplateRequest, SeatConfiguration, SeatLayoutItem } from '../interfaces/template.interface'
import * as templateService from '../services/templateService'
import { success, error as notifyError } from '@/lib/notifier'
import { useAuthStore } from '@/modules/auth/store/useAuthStore'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'created'): void
}>()

const authStore = useAuthStore()
const visibleLocal = ref(props.visible)
const loading = ref(false)
const formData = ref<CreateBusTemplateRequest>({
  cooperativeId: authStore.user?.cooperativeId || null,
  name: '',
  description: '',
  seatCount: 0,
  seatConfiguration: {}
})

const seatLayoutItems = ref<SeatLayoutItem[]>([])
const errors = ref<Record<string, string>>({})

watch(() => props.visible, (val) => {
  visibleLocal.value = val
  if (val) {
    resetForm()
  }
})

function onVisibleChange(val: boolean) {
  emit('update:visible', val)
}

function resetForm() {
  formData.value = {
    cooperativeId: authStore.user?.cooperativeId || null,
    name: '',
    description: '',
    seatCount: 0,
    seatConfiguration: {}
  }
  seatLayoutItems.value = []
  errors.value = {}
}

function onSeatsUpdated(seats: SeatLayoutItem[]) {
  seatLayoutItems.value = seats;
  // Contar solo asientos (no elementos especiales)
  formData.value.seatCount = seats.filter(s => s.type === 'NORMAL' || s.type === 'VIP' || s.type === 'SEMI_BED' || s.type === 'BED').length;
  // Construir seatConfiguration como Map<índice, tipo> (asientos y especiales)
  const config: SeatConfiguration = {};
  seats.forEach(seat => {
    if (typeof seat.row === 'number' && typeof seat.column === 'number' && seat.type) {
      const index = (seat.row - 1) * 5 + (seat.column - 1);
      config[index] = seat.type;
    }
  });
  formData.value.seatConfiguration = config;
}

function validate(): boolean {
  errors.value = {}
  
  if (!formData.value.name?.trim()) {
    errors.value.name = 'El nombre es obligatorio'
    notifyError('Campo requerido', 'El nombre del template es obligatorio')
    return false
  }
  
  if (formData.value.seatCount < 10) {
    errors.value.seats = 'Debe configurar al menos 10 asientos'
    notifyError('Configuración incompleta', 'Debe configurar al menos 10 asientos en el diseño')
    return false
  }
  
  return Object.keys(errors.value).length === 0
}

async function onCreate() {
  if (!validate()) return
  
  loading.value = true
  
  try {
    await templateService.createTemplate(formData.value)
    success('Éxito', 'Template creado correctamente')
    emit('created')
    emit('update:visible', false)
  } catch (err: any) {
    console.error('[TemplateForm] Error creating template:', err)
    notifyError('Error', err.response?.data?.message || 'No se pudo crear el template')
  } finally {
    loading.value = false
  }
}

function onCancel() {
  emit('update:visible', false)
}
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-header {
  font-size: 1.5rem;
  color: var(--app-accent);
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.template-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--app-text);
  border-bottom: 2px solid var(--app-accent);
  padding-bottom: 0.5rem;
}

.basic-info .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.designer-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
}

.help-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  padding: 0.75rem;
  background: #e7f3ff;
  border-left: 3px solid #2196f3;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #1976d2;
}

.help-text i {
  font-size: 1.25rem;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--app-text);
}

.form-field :deep(.p-inputtext) {
  width: 100%;
}

.p-error {
  color: #e24c4c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>

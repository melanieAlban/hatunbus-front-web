<template>
  <Dialog 
    :visible="visible" 
    @update:visible="onVisibleChange"
    :style="{ width: '55rem', maxWidth: '95vw' }" 
    :breakpoints="{ '1199px': '50vw', '575px': '95vw' }"
    :modal="true"
    class="p-fluid bus-form-dialog"
    :draggable="false"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">
          <i class="pi pi-car mr-2"></i>
          {{ isCreate ? 'Crear Nuevo Bus' : 'Editar Bus' }}
        </span>
      </div>
    </template>

    <div class="bus-form-content">
      <form @submit.prevent="onSubmit" class="form-container">
        <!-- Fila 1: Placa y Número de Unidad -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Placa *</label>
            <InputText 
              v-model="modelLocal.plate" 
              :class="{ 'p-invalid': errors.plate }" 
              maxlength="8" 
              placeholder="AAA-1234"
              class="w-full"
              @input="formatPlate"
            />
            <small v-if="errors.plate" class="p-error">{{ errors.plate }}</small>
            <small class="field-hint">Formato: AAA-1234 (3 letras - 4 números)</small>
          </div>

          <div class="form-group">
            <label class="p-label">Número de Unidad</label>
            <InputNumber 
              v-model="modelLocal.unitNumber" 
              :min="1" 
              :max="999"
              placeholder="Ej: 42"
              class="w-full"
            />
            <small class="field-hint">Número identificador de la unidad (1-999)</small>
          </div>
        </div>

        <!-- Fila 2: Marca Chasis y Número de Chasis -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Marca del Chasis *</label>
            <InputText 
              v-model="modelLocal.chassisBrand" 
              :class="{ 'p-invalid': errors.chassisBrand }" 
              maxlength="100" 
              placeholder="Ej: Mercedes Benz"
              class="w-full"
            />
            <small v-if="errors.chassisBrand" class="p-error">{{ errors.chassisBrand }}</small>
          </div>

          <div class="form-group">
            <label class="p-label">Número de Chasis</label>
            <InputText 
              v-model="modelLocal.chassisNumber" 
              maxlength="50" 
              placeholder="Ej: WDB9063461L123456"
              class="w-full"
            />
          </div>
        </div>

        <!-- Fila 3: Marca Carrocería y Número de Carrocería -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Marca de la Carrocería *</label>
            <InputText 
              v-model="modelLocal.bodyBrand" 
              :class="{ 'p-invalid': errors.bodyBrand }" 
              maxlength="100" 
              placeholder="Ej: Marcopolo"
              class="w-full"
            />
            <small v-if="errors.bodyBrand" class="p-error">{{ errors.bodyBrand }}</small>
          </div>

          <div class="form-group">
            <label class="p-label">Número de Carrocería</label>
            <InputText 
              v-model="modelLocal.bodyNumber" 
              maxlength="50" 
              placeholder="Ej: 123456"
              class="w-full"
            />
          </div>
        </div>

        <!-- Fila 4: Número de Asientos y Estado -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Número de Asientos *</label>
            <InputNumber 
              v-model="modelLocal.seatCount" 
              :class="{ 'p-invalid': errors.seatCount }" 
              :min="10" 
              :max="60"
              :disabled="!isCreate"
              placeholder="Ej: 40"
              class="w-full"
            />
            <small v-if="errors.seatCount" class="p-error">{{ errors.seatCount }}</small>
            <small class="field-hint" v-if="isCreate">Entre 10 y 60 asientos</small>
            <small class="field-hint" v-else>No se puede modificar después de crear el bus</small>
          </div>

          <div class="form-group">
            <label class="p-label">Estado *</label>
            <Dropdown
              v-model="modelLocal.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar estado"
              :class="{ 'p-invalid': errors.status }"
              class="w-full"
            />
            <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
          </div>
        </div>

        <div class="form-row seat-layout-row">
          <div class="form-group seat-layout-wrapper">
            <SeatLayoutDesigner
              :seat-count="modelLocal.seatCount"
              v-model="seatLayout"
              :readonly="!isCreate"
            />
            <small v-if="errors.seatLayout" class="p-error">{{ errors.seatLayout }}</small>
          </div>
        </div>

        <!-- Fila 5: Conductor -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Conductor *</label>
            <Dropdown
              v-model="modelLocal.driverId"
              :options="availableDriverOptions"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar conductor"
              :loading="loadingDrivers"
              :class="{ 'p-invalid': errors.driverId }"
              class="w-full"
            >
              <template #option="slotProps">
                <div class="driver-option">
                  <div class="driver-option-main">
                    <i class="pi pi-id-card"></i>
                    <span>{{ slotProps.option.name }}</span>
                  </div>
                  <div class="driver-option-meta">
                    <small v-if="slotProps.option.license">Licencia: {{ slotProps.option.license }}</small>
                    <small
                      v-if="slotProps.option.assignedBusId && (!props.model || slotProps.option.assignedBusId !== props.model.id)"
                      class="assigned-tag"
                    >
                      Asignado a otro bus
                    </small>
                  </div>
                </div>
              </template>
            </Dropdown>
            <small v-if="errors.driverId" class="p-error">{{ errors.driverId }}</small>
            <small class="field-hint">Cada conductor solo puede estar asignado a un bus.</small>
          </div>

          <div class="form-group">
            <!-- espacio -->
          </div>
        </div>

        <!-- Fila 5: Cooperativa (solo para ADMIN o mostrar en edición) -->
        <div class="form-row" v-if="!isCooperative">
          <div class="form-group">
            <label class="p-label">Cooperativa *</label>
            <Dropdown
              v-model="modelLocal.cooperativeId"
              :options="cooperativesOptions"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar cooperativa"
              :class="{ 'p-invalid': errors.cooperativeId }"
              :disabled="!isCreate"
              class="w-full"
            />
            <small v-if="errors.cooperativeId" class="p-error">{{ errors.cooperativeId }}</small>
            <small class="field-hint" v-if="!isCreate">No se puede modificar la cooperativa</small>
          </div>

          <div class="form-group">
            <!-- Espacio vacío -->
          </div>
        </div>

        <!-- Sección de mantenimiento (solo para editar) -->
        <div v-if="!isCreate" class="maintenance-section">
          <div class="section-divider">
            <i class="pi pi-wrench"></i>
            <span>Información de Mantenimiento</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="p-label">Kilómetros Totales</label>
              <InputNumber 
                v-model="modelLocal.totalKilometers" 
                :min="0" 
                :maxFractionDigits="2"
                placeholder="0.00"
                class="w-full"
              />
              <small class="field-hint">Kilometraje acumulado del bus</small>
            </div>

            <div class="form-group">
              <label class="p-label">Próximo Mantenimiento (km)</label>
              <InputNumber 
                v-model="modelLocal.nextMaintenanceKm" 
                :min="0" 
                :maxFractionDigits="2"
                placeholder="0.00"
                class="w-full"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="p-label">Fecha Último Mantenimiento</label>
              <Calendar
                v-model="modelLocal.lastMaintenanceDate"
                dateFormat="yy-mm-dd"
                showIcon
                :maxDate="new Date()"
                placeholder="Seleccionar fecha"
                class="w-full"
              />
            </div>

            <div class="form-group">
              <!-- Espacio vacío -->
            </div>
          </div>
        </div>

        <!-- Fila: Foto del Bus -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Foto del Bus</label>
            <FileUpload
              mode="basic"
              :chooseLabel="modelLocal.photo ? 'Cambiar imagen' : 'Seleccionar imagen'"
              accept="image/*"
              :maxFileSize="5000000"
              @select="onFileSelect"
              class="w-full"
            />
            <small class="file-hint">Formatos: JPG, PNG, GIF. Máx: 5MB</small>
          </div>

          <div class="form-group">
            <div v-if="modelLocal.photo" class="preview-section">
              <div class="preview-header">
                <span>Vista previa:</span>
                <Button
                  type="button"
                  icon="pi pi-times"
                  class="p-button-text p-button-danger p-button-sm"
                  @click="removeImage"
                  v-tooltip="'Eliminar imagen'"
                />
              </div>
              <div class="preview">
                <img :src="modelLocal.photo" alt="Vista previa del bus" />
              </div>
            </div>
            <div v-else class="preview-placeholder">
              <i class="pi pi-image" style="font-size: 2rem; color: var(--surface-400);"></i>
              <small>Seleccione una imagen para ver la vista previa</small>
            </div>
          </div>
        </div>
      </form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          type="button" 
          label="Cancelar" 
          icon="pi pi-times" 
          class="p-button-text p-button-secondary" 
          @click="onCancel"
        />
        <Button 
          type="button" 
          :label="isCreate ? 'Crear Bus' : 'Actualizar Bus'" 
          icon="pi pi-check" 
          class="p-button-primary" 
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, watch, computed, ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Tooltip from 'primevue/tooltip'
import SeatLayoutDesigner from './SeatLayoutDesigner.vue'
import { BusStatus, SeatType, type BusDto, type CreateBusRequest, type UpdateBusPayload, type SeatLayoutItem, type SeatDto } from '../interfaces/bus.interface'
import { useCooperativeStore } from '../../cooperatives/store/useCooperativeStore'
import { useAuthStore } from '../../auth/store/useAuthStore'
import type { DriverDto } from '../../conductores/interfaces/driver.interface'
import driverService from '../../conductores/services/driverService'
import busService from '../services/busService'

type DriverOption = {
  id: string
  name: string
  license?: string | null
  assignedBusId?: string | null
}

const props = defineProps<{ 
  visible?: boolean; 
  model?: BusDto | null;
  loading?: boolean;
}>()

const emit = defineEmits<{
  (e: 'submit', payload: CreateBusRequest | UpdateBusPayload, file?: File): void
  (e: 'cancel'): void
  (e: 'update:visible', v: boolean): void
}>()

const photoFile = ref<File | null>(null)
const coopStore = useCooperativeStore()
const cooperativesOptions = ref<any[]>([])
const authStore = useAuthStore()
const isCooperative = computed(() => authStore.user?.role === 'COOPERATIVE')
const driverOptions = ref<DriverOption[]>([])
const loadingDrivers = ref(false)
const availableDriverOptions = computed(() => {
  return driverOptions.value.filter(option => {
    if (!option.assignedBusId) return true
    return props.model?.id && option.assignedBusId === props.model.id
  })
})

const statusOptions = ref([
  { label: 'Activo', value: BusStatus.ACTIVE },
  { label: 'Inactivo', value: BusStatus.INACTIVE },
  { label: 'Mantenimiento', value: BusStatus.MAINTENANCE }
])

const isCreate = computed(() => !props.model)

const modelLocal = reactive<any>({
  plate: '',
  unitNumber: null,
  chassisBrand: '',
  chassisNumber: null,
  bodyBrand: '',
  bodyNumber: null,
  seatCount: null,
  status: BusStatus.ACTIVE,
  cooperativeId: null,
  driverId: null,
  totalKilometers: null,
  lastMaintenanceDate: null,
  nextMaintenanceKm: null,
  photo: null
})

const seatLayout = ref<SeatLayoutItem[]>([])
const seatLayoutDirty = ref(false)
let suppressSeatLayoutWatch = false
const allowSeatLayoutEdit = computed(() => isCreate.value)

const errors = reactive<any>({})

watch(seatLayout, () => {
  if (suppressSeatLayoutWatch) {
    suppressSeatLayoutWatch = false
    return
  }
  if (allowSeatLayoutEdit.value) {
    seatLayoutDirty.value = true
  }
}, { deep: true })

const mapDriverToOption = (driver: DriverDto): DriverOption => ({
  id: driver.id,
  name: driver.userName || driver.licenseNumber || 'Conductor',
  license: driver.licenseNumber,
  assignedBusId: driver.assignedBusId || null
})

const mapSeatToLayout = (seat: SeatDto): SeatLayoutItem => ({
  code: seat.displayCode || `S${seat.seatNumber}`,
  row: seat.row || Math.ceil((seat.seatNumber || 1) / 4),
  column: seat.column || (((seat.seatNumber || 1) - 1) % 4) + 1,
  seatType: seat.seatType || SeatType.NORMAL
})

async function loadDriversByCooperative(cooperativeId?: string | null) {
  if (!cooperativeId) {
    driverOptions.value = []
    modelLocal.driverId = null
    return
  }

  loadingDrivers.value = true
  try {
    const drivers = await driverService.listActiveByCooperative(cooperativeId)
    driverOptions.value = drivers.map(mapDriverToOption)
    ensureCurrentDriverOption()
  } catch (error) {
    console.error('[BusForm] Error loading drivers:', error)
  } finally {
    loadingDrivers.value = false
  }
}

function ensureCurrentDriverOption() {
  if (!modelLocal.driverId) return
  const exists = driverOptions.value.some(option => option.id === modelLocal.driverId)
  if (!exists && props.model?.driverId === modelLocal.driverId) {
    driverOptions.value.push({
      id: modelLocal.driverId,
      name: props.model?.driverName || 'Conductor asignado',
      license: props.model?.driverLicenseNumber || null,
      assignedBusId: props.model?.id || null
    })
  }
}

async function loadSeatLayout(busId: string) {
  suppressSeatLayoutWatch = true
  try {
    const seats = await busService.getBusSeats(busId)
    seatLayout.value = seats.map(mapSeatToLayout)
    seatLayoutDirty.value = false
    if (allowSeatLayoutEdit.value) {
      modelLocal.seatCount = seatLayout.value.length
    }
  } catch (error) {
    console.error('[BusForm] Error loading seat layout:', error)
    seatLayout.value = []
  } finally {
    suppressSeatLayoutWatch = false
  }
}

watch(() => modelLocal.cooperativeId, (newId) => {
  if (newId) {
    loadDriversByCooperative(newId)
  } else {
    driverOptions.value = []
    modelLocal.driverId = null
  }
})

function formatPlate() {
  // Formatear placa automáticamente AAA-1234
  let value = modelLocal.plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (value.length > 3) {
    value = value.substring(0, 3) + '-' + value.substring(3, 7)
  }
  modelLocal.plate = value
}

function removeImage() {
  modelLocal.photo = null
  photoFile.value = null
}

function onFileSelect(event: any) {
  const files = event?.files || event?.originalEvent?.target?.files || event?.target?.files
  const file = files && files[0]
  if (!file) return

  const realFile: File = file instanceof File ? file : (file.raw || file.file || file)
  if (!realFile || typeof realFile.type !== 'string') return

  // Validar tipo de archivo
  if (!realFile.type.startsWith('image/')) {
    console.error('El archivo debe ser una imagen')
    return
  }

  // Validar tamaño (max 5MB)
  if (realFile.size > 5 * 1024 * 1024) {
    console.error('La imagen no debe superar los 5MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    modelLocal.photo = reader.result as string
    // Guardar el archivo original para enviarlo como multipart
    photoFile.value = realFile
  }
  reader.onerror = () => {
    console.error('Error al leer el archivo')
  }
  reader.readAsDataURL(realFile)
}

watch(() => props.model, async (v) => {
  if (v) {
    // Map DTO to form model
    modelLocal.plate = v.plate || ''
    modelLocal.unitNumber = v.unitNumber || null
    modelLocal.chassisBrand = v.chassisBrand || ''
    modelLocal.chassisNumber = v.chassisNumber || null
    modelLocal.bodyBrand = v.bodyBrand || ''
    modelLocal.bodyNumber = v.bodyNumber || null
    modelLocal.seatCount = v.seatCount || null
    modelLocal.status = v.status || BusStatus.ACTIVE
    modelLocal.cooperativeId = v.cooperativeId || null
    modelLocal.driverId = v.driverId || null
    modelLocal.totalKilometers = v.totalKilometers || null
    modelLocal.lastMaintenanceDate = v.lastMaintenanceDate ? new Date(v.lastMaintenanceDate) : null
    modelLocal.nextMaintenanceKm = v.nextMaintenanceKm || null
    modelLocal.photo = v.photo || null
    ensureCurrentDriverOption()
    if (v.id) {
      await loadSeatLayout(v.id)
    }
  } else {
    resetForm()
    seatLayout.value = []
    seatLayoutDirty.value = isCreate.value
  }
}, { immediate: true })

function resetForm() {
  modelLocal.plate = ''
  modelLocal.unitNumber = null
  modelLocal.chassisBrand = ''
  modelLocal.chassisNumber = null
  modelLocal.bodyBrand = ''
  modelLocal.bodyNumber = null
  modelLocal.seatCount = null
  modelLocal.status = BusStatus.ACTIVE
  modelLocal.cooperativeId = null
  modelLocal.driverId = null
  modelLocal.totalKilometers = null
  modelLocal.lastMaintenanceDate = null
  modelLocal.nextMaintenanceKm = null
  modelLocal.photo = null
  photoFile.value = null
  driverOptions.value = []
  seatLayout.value = []
  seatLayoutDirty.value = isCreate.value

  // Limpiar errores
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  if (isCooperative.value && authStore.user?.cooperativeId) {
    modelLocal.cooperativeId = authStore.user.cooperativeId
  }
}

function onVisibleChange(value: boolean) {
  emit('update:visible', value)
  if (!value) {
    resetForm()
  }
}

function onCancel() {
  emit('cancel')
  emit('update:visible', false)
  resetForm()
}

onMounted(async () => {
  try {
    try { authStore.restoreFromStorage() } catch (e) { /* ignore */ }

    await coopStore.fetchAll()
    cooperativesOptions.value = (coopStore.items || []).map((c: any) => ({ id: c.id, name: c.name }))

    if (isCooperative.value && authStore.user?.cooperativeId) {
      modelLocal.cooperativeId = authStore.user.cooperativeId
    }

    await loadDriversByCooperative(modelLocal.cooperativeId || authStore.user?.cooperativeId || null)
  } catch (e) {
    console.error('[BusForm] error loading cooperatives:', e)
  }
})

function validate(): boolean {
  let isValid = true

  // Clear previous errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  // Plate validation
  const plateRegex = /^[A-Z]{3}-[0-9]{4}$/
  if (!modelLocal.plate?.trim()) {
    errors.plate = 'La placa es obligatoria'
    isValid = false
  } else if (!plateRegex.test(modelLocal.plate)) {
    errors.plate = 'La placa debe tener el formato AAA-1234'
    isValid = false
  }

  // Chassis brand validation
  if (!modelLocal.chassisBrand?.trim()) {
    errors.chassisBrand = 'La marca del chasis es obligatoria'
    isValid = false
  }

  // Body brand validation
  if (!modelLocal.bodyBrand?.trim()) {
    errors.bodyBrand = 'La marca de la carrocería es obligatoria'
    isValid = false
  }

  // Seat count validation
  if (!modelLocal.seatCount) {
    errors.seatCount = 'El número de asientos es obligatorio'
    isValid = false
  } else if (modelLocal.seatCount < 10 || modelLocal.seatCount > 60) {
    errors.seatCount = 'El bus debe tener entre 10 y 60 asientos'
    isValid = false
  }

  if (isCreate.value) {
    if (!seatLayout.value.length) {
      errors.seatLayout = 'Debes definir la distribuci�n de asientos'
      isValid = false
    } else if (modelLocal.seatCount && seatLayout.value.length !== modelLocal.seatCount) {
      errors.seatLayout = `El plano debe tener exactamente ${modelLocal.seatCount} asientos`
      isValid = false
    }
  }

  // Status validation
  if (!modelLocal.status) {
    errors.status = 'El estado es obligatorio'
    isValid = false
  }

  // Cooperative validation (only for create and not COOPERATIVE role)
  if (isCreate.value && !isCooperative.value && !modelLocal.cooperativeId) {
    errors.cooperativeId = 'La cooperativa es obligatoria'
    isValid = false
  }

  if (!modelLocal.driverId) {
    errors.driverId = 'Debes seleccionar un conductor'
    isValid = false
  }

  return isValid
}

function toCreatePayload(): CreateBusRequest {
  const payload: CreateBusRequest = {
    cooperativeId: modelLocal.cooperativeId || authStore.user?.cooperativeId || '',
    driverId: modelLocal.driverId || '',
    plate: modelLocal.plate.trim(),
    chassisBrand: modelLocal.chassisBrand.trim(),
    chassisNumber: modelLocal.chassisNumber?.trim() || null,
    bodyBrand: modelLocal.bodyBrand.trim(),
    bodyNumber: modelLocal.bodyNumber?.trim() || null,
    seatCount: modelLocal.seatCount,
    unitNumber: modelLocal.unitNumber || null,
    seatLayout: seatLayout.value
  }

  // Solo incluir photo si NO hay archivo File (para backward compatibility)
  if (!photoFile.value && modelLocal.photo) {
    payload.photo = modelLocal.photo
  }

  // Si el usuario es COOPERATIVE, asignar automáticamente su cooperativa
  if (isCooperative.value && authStore.user?.cooperativeId) {
    payload.cooperativeId = authStore.user.cooperativeId
  }

  return payload
}

function toUpdatePayload(): UpdateBusPayload {
  const payload: UpdateBusPayload = {
    cooperativeId: modelLocal.cooperativeId || authStore.user?.cooperativeId,
    driverId: modelLocal.driverId || undefined,
    plate: modelLocal.plate?.trim(),
    chassisBrand: modelLocal.chassisBrand?.trim(),
    chassisNumber: modelLocal.chassisNumber?.trim() || null,
    bodyBrand: modelLocal.bodyBrand?.trim(),
    bodyNumber: modelLocal.bodyNumber?.trim() || null,
    seatCount: modelLocal.seatCount,
    unitNumber: modelLocal.unitNumber,
    status: modelLocal.status
  }

  // Solo incluir campos de mantenimiento si tienen valor
  if (modelLocal.totalKilometers != null) {
    payload.totalKilometers = modelLocal.totalKilometers
  }
  if (modelLocal.lastMaintenanceDate) {
    payload.lastMaintenanceDate = modelLocal.lastMaintenanceDate.toISOString().split('T')[0]
  }
  if (modelLocal.nextMaintenanceKm != null) {
    payload.nextMaintenanceKm = modelLocal.nextMaintenanceKm
  }

  // Solo incluir photo si NO hay archivo File (para backward compatibility)
  if (!photoFile.value && modelLocal.photo) {
    payload.photo = modelLocal.photo
  }

  if (seatLayoutDirty.value && seatLayout.value.length) {
    payload.seatLayout = seatLayout.value
  }

  return payload
}

function onSubmit() {
  if (!validate()) return
  
  if (isCreate.value) {
    emit('submit', toCreatePayload(), photoFile.value || undefined)
  } else {
    emit('submit', toUpdatePayload(), photoFile.value || undefined)
  }
}
</script>

<style scoped>
.bus-form-dialog {
  font-family: 'Inter', sans-serif;
}

.dialog-header {
  display: flex;
  align-items: center;
  padding: 1rem 0;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.bus-form-content {
  background: var(--card-bg);
  border-radius: 12px;
}

.form-container {
  padding: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  align-items: start;
}

.seat-layout-row {
  grid-template-columns: 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.seat-layout-wrapper {
  width: 100%;
}

.p-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.field-hint {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}
.driver-option {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.driver-option-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}
.driver-option-main i {
  font-size: 0.9rem;
  color: var(--app-accent);
}
.driver-option-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}
.assigned-tag {
  color: #c32020;
  font-weight: 600;
}

.file-hint {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.preview-section {
  margin-top: 0.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
  border: 1px dashed var(--surface-border);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.preview {
  text-align: center;
}

.preview img {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
  border-radius: 8px;
  border: 2px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--surface-ground);
  border-radius: 6px;
  border: 1px dashed var(--surface-border);
  text-align: center;
  color: var(--text-color-secondary);
  margin-top: 0.5rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.p-error {
  color: #e24c4c;
  font-size: 0.8rem;
  display: block;
  margin-top: 0.25rem;
}

/* Maintenance section */
.maintenance-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--surface-border);
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--app-accent);
}

.section-divider i {
  font-size: 1.25rem;
}

:deep(.p-dialog-content) {
  padding: 0;
}

:deep(.p-dialog-header) {
  background: var(--card-bg);
  border-bottom: 1px solid var(--surface-border);
  padding: 1.5rem 1.5rem 0 1.5rem;
}

:deep(.p-dialog-footer) {
  background: var(--card-bg);
  border-top: 1px solid var(--surface-border);
  padding: 1rem 1.5rem;
}

:deep(.p-fileupload .p-button) {
  width: 100%;
  justify-content: center;
}

:deep(.p-calendar) {
  width: 100%;
}

:deep(.p-dropdown) {
  width: 100%;
}

:deep(.p-inputtext) {
  width: 100%;
}

:deep(.p-inputnumber) {
  width: 100%;
}

:deep(.p-inputnumber-input) {
  width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>


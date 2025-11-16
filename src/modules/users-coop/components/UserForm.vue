<template>
  <Dialog 
    :visible="visible" 
    @update:visible="onVisibleChange"
      :style="{ width: '55rem', maxWidth: '95vw' }" 
    :breakpoints="{ '1199px': '50vw', '575px': '95vw' }"
    :modal="true"
    class="p-fluid user-form-dialog"
    :draggable="false"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">
          <i class="pi pi-user-plus mr-2"></i>
          {{ isCreate ? 'Crear Nuevo Usuario' : 'Editar Usuario' }}
        </span>
      </div>
    </template>

    <div class="user-form-content">
      <form @submit.prevent="onSubmit" class="form-container">
        <!-- Fila 1: Nombres y Apellidos -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Nombres *</label>
            <InputText 
              v-model="modelLocal.firstNames" 
              :class="{ 'p-invalid': errors.firstNames }" 
              maxlength="100" 
              placeholder="Ingrese los nombres"
              class="w-full"
            />
            <small v-if="errors.firstNames" class="p-error">{{ errors.firstNames }}</small>
          </div>

          <div class="form-group">
            <label class="p-label">Apellidos *</label>
            <InputText 
              v-model="modelLocal.lastNames" 
              :class="{ 'p-invalid': errors.lastNames }" 
              maxlength="100" 
              placeholder="Ingrese los apellidos"
              class="w-full"
            />
            <small v-if="errors.lastNames" class="p-error">{{ errors.lastNames }}</small>
          </div>
        </div>

        <!-- Fila 2: Cédula y Email -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Cédula *</label>
            <InputText 
              v-model="modelLocal.idCard" 
              :class="{ 'p-invalid': errors.idCard }" 
              maxlength="10" 
              placeholder="Ingrese la cédula"
              class="w-full"
              :disabled="!isCreate"
            />
            <small v-if="errors.idCard" class="p-error">{{ errors.idCard }}</small>
            <small v-else-if="!isCreate" class="p-help">La cédula no puede editarse desde aquí.</small>
          </div>

          <div class="form-group">
            <label class="p-label">Email</label>
            <InputText 
              v-model="modelLocal.email" 
              maxlength="150" 
              placeholder="usuario@ejemplo.com"
              class="w-full"
            />
          </div>
        </div>

        <!-- Fila 3: Teléfono y Rol -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Teléfono</label>
            <InputText 
              v-model="modelLocal.phone" 
              maxlength="15" 
              placeholder="Ingrese el teléfono"
              class="w-full"
            />
          </div>

          <div class="form-group">
            <label class="p-label">Rol *</label>
            <Dropdown
              v-model="modelLocal.role"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar rol"
              :class="{ 'p-invalid': errors.role }"
              class="w-full"
              :disabled="!!fixedRole"
            />
            <small v-if="errors.role" class="p-error">{{ errors.role }}</small>
          </div>
        </div>

        <!-- Fila 4: Contraseña (solo crear) - ocupa todo el ancho -->
        <div class="form-row" v-if="isCreate">
          <div class="form-group full-width">
            <label class="p-label">Contraseña *</label>
            <div class="password-field">
              <Password 
                v-model="modelLocal.password" 
                :feedback="false" 
                :class="{ 'p-invalid': errors.password }" 
                toggleMask 
                placeholder="Ingrese la contraseña"
                class="w-full password-input"
                :inputStyle="{ width: '100%' }"
              />
              <Button 
                type="button" 
                icon="pi pi-key" 
                class="p-button-outlined generate-btn"
                @click="generatePassword"
                v-tooltip="'Generar contraseña automática'"
              />
            </div>
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
            <small class="password-hint">La contraseña debe tener al menos 6 caracteres</small>
          </div>
        </div>

        <!-- Fila 5: Cooperativa y Estado -->
        <div class="form-row">
          <div class="form-group" v-if="(modelLocal.role === 'CLERK' || (modelLocal.role === 'DRIVER' && isAdmin)) && !isCooperative">
            <label class="p-label">Cooperativa <span v-if="modelLocal.role === 'CLERK'">*</span><span v-else> (opcional)</span></label>
            <Dropdown
              v-model="modelLocal.cooperativeId"
              :options="cooperativesOptions"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar cooperativa"
              :class="{ 'p-invalid': errors.cooperativeId }"
              class="w-full"
            />
            <small v-if="errors.cooperativeId" class="p-error">{{ errors.cooperativeId }}</small>
          </div>

          <!-- Estado solo cuando no es crear -->
          <div class="form-group" v-if="!isCreate">
            <label class="p-label">Estado</label>
            <div class="flex align-items-center mt-2">
              <Checkbox 
                v-model="modelLocal.active" 
                :binary="true" 
                inputId="active"
              />
              <label for="active" class="ml-2">Usuario activo</label>
            </div>
          </div>

          <!-- Espacio vacío cuando no aplica -->
          <div class="form-group" v-else>
            <!-- Espacio vacío para mantener alineación -->
          </div>
        </div>

        <!-- Fila 6: Fecha de Nacimiento y Género -->
        <div class="form-row">
          <div class="form-group">
            <label class="p-label">Fecha de Nacimiento</label>
            <Calendar
              v-model="modelLocal.birthDate"
              dateFormat="yy-mm-dd"
              showIcon
              :maxDate="maxBirthDate"
              placeholder="Seleccionar fecha"
              class="w-full"
            />
          </div>

          <div class="form-group">
            <label class="p-label">Género</label>
            <Dropdown
              v-model="modelLocal.gender"
              :options="genderOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar género"
              class="w-full"
            />
          </div>
        </div>

        <!-- Fila 6: Foto de Perfil (para todos los roles excepto DRIVER) -->
        <div class="form-row" v-if="modelLocal.role !== 'DRIVER'">
          <div class="form-group">
            <label class="p-label">Foto de Perfil</label>
            <FileUpload
              mode="basic"
              :chooseLabel="modelLocal.profilePhoto ? 'Cambiar imagen' : 'Seleccionar imagen'"
              :class="{ 'p-invalid': errors.profilePhoto }"
              accept="image/*"
              :maxFileSize="5000000"
              @select="onFileSelect"
              class="w-full"
            />
            <small class="file-hint">Formatos: JPG, PNG, GIF. Máx: 5MB</small>
          </div>

          <div class="form-group">
            <div v-if="modelLocal.profilePhoto" class="preview-section">
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
                <img :src="modelLocal.profilePhoto" alt="Vista previa de perfil" />
              </div>
            </div>
            <div v-else class="preview-placeholder">
              <i class="pi pi-image" style="font-size: 2rem; color: var(--surface-400);"></i>
              <small>Seleccione una imagen para ver la vista previa</small>
            </div>
          </div>
        </div>

        <!-- Campos específicos para Conductor -->
        <div v-if="modelLocal.role === 'DRIVER' || props.includeDriverFields" class="driver-section">
          <div class="section-divider">
            <i class="pi pi-id-card"></i>
            <span>Información de Licencia de Conducir</span>
          </div>

          <!-- Fila 1: Número de Licencia y Tipo -->
          <div class="form-row">
            <div class="form-group">
              <label class="p-label">Número de Licencia *</label>
              <InputText
                v-model="modelLocal.licenseNumber"
                :class="{ 'p-invalid': errors.licenseNumber }"
                maxlength="20"
                placeholder="Ej: EC-1234567890"
                class="w-full"
              />
              <small v-if="errors.licenseNumber" class="p-error">{{ errors.licenseNumber }}</small>
            </div>

            <div class="form-group">
              <label class="p-label">Tipo de Licencia *</label>
              <Dropdown
                v-model="modelLocal.licenseType"
                :options="licenseTypeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar tipo"
                :class="{ 'p-invalid': errors.licenseType }"
                class="w-full"
              />
              <small v-if="errors.licenseType" class="p-error">{{ errors.licenseType }}</small>
            </div>
          </div>

          <!-- Fila 2: Fechas de Emisión y Expiración -->
          <div class="form-row">
            <div class="form-group">
              <label class="p-label">Fecha de Emisión</label>
              <Calendar
                v-model="modelLocal.issueDate"
                dateFormat="yy-mm-dd"
                showIcon
                :maxDate="new Date()"
                placeholder="Seleccionar fecha"
                class="w-full"
              />
              <small class="password-hint">Fecha de emisión de la licencia</small>
            </div>

            <div class="form-group">
              <label class="p-label">Fecha de Expiración *</label>
              <Calendar
                v-model="modelLocal.expirationDate"
                dateFormat="yy-mm-dd"
                showIcon
                :minDate="new Date()"
                placeholder="Seleccionar fecha"
                :class="{ 'p-invalid': errors.expirationDate }"
                class="w-full"
              />
              <small v-if="errors.expirationDate" class="p-error">{{ errors.expirationDate }}</small>
              <small v-else class="password-hint">La licencia debe estar vigente</small>
            </div>
          </div>

          <!-- Fila 3: Foto de Perfil para Conductor -->
          <div class="form-row">
            <div class="form-group">
              <label class="p-label">Foto de Perfil</label>
              <FileUpload
                mode="basic"
                :chooseLabel="modelLocal.profilePhoto ? 'Cambiar imagen' : 'Seleccionar imagen'"
                :class="{ 'p-invalid': errors.profilePhoto }"
                accept="image/*"
                :maxFileSize="5000000"
                @select="onFileSelect"
                class="w-full"
              />
              <small class="file-hint">Formatos: JPG, PNG, GIF. Máx: 5MB</small>
            </div>

            <div class="form-group">
              <div v-if="modelLocal.profilePhoto" class="preview-section">
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
                  <img :src="modelLocal.profilePhoto" alt="Vista previa de perfil" />
                </div>
              </div>
              <div v-else class="preview-placeholder">
                <i class="pi pi-image" style="font-size: 2rem; color: var(--surface-400);"></i>
                <small>Seleccione una imagen para ver la vista previa</small>
              </div>
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
          :label="isCreate ? 'Crear Usuario' : 'Actualizar Usuario'" 
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
import Password from 'primevue/password'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Checkbox from 'primevue/checkbox'
import Tooltip from 'primevue/tooltip'
import type { UserCoopDto, CreateUserPayload, UpdateUserPayload } from '../interfaces/user.interface'
import { useCooperativeStore } from '../../cooperatives/store/useCooperativeStore'
import { useAuthStore } from '../../auth/store/useAuthStore'

const props = defineProps<{ 
  visible?: boolean; 
  model?: UserCoopDto | null;
  loading?: boolean;
  // Opcional: restringir los roles mostrados en el dropdown
  allowedRoles?: Array<{ label: string; value: string }>,
  // Si este prop viene, fijar el rol (p. ej. 'DRIVER') y deshabilitar selección
  fixedRole?: string | null,
  // Cuando true, mostrar campos relacionados al conductor (licencia, fechas)
  includeDriverFields?: boolean,
  // Si se conoce, pasar cooperativeId para prellenar el driver
  cooperativeId?: string | null,
}>()

const emit = defineEmits<{
  (e: 'submit', payload: any): void
  (e: 'cancel'): void
  (e: 'update:visible', v: boolean): void
}>()

const coopStore = useCooperativeStore()
const cooperativesOptions = ref<any[]>([])
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'ADMIN')
const isCooperative = computed(() => authStore.user?.role === 'COOPERATIVE')

const defaultRoleOptions = [
  { label: 'Cliente', value: 'CLIENT' },
  { label: 'Conductor', value: 'DRIVER' },
  { label: 'Oficinista', value: 'CLERK' },
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Cooperativa', value: 'COOPERATIVE' }
]

const roleOptions = computed(() => {
  // Si el padre pasa `allowedRoles`, usar esa lista (útil para vistas como conductores)
  if (props.allowedRoles && Array.isArray(props.allowedRoles) && props.allowedRoles.length > 0) {
    return props.allowedRoles
  }
  
  // Si el usuario es COOPERATIVE, solo puede crear conductores u oficinistas
  if (isCooperative.value) {
    return [
      { label: 'Conductor', value: 'DRIVER' },
      { label: 'Oficinista', value: 'CLERK' },
    ]
  }

  // Para ADMIN, mostrar todos los roles
  return defaultRoleOptions
})

const genderOptions = [
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' },
  { label: 'Otro', value: 'O' },
]

const licenseTypeOptions = [
  { label: 'Tipo C', value: 'C' },
  { label: 'Tipo D', value: 'D' },
  { label: 'Tipo E', value: 'E' },
]

const isCreate = computed(() => !props.model)

// Fecha máxima para nacimiento (hoy - 18 años)
const maxBirthDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return date
})

const modelLocal = reactive<any>({
  firstNames: '',
  lastNames: '',
  idCard: '',
  email: null,
  phone: null,
  password: '',
  role: '',
  birthDate: null,
  gender: null,
  profilePhoto: null,
  cooperativeId: null,
  active: true,
  // Campos de conductor (opcionales, se muestran con includeDriverFields)
  licenseNumber: '',
  licenseType: null,
  issueDate: null,
  expirationDate: null,
})

const errors = reactive<any>({})

// Generar contraseña automática de 8 caracteres
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  modelLocal.password = password
}

function removeImage() {
  modelLocal.profilePhoto = null
}

function onFileSelect(event: any) {
  // Soportar distintas formas del evento: event.files, event.originalEvent.target.files, event.target.files
  const files = event?.files || event?.originalEvent?.target?.files || event?.target?.files
  const file = files && files[0]
  if (!file) return

  // Si el objeto viene envuelto (p. ej. PrimeVue puede envolver), obtener el File real
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
  reader.onload = () => {
    modelLocal.profilePhoto = reader.result as string
  }
  reader.onerror = () => {
    console.error('Error al leer el archivo')
  }
  reader.readAsDataURL(realFile)
}

watch(() => props.model, (v) => {
  if (v) {
    // Map DTO to form model
    modelLocal.firstNames = v.firstNames || ''
    modelLocal.lastNames = v.lastNames || ''
    modelLocal.idCard = v.idCard || ''
    modelLocal.email = v.email || null
    modelLocal.phone = v.phone || null
    modelLocal.role = v.role || ''
    modelLocal.birthDate = v.birthDate ? new Date(v.birthDate) : null
    modelLocal.gender = v.gender || null
    modelLocal.profilePhoto = v.profilePhoto || null
      modelLocal.cooperativeId = v.cooperativeId || null
      modelLocal.active = typeof v.active === 'boolean' ? v.active : true
      modelLocal.password = ''
      // if parent forced role, keep it
      if (props.fixedRole) {
        modelLocal.role = props.fixedRole
      }
      // Copiar campos de conductor si vienen en el modelo (editar conductor)
      const vm: any = v as any
      if (vm.licenseNumber) modelLocal.licenseNumber = vm.licenseNumber
      if (vm.licenseType) modelLocal.licenseType = vm.licenseType
      if (vm.issueDate) modelLocal.issueDate = vm.issueDate ? new Date(vm.issueDate) : null
      if (vm.expirationDate) modelLocal.expirationDate = vm.expirationDate ? new Date(vm.expirationDate) : null
  } else {
    resetForm()
  }
}, { immediate: true })

  // Si se pasa cooperativeId o fixedRole como prop, aplicarlos al formulario inicial
  if (props.cooperativeId) {
    modelLocal.cooperativeId = props.cooperativeId
  }
  if (props.fixedRole) {
    modelLocal.role = props.fixedRole
  }

function resetForm() {
  modelLocal.firstNames = ''
  modelLocal.lastNames = ''
  modelLocal.idCard = ''
  modelLocal.email = null
  modelLocal.phone = null
  modelLocal.role = ''
  modelLocal.birthDate = null
  modelLocal.gender = null
  modelLocal.profilePhoto = null
  modelLocal.cooperativeId = null
  modelLocal.active = true
  modelLocal.password = ''
  // Driver-specific fields
  modelLocal.licenseNumber = null
  modelLocal.licenseType = null
  modelLocal.licenseExpiry = null

  // Limpiar errores
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
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
    // asegurar restauración de sesión si existe
    try { authStore.restoreFromStorage() } catch (e) { /* ignore */ }

    await coopStore.fetchAll()
    cooperativesOptions.value = (coopStore.items || []).map((c: any) => ({ id: c.id, name: c.name }))

    // Si el usuario es COOPERATIVE, establecer automáticamente su cooperativa
    if (isCooperative.value && authStore.user?.cooperativeId) {
      modelLocal.cooperativeId = authStore.user.cooperativeId
    }
  } catch (e) {
    console.error('[UserForm] error loading cooperatives:', e)
  }
})

function validate(): boolean {
  let isValid = true

  // Clear previous errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  // First names validation
  if (!modelLocal.firstNames?.trim()) {
    errors.firstNames = 'Los nombres son obligatorios'
    isValid = false
  }

  // Last names validation
  if (!modelLocal.lastNames?.trim()) {
    errors.lastNames = 'Los apellidos son obligatorios'
    isValid = false
  }

  // ID Card validation
  if (!modelLocal.idCard?.trim()) {
    errors.idCard = 'La cédula es obligatoria'
    isValid = false
  } else if (modelLocal.idCard.length !== 10) {
    errors.idCard = 'La cédula debe tener 10 dígitos'
    isValid = false
  }

  // Password validation (only for create)
  if (isCreate.value) {
    if (!modelLocal.password) {
      errors.password = 'La contraseña es obligatoria'
      isValid = false
    } else if (modelLocal.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
      isValid = false
    }
  }

  // Role validation
  if (!modelLocal.role) {
    errors.role = 'El rol es obligatorio'
    isValid = false
  } else if (modelLocal.role === 'CLERK' && !modelLocal.cooperativeId) {
    errors.cooperativeId = 'La cooperativa es obligatoria para un oficinista'
    isValid = false
  }

  // Validación de campos de conductor si se solicitan
  const isDriverForm = props.includeDriverFields || modelLocal.role === 'DRIVER' || props.fixedRole === 'DRIVER'
  if (isDriverForm) {
    if (!modelLocal.licenseNumber || !modelLocal.licenseNumber.trim()) {
      errors.licenseNumber = 'El número de licencia es obligatorio'
      isValid = false
    }
    if (!modelLocal.licenseType) {
      errors.licenseType = 'El tipo de licencia es obligatorio'
      isValid = false
    }
    if (!modelLocal.expirationDate) {
      errors.expirationDate = 'La fecha de expiración de licencia es obligatoria'
      isValid = false
    } else {
      // Validar que la licencia no esté expirada
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const expiryDate = new Date(modelLocal.expirationDate)
      expiryDate.setHours(0, 0, 0, 0)
      if (expiryDate < today) {
        errors.expirationDate = 'La licencia está expirada'
        isValid = false
      }
    }
  }

  return isValid
}

function toCreatePayload() : CreateUserPayload {
  const payload: CreateUserPayload = {
    firstNames: modelLocal.firstNames.trim(),
    lastNames: modelLocal.lastNames.trim(),
    idCard: modelLocal.idCard.trim(),
    password: modelLocal.password,
    role: modelLocal.role,
    email: modelLocal.email?.trim() || null,
    phone: modelLocal.phone?.trim() || null,
    birthDate: modelLocal.birthDate ? modelLocal.birthDate.toISOString().split('T')[0] : null,
    gender: modelLocal.gender || null,
    profilePhoto: modelLocal.profilePhoto || null,
    cooperativeId: modelLocal.cooperativeId || null,
  }

  // Si el usuario es COOPERATIVE y está creando un DRIVER o CLERK, asignar automáticamente su cooperativa
  if (isCooperative.value && (modelLocal.role === 'DRIVER' || modelLocal.role === 'CLERK')) {
    payload.cooperativeId = authStore.user?.cooperativeId || modelLocal.cooperativeId
  }

  // Agregar campos de conductor si el rol es DRIVER
  if (modelLocal.role === 'DRIVER') {
    payload.licenseNumber = modelLocal.licenseNumber?.trim() || null
    payload.licenseType = modelLocal.licenseType || null
    payload.licenseExpiry = modelLocal.licenseExpiry ? modelLocal.licenseExpiry.toISOString().split('T')[0] : null
  }

  return payload
}

function buildDriverPayload() {
  return {
    licenseNumber: modelLocal.licenseNumber?.trim() || null,
    licenseType: modelLocal.licenseType || null,
    issueDate: modelLocal.issueDate ? modelLocal.issueDate.toISOString().split('T')[0] : null,
    expirationDate: modelLocal.expirationDate ? modelLocal.expirationDate.toISOString().split('T')[0] : null,
    cooperativeId: props.cooperativeId || modelLocal.cooperativeId || null,
  }
}

function toUpdatePayload() : UpdateUserPayload {
  const payload: UpdateUserPayload = {
    firstNames: modelLocal.firstNames?.trim() || undefined,
    lastNames: modelLocal.lastNames?.trim() || undefined,
    idCard: modelLocal.idCard?.trim() || undefined,
    email: modelLocal.email?.trim() || null,
    phone: modelLocal.phone?.trim() || null,
    birthDate: modelLocal.birthDate ? modelLocal.birthDate.toISOString().split('T')[0] : null,
    gender: modelLocal.gender || null,
    profilePhoto: modelLocal.profilePhoto || null,
    active: typeof modelLocal.active === 'boolean' ? modelLocal.active : undefined,
  }

  // Agregar campos de conductor si el rol es DRIVER
  if (modelLocal.role === 'DRIVER') {
    payload.licenseNumber = modelLocal.licenseNumber?.trim() || null
    payload.licenseType = modelLocal.licenseType || null
    payload.licenseExpiry = modelLocal.licenseExpiry ? modelLocal.licenseExpiry.toISOString().split('T')[0] : null
  }

  return payload
}

function onSubmit() {
  if (!validate()) return

  if (isCreate.value) {
    if (props.includeDriverFields || props.fixedRole === 'DRIVER') {
      // Emitir objeto combinado: { user, driver }
      emit('submit', { user: toCreatePayload(), driver: buildDriverPayload() })
    } else {
      emit('submit', toCreatePayload())
    }
  } else {
    // Para actualización, emitir payload de usuario; si hay campos de conductor, incluirlos también
    if (props.includeDriverFields || props.fixedRole === 'DRIVER') {
      emit('submit', { user: toUpdatePayload(), driver: buildDriverPayload() })
    } else {
      emit('submit', toUpdatePayload())
    }
  }
}
</script>

<style scoped>
.user-form-dialog {
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

.user-form-content {
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

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.p-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.password-field {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.password-input {
  flex: 1;
}

.generate-btn {
  min-width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.password-hint {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
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
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid var(--surface-border);
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

:deep(.p-password input) {
  width: 100%;
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

/* Driver section */
.driver-section {
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

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .password-field {
    flex-direction: column;
  }

  .generate-btn {
    align-self: flex-end;
    margin-top: 0.5rem;
  }
}
</style>
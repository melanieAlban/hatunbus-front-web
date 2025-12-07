<template>
 <Dialog 
  ref="dialogRef"
  :visible="visibleLocal" 
  modal 
  :closable="true" 
  :closeOnEscape="true"
  :dismissableMask="true"
  :style="{ width: '720px', borderRadius: '12px' }" 
  @hide="onHide"
  @update:visible="onVisibleChange"
>
    <template #header>
      <div class="dialog-header">
        <h3>{{ title }}</h3>
      </div>
    </template>

    <div class="cooperative-form">
      <p class="subtitle">Rellena el siguiente formulario para registrar una nueva cooperativa en el sistema.</p>

      <div class="card">
        <div class="grid">
          <div class="col">
            <label class="label">Nombre de la Cooperativa <span class="required">*</span></label>
            <InputText v-model="form.name" placeholder="Ej. Transportes Unidos" />
            <small class="field-error" v-if="errors.name">{{ errors.name }}</small>
          </div>

          <div class="col">
            <label class="label">Información de Contacto (email) <span class="required">*</span></label>
            <InputText v-model="form.email" placeholder="Ej. contacto@unidos.com" />
            <small class="field-error" v-if="errors.email">{{ errors.email }}</small>
          </div>

          <div class="col">
            <label class="label">Datos Legales (RUC) <span class="required">*</span></label>
            <InputText v-model="form.ruc" maxlength="13" placeholder="Ej. 123456789001" />
            <small class="field-error" v-if="errors.ruc">{{ errors.ruc }}</small>
          </div>

          <div class="col">
            <label class="label">Teléfono <span class="required">*</span></label>
            <InputText v-model="form.phone" placeholder="Ej. 0987654321" maxlength="10" />
            <small class="field-error" v-if="errors.phone">{{ errors.phone }}</small>
          </div>

          <div class="col-full">
            <label class="label">Dirección <span class="required">*</span></label>
            <InputText v-model="form.address" placeholder="Ej. Av. Principal 123" />
            <small class="field-error" v-if="errors.address">{{ errors.address }}</small>
          </div>
        </div>
      </div>

      <div class="card small">
        <h4>Personalización Inicial</h4>
        <div class="grid">
          <div class="col-6">
            <label class="label">Logo</label>
            <FileUpload mode="basic" :auto="false" chooseLabel="Seleccionar archivo" accept="image/*" :customUpload="true" @select="onFileSelected" />
            <div v-if="logoPreview" class="logo-preview">
              <img :src="logoPreview" alt="logo" />
              <Button class="p-button-text" label="Quitar" @click="removeLogo" />
            </div>
            <small class="field-error" v-if="errors.logo">{{ errors.logo }}</small>
          </div>

          <div class="col-6">
            <label class="label">Colores Predeterminados</label>
            <div class="color-row">
              <div class="color-item">
                <label>Color Primario</label>
                <ColorPicker v-model="form.primaryColor" :inline="false" />
              </div>
              <div class="color-item">
                <label>Color Secundario</label>
                <ColorPicker v-model="form.secondaryColor" :inline="false" />
              </div>
          </div>
          <div class="color-sample">
            <div class="sample" :style="{ background: form.primaryColor || '#1976d2' }">Primario</div>
            <div class="sample" :style="{ background: form.secondaryColor || '#f5f5f5', color:'#222' }">Secundario</div>
          </div>
          <div class="color-errors">
            <small class="field-error" v-if="errors.primaryColor">{{ errors.primaryColor }}</small>
            <small class="field-error" v-if="errors.secondaryColor">{{ errors.secondaryColor }}</small>
          </div>
        </div>
        </div>
      </div>

      <div class="card small">
        <Checkbox v-model="form.active" :binary="true" /> <label style="margin-left:8px">Activa</label>
      </div>

      <div class="form-actions">
        <Button class="p-button-secondary" label="Cancelar" @click="onCancel" />
        <Button class="p-button-primary" :label="submitLabel" @click="handleSubmit" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import ColorPicker from 'primevue/colorpicker'
import Checkbox from 'primevue/checkbox'
import type { CreateCooperativePayload, CooperativeDto } from '../interfaces/cooperative.interface'
import { onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ model?: CooperativeDto; visible?: boolean }>()
// Emit payload and optionally the original File when present (for multipart uploads)
const emit = defineEmits<{
  (e: 'submit', payload: CreateCooperativePayload, file?: File): void
  (e: 'cancel'): void
  (e: 'update:visible', val: boolean): void
}>()

const visibleLocal = ref<boolean>(!!props.visible)
watch(() => props.visible, v => {
  visibleLocal.value = !!v
})

watch(visibleLocal, v => {
  emit('update:visible', v)
})

function onVisibleChange(value: boolean) {
  visibleLocal.value = value
  if (!value) {
    onHide()
  }
}

const title = computed(() => (props.model ? 'Editar Cooperativa' : 'Crear Nueva Cooperativa'))

const logoPreview = ref<string | null>(props.model?.logo || null)
const logoFile = ref<File | null>(null)
const dialogRef = ref<any>(null)

const form = reactive<CreateCooperativePayload>({
  name: props.model?.name || '',
  ruc: props.model?.ruc || '',
  address: props.model?.address || '',
  email: props.model?.email || '',
  phone: props.model?.phone || '',
  logo: props.model?.logo || null,
  primaryColor: props.model?.primaryColor || '#1976d2',
  secondaryColor: props.model?.secondaryColor || '#f5f5f5',
  active: Boolean(props.model?.active ?? false),
})

const errors = reactive<Record<string, string | null>>({})

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const hexColorRegex = /^#([A-Fa-f0-9]{6})$/
const phoneRegex = /^\d{10}$/

const submitLabel = computed(() => (props.model ? 'Guardar cambios' : 'Crear Cooperativa'))

// debug: observe changes to active while editing
watch(() => form.active, v => {
  console.log('[CooperativeForm] form.active changed ->', v)
})

function sanitizePhoneValue(value: string): string {
  if (!value) return ''
  let sanitized = value.replace(/[^\d+]/g, '')
  if (sanitized.startsWith('+')) {
    sanitized = '+' + sanitized.slice(1).replace(/\D/g, '')
  } else {
    sanitized = sanitized.replace(/\D/g, '')
  }
  return sanitized.slice(0, 16)
}

function sanitizeRuc(value: string): string {
  return (value || '').replace(/\D/g, '').slice(0, 13)
}

function isValidRuc(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc)) return false
  const province = Number(ruc.substring(0, 2))
  if (province < 1 || province > 24) return false
  const thirdDigit = Number(ruc.charAt(2))
  if (thirdDigit === 7 || thirdDigit === 8) return false
  const establishment = Number(ruc.substring(10))
  if (establishment < 1) return false
  return true
}

watch(() => form.ruc, (value) => {
  if (typeof value !== 'string') return
  const sanitized = sanitizeRuc(value)
  if (sanitized !== value) {
    form.ruc = sanitized
  }
})

watch(() => form.phone, (value) => {
  if (typeof value !== 'string') return
  const sanitized = sanitizePhoneValue(value)
  if (sanitized !== value) {
    form.phone = sanitized
  }
})

function validate(): boolean {
  const trimmedName = form.name?.trim() || ''
  const trimmedEmail = form.email?.trim() || ''
  const trimmedAddress = form.address?.trim() || ''
  const trimmedRuc = form.ruc?.trim() || ''
  const trimmedPhone = form.phone?.trim() || ''

  errors.name = !trimmedName
    ? 'El nombre es obligatorio'
    : (trimmedName.length < 3 ? 'El nombre debe tener al menos 3 caracteres' : null)

  errors.email = !trimmedEmail
    ? 'El email es obligatorio'
    : (!emailRegex.test(trimmedEmail) ? 'Email invalido' : null)

  if (!trimmedRuc) {
    errors.ruc = 'El RUC es obligatorio'
  } else if (!/^\d{13}$/.test(trimmedRuc)) {
    errors.ruc = 'El RUC debe contener 13 digitos'
  } else if (!isValidRuc(trimmedRuc)) {
    errors.ruc = 'El RUC no cumple con el formato ecuatoriano'
  } else {
    errors.ruc = null
  }

  if (!trimmedAddress) {
    errors.address = 'La direccion es obligatoria'
  } else if (trimmedAddress.length < 5) {
    errors.address = 'La direccion debe tener al menos 5 caracteres'
  } else {
    errors.address = null
  }

  if (!trimmedPhone) {
    errors.phone = 'El telefono es obligatorio'
  } else if (!phoneRegex.test(trimmedPhone)) {
    errors.phone = 'El teléfono debe tener exactamente 10 dígitos'
  } else {
    errors.phone = null
  }

  errors.primaryColor = form.primaryColor && !hexColorRegex.test(form.primaryColor)
    ? 'Formato de color invalido (#RRGGBB)'
    : null
  errors.secondaryColor = form.secondaryColor && !hexColorRegex.test(form.secondaryColor)
    ? 'Formato de color invalido (#RRGGBB)'
    : null

  return Object.values(errors).every(v => v === null)
}

function onFileSelected(event: any) {
  const file = event.files?.[0]
  if (!file) return
  const allowed = ['image/png', 'image/jpeg', 'image/gif']
  if (!allowed.includes(file.type)) {
    errors.logo = 'Tipo de archivo no permitido'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    errors.logo = 'El archivo supera el límite de 10MB'
    return
  }
  errors.logo = null
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result as string
    logoPreview.value = result
    form.logo = result
    // keep original File so we can send multipart form if backend expects it
    logoFile.value = file
  }
  reader.readAsDataURL(file)
}

function removeLogo() {
  logoPreview.value = null
  form.logo = null
  logoFile.value = null
}

function onCancel() {
  visibleLocal.value = false
  emit('update:visible', false)
  emit('cancel')
}

function onHide() {
  visibleLocal.value = false
  emit('update:visible', false)
  emit('cancel')
}

onMounted(() => {
  // Ensure any native/dialog title close button triggers onHide
  const el = dialogRef.value?.$el || dialogRef.value
  if (!el) return
  const closeBtn = el.querySelector?.('.p-dialog-titlebar-close')
  if (closeBtn) closeBtn.addEventListener('click', onHide)
})

onBeforeUnmount(() => {
  const el = dialogRef.value?.$el || dialogRef.value
  if (!el) return
  const closeBtn = el.querySelector?.('.p-dialog-titlebar-close')
  if (closeBtn) closeBtn.removeEventListener('click', onHide)
})

function handleSubmit() {
  if (!validate()) return
  const payload: CreateCooperativePayload = {
    name: form.name,
    ruc: form.ruc,
    address: form.address,
    email: form.email,
    phone: form.phone,
    logo: form.logo || null,
    primaryColor: form.primaryColor || null,
    secondaryColor: form.secondaryColor || null,
    active: form.active ?? true,
  }
  console.log('[CooperativeForm] handleSubmit -> payload:', payload, 'file:', !!logoFile.value)
  // If we have a File, emit it as second arg to allow multipart submission
  emit('submit', payload, logoFile.value || undefined)
  visibleLocal.value = false
}

watch(() => props.model?.logo, v => {
  logoPreview.value = v || null
})
// When `model` changes (edit open), populate the reactive form fields
watch(() => props.model, (m) => {
    if (!m) {
    form.name = ''
    form.ruc = ''
    form.address = ''
    form.email = ''
    form.phone = ''
    form.logo = null
      form.primaryColor = '#1976d2'
      form.secondaryColor = '#f5f5f5'
      form.active = false
    logoPreview.value = null
    logoFile.value = null
    return
  }

  form.name = m.name || ''
  form.ruc = m.ruc || ''
  form.address = m.address || ''
  form.email = m.email || ''
  form.phone = m.phone || ''
  form.logo = (m as any).logo || null
  form.primaryColor = m.primaryColor || '#1976d2'
  form.secondaryColor = m.secondaryColor || '#f5f5f5'
  form.active = typeof m.active !== 'undefined' ? Boolean(m.active) : true
  logoPreview.value = (m as any).logo || null
  logoFile.value = null
})

</script>

<style scoped>
.cooperative-form { max-width: 100%; }
.subtitle { margin:0 0 1rem; color:var(--app-accent) }
.card { background:var(--white-bone); padding:1rem; border-radius:10px; margin-bottom:1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04) }
.card.small { padding:0.75rem }
.grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem }
.col { display:flex; flex-direction:column }
.col-full { grid-column: 1 / -1 }
.col-6 { width:100% }
.label { font-weight:600; font-size:0.9rem; margin-bottom:0.4rem }
.required { color:#e53935 }
.p-inputtext, input[type="text"], input[type="email"], input[type="tel"], input[type="color"] { padding:0.6rem; border-radius:8px; border:1px solid var(--gray-light); width:100% }
.upload { border-radius:8px; padding:0.6rem }
.upload-area { border:1px dashed var(--gray-light); border-radius:8px; padding:1rem; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:0.5rem; min-height:120px }
.upload-hint { text-align:center; color:var(--gray-medium) }
.logo-preview img { max-width:120px; max-height:80px; object-fit:contain; display:block }
.btn-outline { background:none; border:1px solid var(--gray-light); padding:0.4rem 0.6rem; border-radius:8px; cursor:pointer }
.btn-link { background:none; border:none; color:var(--app-accent); cursor:pointer }
.color-row { display:flex; gap:1rem; align-items:center }
.color-item label { display:block; font-size:0.85rem; margin-bottom:0.25rem }
.color-sample { display:flex; gap:0.5rem; margin-top:0.6rem }
.sample { padding:0.4rem 0.6rem; border-radius:6px; color:white; font-weight:600 }
.color-errors { display:flex; flex-direction:column; gap:0.15rem; margin-top:0.35rem }
.form-actions { display:flex; justify-content:flex-end; gap:0.6rem }
.p-button-primary { background:var(--app-accent) !important; color:white !important }
.p-button-secondary { background:transparent !important; border:1px solid var(--gray-light) !important }
.field-error { color:#d32f2f; font-size:0.85rem; margin-top:0.3rem }
.dialog-header { display:flex; align-items:center; gap:0.5rem }
</style>

<template>
  <div class="driver-form">
    <div class="card">
      <div class="grid">
        <div class="col">
          <label>Usuario (ID) *</label>
          <InputText
            v-model="form.userId"
            :class="{ 'p-invalid': errors.userId }"
            placeholder="UUID del usuario"
          />
          <small v-if="errors.userId" class="field-error">{{ errors.userId }}</small>
        </div>
        <div class="col">
          <label>Cooperativa (ID) *</label>
          <InputText
            v-model="form.cooperativeId"
            :class="{ 'p-invalid': errors.cooperativeId }"
            placeholder="UUID de la cooperativa"
          />
          <small v-if="errors.cooperativeId" class="field-error">{{ errors.cooperativeId }}</small>
        </div>
        <div class="col">
          <label>Numero de licencia *</label>
          <InputText
            v-model="form.licenseNumber"
            :class="{ 'p-invalid': errors.licenseNumber }"
            maxlength="20"
          />
          <small v-if="errors.licenseNumber" class="field-error">{{ errors.licenseNumber }}</small>
        </div>
        <div class="col">
          <label>Tipo de licencia *</label>
          <Dropdown
            v-model="form.licenseType"
            :options="licenseTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar tipo"
            :class="{ 'p-invalid': errors.licenseType }"
          />
          <small v-if="errors.licenseType" class="field-error">{{ errors.licenseType }}</small>
        </div>
        <div class="col">
          <label>Fecha de emision *</label>
          <InputText
            v-model="form.issueDate"
            :class="{ 'p-invalid': errors.issueDate }"
            type="date"
            placeholder="YYYY-MM-DD"
          />
          <small v-if="errors.issueDate" class="field-error">{{ errors.issueDate }}</small>
        </div>
        <div class="col">
          <label>Fecha de vencimiento *</label>
          <InputText
            v-model="form.expirationDate"
            :class="{ 'p-invalid': errors.expirationDate }"
            type="date"
            placeholder="YYYY-MM-DD"
          />
          <small v-if="errors.expirationDate" class="field-error">{{ errors.expirationDate }}</small>
        </div>
        <div class="col-full active-row">
          <Checkbox v-model="form.active" inputId="driver-active" />
          <label for="driver-active">Activo</label>
        </div>
      </div>

      <div class="form-actions">
        <Button class="p-button-secondary" label="Cancelar" @click="$emit('cancel')" />
        <Button class="p-button-primary" label="Guardar" @click="onSubmit" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import type { DriverDto, CreateDriverPayload } from '../interfaces/driver.interface'
import { error as notifyError } from '@/lib/notifier'

const props = defineProps<{ model?: DriverDto }>()
const emit = defineEmits<{
  (e: 'submit', payload: CreateDriverPayload): void
  (e: 'cancel'): void
}>()

const form = reactive<CreateDriverPayload & { active?: boolean }>({
  userId: props.model?.userId || '',
  cooperativeId: props.model?.cooperativeId || '',
  licenseNumber: props.model?.licenseNumber || '',
  licenseType: props.model?.licenseType || null,
  issueDate: props.model?.issueDate || null,
  expirationDate: props.model?.expirationDate || null,
  active: (props.model as any)?.active ?? true
})

const licenseTypeOptions = [
  { label: 'Tipo D', value: 'D' },
  { label: 'Tipo E', value: 'E' }
]

const errors = reactive<Record<string, string>>({})
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

watch(() => props.model, (m) => {
  if (!m) return
  form.userId = m.userId || ''
  form.cooperativeId = m.cooperativeId || ''
  form.licenseNumber = m.licenseNumber || ''
  form.licenseType = m.licenseType || null
  form.issueDate = m.issueDate || null
  form.expirationDate = m.expirationDate || null
  form.active = typeof m.active === 'boolean' ? m.active : true
})

function isValidDate(value: string | null | undefined) {
  if (!value || !dateRegex.test(value)) return false
  const parsed = new Date(value)
  return !isNaN(parsed.getTime())
}

function validate(): boolean {
  Object.keys(errors).forEach(key => { errors[key] = '' })
  let isValid = true

  const trimmedUserId = form.userId.trim()
  if (!trimmedUserId) {
    errors.userId = 'El ID de usuario es obligatorio'
    isValid = false
  } else if (!uuidRegex.test(trimmedUserId)) {
    errors.userId = 'El ID debe tener formato UUID'
    isValid = false
  }

  const trimmedCooperativeId = form.cooperativeId.trim()
  if (!trimmedCooperativeId) {
    errors.cooperativeId = 'La cooperativa es obligatoria'
    isValid = false
  } else if (!uuidRegex.test(trimmedCooperativeId)) {
    errors.cooperativeId = 'El ID debe tener formato UUID'
    isValid = false
  }

  const trimmedLicense = form.licenseNumber.trim()
  if (!trimmedLicense) {
    errors.licenseNumber = 'El numero de licencia es obligatorio'
    isValid = false
  } else if (trimmedLicense.length < 5) {
    errors.licenseNumber = 'El numero de licencia debe tener al menos 5 caracteres'
    isValid = false
  }

  if (!form.licenseType) {
    errors.licenseType = 'Selecciona un tipo de licencia'
    isValid = false
  }

  if (!form.issueDate) {
    errors.issueDate = 'La fecha de emision es obligatoria'
    isValid = false
  } else if (!isValidDate(form.issueDate)) {
    errors.issueDate = 'Formato de fecha invalido (YYYY-MM-DD)'
    isValid = false
  }

  if (!form.expirationDate) {
    errors.expirationDate = 'La fecha de vencimiento es obligatoria'
    isValid = false
  } else if (!isValidDate(form.expirationDate)) {
    errors.expirationDate = 'Formato de fecha invalido (YYYY-MM-DD)'
    isValid = false
  }

  if (isValid && form.issueDate && form.expirationDate) {
    const issueDate = new Date(form.issueDate)
    const expirationDate = new Date(form.expirationDate)
    if (expirationDate <= issueDate) {
      errors.expirationDate = 'La fecha de vencimiento debe ser posterior a la emision'
      isValid = false
    }
  }

  // Mostrar toast con el primer error encontrado
  if (!isValid) {
    const firstError = Object.entries(errors).find(([_, v]) => v && v !== '')
    if (firstError) {
      notifyError('Campo inválido', firstError[1] as string)
    }
  }

  return isValid
}

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    ...form,
    userId: form.userId.trim(),
    cooperativeId: form.cooperativeId.trim(),
    licenseNumber: form.licenseNumber.trim()
  })
}
</script>

<style scoped>
.card { background:var(--white-bone); padding:1rem; border-radius:10px }
.grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem }
.col { display:flex; flex-direction:column }
.col-full { grid-column: 1 / -1 }
.active-row { display:flex; align-items:center; gap:0.5rem }
.form-actions { display:flex; justify-content:flex-end; gap:0.6rem; margin-top:1rem }
.field-error { color:#d32f2f; font-size:0.85rem; margin-top:0.25rem }
</style>

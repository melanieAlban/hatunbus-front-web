<template>
  <div class="driver-form">
    <div class="card">
      <div class="grid">
        <div class="col">
          <label>Usuario (ID)</label>
          <InputText v-model="form.userId" placeholder="UUID del usuario" />
        </div>
        <div class="col">
          <label>Cooperativa (ID)</label>
          <InputText v-model="form.cooperativeId" placeholder="UUID de la cooperativa" />
        </div>
        <div class="col">
          <label>Número de licencia</label>
          <InputText v-model="form.licenseNumber" />
        </div>
        <div class="col">
          <label>Tipo de licencia</label>
          <InputText v-model="form.licenseType" />
        </div>
        <div class="col">
          <label>Fecha de emisión</label>
          <InputText v-model="form.issueDate" placeholder="YYYY-MM-DD" />
        </div>
        <div class="col">
          <label>Fecha de vencimiento</label>
          <InputText v-model="form.expirationDate" placeholder="YYYY-MM-DD" />
        </div>
        <div class="col-full">
          <Checkbox v-model="form.active" /> <label style="margin-left:8px">Activo</label>
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
import type { DriverDto, CreateDriverPayload } from '../interfaces/driver.interface'

const props = defineProps<{ model?: DriverDto }>()
const emit = defineEmits<{
  (e: 'submit', payload: CreateDriverPayload): void
  (e: 'cancel'): void
}>()

const form = reactive<CreateDriverPayload>({
  userId: props.model?.userId || '',
  cooperativeId: props.model?.cooperativeId || '',
  licenseNumber: props.model?.licenseNumber || '',
  licenseType: props.model?.licenseType || null,
  issueDate: props.model?.issueDate || null,
  expirationDate: props.model?.expirationDate || null,
})

watch(() => props.model, (m) => {
  if (!m) return
  form.userId = m.userId || ''
  form.cooperativeId = m.cooperativeId || ''
  form.licenseNumber = m.licenseNumber || ''
  form.licenseType = m.licenseType || null
  form.issueDate = m.issueDate || null
  form.expirationDate = m.expirationDate || null
})

function onSubmit() {
  emit('submit', { ...form })
}
</script>

<style scoped>
.card { background:var(--white-bone); padding:1rem; border-radius:10px }
.grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem }
.col { display:flex; flex-direction:column }
.col-full { grid-column: 1 / -1 }
.form-actions { display:flex; justify-content:flex-end; gap:0.6rem; margin-top:1rem }
</style>

<template>
  <Dialog
    v-model:visible="visibleLocal"
    modal
    :style="{ width: '700px' }"
    :dismissableMask="true"
    class="group-dialog"
    @update:visible="onVisibleChange"
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-sitemap icon-header"></i>
        <h2 class="dialog-title">Crear Grupo de Buses</h2>
      </div>
    </template>

    <div class="group-form">
      <!-- Selección de template -->
      <div class="form-section">
        <h3>Selecciona un Template</h3>
        
        <div class="template-selector">
          <div
            v-for="template in availableTemplates"
            :key="template.id"
            @click="selectTemplate(template)"
            :class="['template-card', { 'selected': selectedTemplate?.id === template.id }]"
          >
            <div class="template-header">
              <h4>{{ template.name }}</h4>
              <Tag v-if="!template.cooperativeId" value="Sistema" severity="info" />
              <Tag v-else value="Personalizado" severity="success" />
            </div>
            
            <p class="template-description">{{ template.description || 'Sin descripción' }}</p>
            
            <div class="template-stats">
              <span class="stat">
                <i class="pi pi-users"></i>
                {{ getRealSeatCount(template) }} asientos
              </span>
              <span v-if="getVipCount(template) > 0" class="stat">
                <i class="pi pi-star"></i>
                {{ getVipCount(template) }} VIP
              </span>
            </div>
          </div>
        </div>

        <Button
          label="+ Crear Nuevo Template"
          @click="showCreateTemplate"
          class="p-button-text p-button-sm"
          icon="pi pi-plus"
        />
      </div>

      <!-- Información del grupo -->
      <div class="form-section" v-if="selectedTemplate">
        <h3>Información del Grupo</h3>
        
        <div class="form-field">
          <label for="groupName">Nombre del Grupo *</label>
          <InputText
            id="groupName"
            v-model="formData.name"
            placeholder="Ej: Flota VIP Norte"
            :class="{ 'p-invalid': errors.name }"
          />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>

        <div class="form-field">
          <label for="groupDescription">Descripción</label>
          <Textarea
            id="groupDescription"
            v-model="formData.description"
            placeholder="Ej: Buses para ruta Quito-Ibarra"
            rows="3"
          />
        </div>

        <!-- Advertencia importante -->
          <Message severity="warn" :closable="false">
          <strong>⚠️ Importante:</strong>
          Todos los buses que agregues a este grupo tendrán:
          <ul>
            <li>{{ selectedTemplate ? getRealSeatCount(selectedTemplate) : 0 }} asientos</li>
            <li>Configuración: {{ selectedTemplate?.name }}</li>
            <li>Intercambiables entre sí en las hojas de ruta</li>
          </ul>
        </Message>
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
          label="Crear Grupo"
          icon="pi pi-check"
          @click="onCreate"
          :disabled="!selectedTemplate"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>

  <TemplateForm
    :visible="showTemplateForm"
    @update:visible="(val) => (showTemplateForm = val)"
    @created="onTemplateCreated"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import TemplateForm from './TemplateForm.vue'
import type { BusTemplateDto, CreateBusGroupRequest } from '../interfaces/template.interface'
import * as templateService from '../services/templateService'
import * as busGroupService from '../services/busGroupService'
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
const showTemplateForm = ref(false)
const availableTemplates = ref<BusTemplateDto[]>([])
const selectedTemplate = ref<BusTemplateDto | null>(null)

const formData = ref<CreateBusGroupRequest>({
  cooperativeId: authStore.user?.cooperativeId || '',
  templateId: '',
  name: '',
  description: ''
})

const errors = ref<Record<string, string>>({})

function getRealSeatCount(template: BusTemplateDto): number {
  // Mostrar seatCount de BD cuando el template es del sistema
  if (template && template.seatCount != null && (template.cooperativeId === null || template.cooperativeId === undefined)) {
    return template.seatCount
  }
  if (!template || !template.seatConfiguration) return template?.seatCount || 0
  return Object.values(template.seatConfiguration).filter(v => ['NORMAL','VIP','SEMI_BED','BED'].includes(v)).length
}

watch(() => props.visible, (val) => {
  visibleLocal.value = val
  if (val) {
    resetForm()
    loadTemplates()
  }
})

onMounted(() => {
  if (props.visible) {
    loadTemplates()
  }
})

function onVisibleChange(val: boolean) {
  emit('update:visible', val)
}

function resetForm() {
  formData.value = {
    cooperativeId: authStore.user?.cooperativeId || '',
    templateId: '',
    name: '',
    description: ''
  }
  selectedTemplate.value = null
  errors.value = {}
}

async function loadTemplates() {
  try {
    if (authStore.user?.cooperativeId) {
      availableTemplates.value = await templateService.listAvailableForCooperative(
        authStore.user.cooperativeId
      )
    } else {
      availableTemplates.value = await templateService.listSystemTemplates()
    }
  } catch (err: any) {
    console.error('[BusGroupForm] Error loading templates:', err)
    notifyError('Error', 'No se pudieron cargar los templates')
  }
}

function selectTemplate(template: BusTemplateDto) {
  selectedTemplate.value = template
  formData.value.templateId = template.id
}

function getVipCount(template: BusTemplateDto): number {
  if (!template.seatConfiguration) return 0
  return Object.values(template.seatConfiguration).filter(type => type === 'VIP').length
}

function showCreateTemplate() {
  showTemplateForm.value = true
}

async function onTemplateCreated() {
  await loadTemplates()
  success('Template creado', 'Ahora puedes seleccionarlo para tu grupo')
}

function validate(): boolean {
  errors.value = {}
  
  if (!formData.value.name?.trim()) {
    errors.value.name = 'El nombre es obligatorio'
  }
  
  if (!selectedTemplate.value) {
    notifyError('Error', 'Debes seleccionar un template')
    return false
  }
  
  return Object.keys(errors.value).length === 0
}

async function onCreate() {
  if (!validate()) return
  
  loading.value = true
  
  try {
    const group = await busGroupService.createGroup(formData.value)
    
    success('Grupo creado', `"${group.name}" creado exitosamente`)
    emit('created')
    onVisibleChange(false)
  } catch (err: any) {
    console.error('[BusGroupForm] Error creating group:', err)
    notifyError('Error', err?.response?.data?.message || 'No se pudo crear el grupo')
  } finally {
    loading.value = false
  }
}

function onCancel() {
  onVisibleChange(false)
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
  color: var(--app-text);
}

.group-form {
  padding: 1rem 0;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--app-text);
}

.template-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
}

.template-card {
  padding: 1rem;
  border: 2px solid var(--gray-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.template-card:hover {
  border-color: var(--app-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-card.selected {
  border-color: var(--app-accent);
  background: rgba(var(--app-accent-rgb), 0.05);
  box-shadow: 0 0 0 3px rgba(var(--app-accent-rgb), 0.1);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.template-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-text);
  flex: 1;
}

.template-description {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--gray-medium);
  min-height: 2.5rem;
}

.template-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--gray-medium);
  margin-top: 0.75rem;
}

.template-stats .stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

.form-field :deep(.p-inputtext),
.form-field :deep(.p-textarea) {
  width: 100%;
}

.p-error {
  color: #e24c4c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

:deep(.p-message) {
  margin-top: 1rem;
}

:deep(.p-message ul) {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

:deep(.p-message li) {
  margin: 0.25rem 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>

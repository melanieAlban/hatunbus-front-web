<template>
  <div class="personalize-view">
    <h2>Personalización de la Cooperativa</h2>
    
    <div v-if="loading" class="loading">
      Cargando datos de la cooperativa...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else class="personalize-content">
      <!-- Preview Card -->
      <div class="preview-card">
        <h3>Vista Previa</h3>
        <div class="preview-box" :style="previewStyles">
          <div v-if="logoPreview" class="logo-preview">
            <img :src="logoPreview" alt="Logo" />
          </div>
          <div v-else class="logo-placeholder">
            Sin logo
          </div>
          <p>Colores de la cooperativa</p>
        </div>
      </div>

      <!-- Logo Upload -->
      <div class="form-section">
        <h3>Logo</h3>
        <p class="help-text">El logo se mostrará en los boletos de la aplicación móvil.</p>
        
        <div class="file-input-wrapper">
          <input
            type="file"
            ref="fileInput"
            accept="image/png,image/jpeg,image/jpg"
            @change="onFileSelected"
            id="logoFile"
          />
          <label for="logoFile" class="file-label">
            Seleccionar Imagen
          </label>
          <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
        </div>
      </div>

      <!-- Color Pickers -->
      <div class="form-section">
        <h3>Colores</h3>
        <p class="help-text">Los colores se aplicarán al panel de administración web.</p>

        <div class="color-row">
          <label for="primaryColor">Color Primario:</label>
          <input
            type="color"
            v-model="primaryColor"
            id="primaryColor"
          />
          <span class="color-value">{{ primaryColor }}</span>
        </div>

        <div class="color-row">
          <label for="secondaryColor">Color Secundario:</label>
          <input
            type="color"
            v-model="secondaryColor"
            id="secondaryColor"
          />
          <span class="color-value">{{ secondaryColor }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions">
        <button @click="saveCustomization" :disabled="saving" class="btn-save">
          {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
        <button @click="resetForm" :disabled="saving" class="btn-reset">
          Restablecer
        </button>
      </div>

      <div v-if="successMessage" class="success">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../auth/store/useAuthStore'
import {
  getCooperativeById,
  updateCustomization,
  getCooperativeLogo,
  type CustomizationPayload
} from '../../cooperatives/services/cooperativeService'

const authStore = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const cooperativeId = ref<string | null>(null)
const cooperativeName = ref<string>('')

const logoPreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const primaryColor = ref('#8B7355') // earth-primary (café/tierra) - color por defecto
const secondaryColor = ref('#A0826D') // earth-light - color por defecto

const previewStyles = computed(() => ({
  '--primary-color': primaryColor.value,
  '--secondary-color': secondaryColor.value,
}))

async function loadCooperativeData() {
  try {
    loading.value = true
    error.value = null

    // Obtener cooperativa del usuario logueado
    const user = authStore.user
    if (!user?.cooperativeId) {
      error.value = 'No se encontró una cooperativa asociada a tu usuario.'
      return
    }

    cooperativeId.value = user.cooperativeId
    
    // Cargar datos de la cooperativa
    const coop = await getCooperativeById(cooperativeId.value)
    cooperativeName.value = coop.name
    
    // Cargar colores si existen
    if (coop.primaryColor) primaryColor.value = coop.primaryColor
    if (coop.secondaryColor) secondaryColor.value = coop.secondaryColor

    // Cargar logo si existe
    if (coop.logo) {
      // Si es base64, usarlo directamente
      logoPreview.value = coop.logo
    } else {
      // Intentar cargar desde endpoint /logo
      try {
        const blob = await getCooperativeLogo(cooperativeId.value)
        logoPreview.value = URL.createObjectURL(blob)
      } catch (e) {
        console.log('No logo found for cooperative')
      }
    }
  } catch (e: any) {
    error.value = e.message || 'Error al cargar los datos de la cooperativa'
  } finally {
    loading.value = false
  }
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // Validar tipo
  if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
    alert('Por favor selecciona una imagen PNG o JPEG')
    return
  }

  // Validar tamaño (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('La imagen no puede superar 5MB')
    return
  }

  selectedFile.value = file

  // Crear preview
  const reader = new FileReader()
  reader.onload = (e) => {
    logoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

async function saveCustomization() {
  if (!cooperativeId.value) {
    alert('No se encontró la cooperativa')
    return
  }

  try {
    saving.value = true
    successMessage.value = null
    error.value = null

    const payload: CustomizationPayload = {
      primaryColor: primaryColor.value,
      secondaryColor: secondaryColor.value,
    }

    // Si hay archivo nuevo, convertir a base64
    if (selectedFile.value) {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(selectedFile.value!)
      })
      payload.logoBase64 = base64
    }

    await updateCustomization(cooperativeId.value, payload)
    
    successMessage.value = '✓ Personalización guardada correctamente'
    
    // Recargar la página para aplicar los cambios en el layout
    setTimeout(() => {
      window.location.reload()
    }, 1000)

  } catch (e: any) {
    error.value = e.message || 'Error al guardar la personalización'
  } finally {
    saving.value = false
  }
}

async function resetForm() {
  if (!cooperativeId.value) {
    alert('No se encontró la cooperativa')
    return
  }

  if (!confirm('¿Deseas restablecer a los valores por defecto? Esto eliminará el logo y restablecerá los colores.')) {
    return
  }

  try {
    saving.value = true
    error.value = null

    // Enviar strings vacíos para restablecer
    const payload: CustomizationPayload = {
      logoBase64: '',
      primaryColor: '',
      secondaryColor: '',
    }

    await updateCustomization(cooperativeId.value, payload)
    
    successMessage.value = '✓ Restablecido a valores por defecto'
    
    // Recargar la página para aplicar los cambios
    setTimeout(() => {
      window.location.reload()
    }, 1000)

  } catch (e: any) {
    error.value = e.message || 'Error al restablecer la personalización'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCooperativeData()
})
</script>

<style scoped>
.personalize-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.loading,
.error {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.loading {
  background: #e3f2fd;
  color: #1976d2;
}

.error {
  background: #ffebee;
  color: #c62828;
}

.success {
  padding: 1rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  margin-top: 1rem;
}

.personalize-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.preview-card {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.preview-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #555;
}

.preview-box {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  color: white;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.logo-preview img {
  max-width: 150px;
  max-height: 150px;
  object-fit: contain;
  background: white;
  padding: 0.5rem;
  border-radius: 8px;
}

.logo-placeholder {
  width: 150px;
  height: 150px;
  background: rgba(255, 255, 255, 0.3);
  border: 2px dashed rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.form-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #333;
}

.help-text {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.file-input-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-input-wrapper input[type="file"] {
  display: none;
}

.file-label {
  background: #2196f3;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.file-label:hover {
  background: #1976d2;
}

.file-name {
  color: #666;
  font-size: 0.9rem;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.color-row label {
  min-width: 150px;
  color: #555;
}

.color-row input[type="color"] {
  width: 60px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-family: monospace;
  color: #666;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn-save,
.btn-reset {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-save {
  background: #4caf50;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #45a049;
}

.btn-reset {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-reset:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-save:disabled,
.btn-reset:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

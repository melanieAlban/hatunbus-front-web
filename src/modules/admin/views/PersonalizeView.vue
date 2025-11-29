<template>
  <div class="personalize-view">
    <div class="view-header">
      <h1 class="page-title">Personalización de la Cooperativa</h1>
      <p class="page-subtitle">Personaliza la identidad visual de tu cooperativa</p>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando datos de la cooperativa...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else class="personalize-content">
      <div class="content-grid">
        <!-- Vista Previa -->
        <div class="preview-section">
          <div class="section-header">
            <h2 class="section-title">Vista Previa</h2>
            <p class="section-description">Así se verá tu personalización en el panel</p>
          </div>
          
          <div class="preview-card" :style="previewStyles">
            <div class="preview-header">
              <div class="preview-logo-wrapper">
                <div 
                  v-if="logoPreview" 
                  class="logo-preview-container"
                  @click="fileInput?.click()"
                >
                  <img :src="logoPreview" alt="Logo" class="logo-image" />
                  <button 
                    class="camera-button"
                    :style="{ borderColor: primaryColor, color: primaryColor }"
                    @click.stop="fileInput?.click()"
                    type="button"
                    aria-label="Cambiar logo"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div 
                  v-else 
                  class="logo-placeholder"
                  @click="fileInput?.click()"
                >
                  <div class="placeholder-content">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="placeholder-text">Sin logo</span>
                    <span class="placeholder-hint">Haz clic para agregar</span>
                  </div>
                </div>
              </div>
              <div class="preview-title">{{ cooperativeName || 'Nombre de la Cooperativa' }}</div>
            </div>
            <div class="preview-footer">
              <div class="color-indicators">
                <div class="color-indicator">
                  <div class="color-dot" :style="{ backgroundColor: primaryColor }"></div>
                  <span class="color-label-text">Primario</span>
                </div>
                <div class="color-indicator">
                  <div class="color-dot" :style="{ backgroundColor: secondaryColor }"></div>
                  <span class="color-label-text">Secundario</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Paleta de Colores -->
        <div class="colors-section">
          <div class="section-header">
            <h2 class="section-title">Paleta de Colores</h2>
            <p class="section-description">Define los colores de tu identidad visual</p>
          </div>

          <div class="colors-card">
            <div class="color-picker-group">
              <div class="color-picker-header">
                <label for="primaryColor" class="color-picker-label">Color Primario</label>
              </div>
              <div class="color-picker-controls">
                <div class="color-display" :style="{ backgroundColor: primaryColor }"></div>
                <input
                  type="color"
                  v-model="primaryColor"
                  id="primaryColor"
                  class="color-input-native"
                />
                <input
                  type="text"
                  v-model="primaryColor"
                  class="color-input-hex"
                  @input="updatePrimaryColor"
                  maxlength="7"
                  placeholder="#8B7355"
                />
              </div>
            </div>

            <div class="color-divider"></div>

            <div class="color-picker-group">
              <div class="color-picker-header">
                <label for="secondaryColor" class="color-picker-label">Color Secundario</label>
              </div>
              <div class="color-picker-controls">
                <div class="color-display" :style="{ backgroundColor: secondaryColor }"></div>
                <input
                  type="color"
                  v-model="secondaryColor"
                  id="secondaryColor"
                  class="color-input-native"
                />
                <input
                  type="text"
                  v-model="secondaryColor"
                  class="color-input-hex"
                  @input="updateSecondaryColor"
                  maxlength="7"
                  placeholder="#A0826D"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-bar">
        <button 
          @click="saveCustomization" 
          :disabled="saving" 
          class="btn btn-primary"
        >
          <span v-if="saving" class="btn-spinner"></span>
          <span v-else class="btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 21V13H7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 3V8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span>{{ saving ? 'Guardando...' : 'Guardar Cambios' }}</span>
        </button>
        <button 
          @click="resetForm" 
          :disabled="saving" 
          class="btn btn-secondary"
        >
          <span class="btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span>Restablecer</span>
        </button>
      </div>

    </div>

    <!-- Hidden File Input -->
    <input
      type="file"
      ref="fileInput"
      accept="image/png,image/jpeg,image/jpg"
      @change="onFileSelected"
      style="display: none;"
    />
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
import { success, confirm } from '../../../lib/notifier'

const authStore = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const cooperativeId = ref<string | null>(null)
const cooperativeName = ref<string>('')

const logoPreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const primaryColor = ref('#8B7355')
const secondaryColor = ref('#A0826D')

const previewStyles = computed(() => ({
  '--primary-color': primaryColor.value,
  '--secondary-color': secondaryColor.value,
}))

async function loadCooperativeData() {
  try {
    loading.value = true
    error.value = null

    const user = authStore.user
    if (!user?.cooperativeId) {
      error.value = 'No se encontró una cooperativa asociada a tu usuario.'
      return
    }

    cooperativeId.value = user.cooperativeId
    
    const coop = await getCooperativeById(cooperativeId.value)
    cooperativeName.value = coop.name
    
    if (coop.primaryColor) primaryColor.value = coop.primaryColor
    if (coop.secondaryColor) secondaryColor.value = coop.secondaryColor

    if (coop.logo) {
      logoPreview.value = coop.logo
    } else {
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
  processFile(file)
}

function processFile(file: File) {
  if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
    error.value = 'Por favor selecciona una imagen PNG o JPEG'
    setTimeout(() => { error.value = null }, 3000)
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    error.value = 'La imagen no puede superar 5MB'
    setTimeout(() => { error.value = null }, 3000)
    return
  }

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    logoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function updatePrimaryColor(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  if (/^#[0-9A-F]{6}$/i.test(value)) {
    primaryColor.value = value.toUpperCase()
  }
}

function updateSecondaryColor(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  if (/^#[0-9A-F]{6}$/i.test(value)) {
    secondaryColor.value = value.toUpperCase()
  }
}

async function saveCustomization() {
  if (!cooperativeId.value) {
    alert('No se encontró la cooperativa')
    return
  }

  try {
    saving.value = true
    error.value = null

    const payload: CustomizationPayload = {
      primaryColor: primaryColor.value,
      secondaryColor: secondaryColor.value,
    }

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
    
    success('Personalización guardada', 'Los cambios se aplicarán en breve')
    
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

  const ok = await confirm({
    title: 'Restablecer personalización',
    message: '¿Deseas restablecer a los valores por defecto? Esto eliminará el logo y restablecerá los colores.',
    acceptLabel: 'Restablecer',
    rejectLabel: 'Cancelar'
  })

  if (!ok) {
    return
  }

  try {
    saving.value = true
    error.value = null

    const payload: CustomizationPayload = {
      logoBase64: '',
      primaryColor: '',
      secondaryColor: '',
    }

    await updateCustomization(cooperativeId.value, payload)
    
    success('Restablecido', 'Los valores por defecto se aplicarán en breve')
    
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
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.view-header {
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--earth-darker);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1.05rem;
  color: var(--gray-earth);
  margin: 0;
  font-weight: 400;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  gap: 1.5rem;
}

.spinner {
  width: 56px;
  height: 56px;
  border: 5px solid var(--beige-medium);
  border-top-color: var(--earth-primary);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--gray-earth);
  font-size: 1.1rem;
  margin: 0;
}

.error-state p {
  color: #dc2626;
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
}

.personalize-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

.section-header {
  margin-bottom: 1.25rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--earth-darker);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.section-description {
  font-size: 0.95rem;
  color: var(--gray-earth);
  margin: 0;
  line-height: 1.5;
}

.preview-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
}

.preview-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  min-height: 280px;
  justify-content: center;
}

.preview-logo-wrapper {
  position: relative;
  z-index: 1;
}

.logo-preview-container {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
}

.logo-preview-container:hover {
  transform: scale(1.05);
}

.logo-image {
  width: 140px;
  height: 140px;
  object-fit: contain;
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  display: block;
}

.camera-button {
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 3px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  z-index: 2;
}

.camera-button svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.camera-button svg path,
.camera-button svg circle {
  stroke: currentColor;
  fill: none;
}

.camera-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  background: currentColor;
}

.camera-button:hover svg path,
.camera-button:hover svg circle {
  stroke: white;
}

.camera-button:active {
  transform: scale(0.95);
}

.logo-placeholder {
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.15);
  border: 2px dashed rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(8px);
}

.logo-placeholder:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.02);
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
}

.placeholder-content svg {
  opacity: 0.8;
}

.placeholder-text {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.95;
}

.placeholder-hint {
  font-size: 0.85rem;
  opacity: 0.75;
  font-weight: 400;
}

.preview-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  letter-spacing: -0.01em;
}

.preview-body {
  background: white;
}

.preview-footer {
  padding: 2rem;
  background: var(--beige-bone);
  border-top: 1px solid var(--beige-medium);
}

.color-indicators {
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: center;
}

.color-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.color-dot {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
}

.color-label-text {
  font-size: 0.875rem;
  color: var(--gray-earth);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.colors-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.colors-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06);
}

.color-picker-group {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.color-picker-header {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.color-picker-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--earth-darker);
  cursor: pointer;
}

.color-picker-description {
  font-size: 0.9rem;
  color: var(--gray-earth);
  line-height: 1.4;
}

.color-picker-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-display {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  border: 4px solid white;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.color-display:hover {
  transform: scale(1.05);
}

.color-input-native {
  width: 90px;
  height: 56px;
  border: 2px solid var(--beige-medium);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  background: transparent;
}

.color-input-native:hover {
  border-color: var(--app-accent);
  transform: scale(1.05);
}

.color-input-hex {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--beige-medium);
  border-radius: 12px;
  font-family: 'Courier New', 'Monaco', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: var(--earth-darker);
  background: var(--beige-bone);
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.color-input-hex:focus {
  outline: none;
  border-color: var(--app-accent);
  background: white;
  box-shadow: 0 0 0 4px rgba(139, 115, 85, 0.1);
}

.color-divider {
  height: 1px;
  background: var(--beige-medium);
  margin: 2rem 0;
}

.actions-bar {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 1px solid var(--beige-medium);
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  position: relative;
  letter-spacing: -0.01em;
}

.btn-primary {
  background: var(--app-accent);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: var(--app-accent);
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 115, 85, 0.35);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  background: white;
  color: var(--earth-darker);
  border: 2px solid var(--beige-medium);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--beige-bone);
  border-color: var(--app-accent);
  color: var(--app-accent);
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon svg {
  stroke-width: 2.5;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}


@media (max-width: 768px) {
  .personalize-view {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .content-grid {
    gap: 1.5rem;
  }

  .preview-header {
    padding: 2rem 1.5rem;
    min-height: 240px;
  }

  .logo-image {
    width: 120px;
    height: 120px;
  }

  .camera-button {
    width: 40px;
    height: 40px;
    bottom: -6px;
    right: -6px;
  }

  .logo-placeholder {
    width: 160px;
    height: 160px;
  }

  .colors-card {
    padding: 1.5rem;
  }

  .actions-bar {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

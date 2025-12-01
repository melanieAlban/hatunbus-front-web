<template>
  <div class="wizard-view">
    <header class="page-header">
      <div>
        <p class="eyebrow">Hoja de Ruta · Nuevo flujo</p>
        <h2>Generador de Hoja de Ruta por Grupo</h2>
        <p class="lead">
          Wizard de 3 pasos para validar conexiones, conservar la cadena confirmada y previsualizar la rotación finita
          en matriz Bus x Fecha.
        </p>
      </div>
      <div class="header-badge">
        <i class="pi pi-route"></i>
        <span>Auto-chaining + Matriz</span>
      </div>
    </header>

    <div class="wizard-grid">
      <!-- Paso 1: Datos base -->
      <section class="card step-card">
        <div class="card-head">
          <div>
            <p class="eyebrow">Paso 1</p>
            <h3>Contexto de generación</h3>
            <p class="muted">Selecciona el grupo, las frecuencias candidatas y la fecha de inicio.</p>
          </div>
          <Button
            icon="pi pi-refresh"
            label="Limpiar"
            text
            size="small"
            @click="resetAll"
            :disabled="wizard.chainLoading || wizard.matrixLoading"
          />
        </div>

        <div class="field">
          <label><i class="pi pi-users"></i> Grupo de buses</label>
          <Dropdown
            v-model="selectedBusGroupId"
            :options="busGroups"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecciona grupo"
            :loading="contextLoading"
            class="w-full"
            showClear
          >
            <template #option="{ option }">
              <div class="option-line">
                <strong>{{ option.name }}</strong>
                <small class="muted">{{ option.busCount || 0 }} buses · {{ option.template?.name || 'Plantilla' }}</small>
              </div>
            </template>
          </Dropdown>
        </div>

        <div class="field">
          <label><i class="pi pi-sitemap"></i> Frecuencias candidatas</label>
          <MultiSelect
            v-model="selectedFrequencyIds"
            :options="availableFrequencies"
            optionLabel="name"
            optionValue="id"
            display="chip"
            placeholder="Selecciona frecuencias a encadenar"
            class="w-full"
            filter
            :loading="contextLoading"
          >
            <template #option="{ option }">
              <div class="option-line">
                <strong>{{ option.name || getFrequencyLabel(option) }}</strong>
                <small class="muted">{{ getFrequencyLabel(option) }}</small>
              </div>
            </template>
          </MultiSelect>
          <small class="muted">
            {{ selectedFrequencyIds.length }} seleccionadas · se auto-ordenarán al validar
          </small>
        </div>

        <div class="field">
          <label><i class="pi pi-calendar"></i> Fecha de inicio</label>
          <Calendar
            v-model="startDate"
            dateFormat="yy-mm-dd"
            :showIcon="true"
            class="w-full"
          />
        </div>

        <div class="actions">
          <Button
            icon="pi pi-link"
            label="Verificar encadenado"
            class="p-button-rounded"
            @click="handleVerifyChain"
            :loading="wizard.chainLoading"
            :disabled="!selectedFrequencyIds.length || !selectedBusGroupId"
          />
        </div>
      </section>

      <!-- Paso 2: Cadena -->
      <ChainResult
        :orderedChain="wizard.orderedChain"
        :discardedFrequencies="wizard.discardedFrequencies"
        :isValid="wizard.isChainValid"
        :loading="wizard.chainLoading"
      />

      <!-- Botón de Generar -->
      <section v-if="wizard.isChainValid && wizard.orderedChain.length > 0" class="card generate-card">
        <div class="generate-content">
          <div>
            <h3><i class="pi pi-check-circle"></i> Cadena Confirmada</h3>
            <p class="muted">El encadenado de frecuencias es válido. Genera la hoja de ruta ahora.</p>
          </div>
          <Button
            icon="pi pi-save"
            label="Generar Hoja de Ruta"
            severity="success"
            size="large"
            @click="handleGenerateRouteSheet"
            :loading="isGenerating"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Calendar from 'primevue/calendar'
import { error as notifyError, success } from '../../../lib/notifier'
import { useAuthStore } from '../../auth/store/useAuthStore'
import { useRouteWizardStore } from '../../routes/store/useRouteWizardStore'
import type { BusGroupDto } from '../../buses/interfaces/template.interface'
import type { FrequencyDto } from '../../routes/interfaces/route.interface'
import { listAllFrequenciesByCooperative } from '../../routes/services/routeService'
import { listGroupsByCooperative } from '../../buses/services/busGroupService'
import { generateForBusGroup } from '../../../services/routeSheetService'
import ChainResult from '../../routes/components/ChainResult.vue'

const auth = useAuthStore()
const wizard = useRouteWizardStore()

const busGroups = ref<BusGroupDto[]>([])
const availableFrequencies = ref<FrequencyDto[]>([])
const selectedBusGroupId = ref<string | null>(null)
const selectedFrequencyIds = ref<Array<string | number>>([])
const startDate = ref<Date | null>(new Date())
const contextLoading = ref(false)
const isGenerating = ref(false)

onMounted(async () => {
  await loadContext()
})

async function loadContext() {
  if (!auth.user?.cooperativeId) return
  contextLoading.value = true
  try {
    const [groups, freqs] = await Promise.all([
      listGroupsByCooperative(auth.user.cooperativeId),
      listAllFrequenciesByCooperative(auth.user.cooperativeId),
    ])
    busGroups.value = groups
    availableFrequencies.value = freqs.map(f => ({
      ...f,
      name: f.name || getFrequencyLabel(f),
    }))
  } catch (err: any) {
    notifyError('Error', err?.response?.data?.message || 'No se pudo cargar el contexto del wizard')
  } finally {
    contextLoading.value = false
  }
}

async function handleVerifyChain() {
  if (!selectedFrequencyIds.value.length) {
    notifyError('Selecciona frecuencias', 'Añade al menos una frecuencia para encadenar')
    return
  }
  try {
    await wizard.verifyChain(selectedFrequencyIds.value)
    if (wizard.isChainValid) {
      success('Cadena válida', 'El orden sugerido está listo para generar la matriz')
    }
  } catch (err) {
    // Errores ya notificados desde store
  }
}

async function handleGenerateRouteSheet() {
  if (!selectedBusGroupId.value) {
    notifyError('Falta grupo', 'Selecciona el grupo de buses')
    return
  }
  if (!startDate.value) {
    notifyError('Falta fecha', 'Elige la fecha de inicio')
    return
  }
  if (!wizard.isChainValid || wizard.orderedChain.length === 0) {
    notifyError('Valida primero', 'Confirma el encadenado antes de generar')
    return
  }

  const confirmed = window.confirm(
    'Se generará la hoja de ruta con la rotación planificada. ¿Continuar?'
  )
  if (!confirmed) return

  isGenerating.value = true
  try {
    const request = {
      startDate: formatDate(startDate.value),
      busGroupId: selectedBusGroupId.value,
      frequencies: wizard.orderedChain.map(freq => ({
        frequencyId: freq.id,
        operatingDays: undefined
      }))
    }

    await generateForBusGroup(request)
    success('Hoja de Ruta Generada', 'La hoja de ruta se creó exitosamente. Revisa el tab "Ver Hojas de Ruta".')
    resetAll()
  } catch (err: any) {
    console.error('[Wizard] Error generando hoja:', err)
    notifyError('Error', err?.response?.data?.message || 'No se pudo generar la hoja de ruta')
  } finally {
    isGenerating.value = false
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getFrequencyLabel(freq: FrequencyDto): string {
  if (freq.origin && freq.destination) return `${freq.origin} → ${freq.destination}`
  if (freq.segments && freq.segments.length) {
    const sorted = [...freq.segments].sort((a, b) => (a.segmentOrder || 0) - (b.segmentOrder || 0))
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    return `${first.routeOrigin || 'Origen'} → ${last.routeDestination || 'Destino'}`
  }
  return freq.name || 'Frecuencia'
}

function resetAll() {
  selectedBusGroupId.value = null
  selectedFrequencyIds.value = []
  startDate.value = new Date()
  wizard.resetAll()
}
</script>

<style scoped>
.wizard-view {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h2 {
  margin: 0.15rem 0;
  font-size: 2rem;
  color: #0f172a;
}

.lead {
  margin: 0;
  color: #475569;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #2563eb, #22d3ee);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.35);
  font-weight: 700;
}

.wizard-grid {
  display: grid;
  gap: 1rem;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
}

.step-card .card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.card-head h3 {
  margin: 0.25rem 0;
}

.muted {
  color: #64748b;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.field label {
  font-weight: 700;
  color: #0f172a;
}

.option-line {
  display: flex;
  flex-direction: column;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.w-full {
  width: 100%;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  color: #2563eb;
}

/* Generate card */
.generate-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #22c55e;
}

.generate-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.generate-content h3 {
  margin: 0 0 0.5rem 0;
  color: #166534;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.generate-content h3 i {
  color: #22c55e;
}

@media (max-width: 900px) {
  .page-header {
    flex-direction: column;
  }

  .step-card .card-head {
    flex-direction: column;
    gap: 0.5rem;
  }

  .generate-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

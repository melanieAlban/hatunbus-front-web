<template>
  <div class="routes-frequencies-view">
    <header class="page-header">
      <div class="header-left">
        <h2>Rutas y Frecuencias</h2>
        <p class="subtitle">
          Administra las rutas de la cooperativa y define las frecuencias (segmentos) que las utilizan.
        </p>
      </div>
    </header>

    <div v-if="!selectedCooperativeId" class="warning-card">
      <i class="pi pi-info-circle"></i>
      <div>
        <p>Debes seleccionar una cooperativa para visualizar o registrar rutas.</p>
        <small>
          Si tu usuario no tiene una cooperativa asignada, solicita al administrador que la configure.
        </small>
      </div>
    </div>

    <template v-else>
      <TabView>
        <TabPanel header="Frecuencias">
          <FrequenciesTab
            :cooperative-id="selectedCooperativeId"
            @create-frequency="openFrequencyDialog()"
          />
        </TabPanel>
        <TabPanel header="Rutas">
          <div class="tab-header">
            <div class="header-actions">
              <Button
                icon="pi pi-refresh"
                label="Refrescar"
                class="btn-refresh"
                @click="refreshRoutes"
                :disabled="!selectedCooperativeId || loadingRoutes"
                :loading="loadingRoutes && !!selectedCooperativeId"
              />
              <Button
                icon="pi pi-plus"
                label="Nueva ruta"
                class="p-button-success"
                @click="openRouteDialog()"
                :disabled="!selectedCooperativeId"
              />
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Total de rutas</span>
              <strong class="stat-value">{{ routes.length }}</strong>
            </div>
            <div class="stat-card">
              <span class="stat-label">Activas</span>
              <strong class="stat-value success">{{ activeRoutes }}</strong>
            </div>
            <div class="stat-card">
              <span class="stat-label">Inactivas</span>
              <strong class="stat-value warning">{{ inactiveRoutes }}</strong>
            </div>
          </div>

          <div class="routes-section">
            <div class="card-header">
              <div>
                <h3>Listado de rutas</h3>
                <small>Gestiona las rutas de la cooperativa.</small>
              </div>
            </div>
          <div class="routes-toolbar">
            <InputText
              v-model="routeSearch"
              placeholder="Buscar por nombre, origen o destino"
              class="route-search-input"
            />
          </div>

          <div v-if="loadingRoutes" class="loading-state">
            <Skeleton width="100%" height="2.5rem" v-for="n in 6" :key="`route-skeleton-${n}`" />
          </div>
          <div v-else-if="routesError" class="error-state">
            <i class="pi pi-exclamation-triangle"></i>
            <div>
              <p>{{ routesError }}</p>
              <Button label="Reintentar" icon="pi pi-refresh" class="p-button-text" @click="refreshRoutes" />
            </div>
          </div>
          <div v-else-if="filteredRoutes.length === 0" class="empty-state">
            <i class="pi pi-map"></i>
            <p>
              {{ routeSearch ? 'No se encontraron rutas que coincidan con la búsqueda.' : 'No hay rutas registradas para esta cooperativa.' }}
            </p>
          </div>
          <div v-else>
            <DataTable
              :value="filteredRoutes"
              dataKey="id"
              responsiveLayout="scroll"
              :rows="8"
              :paginator="filteredRoutes.length > 8"
            >
              <Column header="Ruta">
                <template #body="{ data }">
                  <div class="route-name">
                    <strong>{{ data.name }}</strong>
                    <small>{{ data.origin }} → {{ data.destination }}</small>
                  </div>
                </template>
              </Column>
              <Column header="Distancia">
                <template #body="{ data }">
                  {{ formatDistance(data.distanceKm) }}
                </template>
              </Column>
              <Column header="Tiempo Estimado">
                <template #body="{ data }">
                  {{ formatDuration(data.estimatedTime) }}
                </template>
              </Column>
              <Column header="Tarifa Base">
                <template #body="{ data }">
                  <Tag severity="info" :value="formatPrice(data.basePrice)" />
                </template>
              </Column>
              <Column header="Estado">
                <template #body="{ data }">
                  <Tag :severity="data.active ? 'success' : 'danger'" :value="data.active ? 'Activa' : 'Inactiva'" />
                </template>
              </Column>
              <Column header="Acciones" style="width: 180px;">
                <template #body="{ data }">
                  <div class="row-actions">
                    <Button
                      icon="pi pi-pencil"
                      class="p-button-text"
                      @click="openRouteDialog(data)"
                      v-tooltip.top="'Editar ruta'"
                    />
                    <Button
                      icon="pi pi-ban"
                      class="p-button-text p-button-warning"
                      v-if="data.active"
                      @click="confirmDeactivateRoute(data)"
                      v-tooltip.top="'Desactivar ruta'"
                    />
                    <Button
                      icon="pi pi-trash"
                      class="p-button-text p-button-danger"
                      @click="confirmDeleteRoute(data)"
                      v-tooltip.top="'Eliminar ruta'"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
        </TabPanel>
      </TabView>
    </template>

    <!-- Route dialog -->
    <Dialog
      v-model:visible="routeDialogVisible"
      modal
      :header="routeDialogMode === 'create' ? 'Registrar ruta' : 'Editar ruta'"
      :style="{ width: '640px' }"
      @hide="resetRouteForm"
    >
      <div class="dialog-body">
        <div class="form-grid">
          <div class="form-field">
            <label>Nombre de la ruta *</label>
            <InputText v-model="routeForm.name" placeholder="Ej. Guayaquil - Quito" />
            <small v-if="routeErrors.name" class="field-error">{{ routeErrors.name }}</small>
          </div>
          <div class="form-field">
            <label>Ciudad de origen *</label>
            <Dropdown
              v-model="routeForm.originCity"
              :options="cityOptions"
              optionLabel="name"
              optionValue="name"
              placeholder="Selecciona ciudad"
              filter
              :loading="citiesLoading"
            />
            <small v-if="routeErrors.originCity" class="field-error">{{ routeErrors.originCity }}</small>
          </div>
          <div class="form-field">
            <label>Ciudad de destino *</label>
            <Dropdown
              v-model="routeForm.destinationCity"
              :options="cityOptions"
              optionLabel="name"
              optionValue="name"
              placeholder="Selecciona ciudad"
              filter
              :loading="citiesLoading"
            />
            <small v-if="routeErrors.destinationCity" class="field-error">{{ routeErrors.destinationCity }}</small>
          </div>
          <div class="form-field">
            <label>Distancia (km) *</label>
            <InputNumber
              v-model="routeForm.distanceKm"
              mode="decimal"
              :min="0.1"
              :minFractionDigits="1"
              :maxFractionDigits="2"
              :useGrouping="false"
            />
            <small v-if="routeErrors.distanceKm" class="field-error">{{ routeErrors.distanceKm }}</small>
          </div>
          <div class="form-field">
            <label>Tiempo estimado (min) *</label>
            <InputNumber v-model="routeForm.estimatedTime" :min="1" :useGrouping="false" />
            <small v-if="routeErrors.estimatedTime" class="field-error">{{ routeErrors.estimatedTime }}</small>
          </div>
          <div class="form-field">
            <label>Tarifa base (USD) *</label>
            <InputNumber
              v-model="routeForm.basePrice"
              mode="currency"
              currency="USD"
              locale="es-EC"
              :min="0.1"
            />
            <small v-if="routeErrors.basePrice" class="field-error">{{ routeErrors.basePrice }}</small>
          </div>
          <div class="form-field col-span">
            <label>Descripción</label>
            <Textarea
              v-model="routeForm.description"
              rows="3"
              autoResize
              placeholder="Notas u observaciones sobre la ruta"
            />
          </div>
          <div class="form-field checkbox-field">
            <Checkbox v-model="routeForm.active" :binary="true" />
            <span>Ruta activa</span>
          </div>
        </div>
        <div class="dialog-actions">
          <Button label="Cancelar" class="p-button-text" @click="routeDialogVisible = false" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            :loading="isSavingRoute"
            @click="submitRouteForm"
          />
        </div>
      </div>
    </Dialog>

    <!-- Frequency dialog -->
    <Dialog
      v-model:visible="frequencyDialogVisible"
      modal
      :header="frequencyDialogMode === 'create' ? 'Registrar frecuencia' : 'Editar frecuencia'"
      :style="{ width: '860px' }"
      @hide="resetFrequencyForm"
    >
      <div class="dialog-body">
        <div class="form-grid">
          <div class="form-field col-span">
            <label>Resolución de la ANT *</label>
            <InputText
              v-model="frequencyForm.regulatoryResolution"
              placeholder="Ej. ANT-RES-2025-00123"
            />
            <small v-if="frequencyErrors.regulatoryResolution" class="field-error">
              {{ frequencyErrors.regulatoryResolution }}
            </small>
          </div>
        </div>

        <div class="segments-builder">
          <div class="segments-header">
            <h4>Segmentos</h4>
            <Button icon="pi pi-plus" label="Agregar segmento" class="p-button-sm" @click="addSegment" />
          </div>
          <small v-if="frequencyErrors.segments" class="field-error">{{ frequencyErrors.segments }}</small>
          <div
            v-for="(segment, index) in frequencyForm.segments"
            :key="`segment-${index}`"
            class="segment-row"
          >
            <div class="segment-index">#{{ index + 1 }}</div>
            <div class="segment-field">
              <label>Ruta *</label>
              <Dropdown
                v-model="segment.routeId"
                :options="getAvailableRoutesForSegment(index)"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona ruta"
                filter
                @change="onSegmentRouteChange(index)"
              />
            </div>
            <div class="segment-field">
              <label>Hora salida *</label>
              <Calendar
                v-model="segment.departureTime"
                timeOnly
                hourFormat="24"
                placeholder="HH:MM"
              />
            </div>
            <div class="segment-actions">
              <Button
                icon="pi pi-arrow-up"
                class="p-button-text"
                :disabled="index === 0"
                @click="moveSegment(index, -1)"
              />
              <Button
                icon="pi pi-arrow-down"
                class="p-button-text"
                :disabled="index === frequencyForm.segments.length - 1"
                @click="moveSegment(index, 1)"
              />
              <Button
                icon="pi pi-times"
                class="p-button-text p-button-danger"
                :disabled="frequencyForm.segments.length === 1"
                @click="removeSegment(index)"
              />
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <Button label="Cancelar" class="p-button-text" @click="frequencyDialogVisible = false" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            :loading="isSavingFrequency"
            @click="submitFrequencyForm"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Calendar from 'primevue/calendar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import FrequenciesTab from '../components/FrequenciesTab.vue'
import { useAuthStore } from '../../auth/store/useAuthStore'
import { useFrequencyStore } from '../../cooperatives/store/useFrequencyStore'
import { useCooperativeStore } from '../../cooperatives/store/useCooperativeStore'
import type { RouteDto, FrequencyDto } from '../../routes/interfaces/route.interface'
import {
  listRoutesByCooperative,
  getFrequenciesByRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  deactivateRoute,
  createFrequency,
  updateFrequency,
  deleteFrequency,
  deactivateFrequency,
} from '../../routes/services/routeService'
import { confirm, error as notifyError, success } from '../../../lib/notifier'
import type { CityDto } from '../../tickets/services/cityService'
import * as cityService from '../../tickets/services/cityService'

type RouteDialogMode = 'create' | 'edit'
type FrequencyDialogMode = 'create' | 'edit'

interface FrequencySegmentForm {
  routeId: string
  departureTime: Date | null
}

const auth = useAuthStore()
const cooperativeStore = useCooperativeStore()
const frequencyStore = useFrequencyStore()

const routes = ref<RouteDto[]>([])
const loadingRoutes = ref(false)
const routesError = ref<string | null>(null)
const routeSearch = ref('')

const selectedCooperativeId = ref<string | null>((auth.user as any)?.cooperativeId || null)
const selectedRouteId = ref<string | null>(null)

const frequenciesMap = ref<Record<string, FrequencyDto[]>>({})
const frequenciesLoading = ref<Record<string, boolean>>({})
const frequenciesError = ref<Record<string, string | null>>({})
const freqPanelRef = ref<HTMLElement | null>(null)

const cityOptions = ref<CityDto[]>([])
const citiesLoading = ref(false)

const cooperativeOptions = computed(() => cooperativeStore.items)
const canChangeCooperative = computed(() => {
  const role = (auth.user as any)?.role
  return role === 'ADMIN'
})

const routeDialogVisible = ref(false)
const routeDialogMode = ref<RouteDialogMode>('create')
const editingRouteId = ref<string | null>(null)
const isSavingRoute = ref(false)
const routeForm = reactive({
  name: '',
  originCity: '',
  destinationCity: '',
  distanceKm: null as number | null,
  estimatedTime: null as number | null,
  basePrice: null as number | null,
  description: '',
  active: true,
})
const routeErrors = reactive<Record<string, string | null>>({
  name: null,
  originCity: null,
  destinationCity: null,
  distanceKm: null,
  estimatedTime: null,
  basePrice: null,
})

const frequencyDialogVisible = ref(false)
const frequencyDialogMode = ref<FrequencyDialogMode>('create')
const editingFrequencyId = ref<string | null>(null)
const frequencyForm = reactive({
  regulatoryResolution: '',
  segments: [] as FrequencySegmentForm[],
})
const frequencyErrors = reactive<{ regulatoryResolution: string | null; segments: string | null }>({
  regulatoryResolution: null,
  segments: null,
})
const isSavingFrequency = ref(false)

onMounted(async () => {
  if (canChangeCooperative.value || !selectedCooperativeId.value) {
    await cooperativeStore.fetchActive()
  }
  await loadCities()
  if (selectedCooperativeId.value) {
    await fetchRoutes(selectedCooperativeId.value)
  }
})

watch(selectedCooperativeId, async (newId) => {
  if (!newId) {
    routes.value = []
    selectedRouteId.value = null
    return
  }
  await fetchRoutes(newId)
})

async function loadCities() {
  try {
    citiesLoading.value = true
    cityOptions.value = await cityService.getAllCities()
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'No se pudieron cargar las ciudades'
    notifyError('Error', message)
  } finally {
    citiesLoading.value = false
  }
}

async function fetchRoutes(cooperativeId: string) {
  loadingRoutes.value = true
  routesError.value = null
  selectedRouteId.value = null
  try {
    routes.value = await listRoutesByCooperative(cooperativeId)
    const firstRoute = routes.value[0]
    if (firstRoute) {
      selectRoute(firstRoute)
    } else {
      selectedRouteId.value = null
    }
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'No se pudieron cargar las rutas'
    routesError.value = message
    notifyError('Error', message)
  } finally {
    loadingRoutes.value = false
  }
}

async function refreshRoutes() {
  if (selectedCooperativeId.value) {
    await fetchRoutes(selectedCooperativeId.value)
  }
}

function selectRoute(route: RouteDto) {
  selectedRouteId.value = route.id
  scrollToFrequenciesPanel()
  if (!frequenciesMap.value[route.id]) {
    loadFrequencies(route.id)
  }
}

async function scrollToFrequenciesPanel() {
  await nextTick()
  freqPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function loadFrequencies(routeId: string, force = false) {
  if (!force && frequenciesMap.value[routeId]) return
  frequenciesLoading.value[routeId] = true
  frequenciesError.value[routeId] = null
  try {
    const list = await getFrequenciesByRoute(routeId)
    frequenciesMap.value = { ...frequenciesMap.value, [routeId]: list }
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'No se pudieron cargar las frecuencias'
    frequenciesError.value = { ...frequenciesError.value, [routeId]: message }
    notifyError('Error', message)
  } finally {
    frequenciesLoading.value = { ...frequenciesLoading.value, [routeId]: false }
  }
}

const selectedRoute = computed<RouteDto | null>(() => {
  return routes.value.find((r) => r.id === selectedRouteId.value) || null
})

const selectedRouteFrequencies = computed<FrequencyDto[]>(() => {
  if (!selectedRouteId.value) return []
  return frequenciesMap.value[selectedRouteId.value] || []
})

const isLoadingFrequencies = computed(() => {
  if (!selectedRouteId.value) return false
  return !!frequenciesLoading.value[selectedRouteId.value]
})

const currentFrequenciesError = computed(() => {
  if (!selectedRouteId.value) return null
  return frequenciesError.value[selectedRouteId.value] || null
})

const activeRoutes = computed(() => routes.value.filter((route) => route.active).length)
const inactiveRoutes = computed(() => routes.value.filter((route) => !route.active).length)

const filteredRoutes = computed(() => {
  const term = routeSearch.value.trim().toLowerCase()
  if (!term) return routes.value
  return routes.value.filter((route) => {
    const haystack = [route.name, route.origin, route.destination, route.description ?? '']
      .join(' ')
      .toLowerCase()
    return haystack.includes(term)
  })
})

const routeOptions = computed(() =>
  routes.value.map((route) => ({
    label: `${route.origin} → ${route.destination}`,
    value: route.id,
  }))
)

function formatDistance(distance: number | string) {
  const value = typeof distance === 'string' ? Number(distance) : distance
  if (Number.isNaN(value)) return '—'
  return `${value.toFixed(1)} km`
}

function formatDuration(minutes?: number | null) {
  if (minutes === undefined || minutes === null) return '—'
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs === 0) return `${mins} min`
  return `${hrs} h ${mins.toString().padStart(2, '0')} min`
}

function formatPrice(amount: number | string) {
  const value = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(value)) return '—'
  return `$${value.toFixed(2)}`
}

function formatTime(time?: string | null) {
  if (!time) return '—'
  return time.slice(0, 5)
}

function resetRouteForm() {
  routeForm.name = ''
  routeForm.originCity = ''
  routeForm.destinationCity = ''
  routeForm.distanceKm = null
  routeForm.estimatedTime = null
  routeForm.basePrice = null
  routeForm.description = ''
  routeForm.active = true
  Object.keys(routeErrors).forEach((key) => (routeErrors[key] = null))
  editingRouteId.value = null
}

function openRouteDialog(route?: RouteDto) {
  if (!selectedCooperativeId.value) {
    notifyError('Selecciona una cooperativa', 'Debes elegir una cooperativa antes de registrar rutas.')
    return
  }
  if (route) {
    routeDialogMode.value = 'edit'
    editingRouteId.value = route.id
    routeForm.name = route.name
    routeForm.originCity = route.originCity || route.origin
    routeForm.destinationCity = route.destinationCity || route.destination
    routeForm.distanceKm = Number(route.distanceKm)
    routeForm.estimatedTime = Number(route.estimatedTime)
    routeForm.basePrice = Number(route.basePrice)
    routeForm.description = route.description || ''
    routeForm.active = route.active
  } else {
    routeDialogMode.value = 'create'
    resetRouteForm()
  }
  routeDialogVisible.value = true
}

function validateRouteForm() {
  let isValid = true
  routeErrors.name = routeForm.name.trim() ? null : 'El nombre es obligatorio'
  routeErrors.originCity = routeForm.originCity ? null : 'Selecciona la ciudad de origen'
  routeErrors.destinationCity = routeForm.destinationCity ? null : 'Selecciona la ciudad de destino'
  routeErrors.distanceKm =
    routeForm.distanceKm && routeForm.distanceKm > 0 ? null : 'Ingresa una distancia válida'
  routeErrors.estimatedTime =
    routeForm.estimatedTime && routeForm.estimatedTime > 0 ? null : 'Tiempo estimado inválido'
  routeErrors.basePrice =
    routeForm.basePrice && routeForm.basePrice > 0 ? null : 'Ingresa la tarifa base'
  Object.values(routeErrors).forEach((value) => {
    if (value) isValid = false
  })
  return isValid
}

async function submitRouteForm() {
  if (!selectedCooperativeId.value) {
    notifyError('Selecciona una cooperativa', 'Debes elegir una cooperativa antes de registrar rutas.')
    return
  }
  if (!validateRouteForm()) return

  const distanceValue = Number(routeForm.distanceKm)
  const estimatedValue = Number(routeForm.estimatedTime)
  const basePriceValue = Number(routeForm.basePrice)

  if (!Number.isFinite(distanceValue) || !Number.isFinite(estimatedValue) || !Number.isFinite(basePriceValue)) {
    notifyError('Valores inválidos', 'Verifica la distancia, duración y tarifa base.')
    return
  }

  const basePayload = {
    cooperativeId: selectedCooperativeId.value,
    name: routeForm.name.trim(),
    originCity: routeForm.originCity,
    destinationCity: routeForm.destinationCity,
    distanceKm: distanceValue,
    estimatedTime: estimatedValue,
    description: routeForm.description?.trim() || '',
    basePrice: basePriceValue,
  }

  try {
    isSavingRoute.value = true
    if (routeDialogMode.value === 'create') {
      await createRoute(basePayload)
      success('Ruta registrada', basePayload.name)
    } else if (editingRouteId.value) {
      await updateRoute(editingRouteId.value, { ...basePayload, active: routeForm.active })
      success('Ruta actualizada', basePayload.name)
    }
    routeDialogVisible.value = false
    await refreshRoutes()
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'No se pudo guardar la ruta'
    notifyError('Error', message)
  } finally {
    isSavingRoute.value = false
  }
}

async function confirmDeleteRoute(route: RouteDto) {
  const ok = await confirm({
    title: 'Eliminar ruta',
    message: `¿Eliminar la ruta ${route.name}?`,
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
  })
  if (!ok) return
  try {
    await deleteRoute(route.id)
    success('Ruta eliminada', route.name)
    await refreshRoutes()
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'No se pudo eliminar la ruta'
    notifyError('Error', message)
  }
}

async function confirmDeactivateRoute(route: RouteDto) {
  const ok = await confirm({
    title: 'Desactivar ruta',
    message: `La ruta ${route.name} dejará de estar activa. ¿Deseas continuar?`,
    acceptLabel: 'Desactivar',
    rejectLabel: 'Cancelar',
  })
  if (!ok) return
  try {
    await deactivateRoute(route.id)
    success('Ruta desactivada', route.name)
    await refreshRoutes()
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'No se pudo desactivar la ruta'
    notifyError('Error', message)
  }
}

function resetFrequencyForm() {
  frequencyForm.regulatoryResolution = ''
  frequencyForm.segments = [
    {
      routeId: selectedRouteId.value || '',
      departureTime: '06:00',
      estimatedDuration: 60,
    },
  ]
  frequencyErrors.regulatoryResolution = null
  frequencyErrors.segments = null
  editingFrequencyId.value = null
}

function openFrequencyDialog(frequency?: FrequencyDto) {
  if (!selectedCooperativeId.value || !selectedRouteId.value) {
    notifyError('Selecciona una ruta', 'Debes elegir una ruta antes de gestionar frecuencias.')
    return
  }
  if (!frequency) {
    frequencyDialogMode.value = 'create'
    resetFrequencyForm()
  } else {
    frequencyDialogMode.value = 'edit'
    editingFrequencyId.value = frequency.id
    frequencyForm.regulatoryResolution = frequency.regulatoryResolution || ''
    frequencyForm.segments = (frequency.segments || []).map((segment) => ({
      routeId: segment.routeId || '',
      departureTime: formatTime(segment.departureTime).replace('—', '06:00'),
      estimatedDuration: segment.estimatedDuration || 60,
    }))
    if (frequencyForm.segments.length === 0) {
      frequencyForm.segments.push({
        routeId: selectedRouteId.value,
        departureTime: '06:00',
        estimatedDuration: 60,
      })
    }
  }
  frequencyDialogVisible.value = true
}

function addSegment() {
  const now = new Date()
  now.setHours(6, 0, 0, 0)

  frequencyForm.segments.push({
    routeId: '',
    departureTime: now,
  })
}

function removeSegment(index: number) {
  if (frequencyForm.segments.length === 1) return
  frequencyForm.segments.splice(index, 1)
}

function moveSegment(index: number, direction: 1 | -1) {
  const target = index + direction
  if (target < 0 || target >= frequencyForm.segments.length) return
  const current = frequencyForm.segments[index]
  const destination = frequencyForm.segments[target]
  if (!current || !destination) return
  frequencyForm.segments[index] = destination
  frequencyForm.segments[target] = current
}

function getAvailableRoutesForSegment(index: number) {
  // Primer segmento: todas las rutas disponibles
  if (index === 0) {
    return routeOptions.value
  }

  // Segmentos subsecuentes: filtrar por conectividad
  const previousSegment = frequencyForm.segments[index - 1]
  if (!previousSegment?.routeId) {
    return []
  }

  const previousRoute = routes.value.find((r) => r.id === previousSegment.routeId)
  if (!previousRoute) {
    return []
  }

  // Filtrar rutas que empiecen donde termina la anterior
  const availableRoutes = routes.value.filter(
    (route) => route.origin === previousRoute.destination
  )

  return availableRoutes.map((route) => ({
    label: `${route.origin} → ${route.destination}`,
    value: route.id,
  }))
}

function onSegmentRouteChange(index: number) {
  // Limpiar los segmentos siguientes cuando se cambia una ruta
  if (index < frequencyForm.segments.length - 1) {
    for (let i = index + 1; i < frequencyForm.segments.length; i++) {
      frequencyForm.segments[i].routeId = ''
    }
  }
}

function validateFrequencyForm() {
  let isValid = true
  frequencyErrors.regulatoryResolution = frequencyForm.regulatoryResolution.trim()
    ? null
    : 'La resolución es obligatoria'
  if (!frequencyForm.segments.length) {
    frequencyErrors.segments = 'Agrega al menos un segmento'
    isValid = false
  } else {
    const invalidSegment = frequencyForm.segments.find(
      (segment) => !segment.routeId || !segment.departureTime
    )
    frequencyErrors.segments = invalidSegment
      ? 'Todos los segmentos deben tener ruta y hora de salida'
      : null
    if (invalidSegment) isValid = false
  }
  return isValid
}

function buildFrequencySegmentPayload() {
  return frequencyForm.segments.map((segment, index) => {
    const route = routes.value.find((r) => r.id === segment.routeId)
    const estimatedDuration = route?.estimatedTime || 60

    // Convertir Date a string "HH:mm:ss"
    let departureTimeStr = '06:00:00'
    if (segment.departureTime instanceof Date) {
      const hours = String(segment.departureTime.getHours()).padStart(2, '0')
      const minutes = String(segment.departureTime.getMinutes()).padStart(2, '0')
      departureTimeStr = `${hours}:${minutes}:00`
    }

    return {
      routeId: segment.routeId,
      departureTime: departureTimeStr,
      estimatedDuration,
      segmentOrder: index + 1,
    }
  })
}

async function submitFrequencyForm() {
  if (!selectedCooperativeId.value) {
    notifyError('Selecciona una cooperativa', 'Debes elegir una cooperativa antes de registrar frecuencias.')
    return
  }
  if (!validateFrequencyForm()) return

  const segmentsPayload = buildFrequencySegmentPayload()
  const payload = {
    cooperativeId: selectedCooperativeId.value,
    regulatoryResolution: frequencyForm.regulatoryResolution.trim(),
    segments: segmentsPayload,
  }

  try {
    isSavingFrequency.value = true
    if (frequencyDialogMode.value === 'create') {
      await createFrequency(payload)
      success('Frecuencia registrada', payload.regulatoryResolution)
    } else if (editingFrequencyId.value) {
      await updateFrequency(editingFrequencyId.value, {
        regulatoryResolution: payload.regulatoryResolution,
        segments: segmentsPayload,
      })
      success('Frecuencia actualizada', payload.regulatoryResolution)
    }
    frequencyDialogVisible.value = false
    await refreshFrequenciesForRoutes(segmentsPayload.map((segment) => segment.routeId))
    await refreshAvailableFrequencies()
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'No se pudo guardar la frecuencia'
    notifyError('Error', message)
  } finally {
    isSavingFrequency.value = false
  }
}

async function confirmDeleteFrequency(frequency: FrequencyDto) {
  const ok = await confirm({
    title: 'Eliminar frecuencia',
    message: `¿Eliminar la frecuencia ${frequency.regulatoryResolution || frequency.id}?`,
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
  })
  if (!ok) return
  try {
    await deleteFrequency(frequency.id)
    success('Frecuencia eliminada', frequency.regulatoryResolution || frequency.id)
    await refreshFrequenciesForRoutes(getRouteIdsFromFrequency(frequency))
    await refreshAvailableFrequencies()
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'No se pudo eliminar la frecuencia'
    notifyError('Error', message)
  }
}

async function confirmDeactivateFrequency(frequency: FrequencyDto) {
  const ok = await confirm({
    title: 'Desactivar frecuencia',
    message: `La frecuencia ${frequency.regulatoryResolution || frequency.id} quedará inactiva. ¿Continuar?`,
    acceptLabel: 'Desactivar',
    rejectLabel: 'Cancelar',
  })
  if (!ok) return
  try {
    await deactivateFrequency(frequency.id)
    success('Frecuencia desactivada', frequency.regulatoryResolution || frequency.id)
    await refreshFrequenciesForRoutes(getRouteIdsFromFrequency(frequency))
    await refreshAvailableFrequencies()
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'No se pudo desactivar la frecuencia'
    notifyError('Error', message)
  }
}

function getRouteIdsFromFrequency(frequency: FrequencyDto) {
  const ids = (frequency.segments || []).map((segment) => segment.routeId).filter(Boolean)
  return Array.from(new Set(ids))
}

async function refreshFrequenciesForRoutes(routeIds: string[]) {
  const unique = Array.from(new Set(routeIds.filter(Boolean)))
  await Promise.all(unique.map((routeId) => loadFrequencies(routeId, true)))
  if (selectedRouteId.value && !unique.includes(selectedRouteId.value)) {
    await loadFrequencies(selectedRouteId.value, true)
  }
}

async function refreshAvailableFrequencies() {
  if (!selectedCooperativeId.value) return
  try {
    await frequencyStore.fetchAvailable(selectedCooperativeId.value)
  } catch (error) {
    console.error('[RoutesFrequenciesView] No se pudieron refrescar las frecuencias disponibles', error)
  }
}
</script>
<style scoped>
.routes-frequencies-view {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.subtitle {
  margin-top: 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.95rem;
}

.tab-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.selector {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.selector label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.coop-dropdown {
  min-width: 220px;
}

.btn-refresh {
  height: 42px;
}

.warning-card {
  display: flex;
  gap: 1rem;
  background: #fff9db;
  border: 1px solid #ffd43b;
  border-radius: 10px;
  padding: 1rem;
  color: #7f5f20;
}

.warning-card i {
  font-size: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--gray-light);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-value.success {
  color: #16a34a;
}

.stat-value.warning {
  color: #d97706;
}

.stat-value.highlight {
  color: #0f62fe;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  gap: 1.5rem;
}

.routes-card,
.frequencies-panel {
  background: var(--card-bg, #fff);
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid var(--gray-light);
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.routes-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
}

.route-search-input {
  width: 100%;
  max-width: 280px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.error-state,
.empty-state {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem;
  border-radius: 10px;
  background: var(--surface-100, #fef4f4);
  color: #b42318;
}

.empty-state {
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--text-color-secondary);
  background: var(--surface-50, #f9fafb);
}

.empty-state i {
  font-size: 2rem;
  color: var(--text-color-secondary);
}

.route-name {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.route-name small {
  color: var(--text-color-secondary);
}

.row-actions {
  display: flex;
  gap: 0.35rem;
}

.frequencies-panel {
  display: flex;
  flex-direction: column;
}

.panel-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-color-secondary);
  gap: 0.75rem;
}

.panel-empty i {
  font-size: 2rem;
  color: var(--text-color-secondary);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.panel-header p {
  margin: 0;
  color: var(--text-color-secondary);
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.route-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.route-meta div {
  background: var(--surface-50, #f9fafb);
  border-radius: 10px;
  padding: 0.75rem;
  border: 1px solid var(--surface-border, #e5e7eb);
}

.route-meta small {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.route-meta strong {
  display: block;
  font-size: 1.1rem;
  margin-top: 0.25rem;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
}

.frequencies-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.frequency-card {
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 12px;
  padding: 1rem;
}

.frequency-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.frequency-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.segments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.segment-item {
  border-radius: 10px;
  border: 1px solid var(--surface-border, #e5e7eb);
  padding: 0.75rem;
  background: var(--surface-card, #fff);
}

.segment-item.highlight {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.06);
}

.segment-route {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.segment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.segment-meta span {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-field label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
}

.form-field.col-span {
  grid-column: 1 / -1;
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.field-error {
  color: #dc2626;
  font-size: 0.8rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.segments-builder {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.segments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.segment-row {
  display: grid;
  grid-template-columns: auto minmax(200px, 1fr) minmax(140px, 1fr) minmax(120px, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 10px;
  background: var(--surface-50, #f9fafb);
}

.segment-index {
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--text-color-secondary);
}

.segment-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.segment-field.small {
  max-width: 150px;
}

.segment-field label {
  font-size: 0.85rem;
  font-weight: 600;
}

.segment-actions {
  display: flex;
  gap: 0.25rem;
}

.time-input {
  border: 1px solid var(--surface-border, #d1d5db);
  border-radius: 6px;
  padding: 0.55rem 0.5rem;
  font-size: 0.95rem;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .frequencies-panel {
    order: 2;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .coop-dropdown,
  .btn-refresh {
    width: 100%;
  }

  .segment-row {
    grid-template-columns: 1fr;
  }

  .segment-actions {
    justify-content: flex-end;
  }
}
</style>

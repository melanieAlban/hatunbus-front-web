<template>
  <div class="ticket-sale-view">
    <div class="sale-header">
      <h1><i class="pi pi-ticket"></i> Venta de Boletos</h1>
    </div>

    <div class="sale-container">
      <!-- Búsqueda de Viajes -->
      <Card class="search-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-search"></i>
            Buscar Viajes
          </div>
        </template>
        <template #content>
          <div class="search-grid">
            <!-- Ciudad Origen -->
            <div class="form-field">
              <label class="field-label">
                <i class="pi pi-map-marker"></i> Ciudad de Origen
              </label>
              <Dropdown
                v-model="searchOrigin"
                :options="originCities"
                optionLabel="name"
                optionValue="name"
                placeholder="Seleccionar origen"
                filter
                :class="['w-full', { 'p-invalid': searchErrors.origin }]"
                :loading="loadingCities"
                showClear
              >
                <template #option="slotProps">
                  <div class="city-option">
                    <span>{{ slotProps.option.name }}</span>
                    <small>{{ slotProps.option.province }}</small>
                  </div>
                </template>
              </Dropdown>
            <small v-if="searchErrors.origin" class="field-error">{{ searchErrors.origin }}</small>
            </div>

            <!-- Botón Intercambiar -->
            <div class="form-field swap-button-container">
              <label class="field-label">&nbsp;</label>
              <Button
                icon="pi pi-refresh"
                class="p-button-rounded p-button-outlined swap-button"
                @click="swapCities"
                :disabled="!searchOrigin && !searchDestination"
                v-tooltip.top="'Intercambiar ciudades'"
              />
            </div>

            <!-- Ciudad Destino -->
            <div class="form-field">
              <label class="field-label">
                <i class="pi pi-flag"></i> Ciudad de Destino
              </label>
              <Dropdown
                v-model="searchDestination"
                :options="destinationCities"
                optionLabel="name"
                optionValue="name"
                placeholder="Seleccionar destino"
                filter
                class="w-full"
                :loading="loadingCities"
                :disabled="!searchOrigin"
                showClear
              >
                <template #option="slotProps">
                  <div class="city-option">
                    <span>{{ slotProps.option.name }}</span>
                    <small>{{ slotProps.option.province }}</small>
                  </div>
                </template>
              </Dropdown>
            <small v-if="searchErrors.destination" class="field-error">{{ searchErrors.destination }}</small>
            </div>

            <!-- Fecha -->
            <div class="form-field">
              <label class="field-label">
                <i class="pi pi-calendar"></i> Fecha de Viaje
              </label>
              <input
                type="date"
                v-model="searchDate"
                :min="minDate"
                :class="['date-input', { invalid: searchErrors.date }]"
              />
              <small v-if="searchErrors.date" class="field-error">{{ searchErrors.date }}</small>
            </div>

            <!-- Botón Buscar -->
            <div class="form-field">
              <label class="field-label">&nbsp;</label>
              <Button
                label="Buscar Viajes"
                icon="pi pi-search"
                class="p-button-primary w-full"
                :loading="loading"
                :disabled="!searchOrigin || !searchDestination || !searchDate"
                @click="searchAvailableTrips"
              />
            </div>
          </div>

          <!-- Mostrar cooperativa si el usuario tiene una asignada -->
          <div v-if="userCooperativeId" class="cooperative-info">
            <Divider />
            <div class="info-banner">
              <i class="pi pi-building"></i>
              <span>Cooperativa: <strong>{{ authStore.user?.cooperativeName }}</strong></span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Resultados de Búsqueda -->
      <Card v-if="availableTrips.length > 0" class="results-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-list"></i>
            Viajes Disponibles ({{ availableTrips.length }})
          </div>
        </template>
        <template #content>
          <div class="trips-list">
            <div
              v-for="trip in availableTrips"
              :key="trip.id"
              class="trip-card"
              :class="{ 'selected': selectedTrip?.id === trip.id }"
              @click="selectTrip(trip)"
            >
              <div class="trip-header">
                <div class="trip-route">
                  <i class="pi pi-arrow-right"></i>
                  <strong>{{ trip.routeOrigin }} → {{ trip.routeDestination }}</strong>
                </div>
                <div class="trip-tags">
                  <Tag :value="trip.busPlate" severity="info" icon="pi pi-car" />
                  <Tag 
                    v-if="trip.driverName || trip.mainDriverName" 
                    :value="trip.driverName || trip.mainDriverName || 'Sin conductor'" 
                    severity="success" 
                    icon="pi pi-user" 
                  />
                  <Tag 
                    v-else
                    value="Sin conductor asignado" 
                    severity="warning" 
                    icon="pi pi-exclamation-triangle" 
                  />
                </div>
              </div>
              <div class="trip-info">
                <div class="info-item">
                  <i class="pi pi-clock"></i>
                  <span>{{ formatTime(trip.scheduledDepartureTime) }}</span>
                </div>
                <div class="info-item">
                  <i class="pi pi-calendar"></i>
                  <span>{{ formatDate(trip.date) }}</span>
                </div>
                <div class="info-item">
                  <i class="pi pi-users"></i>
                  <span>{{ trip.availableSeats }} asientos disponibles</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Mensaje si no hay resultados -->
      <Card v-else-if="searchPerformed && !loading" class="no-results-card">
        <template #content>
          <div class="no-results">
            <i class="pi pi-info-circle"></i>
            <h3>No se encontraron viajes</h3>
            <p>No hay viajes disponibles para la ruta y fecha seleccionadas.</p>
            <p>Por favor, intenta con otra búsqueda.</p>
          </div>
        </template>
      </Card>

      <!-- Selección de Asientos -->
      <Card v-if="selectedTrip" class="seats-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-car"></i>
            Selección de asientos
          </div>
        </template>
        <template #subtitle>
          <!-- Selector de cantidad de pasajeros -->
          <div class="passenger-count-selector">
            <label for="passengerCount" class="selector-label">
              <i class="pi pi-users"></i> ¿Cuántos pasajeros viajan?
            </label>
            <div class="count-controls">
              <Button
                icon="pi pi-minus"
                class="p-button-rounded p-button-outlined"
                @click="decrementPassengerCount"
                :disabled="passengerCount <= 1"
              />
              <span class="count-display">{{ passengerCount }}</span>
              <Button
                icon="pi pi-plus"
                class="p-button-rounded p-button-outlined"
                @click="incrementPassengerCount"
                :disabled="passengerCount >= (selectedTrip.availableSeats || 50)"
              />
            </div>
            <small class="count-hint">
              <i class="pi pi-info-circle"></i>
              Máximo {{ selectedTrip.availableSeats || 50 }} asientos disponibles
            </small>
          </div>

          <Divider />

          <div class="seat-legend">
            <div class="legend-item">
              <div class="seat-mini available">
                <i class="pi pi-check-circle"></i>
              </div>
              <span>Disponible</span>
            </div>
            <div class="legend-item">
              <div class="seat-mini selected">
                <i class="pi pi-user"></i>
              </div>
              <span>Seleccionado</span>
            </div>
            <div class="legend-item">
              <div class="seat-mini occupied">
                <i class="pi pi-times-circle"></i>
              </div>
              <span>Ocupado</span>
            </div>
          </div>
        </template>
        <template #content>
          <div class="bus-layout">
            <!-- Driver area -->
            <div class="driver-area">
              <i class="pi pi-user"></i>
              <span>Conductor</span>
            </div>

          <div class="seat-bus-shell">
            <div class="bus-label front">Frente</div>

            <!-- Dynamic Bus Layout Grid based on Template -->
            <div class="dynamic-seat-grid" :style="dynamicGridStyle">
              <div
                v-for="index in totalGridCells"
                :key="`cell-${index}`"
                :class="getDynamicCellClass(index)"
                @click="onCellClick(index)"
              >
                <template v-if="getCellInfo(index)?.type === 'seat'">
                  <span class="seat-number">{{ getCellInfo(index)?.seatCode }}</span>
                  <div v-if="getCellInfo(index)?.seatType && getCellInfo(index)?.seatType !== 'NORMAL'" class="seat-type-badge">
                    {{ getSeatTypeLabel(getCellInfo(index)?.seatType) }}
                  </div>
                  <div
                    v-if="(getCellInfo(index)?.additionalPrice ?? 0) > 0"
                    class="seat-price-badge"
                  >
                    +${{ (getCellInfo(index)?.additionalPrice ?? 0).toFixed(2) }}
                  </div>
                </template>
                <template
                  v-else-if="
                    getCellInfo(index)?.type &&
                    getCellInfo(index)?.type !== 'empty' &&
                    getCellInfo(index)?.type !== 'aisle'
                  "
                >
                  <div class="special-content">
                    <i
                      v-if="getSpecialIcon(getCellInfo(index)?.type)"
                      :class="getSpecialIcon(getCellInfo(index)?.type)"
                      :title="getSpecialLabel(getCellInfo(index)?.type)"
                    ></i>
                    <small class="special-label">{{ getSpecialLabel(getCellInfo(index)?.type) }}</small>
                  </div>
                </template>
              </div>
            </div>

            <div class="bus-label back">Salida</div>
          </div>
          </div>
        </template>
      </Card>

      <!-- Información de los Pasajeros -->
      <Card v-if="selectedSeats.length > 0" class="passengers-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-id-card"></i>
            Información de los pasajeros
          </div>
        </template>
        <template #content>
          <div v-for="(seat, index) in selectedSeats" :key="seat" class="passenger-form">
            <Divider v-if="index > 0" />
            <div class="passenger-header">
              <div class="passenger-badge">
                <i class="pi pi-user"></i>
                <h4>Pasajero {{ index + 1 }}</h4>
              </div>
              <Tag :value="`Asiento ${seat}`" severity="info" icon="pi pi-ticket" />
            </div>
            <div class="passenger-grid">
              <div class="form-field" v-if="passengers[index]">
                <label class="field-label">
                  <i class="pi pi-user"></i>
                  Nombre completo *
                </label>
                <InputText
                  v-model="passengers[index]!.passengerName"
                  placeholder="Nombres y apellidos"
                  :class="['w-full', { 'p-invalid': passengerErrors[index]?.passengerName }]"
                />
                <small v-if="passengerErrors[index]?.passengerName" class="field-error">{{ passengerErrors[index]?.passengerName }}</small>
              </div>
              <div class="form-field" v-if="passengers[index]">
                <label class="field-label">
                  <i class="pi pi-id-card"></i>
                  Cédula *
                </label>
                <InputText
                  v-model="passengers[index]!.passengerIdCard"
                  placeholder="1234567890"
                  maxlength="10"
                  :class="['w-full', { 'p-invalid': passengerErrors[index]?.passengerIdCard }]"
                />
                <small v-if="passengerErrors[index]?.passengerIdCard" class="field-error">{{ passengerErrors[index]?.passengerIdCard }}</small>
              </div>
              <div class="form-field" v-if="passengers[index]">
                <label class="field-label">
                  <i class="pi pi-users"></i>
                  Tipo de pasajero *
                </label>
                <Dropdown
                  v-model="passengers[index]!.passengerType"
                  :options="passengerTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar tipo"
                  :class="['w-full', { 'p-invalid': passengerErrors[index]?.passengerType }]"
                />
                <small v-if="passengerErrors[index]?.passengerType" class="field-error">{{ passengerErrors[index]?.passengerType }}</small>
              </div>
              <div class="form-field" v-if="passengers[index]">
                <label class="field-label">
                  <i class="pi pi-envelope"></i>
                  Email
                </label>
                <InputText
                  v-model="passengers[index]!.passengerEmail"
                  placeholder="correo@ejemplo.com"
                  type="email"
                  :class="['w-full', { 'p-invalid': passengerErrors[index]?.passengerEmail }]"
                />
                <small v-if="passengerErrors[index]?.passengerEmail" class="field-error">{{ passengerErrors[index]?.passengerEmail }}</small>
              </div>
              <div class="form-field" v-if="passengers[index]">
                <label class="field-label">
                  <i class="pi pi-phone"></i>
                  Teléfono
                </label>
                <InputText
                  v-model="passengers[index]!.passengerPhone"
                  placeholder="0987654321"
                  maxlength="10"
                  :class="['w-full', { 'p-invalid': passengerErrors[index]?.passengerPhone }]"
                />
                <small v-if="passengerErrors[index]?.passengerPhone" class="field-error">{{ passengerErrors[index]?.passengerPhone }}</small>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Pago -->
      <Card v-if="selectedSeats.length > 0" class="payment-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-wallet"></i>
            Pago
          </div>
        </template>
        <template #content>
          <div class="payment-section">
            <div class="payment-method">
              <label class="field-label">Método de pago *</label>
              <div class="payment-options">
                <div
                  v-for="method in paymentMethods"
                  :key="method.value"
                  class="payment-option"
                  :class="{ 'selected': paymentMethod === method.value }"
                  @click="paymentMethod = method.value"
                >
                  <i :class="method.icon"></i>
                  <span>{{ method.label }}</span>
                </div>
              </div>
            </div>

            <Divider />

            <div class="price-summary">
              <div class="price-row">
                <span><i class="pi pi-ticket"></i> Subtotal ({{ selectedSeats.length }} boletos)</span>
                <span class="price">${{ lastSaleTotals.subtotal.toFixed(2) }}</span>
              </div>
              <div class="price-row" v-if="lastSaleTotals.discount > 0">
                <span><i class="pi pi-percentage"></i> Descuentos</span>
                <span class="price discount">-${{ lastSaleTotals.discount.toFixed(2) }}</span>
              </div>
              <div v-if="discountDetails.length" class="discount-breakdown">
                <div
                  class="discount-detail"
                  v-for="detail in discountDetails"
                  :key="`${detail.seatCode}-${detail.passengerType}`"
                >
                  <Tag :value="detail.label" severity="warning" />
                  <span class="discount-seat">
                    Asiento {{ detail.seatCode }}
                    <span v-if="detail.passengerName">- {{ detail.passengerName }}</span>
                  </span>
                  <span class="discount-amount">-${{ detail.amount.toFixed(2) }}</span>
                </div>
              </div>
              <Divider />
              <div class="price-row total">
                <span><i class="pi pi-dollar"></i> Total a pagar</span>
                <span class="price">${{ lastSaleTotals.total.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Botón de Venta -->
      <div v-if="selectedSeats.length > 0" class="action-buttons">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          class="p-button-secondary p-button-lg"
          @click="resetForm"
        />
        <Button
          label="Confirmar y Emitir Boletos"
          icon="pi pi-check-circle"
          class="p-button-success p-button-lg"
          :loading="loading"
          @click="submitPurchase"
        />
      </div>
    </div>

    <!-- Diálogo de Compra Exitosa -->
    <PurchaseSuccessDialog
      :purchase="completedPurchase"
      @close="handleClosePurchaseDialog"
      @newSale="handleNewSale"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import { useTicketStore } from '../store/useTicketStore'
import { useCooperativeStore } from '../../cooperatives/store/useCooperativeStore'
import { useAuthStore } from '../../auth/store/useAuthStore'
import type { TripSummary, RequestTicketDto, PassengerType, PaymentMethod, CreatePurchaseRequest, PurchaseType, StopDto, PurchaseDto, RouteDto, SeatAvailability } from '../interfaces/ticket.interface'
import { success, error as notifyError } from '../../../lib/notifier'
import * as cityService from '../services/cityService'
import * as ticketService from '../services/ticketService'
import type { CityDto } from '../services/cityService'
import PurchaseSuccessDialog from '../components/PurchaseSuccessDialog.vue'
import busService from '../../buses/services/busService'

// Directiva tooltip
const vTooltip = {
  mounted(el: HTMLElement, binding: any) {
    el.title = binding.value
  }
}

const ticketStore = useTicketStore()
const coopStore = useCooperativeStore()
const authStore = useAuthStore()

const selectedCooperative = ref<string>()
const selectedTrip = ref<TripSummary | null>(null)
const passengerCount = ref(1)
const selectedSeats = ref<string[]>([])
const seatAvailability = ref<SeatAvailability[]>([])
const occupiedSeats = computed(() =>
  seatAvailability.value
    .filter(seat => seat.status !== 'available')
    .map(seat => seat.seatCode)
)

watch(seatAvailability, (layout) => {
  const validCodes = layout.map(seat => seat.seatCode)
  selectedSeats.value = selectedSeats.value.filter(code => validCodes.includes(code))
}, { deep: true })
const routeStops = ref<StopDto[]>([])
const selectedRoute = ref<RouteDto | null>(null)
const paymentMethod = ref<string>('CASH')
const loading = ref(false)
const completedPurchase = ref<PurchaseDto | null>(null)
const busTemplateConfig = ref<Record<string, string> | null>(null)
const lastSaleTotals = ref({
  subtotal: 0,
  discount: 0,
  total: 0
})

// Variables para búsqueda de viajes
const cities = ref<CityDto[]>([])
const availableCities = ref<{origins: string[], destinations: string[]}>({
  origins: [],
  destinations: []
})
const searchOrigin = ref<string>('')
const searchDestination = ref<string>('')
const searchDate = ref<string>((new Date().toISOString().split('T')[0]) || '')
const loadingCities = ref(false)
const searchPerformed = ref(false)

watch(searchOrigin, () => {
  searchErrors.origin = ''
  if (searchDestination.value && searchDestination.value !== searchOrigin.value) {
    searchErrors.destination = ''
  }
})

watch(searchDestination, () => {
  searchErrors.destination = ''
  if (searchOrigin.value && searchOrigin.value !== searchDestination.value) {
    searchErrors.origin = ''
  }
})

watch(searchDate, () => {
  searchErrors.date = ''
})

interface PassengerForm {
  passengerName: string
  passengerIdCard: string
  passengerEmail?: string
  passengerPhone?: string
  passengerType: PassengerType
}

const passengers = ref<PassengerForm[]>([])

interface PassengerFieldErrors {
  passengerName?: string
  passengerIdCard?: string
  passengerType?: string
  passengerEmail?: string
  passengerPhone?: string
}

const passengerErrors = ref<PassengerFieldErrors[]>([])
const passengersValidated = ref(false)

const searchErrors = reactive({
  origin: '',
  destination: '',
  date: ''
})

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const phoneRegex = /^\d{10}$/
const cedulaRegex = /^\d{10}$/

// Computed para obtener datos del store
const cooperatives = computed(() => coopStore.items)
const availableTrips = computed(() => ticketStore.availableTrips)

// Obtener cooperativa del usuario autenticado
const userCooperativeId = computed(() => authStore.user?.cooperativeId || null)

// Fecha mínima (hoy)
const minDate = computed(() => new Date().toISOString().split('T')[0])

// Ciudades de origen (solo las que tienen viajes)
const originCities = computed(() => {
  if (availableCities.value.origins.length > 0) {
    return cities.value.filter(city => availableCities.value.origins.includes(city.name))
  }
  return cities.value
})

// Ciudades de destino (excluyendo la ciudad de origen seleccionada)
const destinationCities = computed(() => {
  let filtered = cities.value
  
  // Si hay ciudades con viajes disponibles, filtrar por ellas
  if (availableCities.value.destinations.length > 0) {
    filtered = cities.value.filter(city => availableCities.value.destinations.includes(city.name))
  }
  
  // Excluir la ciudad de origen seleccionada
  if (searchOrigin.value) {
    filtered = filtered.filter(city => city.name !== searchOrigin.value)
  }
  
  return filtered
})

const seatMatrix = computed(() => {
  if (!seatAvailability.value.length) return []

  const maxRow = seatAvailability.value.reduce(
    (max, seat) => Math.max(max, seat.row ?? 0),
    0
  )
  const maxCol = seatAvailability.value.reduce(
    (max, seat) => Math.max(max, seat.column ?? 0),
    0
  )

  if (!maxRow || !maxCol) return []

  const map = new Map<string, SeatAvailability>()
  seatAvailability.value.forEach(seat => {
    if (seat.row && seat.column) {
      map.set(`${seat.row}-${seat.column}`, seat)
    }
  })

  const matrix: (SeatAvailability | null)[][] = []
  for (let row = 1; row <= maxRow; row++) {
    const rowItems: (SeatAvailability | null)[] = []
    for (let column = 1; column <= maxCol; column++) {
      rowItems.push(map.get(`${row}-${column}`) || null)
    }
    matrix.push(rowItems)
  }
  return matrix
})

const seatRowBlocks = computed(() => {
  return seatMatrix.value.map(row => ({
    left: row.slice(0, 2),
    right: row.slice(2)
  }))
})

// ==========================================
// DYNAMIC SEAT LAYOUT (Template-based)
// ==========================================

// Auto-detect number of columns based on seat data
const hasTemplateLayout = computed(() =>
  busTemplateConfig.value != null && Object.keys(busTemplateConfig.value).length > 0
)

const GRID_COLUMNS = computed(() => {
  if (hasTemplateLayout.value) {
    // En templates el grid es fijo de 5 columnas (2 asientos | pasillo | 2 asientos)
    return 5
  }

  if (!seatAvailability.value.length) return 5

  const maxCol = seatAvailability.value.reduce(
    (max, seat) => Math.max(max, seat.column ?? 0),
    0
  )

  // Legacy layout: 2 columns (V and P) -> use 5 column grid (2 seats | aisle | 2 seats)
  if (maxCol === 2) {
    return 5
  }

  return Math.max(maxCol, 4)
})

const GRID_ROWS = computed(() => {
  if (hasTemplateLayout.value) {
    const config = busTemplateConfig.value || {}
    const maxIndex = Object.keys(config)
      .map(k => Number(k))
      .filter(n => !Number.isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0)
    // index = (row-1)*5+(col-1)
    const maxRowFromTemplate = Math.floor(maxIndex / 5) + 1
    return Math.max(maxRowFromTemplate, 1)
  }

  // Fallback: rows from availability
  if (!seatAvailability.value.length) return 10

  const maxRow = seatAvailability.value.reduce(
    (max, seat) => Math.max(max, seat.row ?? 0),
    0
  )
  return Math.max(maxRow, 10)
})

const totalGridCells = computed(() => GRID_ROWS.value * GRID_COLUMNS.value)

const dynamicGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${GRID_COLUMNS.value}, 1fr)`,
  gridTemplateRows: `repeat(${GRID_ROWS.value}, 1fr)`,
}))

// Map seat availability to grid positions
const availabilityByPos = computed(() => {
  const map = new Map<string, SeatAvailability>()
  seatAvailability.value.forEach(seat => {
    if (seat.row && seat.column) {
      map.set(`${seat.row}-${seat.column}`, seat)
    }
  })
  return map
})

type SpecialCell = 'bathroom' | 'door' | 'stairs' | 'storage' | 'wheelchair'

interface CellInfo {
  type: 'seat' | SpecialCell | 'aisle' | 'empty'
  seatCode?: string
  seatType?: string
  additionalPrice?: number
  status?: 'available' | 'occupied'
}

const seatGridMap = computed(() => {
  const map = new Map<number, CellInfo>()
  const seatTypes = ['NORMAL', 'VIP', 'SEMI_BED', 'BED']
  const specialTypes: SpecialCell[] = ['bathroom', 'door', 'stairs', 'storage', 'wheelchair']

  // Template-aware layout (5-column grid with especiales)
  if (hasTemplateLayout.value) {
    const config = busTemplateConfig.value || {}
    Object.entries(config).forEach(([idxStr, typeValue]) => {
      const idx = Number(idxStr)
      if (Number.isNaN(idx)) return
      const row = Math.floor(idx / 5) + 1
      const column = (idx % 5) + 1
      const gridIndex = (row - 1) * GRID_COLUMNS.value + column

      const availability = availabilityByPos.value.get(`${row}-${column}`)
      const normalizedSeatType = typeof typeValue === 'string' ? typeValue.toUpperCase() : ''
      const normalizedSpecial = typeof typeValue === 'string' ? typeValue.toLowerCase() : ''

      if (seatTypes.includes(normalizedSeatType)) {
        map.set(gridIndex, {
          type: 'seat',
          seatCode: availability?.seatCode || `S${String(idx + 1).padStart(2, '0')}`,
          seatType: normalizedSeatType,
          additionalPrice: availability?.additionalPrice || 0,
          status: availability?.status || 'available'
        })
      } else if (normalizedSpecial === 'aisle') {
        map.set(gridIndex, { type: 'aisle' })
      } else if (specialTypes.includes(normalizedSpecial as SpecialCell)) {
        map.set(gridIndex, { type: normalizedSpecial as SpecialCell })
      } else {
        // cualquier otro valor = celda vacía
        map.set(gridIndex, { type: 'empty' })
      }
    })
    return map
  }

  // Fallback legacy: solo asientos disponibles con filas/columnas
  if (!seatAvailability.value.length) return map

  const maxCol = seatAvailability.value.reduce(
    (max, seat) => Math.max(max, seat.column ?? 0),
    0
  )

  seatAvailability.value.forEach(seat => {
    if (seat.row && seat.column) {
      let gridIndex: number

      if (maxCol === 2) {
        gridIndex = (seat.row - 1) * 5 + seat.column
      } else {
        gridIndex = (seat.row - 1) * GRID_COLUMNS.value + seat.column
      }

      map.set(gridIndex, {
        type: 'seat',
        seatCode: seat.seatCode,
        seatType: seat.seatType,
        additionalPrice: seat.additionalPrice || 0,
        status: seat.status
      })
    }
  })

  return map
})

function getCellInfo(index: number): CellInfo {
  const cell = seatGridMap.value.get(index)
  if (cell) return cell

  if (!hasTemplateLayout.value) {
    const column = ((index - 1) % GRID_COLUMNS.value) + 1

    // Aisle default for column 3 en legacy
    if (column === 3) {
      return { type: 'aisle' }
    }
  }

  return { type: 'empty' }
}

function getDynamicCellClass(index: number): string {
  const cellInfo = getCellInfo(index)
  const classes = ['grid-cell']

  if (!cellInfo) return classes.join(' ')

  // Aisle styling
  if (cellInfo.type === 'aisle') {
    classes.push('aisle-cell')
    return classes.join(' ')
  }

  // Seat styling
  if (cellInfo.type === 'seat' && cellInfo.seatCode) {
    classes.push('seat-cell')

    // Seat type classes
    if (cellInfo.seatType) {
      classes.push(`seat-type-${cellInfo.seatType.toLowerCase()}`)
    }

    // Status classes
    if (selectedSeats.value.includes(cellInfo.seatCode)) {
      classes.push('selected')
    } else if (cellInfo.status === 'occupied') {
      classes.push('occupied')
    } else if (cellInfo.status === 'available') {
      classes.push('available')
      if (selectedSeats.value.length >= passengerCount.value) {
        classes.push('disabled')
      }
    }

    return classes.join(' ')
  }

  if (cellInfo.type === 'empty') {
    classes.push('empty')
    return classes.join(' ')
  }

  // Special elements
  if (['bathroom', 'door', 'stairs', 'storage', 'wheelchair'].includes(cellInfo.type)) {
    classes.push('special-element', cellInfo.type)
  }

  return classes.join(' ')
}

function onCellClick(index: number) {
  const cellInfo = getCellInfo(index)
  if (cellInfo?.type === 'seat' && cellInfo.seatCode) {
    toggleSeat(cellInfo.seatCode)
  }
}

function getSeatTypeLabel(seatType?: string): string {
  const labels: Record<string, string> = {
    'NORMAL': 'Normal',
    'VIP': 'VIP',
    'SEMI_BED': 'Semi-cama',
    'BED': 'Cama'
  }
  return labels[seatType || 'NORMAL'] || ''
}

const specialLabels: Record<string, string> = {
  bathroom: 'Baño',
  door: 'Puerta',
  stairs: 'Escaleras',
  aisle: 'Pasillo',
  storage: 'Maletero',
  wheelchair: 'Acceso'
}

function getSpecialLabel(type?: string): string {
  if (!type) return ''
  return specialLabels[type] || ''
}

function getSpecialIcon(type?: string): string {
  if (!type) return ''
  const icons: Record<string, string> = {
    bathroom: 'pi pi-home',
    door: 'pi pi-sign-in',
    stairs: 'pi pi-sort-alt',
    storage: 'pi pi-briefcase',
    wheelchair: 'pi pi-users'
  }
  return icons[type] || ''
}

// ==========================================

const passengerTypes = [
  { label: '👤 Adulto', value: 'ADULT' },
  { label: '👶 Menor', value: 'CHILD' },
  { label: '👴 Tercera Edad', value: 'SENIOR' },
  { label: '♿ Discapacitado', value: 'DISABLED' }
]

const paymentMethods = [
  { label: 'Efectivo', value: 'CASH', icon: 'pi pi-money-bill' },
  { label: 'Transferencia', value: 'TRANSFER', icon: 'pi pi-building-columns' },
]

const BASE_PRICE = 15.00

// Precio base dinámico - usar el de la ruta seleccionada o el valor por defecto
const routeBasePrice = computed(() => selectedRoute.value?.basePrice || BASE_PRICE)

async function loadCities() {
  loadingCities.value = true
  try {
    cities.value = await cityService.getAllCities()
    await loadAvailableRoutes()
  } catch (err) {
    console.error('Error al cargar ciudades:', err)
    notifyError('Error al cargar ciudades')
  } finally {
    loadingCities.value = false
  }
}

async function loadAvailableRoutes() {
  try {
    // Cargar viajes disponibles para saber qué ciudades tienen rutas activas
    await ticketStore.loadAvailableTrips(userCooperativeId.value || undefined)
    
    // Extraer ciudades únicas de origen y destino de los viajes disponibles
    const origins = new Set<string>()
    const destinations = new Set<string>()
    
    ticketStore.availableTrips.forEach(trip => {
      if (trip.routeOrigin) origins.add(trip.routeOrigin)
      if (trip.routeDestination) destinations.add(trip.routeDestination)
    })
    
    availableCities.value = {
      origins: Array.from(origins),
      destinations: Array.from(destinations)
    }
  } catch (err) {
    console.error('Error al cargar rutas disponibles:', err)
    // Si hay error, mostrar todas las ciudades
    availableCities.value = {
      origins: [],
      destinations: []
    }
  }
}

function swapCities() {
  const temp = searchOrigin.value
  searchOrigin.value = searchDestination.value
  searchDestination.value = temp
}


function validateSearchParams(): boolean {
  let isValid = true
  searchErrors.origin = ''
  searchErrors.destination = ''
  searchErrors.date = ''

  if (!searchOrigin.value) {
    searchErrors.origin = 'Selecciona la ciudad de origen'
    isValid = false
  }

  if (!searchDestination.value) {
    searchErrors.destination = 'Selecciona la ciudad de destino'
    isValid = false
  }

  if (searchOrigin.value && searchDestination.value && searchOrigin.value === searchDestination.value) {
    searchErrors.destination = 'El destino debe ser distinto al origen'
    searchErrors.origin = 'El origen debe ser distinto al destino'
    isValid = false
  }

  if (!searchDate.value) {
    searchErrors.date = 'Selecciona la fecha del viaje'
    isValid = false
  } else {
    const selectedDate = new Date(searchDate.value)
    const today = new Date(minDate.value)
    if (selectedDate < today) {
      searchErrors.date = 'La fecha no puede ser anterior a hoy'
      isValid = false
    }
  }

  return isValid
}

async function searchAvailableTrips() {
  if (!validateSearchParams()) {
    notifyError('Corrige los campos de busqueda antes de continuar')
    return
  }
  
  searchPerformed.value = true
  loading.value = true
  try {
    // Asegurar formato de fecha correcto (YYYY-MM-DD)
    const dateStr = searchDate.value
    const now = new Date()
    console.log('=== DEBUG FECHA ===')
    console.log('Fecha del input:', dateStr)
    console.log('Fecha actual del navegador:', now.toISOString())
    console.log('Zona horaria del navegador:', Intl.DateTimeFormat().resolvedOptions().timeZone)
    console.log('Offset de zona horaria:', now.getTimezoneOffset(), 'minutos')
    console.log('Buscando viajes para fecha:', dateStr, 'origen:', searchOrigin.value, 'destino:', searchDestination.value)
    console.log('==================')
    
    await ticketStore.searchTrips(
      dateStr,
      searchOrigin.value,
      searchDestination.value,
      userCooperativeId.value || undefined
    )
    
    if (ticketStore.availableTrips.length === 0) {
      notifyError('No se encontraron viajes para la ruta y fecha seleccionadas')
    }
  } catch (err: any) {
    console.error('Error al buscar viajes:', err)
    notifyError(err.response?.data?.message || 'Error al buscar viajes')
  } finally {
    loading.value = false
  }
}

async function selectTrip(trip: TripSummary) {
  console.log('=== SELECT TRIP ===')
  console.log('Trip completo:', trip)
  console.log('frequencySegment:', trip.frequencySegment)
  console.log('routeId directo:', trip.routeId)
  console.log('mainDriverId:', trip.mainDriverId)
  console.log('driverName:', trip.driverName)
  
  // Validar que el trip tenga conductor asignado
  if (!trip.mainDriverId && !trip.driverId && !trip.driverName && !trip.mainDriverName) {
    notifyError('Este viaje no tiene conductor asignado. Por favor contacte al administrador.')
    console.warn('Trip sin conductor:', trip)
    return
  }
  
  selectedTrip.value = trip
  selectedSeats.value = []
  seatAvailability.value = []
  passengers.value = []
  passengerErrors.value = []
  passengersValidated.value = false
  routeStops.value = []
  selectedRoute.value = null
  
  // Cargar stops y precio de la ruta
  try {
    const routeId = trip.frequencySegment?.routeId || trip.routeId
    console.log('routeId extraído:', routeId)
    
    if (routeId) {
      console.log('Cargando información de la ruta:', routeId)
      
      // Cargar stops y detalles de la ruta en paralelo
      const [stops, route] = await Promise.all([
        ticketService.getRouteStops(routeId),
        ticketService.getRouteById(routeId)
      ])
      
      routeStops.value = stops
      selectedRoute.value = route
      
      console.log('Stops cargados:', stops.length, stops)
      console.log('Ruta cargada:', route)
      console.log('Precio base de la ruta:', route.basePrice)
    } else {
      console.warn('No se encontró routeId en el trip seleccionado')
      console.warn('Trip keys:', Object.keys(trip))
    }
  } catch (err) {
    console.error('Error al cargar información de la ruta:', err)
  }
  
  onTripChange()
}

function formatTime(datetime: string | any[]): string {
  if (!datetime) return ''
  
  // Si es un array [year, month, day, hour, minute], formatear
  if (Array.isArray(datetime)) {
    if (datetime.length >= 5) {
      const hour = String(datetime[3]).padStart(2, '0')
      const minute = String(datetime[4]).padStart(2, '0')
      return `${hour}:${minute}`
    }
    return ''
  }
  
  // Si es string
  const datetimeStr = String(datetime)
  
  // Si es solo hora (HH:MM:SS o HH:MM), devolverla directamente
  if (datetimeStr.includes(':') && !datetimeStr.includes('T') && !datetimeStr.includes(' ')) {
    const parts = datetimeStr.split(':')
    return `${parts[0]}:${parts[1]}` // HH:MM
  }
  
  // Si es datetime completo, parsear y formatear
  const date = new Date(datetimeStr)
  if (isNaN(date.getTime())) return datetimeStr // Si es inválido, devolver original
  return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: string): string {
  if (!date) return ''
  // No usar new Date() porque causa problemas de zona horaria
  // Parsear directamente el string YYYY-MM-DD
  const parts = date.split('-')
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return date
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  const dateObj = new Date(year, month - 1, day) // month es 0-indexed
  return dateObj.toLocaleDateString('es-EC', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

onMounted(async () => {
  try {
    await loadCities()
    await coopStore.fetchAll()
    
    // Si el usuario tiene cooperativa asignada, establecerla
    if (userCooperativeId.value) {
      selectedCooperative.value = userCooperativeId.value
    }
  } catch (err) {
    console.error('Error al inicializar:', err)
    notifyError('Error al cargar datos iniciales')
  }
})

watch(selectedSeats, (newSeats, oldSeats) => {
  console.log('=== WATCHER selectedSeats ===')
  console.log('Asientos OLD:', oldSeats?.length || 0, oldSeats)
  console.log('Asientos NEW:', newSeats.length, newSeats)
  console.log('Pasajeros actuales:', passengers.value.length)
  
  // Adjust passengers array to match selected seats
  const diff = newSeats.length - passengers.value.length
  console.log('Diferencia:', diff)
  
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      passengers.value.push({
        passengerName: '',
        passengerIdCard: '',
        passengerEmail: '',
        passengerPhone: '',
        passengerType: 'ADULT' as PassengerType
      })
    }
    console.log('Pasajeros agregados. Total ahora:', passengers.value.length)
  } else if (diff < 0) {
    passengers.value = passengers.value.slice(0, newSeats.length)
    console.log('Pasajeros eliminados. Total ahora:', passengers.value.length)
  }
  console.log('=============================')
  syncPassengerErrorsWithPassengers()
}, { deep: true })

function syncPassengerErrorsWithPassengers() {
  const diff = passengers.value.length - passengerErrors.value.length
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      passengerErrors.value.push({})
    }
  } else if (diff < 0) {
    passengerErrors.value = passengerErrors.value.slice(0, passengers.value.length)
  }
}

watch(passengers, () => {
  syncPassengerErrorsWithPassengers()
  if (passengersValidated.value) {
    validatePassengersSection()
  }
}, { deep: true })

function isValidEcuadorianId(id: string): boolean {
  if (!cedulaRegex.test(id)) return false
  const province = parseInt(id.substring(0, 2), 10)
  if (province < 1 || province > 24) return false
  const digits = id.split('').map(Number)
  const verifier = digits[9]
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let digit = digits[i]
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  const calculatedVerifier = (10 - (sum % 10)) % 10
  return verifier === calculatedVerifier
}

async function loadTripsForCooperative(cooperativeId: string) {
  loading.value = true
  try {
    await ticketStore.loadAvailableTrips(cooperativeId)
    if (ticketStore.availableTrips.length === 0) {
      notifyError('No hay viajes disponibles para esta cooperativa')
    }
  } catch (err: any) {
    console.error('Error al cargar viajes:', err)
    notifyError(err.response?.data?.message || 'Error al cargar viajes')
  } finally {
    loading.value = false
  }
}

async function onCooperativeChange() {
  selectedTrip.value = null
  selectedSeats.value = []
  
  if (!selectedCooperative.value) return
  
  await loadTripsForCooperative(selectedCooperative.value)
}

async function loadBusTemplateForTrip() {
  busTemplateConfig.value = selectedTrip.value?.busTemplate?.seatConfiguration || null
  if (
    (!busTemplateConfig.value || Object.keys(busTemplateConfig.value).length === 0) &&
    selectedTrip.value?.busId
  ) {
    try {
      const bus = await busService.getBusById(selectedTrip.value.busId)
      busTemplateConfig.value = bus.busTemplate?.seatConfiguration || null
    } catch (err) {
      console.warn('No se pudo cargar el template del bus', err)
    }
  }
}

async function onTripChange() {
  selectedSeats.value = []
  passengers.value = []
  passengerErrors.value = []
  passengersValidated.value = false
  seatAvailability.value = []

  if (!selectedTrip.value) return

  loading.value = true
  try {
      await loadBusTemplateForTrip()
      const availability = await ticketService.getSeatAvailability(selectedTrip.value.id)
      console.log('=== SEAT AVAILABILITY DEBUG ===')
      console.log('Trip ID:', selectedTrip.value.id)
      console.log('Total seats:', availability.length)
      console.log('First 3 seats:', availability.slice(0, 3))
      console.log('Sample seat structure:', availability[0])
      console.log('Has row/column?', availability[0]?.row, availability[0]?.column)
      console.log('Has seatType?', availability[0]?.seatType)
      console.log('Has additionalPrice?', availability[0]?.additionalPrice)
      console.log('Full first seat:', JSON.stringify(availability[0], null, 2))
      console.log('Max row:', Math.max(...availability.map(s => s.row || 0)))
      console.log('Max column:', Math.max(...availability.map(s => s.column || 0)))
      console.log('===============================')
      seatAvailability.value = availability
    } catch (err: any) {
      console.warn('No se pudieron cargar los asientos del viaje:', err.response?.data?.message || err.message)
      seatAvailability.value = []
    } finally {
      loading.value = false
    }
  }

function incrementPassengerCount() {
  if (selectedTrip.value && passengerCount.value < (selectedTrip.value.availableSeats || 50)) {
    passengerCount.value++
  }
}

function decrementPassengerCount() {
  if (passengerCount.value > 1) {
    passengerCount.value--
    // Si hay más asientos seleccionados que pasajeros, eliminar los extras
    if (selectedSeats.value.length > passengerCount.value) {
      selectedSeats.value = selectedSeats.value.slice(0, passengerCount.value)
    }
  }
}

function toggleSeat(seat: string) {
  if (occupiedSeats.value.includes(seat)) return
  
  const index = selectedSeats.value.indexOf(seat)
  if (index > -1) {
    // Deseleccionar
    selectedSeats.value = selectedSeats.value.filter(s => s !== seat)
    console.log(`Asiento ${seat} deseleccionado. Total seleccionados:`, selectedSeats.value.length)
  } else {
    if (selectedSeats.value.length < passengerCount.value) {
      // Seleccionar - crear nuevo array para forzar reactividad
      selectedSeats.value = [...selectedSeats.value, seat]
      console.log(`Asiento ${seat} seleccionado. Total seleccionados:`, selectedSeats.value.length, '/', passengerCount.value)
    } else {
      console.warn('Ya alcanzaste el máximo de asientos permitidos:', passengerCount.value)
    }
  }
  console.log('Asientos seleccionados:', selectedSeats.value)
  console.log('Array de pasajeros:', passengers.value.length)
}

function getTripLabel(tripId: string): string {
  const trip = availableTrips.value.find(t => t.id === tripId)
  return trip ? `${trip.routeName} - ${trip.busPlate}` : ''
}

function formatDateTime(datetime: string): string {
  if (!datetime) return ''
  const date = new Date(datetime)
  return date.toLocaleString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getSeatPrice(seatCode: string): number {
  // Find seat in availability to get additional price
  const seat = seatAvailability.value.find(s => s.seatCode === seatCode)
  const additionalPrice = seat?.additionalPrice || 0
  return routeBasePrice.value + additionalPrice
}

function calculateSubtotal(): number {
  let subtotal = 0
  selectedSeats.value.forEach(seatCode => {
    subtotal += getSeatPrice(seatCode)
  })
  return subtotal
}

function calculateDiscount(): number {
  let discount = 0
  passengers.value.forEach((p, index) => {
    const seatCode = selectedSeats.value[index]
    if (!seatCode) return

    const seatPrice = getSeatPrice(seatCode)

    if (p.passengerType === 'CHILD') discount += seatPrice * 0.5 // 50% niños
    else if (p.passengerType === 'SENIOR') discount += seatPrice * 0.3 // 30% tercera edad
    else if (p.passengerType === 'DISABLED') discount += seatPrice * 0.5 // 50% discapacitados
  })
  return discount
}

interface DiscountDetail {
  seatCode: string
  passengerName: string
  passengerType: PassengerType
  label: string
  amount: number
}

const discountRules: Record<PassengerType, { label: string; rate: number }> = {
  'ADULT': { label: 'Adulto', rate: 0 },
  'CHILD': { label: 'Niño (50%)', rate: 0.5 },
  'SENIOR': { label: 'Adulto mayor (30%)', rate: 0.3 },
  'DISABLED': { label: 'Discapacitado (50%)', rate: 0.5 }
}

const discountDetails = computed<DiscountDetail[]>(() => {
  const details: DiscountDetail[] = []
  selectedSeats.value.forEach((seatCode, index) => {
    const passenger = passengers.value[index]
    if (!seatCode || !passenger) return
    const rule = discountRules[passenger.passengerType]
    if (!rule || rule.rate <= 0) return
    const seatPrice = getSeatPrice(seatCode)
    const amount = seatPrice * rule.rate
    if (amount <= 0) return
    details.push({
      seatCode,
      passengerName: passenger.passengerName,
      passengerType: passenger.passengerType,
      label: rule.label,
      amount
    })
  })
  return details
})

function calculateTotal(): number {
  return calculateSubtotal() - calculateDiscount()
}

function updateLastSaleTotals() {
  lastSaleTotals.value = {
    subtotal: Number(calculateSubtotal().toFixed(2)),
    discount: Number(calculateDiscount().toFixed(2)),
    total: Number(calculateTotal().toFixed(2))
  }
}

watch(
  [selectedSeats, passengers, seatAvailability],
  () => updateLastSaleTotals(),
  { deep: true, immediate: true }
)

function validatePassengersSection(): boolean {
  if (!passengers.value.length) {
    passengerErrors.value = []
  passengersValidated.value = false
    return true
  }

  passengerErrors.value = passengers.value.map(() => ({}))
  let isValid = true

  passengers.value.forEach((passenger, index) => {
    const errorsForPassenger: PassengerFieldErrors = {}
    if (!passenger || !passenger.passengerName?.trim()) {
      errorsForPassenger.passengerName = 'El nombre es obligatorio'
    }

    const idCard = passenger?.passengerIdCard?.trim() || ''
    if (!idCard) {
      errorsForPassenger.passengerIdCard = 'La c�dula es obligatoria'
    } else if (!cedulaRegex.test(idCard)) {
      errorsForPassenger.passengerIdCard = 'La c�dula debe tener 10 d�gitos'
    } else if (!isValidEcuadorianId(idCard)) {
      errorsForPassenger.passengerIdCard = 'La c�dula ecuatoriana no es v�lida'
    }

    if (!passenger?.passengerType) {
      errorsForPassenger.passengerType = 'Selecciona el tipo de pasajero'
    }

    const email = passenger?.passengerEmail?.trim()
    if (email && !emailRegex.test(email)) {
      errorsForPassenger.passengerEmail = 'Email inv�lido'
    }

    const phone = passenger?.passengerPhone?.trim()
    if (phone && !phoneRegex.test(phone)) {
      errorsForPassenger.passengerPhone = 'Tel�fono inv�lido'
    }

    if (Object.keys(errorsForPassenger).length > 0) {
      isValid = false
    }
    passengerErrors.value[index] = errorsForPassenger
  })

  return isValid
}

function validateForm(): boolean {
  if (!selectedTrip.value) {
    notifyError('Debe seleccionar un viaje')
    return false
  }
  
  if (selectedSeats.value.length === 0) {
    notifyError('Debe seleccionar al menos un asiento')
    return false
  }
  
  passengersValidated.value = true
  if (!validatePassengersSection()) {
    notifyError('Corrige los datos de los pasajeros antes de continuar')
    return false
  }

  if (!paymentMethod.value) {
    notifyError('Selecciona un metodo de pago')
    return false
  }
  
  return true
}

async function submitPurchase() {
  if (!validateForm()) return
  
  loading.value = true
  try {
    console.log('=== SUBMIT PURCHASE DEBUG ===')
    console.log('selectedSeats:', selectedSeats.value)
    console.log('passengers:', passengers.value)
    console.log('selectedTrip:', selectedTrip.value)
    console.log('searchOrigin:', searchOrigin.value)
    console.log('searchDestination:', searchDestination.value)
    console.log('routeStops:', routeStops.value)
    console.log('cities:', cities.value)
    
    // Usar routeOrigin y routeDestination del trip si searchOrigin/searchDestination están vacíos
    const originCityName = searchOrigin.value || selectedTrip.value?.routeOrigin
    const destinationCityName = searchDestination.value || selectedTrip.value?.routeDestination
    
    console.log('Ciudades a usar:', { originCityName, destinationCityName })
    
    if (!originCityName || !destinationCityName) {
      notifyError('No se pudieron determinar las ciudades de origen y destino')
        return
    }
    
    // Encontrar los IDs de las ciudades de origen y destino
    let originCityId: string | undefined
    let destinationCityId: string | undefined
    
    // Primero intentar obtener el nombre de ciudad desde los stops, luego mapearlo al catálogo de ciudades
    if (routeStops.value.length > 0) {
      const originStop = routeStops.value.find(stop =>
        stop.city === originCityName || (stop.name && stop.name.includes(originCityName))
      )
      const destinationStop = routeStops.value.find(stop =>
        stop.city === destinationCityName || (stop.name && stop.name.includes(destinationCityName))
      )

      if (originStop?.city) {
        originCityId = cities.value.find(city => city.name === originStop.city)?.id
      }
      if (destinationStop?.city) {
        destinationCityId = cities.value.find(city => city.name === destinationStop.city)?.id
      }

      console.log('Stops encontrados:', { originCityId, destinationCityId })
    }
    
    // Si no hay stops o no se encontró ciudad, buscar directamente por nombre
    if (!originCityId || !destinationCityId) {
      console.log('No se encontraron stops válidos, buscando city IDs...')
      console.log('Buscando ciudades con nombres:', { originCityName, destinationCityName })
      console.log('Total ciudades disponibles:', cities.value.length)
      console.log('Primeras 5 ciudades:', cities.value.slice(0, 5).map(c => ({ id: c.id, name: c.name })))

      const originCity = cities.value.find(city => city.name === originCityName)
      const destinationCity = cities.value.find(city => city.name === destinationCityName)

      console.log('Ciudad origen encontrada:', originCity)
      console.log('Ciudad destino encontrada:', destinationCity)

      originCityId = originCity?.id
      destinationCityId = destinationCity?.id

      console.log('City IDs encontrados:', { originCityId, destinationCityId })

      if (!originCityId || !destinationCityId) {
        notifyError('No se pudieron encontrar las ciudades de origen o destino en el catálogo')
        return
      }
    }
    
    const tickets: RequestTicketDto[] = selectedSeats.value.map((seat, index) => {
      const passenger = passengers.value[index]
      console.log(`Procesando asiento ${seat}, index ${index}, passenger:`, passenger)
      
      if (!passenger) {
        throw new Error(`No hay información del pasajero para el asiento ${seat}`)
      }
      
      // Construir ticket con validación de campos opcionales
      const ticket: any = {
        tripId: selectedTrip.value!.id,
        seatNumber: seat,
        passengerName: passenger.passengerName.trim(),
        passengerIdCard: passenger.passengerIdCard.trim(),
        passengerType: passenger.passengerType,
        originCityId: originCityId!,
        destinationCityId: destinationCityId!
      }
      
      // Email es opcional pero si se proporciona debe ser válido
      if (passenger.passengerEmail && passenger.passengerEmail.trim()) {
        const email = passenger.passengerEmail.trim()
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(email)) {
          ticket.passengerEmail = email
        }
      }
      
      // Phone es opcional pero si se proporciona debe tener 10 dígitos
      if (passenger.passengerPhone && passenger.passengerPhone.trim()) {
        const phone = passenger.passengerPhone.trim()
        if (phone.length === 10 && /^\d+$/.test(phone)) {
          ticket.passengerPhone = phone
        }
      }
      
      return ticket
    })
    
    console.log('Tickets construidos:', tickets)
    
    const purchaseRequest: any = {
      buyerUserId: authStore.user!.id,
      purchaseType: 'IN_PERSON',
      paymentMethod: paymentMethod.value,
      clerkId: authStore.user!.id, // El usuario actual actúa como clerk
      tickets
    }
    
    console.log('Purchase request:', JSON.stringify(purchaseRequest, null, 2))
    
    const purchase = await ticketStore.createPurchase(purchaseRequest)
    
    console.log('Compra creada:', purchase)
    
    // Solo confirmar pago si es necesario (no es CASH IN_PERSON)
    // Para CASH IN_PERSON, el backend ya marca como PAID automáticamente
    if (!(paymentMethod.value === 'CASH' && purchase.purchaseType === 'IN_PERSON')) {
      await ticketStore.confirmPayment(purchase.id)
    }
    
    // Mostrar diálogo de éxito con los boletos
    completedPurchase.value = purchase
    
    // Notificación de éxito
    success('Boletos emitidos correctamente')
  } catch (err: any) {
    console.error('Error en submitPurchase:', err)
    notifyError(err.response?.data?.message || err.message || 'Error al emitir los boletos')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  selectedCooperative.value = undefined
  selectedTrip.value = null
  passengerCount.value = 1
  selectedSeats.value = []
  passengers.value = []
  passengerErrors.value = []
  paymentMethod.value = 'CASH'
  seatAvailability.value = []
  completedPurchase.value = null
  selectedRoute.value = null
}

function handleClosePurchaseDialog() {
  completedPurchase.value = null
}

function handleNewSale() {
  resetForm()
}

</script>

<style scoped>
.ticket-sale-view {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.sale-header {
  margin-bottom: 2rem;
}

.sale-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sale-header h1 i {
  color: var(--primary-color);
}

.sale-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.selection-card,
.seats-card,
.passengers-card,
.payment-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.card-title i {
  color: var(--primary-color);
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-error {
  color: #d32f2f;
  font-size: 0.85rem;
}


.field-label i {
  color: var(--primary-color);
  font-size: 0.85rem;
}

.trip-option {
  width: 100%;
}

.trip-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.trip-route {
  font-weight: 600;
}

.bus-tag {
  font-size: 0.75rem;
}

.trip-details {
  display: flex;
  gap: 1rem;
  color: var(--text-color-secondary);
}

.trip-summary {
  margin-top: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.summary-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.summary-item i {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-top: 0.25rem;
}

.summary-item small {
  display: block;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.summary-item strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.95rem;
}

/* Selector de cantidad de pasajeros */
.passenger-count-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid var(--gray-medium);
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #5A4A3A;
}

.count-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.count-controls button {
  width: 3rem;
  height: 3rem;
  border-color: #C9A882 !important;
  color: var(--app-accent) !important;
  transition: all 0.3s ease;
}

.count-controls button:not(:disabled):hover {
  background-color: var(--app-accent) !important;
  color: white !important;
  border-color: var(--app-accent) !important;
  transform: scale(1.1);
}

.count-display {
  font-size: 2rem;
  font-weight: 700;
  color: var(--app-accent);
  min-width: 3rem;
  text-align: center;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(160, 130, 109, 0.15);
}

.count-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #76614D;
  font-style: italic;
}

.seat-legend {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  padding: 0.5rem 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.seat-mini {
  width: 36px;
  height: 36px;
  border-radius: 8px 8px 4px 4px;
  border: 2px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.seat-mini::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 6px;
  background: inherit;
  border-radius: 4px 4px 0 0;
  border: inherit;
  border-bottom: none;
}

.seat-mini i {
  font-size: 1rem;
  z-index: 1;
}

.seat-mini.available {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.seat-mini.selected {
  background: #2196F3;
  border-color: #1976D2;
  color: white;
}

.seat-mini.occupied {
  background: #ffebee;
  border-color: #ef5350;
  color: #c62828;
}

.bus-layout {
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--gray-medium);
}

.driver-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #FFFFFF;
  border-radius: 12px;
  margin-bottom: 1rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 600;
  color: #5A4A3A;
  box-shadow: 0 4px 12px rgba(107, 91, 71, 0.15);
  border: 2px solid var(--app-accent);
}

.driver-area i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.bus-info {
  text-align: center;
  color: #5A4A3A;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.bus-info i {
  color: var(--app-accent);
}

.seat-bus-shell {
  background: linear-gradient(145deg, #fdfdfd, #f2f4f8);
  border: 2px solid #dbe1f0;
  border-radius: 24px;
  padding: 1.5rem 1rem;
  position: relative;
  margin-bottom: 1rem;
}

.bus-label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  letter-spacing: 1px;
  color: #7a8297;
  text-transform: uppercase;
  font-weight: 600;
}

.bus-label.front {
  top: 8px;
}

.bus-label.back {
  bottom: 8px;
}

.seat-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 0.5rem;
}

.seat-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
}

.seat-side {
  display: grid;
  grid-template-columns: repeat(2, minmax(30px, 1fr));
  gap: 0.4rem;
  justify-items: center;
}

.seat-slot {
  display: flex;
  justify-content: center;
}

.seat-item {
  width: 38px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid #d4c7b4;
  background: #f8f2ea;
  color: #735c45;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(90, 74, 58, 0.2);
}

.seat-item:hover:not(.disabled):not(.occupied) {
  background: #e7d9c8;
  border-color: var(--app-accent);
}

.seat-item.selected {
  background: linear-gradient(135deg, #c9a882, #a7784c);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(169, 120, 76, 0.45);
}

.seat-item.occupied {
  background: #ded7cd;
  color: #a0948a;
  border-color: transparent;
}

.seat-item.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.seat-placeholder {
  width: 38px;
  height: 44px;
  border-radius: 12px;
  border: 1px dashed rgba(169, 120, 76, 0.4);
  background: transparent;
}

.seat-number {
  font-weight: 600;
  font-size: 0.8rem;
}

.bus-aisle {
  width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--app-accent);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.65rem;
}

.bus-aisle::before {
  content: '';
  width: 2px;
  height: 80%;
  background: repeating-linear-gradient(
    to bottom,
    rgba(139, 115, 85, 0.6),
    rgba(139, 115, 85, 0.6) 8px,
    transparent 8px,
    transparent 16px
  );
}

.bus-aisle span {
  margin-top: 0.25rem;
}

/* ==========================================
   DYNAMIC SEAT GRID STYLES (Template-based)
   ========================================== */

.dynamic-seat-grid {
  display: grid;
  gap: 8px;
  padding: 2rem 1rem;
  max-width: 400px;
  margin: 0 auto;
}

.grid-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
  min-height: 40px;
}

/* Aisle styling */
.grid-cell.aisle-cell {
  background: repeating-linear-gradient(
    45deg,
    #e9ecef,
    #e9ecef 4px,
    #f8f9fa 4px,
    #f8f9fa 8px
  );
  border: none;
  cursor: default;
}

/* Empty cells */
.grid-cell.empty {
  background: transparent;
  border: none;
}

/* Seat cells */
.grid-cell.seat-cell {
  border: 2px solid #d4c7b4;
  background: #f8f2ea;
  color: #735c45;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(90, 74, 58, 0.2);
}

.grid-cell.seat-cell:hover:not(.disabled):not(.occupied) {
  background: #e7d9c8;
  border-color: var(--app-accent);
  transform: scale(1.05);
}

/* Seat type colors */
.grid-cell.seat-type-normal {
  background: #f8f2ea;
  border-color: #d4c7b4;
}

.grid-cell.seat-type-vip {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: #6366f1;
  color: white;
}

.grid-cell.seat-type-semi_bed {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  border-color: #14b8a6;
  color: white;
}

.grid-cell.seat-type-bed {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  border-color: #f59e0b;
  color: white;
}

/* Seat status */
.grid-cell.seat-cell.available {
  opacity: 1;
}

.grid-cell.seat-cell.selected {
  background: linear-gradient(135deg, #2196F3, #1976D2) !important;
  color: white !important;
  border-color: #1976D2 !important;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.5);
  transform: scale(1.1);
}

.grid-cell.seat-cell.occupied {
  background: #ded7cd !important;
  color: #a0948a !important;
  border-color: #c4bbb0 !important;
  cursor: not-allowed;
  opacity: 0.6;
}

.grid-cell.seat-cell.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Seat number display */
.grid-cell .seat-number {
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 2px;
}

/* Seat type badge */
.seat-type-badge {
  font-size: 0.5rem;
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  margin-top: 2px;
  white-space: nowrap;
}

/* Seat price badge */
.seat-price-badge {
  font-size: 0.55rem;
  padding: 1px 3px;
  background: rgba(255, 255, 255, 0.9);
  color: #2e7d32;
  border-radius: 3px;
  margin-top: 1px;
  font-weight: 700;
}

.grid-cell.seat-type-vip .seat-price-badge,
.grid-cell.seat-type-semi_bed .seat-price-badge,
.grid-cell.seat-type-bed .seat-price-badge {
  background: rgba(255, 255, 255, 0.95);
}

/* Special elements */
.grid-cell.special-element {
  cursor: default;
}

.grid-cell.special-element .special-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.grid-cell.special-element .special-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.grid-cell.bathroom {
  background-color: #0ea5e9;
  color: white;
  border: 2px solid #0284c7;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.grid-cell.door {
  background-color: #10b981;
  color: white;
  border: 2px solid #059669;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.grid-cell.stairs {
  background-color: #f59e0b;
  color: white;
  border: 2px solid #d97706;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.grid-cell.storage {
  background-color: #dbeafe;
  color: #1d4ed8;
  border: 2px solid #93c5fd;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.grid-cell.wheelchair {
  background-color: #e0f2f1;
  color: #0f766e;
  border: 2px solid #14b8a6;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.grid-cell.special-element i {
  font-size: 1.2rem;
}

/* ========================================== */

.passenger-form {
  padding: 1.5rem;
  background: var(--surface-ground);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.passenger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.passenger-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.passenger-badge i {
  font-size: 1.5rem;
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.1);
  padding: 0.5rem;
  border-radius: 50%;
}

.passenger-badge h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.2rem;
  font-weight: 600;
}

.passenger-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.payment-section {
  padding: 0.5rem 0;
}

.payment-method {
  margin-bottom: 1.5rem;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

@media (max-width: 992px) {
  .payment-options {
    grid-template-columns: 1fr;
  }
}

.payment-option {
  padding: 2rem 1.5rem;
  border: 3px solid #E8DFD5;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  position: relative;
  overflow: hidden;
  min-width: 0;
}

.payment-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--app-accent);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.payment-option:hover {
  border-color: var(--app-accent);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 115, 85, 0.2);
}

.payment-option:hover::before {
  transform: scaleX(1);
}

.payment-option.selected {
  background: white;
  border-color: var(--app-accent);
  color: #5A4A3A;
  box-shadow: 0 8px 24px rgba(139, 115, 85, 0.15);
}

.payment-option.selected::before {
  transform: scaleX(1);
  background: var(--app-accent);
}

.payment-option i {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.payment-option span {
  font-weight: 700;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  word-break: break-word;
}

.price-summary {
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--surface-ground) 0%, var(--surface-50) 100%);
  border-radius: 12px;
  border: 2px solid var(--surface-border);
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  font-size: 1.05rem;
}

.price-row span:first-child {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-row i {
  color: var(--primary-color);
  font-size: 1.1rem;
}

.price-row.total {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-color);
  padding: 1.5rem 0 0.5rem 0;
}

.price-row.total i {
  font-size: 1.5rem;
}

.price {
  font-weight: 700;
  font-size: 1.15rem;
}

.price.discount {
  color: #e53935;
  font-weight: 700;
}

.discount-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.5rem 0 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px dashed rgba(229, 57, 53, 0.3);
}

.discount-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #92400e;
}

.discount-detail .p-tag {
  font-size: 0.75rem;
}

.discount-seat {
  flex: 1;
  color: var(--text-color);
}

.discount-amount {
  font-weight: 700;
  color: #b45309;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, transparent 0%, var(--surface-ground) 20%);
  border-radius: 12px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  .seat-grid {
    padding: 1rem;
  }
  .seat-row {
    gap: 0.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons button {
    width: 100%;
  }
  
  .search-grid {
    grid-template-columns: 1fr;
  }
  
  .swap-button-container {
    order: 2;
    margin: 0.5rem 0;
  }
}

/* Estilos para búsqueda de viajes */
.search-card {
  margin-bottom: 1.5rem;
}

.search-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr 1fr 1fr;
  gap: 1.5rem;
  align-items: end;
}

.swap-button-container {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.25rem;
}

.swap-button {
  width: 3rem;
  height: 3rem;
  background-color: #f8f7f5 !important;
  border-color: #C9A882 !important;
  color: var(--app-accent) !important;
  transition: all 0.3s ease;
}

.swap-button:not(:disabled):hover {
  background-color: #E8DFD5 !important;
  border-color: var(--app-accent) !important;
  color: #76614D !important;
  transform: rotate(180deg);
}

.swap-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.date-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.date-input.invalid {
  border-color: #d32f2f;
  box-shadow: 0 0 0 1px rgba(211, 47, 47, 0.15);
}

.date-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(var(--primary-color-rgb), 0.25);
}

.city-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.city-option small {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.cooperative-info {
  margin-top: 1rem;
}

.info-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  color: #5A4A3A;
  font-size: 1.05rem;
  border: 2px solid var(--app-accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-banner i {
  font-size: 1.5rem;
  color: var(--app-accent);
}

.results-card {
  margin-bottom: 1.5rem;
}

.trips-list {
  display: grid;
  gap: 1rem;
}

.trip-card {
  padding: 1.5rem;
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--surface-ground);
}

.trip-card:hover {
  border-color: var(--app-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.15);
}

.trip-card.selected {
  border-color: var(--app-accent);
  background: white;
  box-shadow: 0 4px 16px rgba(139, 115, 85, 0.25);
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.trip-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.trip-route {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: var(--text-color);
}

.trip-route i {
  color: var(--app-accent);
}

.trip-info {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.95rem;
}

.info-item i {
  color: var(--app-accent);
}

.no-results-card {
  margin-bottom: 1.5rem;
}

.no-results {
  text-align: center;
  padding: 3rem 2rem;
}

.no-results i {
  font-size: 4rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.no-results h3 {
  margin: 1rem 0 0.5rem;
  color: var(--text-color);
  font-size: 1.5rem;
}

.no-results p {
  color: var(--text-color-secondary);
  margin: 0.25rem 0;
  font-size: 1.05rem;
}
</style>

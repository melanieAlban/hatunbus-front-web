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
                class="w-full"
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
                class="date-input"
              />
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
            
            <!-- Aisle indicator -->
            <div class="bus-info">
              <small><i class="pi pi-arrow-down"></i> Pasillo central <i class="pi pi-arrow-down"></i></small>
            </div>
            
            <div class="seat-grid">
              <div
                v-for="seat in seatNumbers"
                :key="seat"
                class="seat-item"
                :class="{
                  'selected': selectedSeats.includes(seat),
                  'occupied': occupiedSeats.includes(seat),
                  'disabled': occupiedSeats.includes(seat) || (selectedSeats.length >= passengerCount && !selectedSeats.includes(seat)),
                  'aisle-right': parseInt(seat) % 4 === 2
                }"
                @click="toggleSeat(seat)"
              >
                <div class="seat-shape">
                  <div class="seat-back"></div>
                  <div class="seat-cushion">
                    <span class="seat-number">{{ seat }}</span>
                  </div>
                </div>
              </div>
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
                  class="w-full"
                />
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
                  class="w-full"
                />
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
                  class="w-full"
                />
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
                  class="w-full"
                />
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
                  class="w-full"
                />
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
                <span class="price">${{ calculateSubtotal().toFixed(2) }}</span>
              </div>
              <div class="price-row" v-if="calculateDiscount() > 0">
                <span><i class="pi pi-percentage"></i> Descuentos</span>
                <span class="price discount">-${{ calculateDiscount().toFixed(2) }}</span>
              </div>
              <Divider />
              <div class="price-row total">
                <span><i class="pi pi-dollar"></i> Total a pagar</span>
                <span class="price">${{ calculateTotal().toFixed(2) }}</span>
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
import { ref, computed, watch, onMounted } from 'vue'
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
import type { TripSummary, RequestTicketDto, PassengerType, PaymentMethod, CreatePurchaseRequest, PurchaseType, StopDto, PurchaseDto, RouteDto } from '../interfaces/ticket.interface'
import { success, error as notifyError } from '../../../lib/notifier'
import * as cityService from '../services/cityService'
import * as ticketService from '../services/ticketService'
import type { CityDto } from '../services/cityService'
import PurchaseSuccessDialog from '../components/PurchaseSuccessDialog.vue'

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
const occupiedSeats = ref<string[]>([])
const routeStops = ref<StopDto[]>([])
const selectedRoute = ref<RouteDto | null>(null)
const paymentMethod = ref<string>('CASH')
const loading = ref(false)
const completedPurchase = ref<PurchaseDto | null>(null)

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

interface PassengerForm {
  passengerName: string
  passengerIdCard: string
  passengerEmail?: string
  passengerPhone?: string
  passengerType: PassengerType
}

const passengers = ref<PassengerForm[]>([])

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

const seatNumbers = computed(() => {
  if (!selectedTrip.value) return []
  const count = selectedTrip.value.busSeatsCount || 40
  
  // Generar asientos en formato backend: V1, P1, V2, P2, V3, P3...
  // V = Ventana (columnas 1 y 4), P = Pasillo (columnas 2 y 3)
  const seats: string[] = []
  let vCounter = 1
  let pCounter = 1
  
  for (let i = 1; i <= count; i++) {
    // En una fila de 4 asientos: posiciones 1,2,3,4
    const positionInRow = ((i - 1) % 4) + 1
    
    // Posiciones 1 y 4 son ventana, 2 y 3 son pasillo
    if (positionInRow === 1 || positionInRow === 4) {
      seats.push(`V${vCounter}`)
      vCounter++
    } else {
      seats.push(`P${pCounter}`)
      pCounter++
    }
  }
  
  return seats
})

const passengerTypes = [
  { label: '👤 Adulto', value: 'ADULT' },
  { label: '👶 Menor', value: 'CHILD' },
  { label: '👴 Tercera Edad', value: 'SENIOR' },
  { label: '♿ Discapacitado', value: 'DISABLED' }
]

const paymentMethods = [
  { label: 'Efectivo', value: 'CASH', icon: 'pi pi-money-bill' },
  { label: 'Transferencia', value: 'TRANSFER', icon: 'pi pi-building-columns' },
  { label: 'PayPal', value: 'PAYPAL', icon: 'pi pi-paypal' }
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

async function searchAvailableTrips() {
  if (!searchOrigin.value || !searchDestination.value || !searchDate.value) {
    notifyError('Por favor complete todos los campos de búsqueda')
    return
  }
  
  if (searchOrigin.value === searchDestination.value) {
    notifyError('El origen y destino no pueden ser iguales')
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
  occupiedSeats.value = []
  passengers.value = []
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
}, { deep: true })

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

async function onTripChange() {
  selectedSeats.value = []
  occupiedSeats.value = []
  passengers.value = []
  
  if (!selectedTrip.value) return
  
  loading.value = true
  try {
    // Cargar asientos ocupados desde el backend
    const tickets = await ticketStore.loadTicketsByTrip(selectedTrip.value.id)
    occupiedSeats.value = tickets.map(t => t.seatNumber)
    console.log('Asientos ocupados cargados:', occupiedSeats.value)
  } catch (err: any) {
    console.warn('No se pudieron cargar asientos ocupados, continuando sin esa información:', err.response?.data?.message || err.message)
    // Si hay error de permisos o el endpoint no está disponible, asumir que no hay asientos ocupados
    // Esto permite continuar con la venta normalmente
    occupiedSeats.value = []
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

function calculateSubtotal(): number {
  return selectedSeats.value.length * routeBasePrice.value
}

function calculateDiscount(): number {
  let discount = 0
  passengers.value.forEach(p => {
    if (p.passengerType === 'CHILD') discount += routeBasePrice.value * 0.5 // 50% niños
    else if (p.passengerType === 'SENIOR') discount += routeBasePrice.value * 0.3 // 30% tercera edad
    else if (p.passengerType === 'DISABLED') discount += routeBasePrice.value * 0.5 // 50% discapacitados
  })
  return discount
}

function calculateTotal(): number {
  return calculateSubtotal() - calculateDiscount()
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
  
  for (let i = 0; i < passengers.value.length; i++) {
    const p = passengers.value[i]
    if (!p) {
      notifyError(`Información del pasajero ${i + 1} incompleta`)
      return false
    }
    if (!p.passengerName.trim()) {
      notifyError(`El nombre del pasajero ${i + 1} es obligatorio`)
      return false
    }
    if (!p.passengerIdCard.trim() || p.passengerIdCard.length !== 10) {
      notifyError(`La cédula del pasajero ${i + 1} debe tener 10 dígitos`)
      return false
    }
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
    let originId: string | undefined
    let destinationId: string | undefined
    
    // Primero intentar encontrar stops si existen
    if (routeStops.value.length > 0) {
      const originStop = routeStops.value.find(stop => 
        stop.city === originCityName || (stop.name && stop.name.includes(originCityName))
      )
      const destinationStop = routeStops.value.find(stop => 
        stop.city === destinationCityName || (stop.name && stop.name.includes(destinationCityName))
      )
      
      originId = originStop?.id
      destinationId = destinationStop?.id
      
      console.log('Stops encontrados:', { originId, destinationId })
    }
    
    // Si no hay stops, usar los IDs de las ciudades (el backend creará stops temporales)
    if (!originId || !destinationId) {
      console.log('No se encontraron stops, buscando city IDs...')
      const originCity = cities.value.find(city => city.name === originCityName)
      const destinationCity = cities.value.find(city => city.name === destinationCityName)
      
      originId = originCity?.id
      destinationId = destinationCity?.id
      
      console.log('City IDs encontrados:', { originId, destinationId })
      console.log('originCity:', originCity)
      console.log('destinationCity:', destinationCity)
      
      if (!originId || !destinationId) {
        notifyError('No se pudieron encontrar las ciudades de origen o destino')
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
        originStopId: originId,
        destinationStopId: destinationId
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
  paymentMethod.value = 'CASH'
  occupiedSeats.value = []
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
  background: linear-gradient(135deg, #f8f7f5 0%, #E8DFD5 100%);
  border-radius: 12px;
  margin-bottom: 1rem;
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
  color: #A0826D !important;
  transition: all 0.3s ease;
}

.count-controls button:not(:disabled):hover {
  background-color: #A0826D !important;
  color: white !important;
  border-color: #A0826D !important;
  transform: scale(1.1);
}

.count-display {
  font-size: 2rem;
  font-weight: 700;
  color: #A0826D;
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
  background: linear-gradient(135deg, #F5F1EB 0%, #E8DFD5 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 2px solid #C9A882;
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
  border: 2px solid #A0826D;
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
  color: #8B7355;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  max-width: 420px;
  margin: 0 auto;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(139, 115, 85, 0.2);
}

.seat-item {
  aspect-ratio: 0.85;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  position: relative;
}

.seat-item.aisle-right {
  margin-right: 1.5rem;
}

.seat-shape {
  width: 100%;
  height: 100%;
  position: relative;
}

.seat-back {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 85%;
  height: 25%;
  background: linear-gradient(180deg, #C9E4C5 0%, #A8D5A3 100%);
  border-radius: 8px 8px 4px 4px;
  border: 2px solid #81C784;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.seat-cushion {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72%;
  background: linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 100%);
  border-radius: 12px 12px 6px 6px;
  border: 2px solid #81C784;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.seat-number {
  font-weight: 700;
  font-size: 1rem;
  color: #2E7D32;
  z-index: 2;
}

.seat-item:hover:not(.disabled):not(.occupied) .seat-cushion {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.seat-item:hover:not(.disabled):not(.occupied) .seat-back {
  background: linear-gradient(180deg, #A8D5A3 0%, #81C784 100%);
  border-color: #66BB6A;
}

.seat-item:hover:not(.disabled):not(.occupied) .seat-cushion {
  background: linear-gradient(180deg, #C8E6C9 0%, #A5D6A7 100%);
  border-color: #66BB6A;
}

.seat-item.selected .seat-back {
  background: linear-gradient(180deg, #1E88E5 0%, #1565C0 100%);
  border-color: #0D47A1;
}

.seat-item.selected .seat-cushion {
  background: linear-gradient(180deg, #2196F3 0%, #1976D2 100%);
  border-color: #0D47A1;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.5);
}

.seat-item.selected .seat-number {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.seat-item.occupied .seat-back {
  background: linear-gradient(180deg, #ef5350 0%, #e53935 100%);
  border-color: #c62828;
}

.seat-item.occupied .seat-cushion {
  background: linear-gradient(180deg, #ef5350 0%, #e53935 100%);
  border-color: #c62828;
  cursor: not-allowed;
}

.seat-item.occupied .seat-number {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.seat-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.seat-item.disabled .seat-back,
.seat-item.disabled .seat-cushion {
  filter: grayscale(0.5);
}

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
  background: #8B7355;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.payment-option:hover {
  border-color: #A0826D;
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 115, 85, 0.2);
}

.payment-option:hover::before {
  transform: scaleX(1);
}

.payment-option.selected {
  background: linear-gradient(135deg, #E8DFD5 0%, #e3bf97 0%);
  border-color: #A0826D;
  color: #5A4A3A;
  box-shadow: 0 8px 24px rgba(201, 168, 130, 0.3);
}

.payment-option.selected::before {
  transform: scaleX(1);
  background: #A0826D;
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
    grid-template-columns: repeat(4, 1fr);
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
  color: #A0826D !important;
  transition: all 0.3s ease;
}

.swap-button:not(:disabled):hover {
  background-color: #E8DFD5 !important;
  border-color: #A0826D !important;
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
  background: linear-gradient(135deg, #E8DFD5 0%, #C9A882 100%);
  border-radius: 8px;
  color: #5A4A3A;
  font-size: 1.05rem;
  border: 2px solid #A0826D;
}

.info-banner i {
  font-size: 1.5rem;
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
  border-color: #A0826D;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.15);
}

.trip-card.selected {
  border-color: #8B7355;
  background: linear-gradient(135deg, #FAF8F4 0%, #E8DFD5 100%);
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
  color: #8B7355;
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
  color: #A0826D;
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

import apiClient from '../../../services/apiClient'
import type {
  CreatePurchaseRequest,
  PurchaseDto,
  TicketDto,
  TripSummary,
  StopDto,
  RouteDto,
  SeatAvailability
} from '../interfaces/ticket.interface'

const BASE = '/compras'
const TICKET_BASE = '/boletos'
const TRIP_BASE = '/viajes'
const ROUTE_BASE = '/rutas'

export async function createPurchase(request: CreatePurchaseRequest): Promise<PurchaseDto> {
  const res = await apiClient.post(`${BASE}`, request)
  return res.data as PurchaseDto
}

export async function confirmPayment(purchaseId: string): Promise<PurchaseDto> {
  const res = await apiClient.post(`${BASE}/${purchaseId}/confirmar-pago`)
  return res.data as PurchaseDto
}

export async function cancelPurchase(purchaseId: string): Promise<PurchaseDto> {
  const res = await apiClient.post(`${BASE}/${purchaseId}/cancelar`)
  return res.data as PurchaseDto
}

export async function getPurchaseById(id: string): Promise<PurchaseDto> {
  const res = await apiClient.get(`${BASE}/${id}`)
  return res.data as PurchaseDto
}

export async function listPurchasesByUser(userId: string): Promise<PurchaseDto[]> {
  const res = await apiClient.get(`${BASE}/usuario/${userId}`)
  return res.data as PurchaseDto[]
}

export async function listTicketsByTrip(tripId: string): Promise<TicketDto[]> {
  const res = await apiClient.get(`${TICKET_BASE}/viaje/${tripId}`)
  return res.data as TicketDto[]
}

export async function getSeatAvailability(tripId: string): Promise<SeatAvailability[]> {
  const res = await apiClient.get(`${TRIP_BASE}/${tripId}/asientos-disponibles`)
  return res.data as SeatAvailability[]
}

export async function searchTrips(date: string, origin: string, destination: string): Promise<TripSummary[]> {
  try {
    // Asegurar que la fecha esté en formato YYYY-MM-DD sin conversión de zona horaria
    // El input type="date" ya devuelve en formato correcto, solo lo validamos
    const dateStr = date.trim()
    
    console.log('[Service] Llamando al backend con:', { fecha: dateStr, origen: origin, destino: destination })
    const res = await apiClient.get(`${TRIP_BASE}/buscar`, {
      params: {
        fecha: dateStr,
        origen: origin,
        destino: destination
      },
      // Evitar que axios transforme los parámetros
      paramsSerializer: {
        encode: (param) => param, // No codificar los parámetros
      }
    })
    
    console.log('[Service] Respuesta del backend:', res.data.length, 'viajes')
    console.log('[Service] URL completa:', res.config.url)
    let trips = res.data as any[]
    
    if (trips.length > 0) {
      console.log('[Service] Primer viaje recibido:', {
        date: trips[0].date,
        origin: trips[0].routeOrigin,
        destination: trips[0].routeDestination,
        status: trips[0].status,
        availableSeats: trips[0].availableSeats
      })
    }
    
    // Mapear y extraer cooperativeId del objeto frequency y routeId del frequencySegment
    trips = trips.map(trip => ({
      ...trip,
      cooperativeId: trip.frequency?.cooperativeId || trip.cooperativeId,
      cooperativeName: trip.frequency?.cooperativeName || trip.cooperativeName,
      routeId: trip.frequencySegment?.routeId || trip.routeId
    }))
    
    const beforeFilter = trips.length
    
    // Obtener fecha y hora actual
    const now = new Date()
    
    // Filtrar viajes que:
    // 1. Estén programados (SCHEDULED)
    // 2. Tengan asientos disponibles
    // 3. La hora de salida no haya pasado aún
    trips = trips.filter(trip => {
      // Validar estado y asientos
      if (trip.status !== 'SCHEDULED' || !trip.availableSeats || trip.availableSeats <= 0) {
        return false
      }
      
      // Validar hora de salida
      if (trip.scheduledDepartureTime) {
        let tripDateTime: Date
        
        // Si es un array [year, month, day, hour, minute]
        if (Array.isArray(trip.scheduledDepartureTime)) {
          const [year, month, day, hour = 0, minute = 0] = trip.scheduledDepartureTime
          tripDateTime = new Date(year, month - 1, day, hour, minute)
        } else {
          tripDateTime = new Date(trip.scheduledDepartureTime)
        }
        
        // Solo mostrar si la hora de salida es futura
        return tripDateTime > now
      }
      
      // Si no hay hora de salida, mostrar el viaje (caso raro pero seguro)
      return true
    })
    
    console.log(`[Service] Después de filtrar por status, asientos y hora: ${beforeFilter} -> ${trips.length}`)
    
    return trips as TripSummary[]
  } catch (error) {
    console.error('[Service] Error al buscar viajes:', error)
    return []
  }
}

export async function getAvailableTrips(cooperativeId?: string): Promise<TripSummary[]> {
  try {
    // Obtener viajes de hoy con estado SCHEDULED
    const today = new Date().toISOString().split('T')[0]
    const res = await apiClient.get(`${TRIP_BASE}/fecha/${today}`)
    
    let trips = res.data as any[]
    
    // Mapear y extraer cooperativeId del objeto frequency y routeId del frequencySegment
    trips = trips.map(trip => ({
      ...trip,
      cooperativeId: trip.frequency?.cooperativeId || trip.cooperativeId,
      cooperativeName: trip.frequency?.cooperativeName || trip.cooperativeName,
      routeId: trip.frequencySegment?.routeId || trip.routeId
    }))
    
    // Filtrar por cooperativa si se proporciona
    if (cooperativeId) {
      trips = trips.filter(trip => trip.cooperativeId === cooperativeId)
    }
    
    // Obtener fecha y hora actual
    const now = new Date()
    
    // Filtrar viajes que:
    // 1. Estén programados (SCHEDULED)
    // 2. Tengan asientos disponibles
    // 3. La hora de salida no haya pasado aún
    trips = trips.filter(trip => {
      // Validar estado y asientos
      if (trip.status !== 'SCHEDULED' || !trip.availableSeats || trip.availableSeats <= 0) {
        return false
      }
      
      // Validar hora de salida
      if (trip.scheduledDepartureTime) {
        let tripDateTime: Date
        
        // Si es un array [year, month, day, hour, minute]
        if (Array.isArray(trip.scheduledDepartureTime)) {
          const [year, month, day, hour = 0, minute = 0] = trip.scheduledDepartureTime
          tripDateTime = new Date(year, month - 1, day, hour, minute)
        } else {
          tripDateTime = new Date(trip.scheduledDepartureTime)
        }
        
        // Solo mostrar si la hora de salida es futura
        return tripDateTime > now
      }
      
      return true
    })
    
    return trips as TripSummary[]
  } catch (error) {
    console.error('Error al obtener viajes:', error)
    // Si no hay viajes para hoy, intentar con rango de fechas
    try {
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const res = await apiClient.get(`${TRIP_BASE}/rango`, {
        params: { fechaInicio: today, fechaFin: nextWeek }
      })
      let trips = res.data as any[]
      
      // Mapear y extraer cooperativeId del objeto frequency y routeId del frequencySegment
      trips = trips.map(trip => ({
        ...trip,
        cooperativeId: trip.frequency?.cooperativeId || trip.cooperativeId,
        cooperativeName: trip.frequency?.cooperativeName || trip.cooperativeName,
        routeId: trip.frequencySegment?.routeId || trip.routeId
      }))
      
      // Filtrar por cooperativa si se proporciona
      if (cooperativeId) {
        trips = trips.filter(trip => trip.cooperativeId === cooperativeId)
      }
      
      // Obtener fecha y hora actual
      const now = new Date()
      
      // Filtrar viajes que:
      // 1. Estén programados (SCHEDULED)
      // 2. Tengan asientos disponibles
      // 3. La hora de salida no haya pasado aún
      trips = trips.filter(trip => {
        // Validar estado y asientos
        if (trip.status !== 'SCHEDULED' || !trip.availableSeats || trip.availableSeats <= 0) {
          return false
        }
        
        // Validar hora de salida
        if (trip.scheduledDepartureTime) {
          let tripDateTime: Date
          
          // Si es un array [year, month, day, hour, minute]
          if (Array.isArray(trip.scheduledDepartureTime)) {
            const [year, month, day, hour = 0, minute = 0] = trip.scheduledDepartureTime
            tripDateTime = new Date(year, month - 1, day, hour, minute)
          } else {
            tripDateTime = new Date(trip.scheduledDepartureTime)
          }
          
          // Solo mostrar si la hora de salida es futura
          return tripDateTime > now
        }
        
        return true
      })
      
      return trips as TripSummary[]
    } catch (err) {
      console.error('Error al obtener viajes por rango:', err)
      return []
    }
  }
}

export async function getTripById(tripId: string): Promise<TripSummary> {
  const res = await apiClient.get(`${TRIP_BASE}/${tripId}`)
  return res.data as TripSummary
}

export async function getRouteStops(routeId: string): Promise<StopDto[]> {
  const res = await apiClient.get(`${ROUTE_BASE}/${routeId}/paradas`)
  return res.data as StopDto[]
}

export async function getRouteById(routeId: string): Promise<RouteDto> {
  const res = await apiClient.get(`${ROUTE_BASE}/${routeId}`)
  return res.data as RouteDto
}

export default {
  createPurchase,
  confirmPayment,
  cancelPurchase,
  getPurchaseById,
  listPurchasesByUser,
  listTicketsByTrip,
  getSeatAvailability,
  getAvailableTrips,
  searchTrips,
  getTripById,
  getRouteStops,
  getRouteById
}

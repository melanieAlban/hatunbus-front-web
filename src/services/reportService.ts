import apiClient from './apiClient'

export interface PassengerReportDto {
  seatNumber?: string
  passengerName?: string
  passengerIdCard?: string
  passengerEmail?: string
  passengerPhone?: string
  passengerType?: string
  status?: string
  originStop?: string
  destinationStop?: string
}

export interface TripReportDto {
  tripId: string
  totalSeats: number
  occupiedSeats: number
  availableSeats: number
  totalRevenue: number
  occupancyRate: number
  routeName?: string
  driverName?: string
  driverPhone?: string
  routeOrigin?: string
  routeDestination?: string
  busPlate?: string
  busUnitNumber?: number
  cooperativeName?: string
  cooperativeLogo?: string
  scheduledDepartureTime?: string
  scheduledArrivalTime?: string
  generatedAt?: string
  passengers: PassengerReportDto[]
}

export async function fetchTripReport(tripId: string): Promise<TripReportDto> {
  const { data } = await apiClient.get(`/reportes/viaje/${tripId}`)
  return data
}

export interface TripSummaryDto {
  id: string
  routeName?: string
  routeOrigin?: string
  routeDestination?: string
  scheduledDate?: string
  scheduledDepartureTime?: string
  scheduledArrivalTime?: string
  busPlate?: string
  busUnitNumber?: number
  status?: string
  cooperativeName?: string
}

export async function fetchTripsByDateRange(startDate: string, endDate: string): Promise<TripSummaryDto[]> {
  const { data } = await apiClient.get('/viajes/rango', {
    params: { fechaInicio: startDate, fechaFin: endDate },
  })
  return data
}

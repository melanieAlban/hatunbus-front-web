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
  actualDepartureTime?: string
  actualArrivalTime?: string
  busPlate?: string
  busUnitNumber?: number
  status?: string
  cooperativeName?: string
  cooperativeLogo?: string
  driverName?: string
  cooperativePrimaryColor?: string
  cooperativeSecondaryColor?: string
}

export async function fetchTripsByDateRange(startDate: string, endDate: string): Promise<TripSummaryDto[]> {
  const { data } = await apiClient.get('/viajes/rango', {
    params: { fechaInicio: startDate, fechaFin: endDate },
  })
  return data
}

export async function fetchCompletedTrips(): Promise<TripSummaryDto[]> {
  const { data } = await apiClient.get('/viajes/completados')
  return data
}

export interface RouteFrequencyDto {
  routeName: string
  tripCount: number
}

export interface DriverReportDto {
  driverId: string
  driverName: string
  cedula: string
  licenseNumber: string
  totalTrips: number
  totalPassengers: number
  totalIncome: number
  totalExpenses: number
  netBalance: number
  averagePassengersPerTrip: number
  mostFrequentRoutes: RouteFrequencyDto[]
  cooperativeName: string
}

export interface DriversReportResponseDto {
  drivers: DriverReportDto[]
  totalDrivers: number
  totalTrips: number
  totalPassengers: number
}

export async function fetchDriversReport(
  startDate?: string,
  endDate?: string,
  driverId?: string
): Promise<DriversReportResponseDto> {
  const params: any = {}
  if (startDate) params.fechaInicio = startDate
  if (endDate) params.fechaFin = endDate
  if (driverId) params.conductorId = driverId
  
  const { data } = await apiClient.get('/reportes/conductores', { params })
  return data
}

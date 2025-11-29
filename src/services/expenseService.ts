import apiClient from './apiClient'

export interface TripExpenseDto {
  id: string
  tripId: string
  driverId: string
  category: 'FUEL' | 'TOLL' | 'MEALS' | 'MAINTENANCE' | 'PARKING' | 'OTHER'
  amount: number
  description: string
  receiptImageBase64?: string
  createdAt: string
  updatedAt?: string
  tripRoute?: string
  driverName?: string
  busPlate?: string
}

export interface BusExpenseReport {
  busId: string
  busPlate: string
  busUnitNumber?: number
  busBrand?: string
  totalExpenses: number
  expensesByCategory: {
    category: string
    total: number
  }[]
  trips: {
    tripId: string
    date: string
    route: string
    driverName: string
    totalExpenses: number
    expenses: TripExpenseDto[]
  }[]
}

export async function fetchExpensesByTrip(tripId: string): Promise<TripExpenseDto[]> {
  const { data } = await apiClient.get(`/gastos-viaje/viaje/${tripId}`)
  return data
}

export async function fetchTotalExpensesByTrip(tripId: string): Promise<number> {
  const { data } = await apiClient.get(`/gastos-viaje/viaje/${tripId}/total`)
  return data
}

export async function fetchExpensesByBus(busId: string, startDate?: string, endDate?: string): Promise<BusExpenseReport> {
  const params: any = {}
  if (startDate) params.fechaInicio = startDate
  if (endDate) params.fechaFin = endDate
  
  const { data } = await apiClient.get(`/gastos-viaje/bus/${busId}`, { params })
  return data
}

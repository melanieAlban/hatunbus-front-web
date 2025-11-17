export type Token = string

export interface RouteSheetDto {
  id: string
  cooperativeId: string
  cooperativeName?: string
  startDate: string
  endDate: string
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface TripDto {
  id: string
  routeSheetId: string
  busId?: string
  driverId?: string
  routeId: string
  departureDate: string
  departureTime: string
  estimatedArrivalTime?: string
  status: string
  availableSeats?: number
  createdAt?: string
  updatedAt?: string
}

export interface BusAssignment {
  tripId: string
  busId: string
  busUnitNumber: string
  busPlate: string
  driverId: string
  driverName: string
  status: string
}

export interface RouteSheetMatrixRow {
  frequencyId: string
  frequencySegmentId: string
  frequencyName: string
  segmentOrder: number
  routeName: string
  departureTime: string
  assignments: Record<string, BusAssignment>
}

export interface RouteSheetMatrixDto {
  routeSheetId: string
  routeSheetName: string
  cooperativeId: string
  cooperativeName: string
  startDate: string
  endDate: string
  dates: string[]
  rows: RouteSheetMatrixRow[]
}

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

export interface FrequencySegmentDetail {
  frequencySegmentId: string
  segmentOrder: number
  departureTime: string
  origin: string
  destination: string
  estimatedDuration: number
}

export interface RouteSheetMatrixRow {
  frequencyId: string
  frequencyName: string
  segments: FrequencySegmentDetail[]
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

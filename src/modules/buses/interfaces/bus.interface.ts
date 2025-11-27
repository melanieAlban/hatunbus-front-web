export enum BusStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum SeatType {
  NORMAL = 'NORMAL',
  VIP = 'VIP'
}

export interface BusDto {
  id: string
  cooperativeId: string
  cooperativeName?: string
  driverId: string
  driverName?: string | null
  driverLicenseNumber?: string | null
  plate: string
  chassisBrand: string
  chassisNumber?: string | null
  bodyBrand: string
  bodyNumber?: string | null
  seatCount: number
  unitNumber?: number | null
  totalKilometers?: number | null
  lastMaintenanceDate?: string | null
  nextMaintenanceKm?: number | null
  photo?: string | null // Base64 desde el backend
  status: BusStatus
  createdAt?: string
  updatedAt?: string
}

export interface CreateBusRequest {
  cooperativeId: string
  driverId: string
  plate: string
  chassisBrand: string
  chassisNumber?: string | null
  bodyBrand: string
  bodyNumber?: string | null
  seatCount: number
  unitNumber?: number | null
  photo?: string | null // Base64 para enviar al backend
  seatsConfiguration?: Record<number, SeatType>
}

export interface UpdateBusPayload {
  cooperativeId?: string
  driverId?: string
  plate?: string
  chassisBrand?: string
  chassisNumber?: string | null
  bodyBrand?: string
  bodyNumber?: string | null
  seatCount?: number
  unitNumber?: number | null
  totalKilometers?: number | null
  lastMaintenanceDate?: string | null
  nextMaintenanceKm?: number | null
  photo?: string | null // Base64 para enviar al backend
  status?: BusStatus
}

export interface SeatDto {
  id: string
  busId: string
  seatNumber: number
  type: SeatType
  available: boolean
}

export interface MaintenanceRecordDto {
  id: string
  busId: string
  maintenanceDate: string
  maintenanceType: string
  kilometersAtMaintenance?: number | null
  description?: string | null
  cost?: number | null
  workshop?: string | null
  nextMaintenanceKm?: number | null
  createdAt?: string
}

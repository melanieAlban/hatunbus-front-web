export enum BusStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum SeatType {
  NORMAL = 'NORMAL',
  VIP = 'VIP',
  SEMI_BED = 'SEMI_BED',
  BED = 'BED'
}

export interface BusDto {
  id: string
  cooperativeId: string
  cooperativeName?: string
  busTemplateId?: string | null
  busTemplate?: BusTemplateDto | null
  busGroupId?: string | null
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
  seatLayout?: SeatLayoutItem[]
}

export interface BusTemplateDto {
  id: string
  cooperativeId?: string | null
  cooperativeName?: string | null
  name: string
  description?: string
  seatCount: number
  seatConfiguration: Record<string, string>
  active: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateBusRequest {
  cooperativeId: string
  driverId?: string
  busTemplateId?: string
  plate: string
  chassisBrand: string
  chassisNumber?: string | null
  bodyBrand: string
  bodyNumber?: string | null
  unitNumber?: number | null
  photo?: string | null // Base64 para enviar al backend
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
  seatLayout?: SeatLayoutItem[]
}

export interface SeatDto {
  id: string
  busId: string
  seatNumber: number
  displayCode?: string | null
  row?: number | null
  column?: number | null
  floor?: number | null
  seatType: SeatType
  additionalPrice?: number | null
  status: string
  createdAt?: string
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

export interface SeatLayoutItem {
  code: string
  row: number
  column: number
  seatType: SeatType
}

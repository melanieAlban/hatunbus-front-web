export interface DriverDto {
  id: string
  userId: string
  cooperativeId: string
  licenseNumber: string
  licenseType?: string | null
  issueDate?: string | null
  expirationDate?: string | null
  active: boolean
  userName?: string | null
  cooperativeName?: string | null
  assignedBusId?: string | null
  assignedBusPlate?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateDriverPayload {
  userId: string
  cooperativeId: string
  licenseNumber: string
  licenseType?: string | null
  issueDate?: string | null
  expirationDate?: string | null
  // NOTA: 'active' no se incluye porque el backend no lo acepta en la creación
}

export interface UpdateDriverPayload {
  licenseNumber?: string
  licenseType?: string | null
  issueDate?: string | null
  expirationDate?: string | null
  active?: boolean
  cooperativeId?: string
  // NOTA: userId no se incluye porque el backend no lo acepta en la actualización
}

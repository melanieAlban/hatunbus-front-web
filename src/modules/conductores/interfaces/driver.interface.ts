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
  active?: boolean
}

export interface UpdateDriverPayload {
  licenseNumber?: string
  licenseType?: string | null
  issueDate?: string | null
  expirationDate?: string | null
  active?: boolean
  cooperativeId?: string
  userId?: string
}

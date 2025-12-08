export interface UserCoopDto {
  id: string
  firstNames: string
  lastNames: string
  idCard: string
  email?: string | null
  phone?: string | null
  role: string
  birthDate?: string | null
  gender?: string | null
  profilePhoto?: string | null // base64 data URL: data:image/...;base64,...
  active: boolean
  cooperativeId?: string | null
  cooperativeName?: string | null
  createdAt?: string | null
  // Driver-specific fields
  licenseNumber?: string | null
  licenseType?: string | null
  issueDate?: string | null
  expirationDate?: string | null
}

export interface CreateUserPayload {
  firstNames: string
  lastNames: string
  idCard: string
  password: string
  role: string // 'CLIENT'|'DRIVER'|'CLERK'|'COOPERATIVE'|'ADMIN'
  email?: string | null
  phone?: string | null
  birthDate?: string | null
  gender?: string | null
  profilePhoto?: string | null // optional base64 data URL
  cooperativeId?: string | null // required when role = CLERK
  // NOTA: Los campos de licencia NO se incluyen aquí porque el backend no los acepta.
  // Los datos del conductor se manejan por separado via /api/conductores
}

export interface UpdateUserPayload {
  firstNames?: string
  lastNames?: string
  // NOTA: idCard no se incluye porque el backend no permite actualizar la cédula
  email?: string | null
  phone?: string | null
  birthDate?: string | null
  gender?: string | null
  profilePhoto?: string | null // base64 data URL
  active?: boolean
  // NOTA: Los campos de licencia NO se incluyen aquí porque el backend no los acepta.
  // Los datos del conductor se manejan por separado via /api/conductores
}

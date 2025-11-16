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
}

export interface UpdateUserPayload {
  firstNames?: string
  lastNames?: string
  idCard?: string
  email?: string | null
  phone?: string | null
  birthDate?: string | null
  gender?: string | null
  profilePhoto?: string | null // base64 data URL
  active?: boolean
}

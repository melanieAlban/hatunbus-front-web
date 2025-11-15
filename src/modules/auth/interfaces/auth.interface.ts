export interface LoginCredentials {
  // Backend accepts email or idCard as identifier; keep field name email
  email: string
  password: string
}

export interface UserDto {
  id: string
  firstNames?: string
  lastNames?: string
  idCard?: string
  email?: string
  phone?: string
  role?: string
  birthDate?: string | null
  gender?: string
  profilePhoto?: string
  active?: boolean
  cooperativeId?: string | null
  cooperativeName?: string | null
  createdAt?: string | null
}

export interface LoginResponse {
  token: string
  user: UserDto
}

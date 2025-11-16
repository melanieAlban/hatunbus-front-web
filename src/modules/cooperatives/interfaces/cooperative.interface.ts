export interface CooperativeDto {
  id?: string
  name: string
  ruc: string
  address: string
  email: string
  phone: string
  // El backend ahora usa `logoBase64` (data URL) para enviar/recibir el logo
  logo?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  active: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateCooperativePayload {
  name: string
  ruc: string
  address: string
  email: string
  phone: string
  logo?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  active?: boolean
}

export interface UpdateCooperativePayload extends Partial<CreateCooperativePayload> {}

export interface CooperativeReportDto {
  startDate?: string
  endDate?: string
  totalRevenue?: string | number
  totalTrips?: number
  completedTrips?: number
  inProgressTrips?: number
  canceledTrips?: number
  totalTickets?: number
  cooperativeId?: string
  cooperativeName?: string
}

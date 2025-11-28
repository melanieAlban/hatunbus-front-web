export type SeatType = 'NORMAL' | 'VIP' | 'SEMI_BED' | 'BED';
export type SpecialType = 'bathroom' | 'door' | 'stairs' | 'aisle';
export type SeatOrSpecialType = SeatType | SpecialType;

export interface SeatConfiguration {
  [seatNumber: number]: SeatOrSpecialType;
}

export interface BusTemplateDto {
  id: string
  cooperativeId?: string | null // null = template del sistema
  cooperativeName?: string | null
  name: string
  description?: string
  seatCount: number
  seatConfiguration: SeatConfiguration
  active: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateBusTemplateRequest {
  cooperativeId?: string | null
  name: string
  description?: string
  seatCount: number
  seatConfiguration: SeatConfiguration
}

export interface BusGroupDto {
  id: string
  cooperativeId: string
  cooperativeName: string
  templateId: string
  template: BusTemplateDto
  name: string
  description?: string
  active: boolean
  busCount?: number
  createdAt: string
  updatedAt?: string
}

export interface CreateBusGroupRequest {
  cooperativeId: string
  templateId: string
  name: string
  description?: string
}

export interface SeatLayoutItem {
  number?: number;
  type: SeatOrSpecialType;
  row: number;
  column: number;
  floor?: number;
  additionalPrice?: number;
  code?: string;
  seatType?: SeatType;
}

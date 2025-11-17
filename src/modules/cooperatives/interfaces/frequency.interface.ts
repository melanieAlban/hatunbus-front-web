export interface FrequencySegmentDto {
  id?: string
  frequencyId?: string
  routeId: string
  departureTime: string // HH:mm format
  estimatedDuration: number // in minutes
  segmentOrder: number
  routeName?: string
  routeOrigin?: string
  routeDestination?: string
  createdAt?: string
  updatedAt?: string
}

export interface FrequencyWithSegmentsDto {
  id: string
  cooperativeId: string
  cooperativeName?: string
  name: string
  operatingDays: string[] // ["MONDAY", "TUESDAY", etc.]
  active: boolean
  regulatoryResolution?: string
  segments: FrequencySegmentDto[]
  selected?: boolean // Flag indicating if selected by cooperative
  createdAt?: string
  updatedAt?: string
}

export interface UpdateFrequencySelectionRequest {
  frequencyIds: string[]
}

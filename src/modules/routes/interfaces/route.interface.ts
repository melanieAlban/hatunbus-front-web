export interface RouteDto {
  id: string
  cooperativeId: string
  name: string
  origin: string
  destination: string
  originCity: string
  destinationCity: string
  originCityId?: string
  destinationCityId?: string
  distanceKm: number
  estimatedTime: number
  description?: string
  basePrice: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateRoutePayload {
  cooperativeId: string
  name: string
  originCity: string
  destinationCity: string
  distanceKm: number
  estimatedTime: number
  description?: string
  basePrice: number
}

export interface UpdateRoutePayload extends CreateRoutePayload {
  active: boolean
}

export interface FrequencySegmentDto {
  id: string
  frequencyId?: string
  routeId: string
  departureTime: string
  estimatedDuration: number
  segmentOrder: number
  routeName?: string
  routeOrigin?: string
  routeDestination?: string
  createdAt?: string
  updatedAt?: string
}

export interface FrequencyDto {
  id: string
  cooperativeId: string
  cooperativeName?: string
  regulatoryResolution?: string
  active: boolean
  origin?: string
  destination?: string
  createdAt?: string
  updatedAt?: string
  segments: FrequencySegmentDto[]
  operatingDays?: string[]
}

export interface FrequencySegmentPayload {
  routeId: string
  departureTime: string
  estimatedDuration: number
  segmentOrder: number
}

export interface CreateFrequencyPayload {
  cooperativeId: string
  regulatoryResolution: string
  segments: FrequencySegmentPayload[]
  operatingDays?: string[]
}

export interface UpdateFrequencyPayload {
  regulatoryResolution: string
  segments: FrequencySegmentPayload[]
  operatingDays?: string[]
}

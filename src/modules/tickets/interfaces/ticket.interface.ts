export enum TicketStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum PassengerType {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
  SENIOR = 'SENIOR',
  DISABLED = 'DISABLED'
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum PurchaseType {
  ONLINE = 'ONLINE',
  IN_PERSON = 'IN_PERSON'
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  PAYPAL = 'PAYPAL'
}

export interface TicketDto {
  id: string
  purchaseId: string
  tripId: string
  tripSeatId?: string
  
  // Trip data
  routeName?: string
  routeOrigin?: string
  routeDestination?: string
  scheduledDepartureTime?: string
  cooperativeName?: string
  cooperativeLogo?: string
  busPlate?: string
  busUnitNumber?: number
  
  // Seat data
  seatNumber: string
  
  // Passenger data
  passengerName: string
  passengerIdCard: string
  passengerEmail?: string
  passengerPhone?: string
  passengerType: PassengerType
  
  // Prices
  basePrice: number
  discount: number
  finalPrice: number
  
  // Stops
  originStopName?: string
  destinationStopName?: string
  
  // Status and QR
  status: TicketStatus
  qrCode?: string
  useDate?: string
  usageDate?: string
  validatingDriver?: string
  tripStatus?: string
  
  createdAt?: string
  updatedAt?: string
}

export interface RequestTicketDto {
  tripId: string
  seatNumber: string
  passengerName: string
  passengerIdCard: string
  passengerEmail?: string
  passengerPhone?: string
  passengerType: PassengerType
  originStopId?: string
  destinationStopId?: string
}

export interface PurchaseDto {
  id: string
  buyerUserId: string
  purchaseType: PurchaseType
  clerkId?: string
  totalAmount: number
  totalDiscount: number
  status: PurchaseStatus
  tickets: TicketDto[]
  payment?: PaymentDto
  purchaseDate: string
  createdAt?: string
  updatedAt?: string
  expirationDate?: string
  buyerName?: string
  clerkName?: string
}

export interface CreatePurchaseRequest {
  buyerUserId: string
  purchaseType: PurchaseType
  paymentMethod: PaymentMethod
  clerkId?: string
  tickets: RequestTicketDto[]
}

export interface PaymentDto {
  id: string
  purchaseId: string
  paymentMethod: PaymentMethod
  amount: number
  paymentDate: string
  transactionReference?: string
}

export interface StopDto {
  id: string
  routeId: string
  name: string
  city: string
  province?: string
  address?: string
  order: number
  distanceFromOrigin: number
  estimatedMinutes: number
  isMainStop: boolean
}

export interface RouteDto {
  id: string
  name: string
  origin: string
  destination: string
  distance: number
  estimatedDuration: number
  basePrice: number
  cooperativeId?: string
  isActive?: boolean
}

export interface TripSummary {
  id: string
  frequencySegmentId: string
  busId: string
  mainDriverId?: string
  date: string
  scheduledDepartureTime: string
  scheduledArrivalTime?: string
  status: string
  routeName?: string
  routeOrigin?: string
  routeDestination?: string
  busPlate?: string
  busUnitNumber?: number
  busSeatsCount?: number
  occupiedSeats?: number
  availableSeats?: number
  cooperativeName?: string
  cooperativeId?: string // ID de la cooperativa (viene del Frequency → Cooperative)
  routeId?: string // ID de la ruta (viene del FrequencySegment → Route)
  driverId?: string // Alias de mainDriverId
  driverName?: string // Nombre completo del conductor
  mainDriverName?: string // Alias de driverName
  frequencySegment?: {
    id: string
    routeId: string
    [key: string]: any
  }
}

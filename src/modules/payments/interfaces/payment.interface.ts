export interface PendingPayment {
  id: string
  userId: string
  userName: string
  userEmail: string
  cooperativeId: string
  cooperativeName: string
  totalAmount: number
  paymentMethod: 'TRANSFER' | 'PAYPAL' | 'CASH'
  paymentStatus: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELED'
  tripInfo: {
    origin: string
    destination: string
    date: string
    time: string
  }
  seats: string[]
  ticketsCount: number
  createdAt: string
  updatedAt: string
  receiptUrl?: string
  rejectionReason?: string
  approvalDate?: string
  rejectionDate?: string
}

export interface ApprovePaymentRequest {
  purchaseId: string
  approvedBy?: string
  notes?: string
}

export interface RejectPaymentRequest {
  purchaseId: string
  rejectedBy?: string
  reason: string
}

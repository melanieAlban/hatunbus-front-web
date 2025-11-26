import apiClient from '../../../services/apiClient'
import type { PendingPayment, ApprovePaymentRequest, RejectPaymentRequest } from '../interfaces/payment.interface'

const BASE = '/compras'

export async function getPendingPayments(): Promise<PendingPayment[]> {
  const res = await apiClient.get(`${BASE}/pagos-pendientes`)
  return res.data as PendingPayment[]
}

export async function getApprovedPayments(): Promise<PendingPayment[]> {
  const res = await apiClient.get(`${BASE}/pagos-aprobados`)
  return res.data as PendingPayment[]
}

export async function getRejectedPayments(): Promise<PendingPayment[]> {
  const res = await apiClient.get(`${BASE}/pagos-rechazados`)
  return res.data as PendingPayment[]
}

export async function approvePayment(request: ApprovePaymentRequest): Promise<any> {
  const res = await apiClient.post(`${BASE}/${request.purchaseId}/aprobar`, request)
  return res.data
}

export async function rejectPayment(request: RejectPaymentRequest): Promise<any> {
  const res = await apiClient.post(`${BASE}/${request.purchaseId}/rechazar`, { reason: request.reason })
  return res.data
}

export default {
  getPendingPayments,
  getApprovedPayments,
  getRejectedPayments,
  approvePayment,
  rejectPayment
}

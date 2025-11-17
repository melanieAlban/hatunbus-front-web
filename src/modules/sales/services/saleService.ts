import apiClient from '../../../services/apiClient'
import type { PurchaseDto } from '../interfaces/sale.interface'

const BASE = '/compras'

export async function getAllPurchases(): Promise<PurchaseDto[]> {
  const res = await apiClient.get(`${BASE}`)
  return res.data as PurchaseDto[]
}

export async function getPurchasesByUser(userId: string): Promise<PurchaseDto[]> {
  const res = await apiClient.get(`${BASE}/usuario/${userId}`)
  return res.data as PurchaseDto[]
}

export async function getPurchasesByCooperative(cooperativeId: string): Promise<PurchaseDto[]> {
  const res = await apiClient.get(`${BASE}/cooperativa/${cooperativeId}`)
  return res.data as PurchaseDto[]
}

export async function getPurchaseById(id: string): Promise<PurchaseDto> {
  const res = await apiClient.get(`${BASE}/${id}`)
  return res.data as PurchaseDto
}

export async function cancelPurchase(id: string): Promise<PurchaseDto> {
  const res = await apiClient.post(`${BASE}/${id}/cancelar`)
  return res.data as PurchaseDto
}

export default {
  getAllPurchases,
  getPurchasesByUser,
  getPurchasesByCooperative,
  getPurchaseById,
  cancelPurchase
}

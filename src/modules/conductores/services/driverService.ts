import apiClient from '../../../services/apiClient'
import type { DriverDto, CreateDriverPayload, UpdateDriverPayload } from '../interfaces/driver.interface'

const BASE = '/conductores'

export async function listByCooperative(cooperativeId: string): Promise<DriverDto[]> {
  console.log('[driverService] listByCooperative called with cooperativeId:', cooperativeId)
  const res = await apiClient.get(`${BASE}/cooperativa/${cooperativeId}`)
  console.log('[driverService] listByCooperative response (first item):', res.data?.[0])
  return res.data as DriverDto[]
}

export async function listActiveByCooperative(cooperativeId: string): Promise<DriverDto[]> {
  const res = await apiClient.get(`${BASE}/cooperativa/${cooperativeId}/activos`)
  return res.data as DriverDto[]
}

export async function getDriverById(id: string): Promise<DriverDto> {
  console.log('[driverService] getDriverById called with id:', id)
  const res = await apiClient.get(`${BASE}/${id}`)
  console.log('[driverService] getDriverById response:', res.data)
  return res.data as DriverDto
}

export async function getDriverByUserId(userId: string): Promise<DriverDto> {
  console.log('[driverService] getDriverByUserId called with userId:', userId)
  const res = await apiClient.get(`${BASE}/usuario/${userId}`)
  console.log('[driverService] getDriverByUserId response:', res.data)
  return res.data as DriverDto
}

export async function createDriver(payload: CreateDriverPayload): Promise<DriverDto> {
  const res = await apiClient.post(`${BASE}`, payload)
  return res.data as DriverDto
}

export async function updateDriver(id: string, payload: UpdateDriverPayload): Promise<DriverDto> {
  const res = await apiClient.put(`${BASE}/${id}`, payload)
  return res.data as DriverDto
}

export async function deleteDriver(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}

export async function deactivateDriver(id: string): Promise<void> {
  await apiClient.patch(`${BASE}/${id}/desactivar`)
}

export default { listByCooperative, listActiveByCooperative, getDriverById, createDriver, updateDriver, deleteDriver, deactivateDriver }

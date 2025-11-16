import apiClient from '../../../services/apiClient'
import type { UserCoopDto, CreateUserPayload, UpdateUserPayload } from '../interfaces/user.interface'

const BASE = '/usuarios'

export async function listUsers(): Promise<UserCoopDto[]> {
  const res = await apiClient.get(`${BASE}`)
  return res.data as UserCoopDto[]
}

export async function listByCooperative(cooperativeId: string): Promise<UserCoopDto[]> {
  const res = await apiClient.get(`${BASE}/cooperativa/${cooperativeId}`)
  return res.data as UserCoopDto[]
}

export async function listClerksByCooperative(cooperativeId: string): Promise<UserCoopDto[]> {
  const res = await apiClient.get(`${BASE}/cooperativa/${cooperativeId}/oficinistas`)
  return res.data as UserCoopDto[]
}

export async function getUserById(id: string): Promise<UserCoopDto> {
  const res = await apiClient.get(`${BASE}/${id}`)
  return res.data as UserCoopDto
}

export async function createUser(payload: CreateUserPayload): Promise<UserCoopDto> {
  const res = await apiClient.post(`${BASE}`, payload)
  return res.data as UserCoopDto
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserCoopDto> {
  const res = await apiClient.put(`${BASE}/${id}`, payload)
  return res.data as UserCoopDto
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}

export async function deactivateUser(id: string): Promise<void> {
  await apiClient.patch(`${BASE}/${id}/desactivar`)
}

export async function activateUser(id: string): Promise<void> {
  await apiClient.patch(`${BASE}/${id}/activar`)
}

export default { listUsers, listByCooperative, listClerksByCooperative, getUserById, createUser, updateUser, deleteUser, deactivateUser, activateUser }

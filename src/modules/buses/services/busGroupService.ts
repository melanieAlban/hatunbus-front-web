import type { BusGroupDto, CreateBusGroupRequest } from '../interfaces/template.interface'
import { apiClient } from '@/services/apiClient'

export async function listGroups(): Promise<BusGroupDto[]> {
  const response = await apiClient.get<BusGroupDto[]>('/bus-groups')
  return response.data
}

export async function listGroupsByCooperative(cooperativeId: string): Promise<BusGroupDto[]> {
  const response = await apiClient.get<BusGroupDto[]>(`/bus-groups/cooperative/${cooperativeId}`)
  return response.data
}

export async function getGroupById(id: string): Promise<BusGroupDto> {
  const response = await apiClient.get<BusGroupDto>(`/bus-groups/${id}`)
  return response.data
}

export async function createGroup(request: CreateBusGroupRequest): Promise<BusGroupDto> {
  const response = await apiClient.post<BusGroupDto>('/bus-groups', request)
  return response.data
}

export async function updateGroup(id: string, request: Partial<CreateBusGroupRequest>): Promise<BusGroupDto> {
  const response = await apiClient.put<BusGroupDto>(`/bus-groups/${id}`, request)
  return response.data
}

export async function deactivateGroup(id: string): Promise<void> {
  await apiClient.patch(`/bus-groups/${id}/deactivate`)
}

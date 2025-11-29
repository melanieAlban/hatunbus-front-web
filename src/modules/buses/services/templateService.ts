import type { BusTemplateDto, CreateBusTemplateRequest } from '../interfaces/template.interface'
import { apiClient } from '@/services/apiClient'

export async function listTemplates(): Promise<BusTemplateDto[]> {
  const response = await apiClient.get<BusTemplateDto[]>('/bus-templates')
  return response.data
}

export async function listSystemTemplates(): Promise<BusTemplateDto[]> {
  const response = await apiClient.get<BusTemplateDto[]>('/bus-templates/system')
  return response.data
}

export async function listAvailableForCooperative(cooperativeId: string): Promise<BusTemplateDto[]> {
  const response = await apiClient.get<BusTemplateDto[]>(`/bus-templates/available/${cooperativeId}`)
  return response.data
}

export async function createTemplate(request: CreateBusTemplateRequest): Promise<BusTemplateDto> {
  const response = await apiClient.post<BusTemplateDto>('/bus-templates', request)
  return response.data
}

export async function deactivateTemplate(id: string): Promise<void> {
  await apiClient.patch(`/bus-templates/${id}/deactivate`)
}

export async function getById(id: string): Promise<BusTemplateDto> {
  const response = await apiClient.get<BusTemplateDto>(`/bus-templates/${id}`)
  return response.data
}

import apiClient from '../../../services/apiClient'
import type {
  CooperativeDto,
  CreateCooperativePayload,
  UpdateCooperativePayload,
} from '../interfaces/cooperative.interface'

const BASE = '/cooperativas'

export async function listCooperatives(): Promise<CooperativeDto[]> {
  const res = await apiClient.get(`${BASE}`)
  return res.data as CooperativeDto[]
}

export async function listActiveCooperatives(): Promise<CooperativeDto[]> {
  const res = await apiClient.get(`${BASE}/activas`)
  return res.data as CooperativeDto[]
}

export async function getCooperativeById(id: string): Promise<CooperativeDto> {
  const res = await apiClient.get(`${BASE}/${id}`)
  return res.data as CooperativeDto
}

export async function createCooperative(payload: CreateCooperativePayload): Promise<CooperativeDto> {
  const res = await apiClient.post(`${BASE}`, payload)
  return res.data as CooperativeDto
}

export async function createCooperativeMultipart(payload: CreateCooperativePayload, file?: File): Promise<CooperativeDto> {
  const form = new FormData()
  
  // Excluir logo del JSON cuando hay archivo
  const { logo, ...dtoWithoutLogo } = payload
  const blob = new Blob([JSON.stringify(dtoWithoutLogo)], { type: 'application/json' })
  form.append('data', blob, 'data.json')
  
  // Debug: log the JSON part we're sending
  try { console.log('[cooperativeService] create multipart payload:', dtoWithoutLogo, 'file:', !!file) } catch(e){}

  if (file) {
    form.append('logo', file) // Solo el archivo binario
  }
  
  // Let axios/browser set the Content-Type (boundary) automatically
  const res = await apiClient.post(`${BASE}`, form)
  return res.data as CooperativeDto
}
export async function updateCooperativeMultipart(id: string, payload: UpdateCooperativePayload, file?: File): Promise<CooperativeDto> {
  const form = new FormData()
  const { logo, ...dtoWithoutLogo } = payload
  const blob = new Blob([JSON.stringify(dtoWithoutLogo)], { type: 'application/json' })
  form.append('data', blob, 'data.json')
  
  // Debug: log the JSON part we're sending
  try { console.log('[cooperativeService] update multipart payload:', dtoWithoutLogo, 'file:', !!file) } catch(e){}

  if (file) {
    form.append('logo', file)
  }
  
  // Let axios/browser set the Content-Type (boundary) automatically
  const res = await apiClient.put(`${BASE}/${id}`, form)
  return res.data as CooperativeDto
}

export async function updateCooperative(id: string, payload: UpdateCooperativePayload): Promise<CooperativeDto> {
  const res = await apiClient.put(`${BASE}/${id}`, payload)
  return res.data as CooperativeDto
}

export async function deleteCooperative(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}

export async function deactivateCooperative(id: string): Promise<void> {
  await apiClient.patch(`${BASE}/${id}/desactivar`)
}

export default {
  listCooperatives,
  listActiveCooperatives,
  getCooperativeById,
  createCooperative,
  createCooperativeMultipart,   // ⬅️ AGREGA ESTO
  updateCooperative,
  updateCooperativeMultipart,   // ⬅️ Y ESTO
  deleteCooperative,
  deactivateCooperative,
}


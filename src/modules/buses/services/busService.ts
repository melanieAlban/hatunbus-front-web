import apiClient from '../../../services/apiClient'
import type { BusDto, CreateBusRequest, UpdateBusPayload, SeatDto, BusStatus, MaintenanceRecordDto } from '../interfaces/bus.interface'

const BASE = '/buses'

export async function listByCooperative(cooperativeId: string): Promise<BusDto[]> {
  const res = await apiClient.get(`${BASE}/cooperative/${cooperativeId}`)
  return res.data as BusDto[]
}

export async function listByCooperativeAndStatus(
  cooperativeId: string,
  status: BusStatus
): Promise<BusDto[]> {
  const res = await apiClient.get(`${BASE}/cooperative/${cooperativeId}/status/${status}`)
  return res.data as BusDto[]
}

export async function getBusById(id: string): Promise<BusDto> {
  const res = await apiClient.get(`${BASE}/${id}`)
  return res.data as BusDto
}

export async function getBusSeats(id: string): Promise<SeatDto[]> {
  const res = await apiClient.get(`${BASE}/${id}/seats`)
  return res.data as SeatDto[]
}

export async function getMaintenanceRecords(busId: string): Promise<MaintenanceRecordDto[]> {
  const res = await apiClient.get(`${BASE}/${busId}/maintenance-records`)
  return res.data as MaintenanceRecordDto[]
}

export async function createBus(payload: CreateBusRequest, file?: File): Promise<BusDto> {
  const form = new FormData()
  
  // Excluir photo del JSON cuando hay archivo
  const { photo, ...dtoWithoutPhoto } = payload
  const blob = new Blob([JSON.stringify(dtoWithoutPhoto)], { type: 'application/json' })
  form.append('data', blob, 'data.json')
  
  if (file) {
    form.append('photo', file) // Solo el archivo binario
  }
  
  // Let axios/browser set the Content-Type (boundary) automatically
  const res = await apiClient.post(`${BASE}`, form)
  return res.data as BusDto
}

export async function updateBus(id: string, payload: UpdateBusPayload, file?: File): Promise<BusDto> {
  const form = new FormData()
  
  const { photo, ...dtoWithoutPhoto } = payload
  const blob = new Blob([JSON.stringify(dtoWithoutPhoto)], { type: 'application/json' })
  form.append('data', blob, 'data.json')
  
  if (file) {
    form.append('photo', file)
  }
  
  // Let axios/browser set the Content-Type (boundary) automatically
  const res = await apiClient.put(`${BASE}/${id}`, form)
  return res.data as BusDto
}

export async function changeStatus(id: string, status: BusStatus): Promise<void> {
  await apiClient.patch(`${BASE}/${id}/status`, null, {
    params: { status }
  })
}

export async function deleteBus(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}

export default {
  listByCooperative,
  listByCooperativeAndStatus,
  getBusById,
  getBusSeats,
  getMaintenanceRecords,
  createBus,
  updateBus,
  changeStatus,
  deleteBus
}

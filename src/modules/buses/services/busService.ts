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

export async function listByGroup(groupId: string): Promise<BusDto[]> {
  const res = await apiClient.get(`${BASE}/group/${groupId}`)
  return res.data as BusDto[]
}

export async function getBusSeats(id: string): Promise<SeatDto[]> {
  const res = await apiClient.get(`${BASE}/${id}/seats`)
  return res.data as SeatDto[]
}

export async function getMaintenanceRecords(busId: string): Promise<MaintenanceRecordDto[]> {
  const res = await apiClient.get(`${BASE}/${busId}/maintenance-records`)
  return res.data as MaintenanceRecordDto[]
}

export async function createMaintenanceRecord(busId: string, record: Partial<MaintenanceRecordDto>): Promise<MaintenanceRecordDto> {
  const res = await apiClient.post(`${BASE}/${busId}/maintenance-records`, record)
  return res.data as MaintenanceRecordDto
}

export async function createBus(payload: CreateBusRequest, file?: File): Promise<BusDto> {
  const form = new FormData()
  
  // Excluir photo del JSON cuando hay archivo
  const { photo, ...dtoWithoutPhoto } = payload
  // Deep-clone to avoid Vue reactive proxies when stringify
  const plain = JSON.parse(JSON.stringify(dtoWithoutPhoto))
  const blob = new Blob([JSON.stringify(plain)], { type: 'application/json' })
  form.append('data', blob, 'data.json')
  
  if (file) {
    form.append('photo', file) // Solo el archivo binario
  }
  
  // Let axios/browser set the Content-Type (boundary) automatically
  const res = await apiClient.post(`${BASE}`, form)
  return res.data as BusDto
}

export async function createFromGroup(groupId: string, payload: Partial<CreateBusRequest>, file?: File): Promise<BusDto> {
  const form = new FormData()

  // Build minimal payload expected by backend CreateBusFromGroupRequest
  const dto: any = {
    plate: payload.plate,
    chassisBrand: payload.chassisBrand,
    chassisNumber: payload.chassisNumber || null,
    bodyBrand: payload.bodyBrand,
    bodyNumber: payload.bodyNumber || null,
    unitNumber: payload.unitNumber || null
  }

  // Include driverId and cooperativeId explicitly (backend may accept null)
  dto.driverId = (payload as any).driverId ?? null
  dto.cooperativeId = (payload as any).cooperativeId ?? null

  // Debug: log payload sent to backend to ease troubleshooting
  try {
    // eslint-disable-next-line no-console
    console.debug('[busService] createFromGroup dto:', JSON.parse(JSON.stringify(dto)))
  } catch (e) {
    /* ignore logging errors */
  }

  const plain = JSON.parse(JSON.stringify(dto))
  const jsonString = JSON.stringify(plain)
  // Append as raw string to avoid being interpreted as a file part
  form.append('data', jsonString)

  // eslint-disable-next-line no-console
  console.debug('[busService] createFromGroup jsonString:', jsonString)

  if (file) form.append('photo', file)

  try {
    const res = await apiClient.post(`${BASE}/group/${groupId}`, form)
    return res.data as BusDto
  } catch (err: any) {
    // Attach server response (if any) to the error log for easier debugging in UI
    // eslint-disable-next-line no-console
    console.error('[busService] createFromGroup error:', err?.response?.data || err)
    throw err
  }
}

export async function updateBus(id: string, payload: UpdateBusPayload, file?: File): Promise<BusDto> {
  const form = new FormData()
  
  const { photo, ...dtoWithoutPhoto } = payload
  // Deep-clone to avoid Vue reactive proxies when stringify
  const plain = JSON.parse(JSON.stringify(dtoWithoutPhoto))
  const blob = new Blob([JSON.stringify(plain)], { type: 'application/json' })
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

export async function assignToGroup(busId: string, groupId: string): Promise<BusDto> {
  const res = await apiClient.patch(`${BASE}/${busId}/group`, { groupId })
  return res.data as BusDto
}

export default {
  listByCooperative,
  listByCooperativeAndStatus,
  getBusById,
  getBusSeats,
  getMaintenanceRecords,
  createMaintenanceRecord,
  createBus,
  createFromGroup,
  listByGroup,
  assignToGroup,
  updateBus,
  changeStatus,
  deleteBus
}

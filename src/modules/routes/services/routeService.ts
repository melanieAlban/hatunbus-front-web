import apiClient from '../../../services/apiClient'
import type {
  RouteDto,
  FrequencyDto,
  CreateRoutePayload,
  UpdateRoutePayload,
  CreateFrequencyPayload,
  UpdateFrequencyPayload,
} from '../interfaces/route.interface'

const ROUTE_BASE = '/rutas'
const FREQUENCY_BASE = '/frecuencias'

export async function listRoutesByCooperative(cooperativeId: string): Promise<RouteDto[]> {
  const res = await apiClient.get(`${ROUTE_BASE}/cooperativa/${cooperativeId}`)
  return res.data as RouteDto[]
}

export async function listActiveRoutesByCooperative(cooperativeId: string): Promise<RouteDto[]> {
  const res = await apiClient.get(`${ROUTE_BASE}/cooperativa/${cooperativeId}/activas`)
  return res.data as RouteDto[]
}

export async function listAllFrequenciesByCooperative(cooperativeId: string): Promise<FrequencyDto[]> {
  const res = await apiClient.get(`${FREQUENCY_BASE}/cooperativa/${cooperativeId}`)
  return res.data as FrequencyDto[]
}

export async function getFrequenciesByRoute(routeId: string): Promise<FrequencyDto[]> {
  const res = await apiClient.get(`${FREQUENCY_BASE}/ruta/${routeId}`)
  return res.data as FrequencyDto[]
}

export async function createRoute(payload: CreateRoutePayload): Promise<RouteDto> {
  const res = await apiClient.post(`${ROUTE_BASE}`, payload)
  return res.data as RouteDto
}

export async function updateRoute(id: string, payload: UpdateRoutePayload): Promise<RouteDto> {
  const res = await apiClient.put(`${ROUTE_BASE}/${id}`, payload)
  return res.data as RouteDto
}

export async function deleteRoute(id: string): Promise<void> {
  await apiClient.delete(`${ROUTE_BASE}/${id}`)
}

export async function deactivateRoute(id: string): Promise<void> {
  await apiClient.patch(`${ROUTE_BASE}/${id}/desactivar`)
}

export async function activateRoute(id: string): Promise<void> {
  await apiClient.patch(`${ROUTE_BASE}/${id}/activar`)
}

export async function createFrequency(payload: CreateFrequencyPayload): Promise<FrequencyDto> {
  const res = await apiClient.post(`${FREQUENCY_BASE}`, payload)
  return res.data as FrequencyDto
}

export async function updateFrequency(id: string, payload: UpdateFrequencyPayload): Promise<FrequencyDto> {
  const res = await apiClient.put(`${FREQUENCY_BASE}/${id}`, payload)
  return res.data as FrequencyDto
}

export async function deleteFrequency(id: string): Promise<void> {
  await apiClient.delete(`${FREQUENCY_BASE}/${id}`)
}

export async function deactivateFrequency(id: string): Promise<void> {
  await apiClient.patch(`${FREQUENCY_BASE}/${id}/desactivar`)
}

export async function activateFrequency(id: string): Promise<void> {
  await apiClient.patch(`${FREQUENCY_BASE}/${id}/activar`)
}

export default {
  listRoutesByCooperative,
  listActiveRoutesByCooperative,
  listAllFrequenciesByCooperative,
  getFrequenciesByRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  deactivateRoute,
  createFrequency,
  updateFrequency,
  deleteFrequency,
  deactivateFrequency,
}

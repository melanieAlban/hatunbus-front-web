import apiClient from './apiClient'
import type { RouteSheetDto } from '../types'

export interface BusGroupRouteSheetCheckRequest {
  startDate: string // Format: YYYY-MM-DD
  busGroupId: string
  frequencies: Array<{
    frequencyId: string
    operatingDays?: string[] // MONDAY, TUESDAY, etc.
  }>
}

export interface BusGroupRouteSheetCheckResponse {
  status: 'OK' | 'ERROR'
  warnings: string[]
  disconnectedRoutes: Array<{
    frequencyId: string
    nextFrequencyId: string
    reason: string
  }>
  operatingDayConflicts: Array<{
    frequencyId: string
    frequencyResolution: string
    requestedDate: string
    requestedDayOfWeek: string
    actualOperatingDays: string[]
    message: string
  }>
  assignments: Array<{
    busId: string
    frequencyId?: string
    restDay: boolean
  }>
}

export interface BusGroupRouteSheetGenerateRequest {
  startDate: string // Format: YYYY-MM-DD
  busGroupId: string
  frequencies: Array<{
    frequencyId: string
    operatingDays?: string[]
  }>
  endDate?: string // Opcional: si no se especifica, backend usa lógica por defecto
}

/**
 * Generate automatic route sheet for a cooperative
 * @param cooperativeId The cooperative ID
 * @returns The created route sheet
 */
export async function generateAutomaticRouteSheet(
  cooperativeId: string
): Promise<RouteSheetDto> {
  const res = await apiClient.post(`/hojas-ruta/automatica?cooperativeId=${cooperativeId}`)
  return res.data as RouteSheetDto
}

/**
 * Verify/check bus group rotation before generating route sheet
 * Pre-validates interconnection, availability and capacity
 */
export async function checkGroupRotation(
  request: BusGroupRouteSheetCheckRequest
): Promise<BusGroupRouteSheetCheckResponse> {
  const res = await apiClient.post('/hojas-ruta/grupo/check', request)
  return res.data as BusGroupRouteSheetCheckResponse
}

/**
 * Generate route sheet for a specific bus group
 */
export async function generateForBusGroup(
  request: BusGroupRouteSheetGenerateRequest
): Promise<RouteSheetDto> {
  const res = await apiClient.post('/hojas-ruta/grupo/generar', request)
  return res.data as RouteSheetDto
}

export default {
  generateAutomaticRouteSheet,
  checkGroupRotation,
  generateForBusGroup,
}

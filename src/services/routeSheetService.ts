import apiClient from './apiClient'
import type { RouteSheetDto } from '../types'

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

export default {
  generateAutomaticRouteSheet,
}

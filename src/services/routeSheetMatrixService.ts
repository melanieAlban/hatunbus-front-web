import apiClient from './apiClient'
import type { RouteSheetMatrixDto } from '../types'

/**
 * Get route sheet matrix for visualization
 * @param cooperativeId The cooperative ID
 * @param startDate Optional start date
 * @param endDate Optional end date
 * @returns Route sheet matrix data
 */
export async function getRouteSheetMatrix(
  cooperativeId: string,
  startDate?: string,
  endDate?: string
): Promise<RouteSheetMatrixDto> {
  const params = new URLSearchParams({ cooperativeId })
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  
  const res = await apiClient.get(`/viajes/matriz?${params.toString()}`)
  return res.data as RouteSheetMatrixDto
}

export default {
  getRouteSheetMatrix,
}

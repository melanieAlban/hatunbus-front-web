import apiClient from './apiClient'
import type { TripDto } from '../types'

/**
 * Generate trips from route sheet for a cooperative
 * @param cooperativeId The cooperative ID
 * @returns List of generated trips
 */
export async function generateTripsFromRouteSheet(
  cooperativeId: string
): Promise<TripDto[]> {
  const res = await apiClient.post(`/viajes/generar?cooperativeId=${cooperativeId}`)
  return res.data as TripDto[]
}

export default {
  generateTripsFromRouteSheet,
}

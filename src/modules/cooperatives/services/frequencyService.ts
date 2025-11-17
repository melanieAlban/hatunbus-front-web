import apiClient from '../../../services/apiClient'
import type {
  FrequencyWithSegmentsDto,
  UpdateFrequencySelectionRequest,
} from '../interfaces/frequency.interface'

/**
 * Get all available frequencies with selection status for a cooperative
 * @param cooperativeId The cooperative ID
 * @returns List of all frequencies with 'selected' flag
 */
export async function getAvailableFrequencies(
  cooperativeId: string
): Promise<FrequencyWithSegmentsDto[]> {
  const res = await apiClient.get(`/cooperativas/${cooperativeId}/frecuencias/disponibles`)
  return res.data as FrequencyWithSegmentsDto[]
}

/**
 * Get only the selected/active frequencies for a cooperative
 * @param cooperativeId The cooperative ID
 * @returns List of selected frequencies
 */
export async function getSelectedFrequencies(
  cooperativeId: string
): Promise<FrequencyWithSegmentsDto[]> {
  const res = await apiClient.get(`/cooperativas/${cooperativeId}/frecuencias`)
  return res.data as FrequencyWithSegmentsDto[]
}

/**
 * Update the frequency selection for a cooperative
 * @param cooperativeId The cooperative ID
 * @param frequencyIds Array of frequency IDs to activate
 */
export async function updateFrequencySelection(
  cooperativeId: string,
  frequencyIds: string[]
): Promise<void> {
  const payload: UpdateFrequencySelectionRequest = { frequencyIds }
  await apiClient.put(`/cooperativas/${cooperativeId}/frecuencias`, payload)
}

export default {
  getAvailableFrequencies,
  getSelectedFrequencies,
  updateFrequencySelection,
}

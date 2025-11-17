import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as service from '../services/frequencyService'
import type { FrequencyWithSegmentsDto } from '../interfaces/frequency.interface'

export const useFrequencyStore = defineStore('frequencies', () => {
  const availableFrequencies = ref<FrequencyWithSegmentsDto[]>([])
  const selectedFrequencies = ref<FrequencyWithSegmentsDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all available frequencies with selection status for a cooperative
   */
  async function fetchAvailable(cooperativeId: string) {
    loading.value = true
    error.value = null
    try {
      availableFrequencies.value = await service.getAvailableFrequencies(cooperativeId)
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando frecuencias disponibles'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch only selected frequencies for a cooperative
   */
  async function fetchSelected(cooperativeId: string) {
    loading.value = true
    error.value = null
    try {
      selectedFrequencies.value = await service.getSelectedFrequencies(cooperativeId)
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando frecuencias seleccionadas'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Update frequency selection for a cooperative
   */
  async function updateSelection(cooperativeId: string, frequencyIds: string[]) {
    loading.value = true
    error.value = null
    try {
      await service.updateFrequencySelection(cooperativeId, frequencyIds)
      // Refresh available frequencies to update selection status
      await fetchAvailable(cooperativeId)
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error actualizando selección de frecuencias'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    availableFrequencies,
    selectedFrequencies,
    loading,
    error,
    fetchAvailable,
    fetchSelected,
    updateSelection,
  }
})

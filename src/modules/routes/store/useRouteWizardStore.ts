import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  ChainedFrequency,
  DiscardedFrequency,
  PreviewMatrixResponse,
} from '../interfaces/routeWizard.interface'
import { getPreviewMatrix, verifyAndChainFrequencies } from '../services/routeWizardService'

export const useRouteWizardStore = defineStore('routeWizard', () => {
  const orderedChain = ref<ChainedFrequency[]>([])
  const discardedFrequencies = ref<DiscardedFrequency[]>([])
  const isChainValid = ref<boolean | null>(null)
  const chainLoading = ref(false)
  const chainError = ref<string | null>(null)

  const matrixPreview = ref<PreviewMatrixResponse | null>(null)
  const matrixLoading = ref(false)
  const matrixError = ref<string | null>(null)

  const orderedFrequencyIds = computed(() => orderedChain.value.map(item => item.id))
  const readyForPreview = computed(
    () => !!orderedChain.value.length && isChainValid.value !== false
  )

  async function verifyChain(frequencyIds: Array<string | number>) {
    chainLoading.value = true
    chainError.value = null
    isChainValid.value = null
    try {
      const response = await verifyAndChainFrequencies({ frequencyIds })
      orderedChain.value = response.orderedChain
      discardedFrequencies.value = response.discardedFrequencies
      isChainValid.value = response.isValid
      return response
    } catch (err: any) {
      chainError.value = err?.response?.data?.message || err?.message || 'No se pudo validar el encadenado'
      orderedChain.value = []
      discardedFrequencies.value = []
      isChainValid.value = false
      throw err
    } finally {
      chainLoading.value = false
    }
  }

  async function fetchPreviewMatrix(busGroupId: string | number, startDate: string) {
    if (!orderedFrequencyIds.value.length) {
      throw new Error('Valida y confirma una cadena de frecuencias antes de previsualizar la matriz')
    }

    matrixLoading.value = true
    matrixError.value = null
    try {
      const response = await getPreviewMatrix({
        busGroupId,
        orderedFrequencyIds: orderedFrequencyIds.value,
        startDate,
      })
      matrixPreview.value = response
      return response
    } catch (err: any) {
      matrixError.value = err?.response?.data?.message || err?.message || 'No se pudo generar la previsualización'
      matrixPreview.value = null
      throw err
    } finally {
      matrixLoading.value = false
    }
  }

  function resetChain() {
    orderedChain.value = []
    discardedFrequencies.value = []
    isChainValid.value = null
    chainError.value = null
  }

  function resetMatrix() {
    matrixPreview.value = null
    matrixError.value = null
  }

  function resetAll() {
    resetChain()
    resetMatrix()
  }

  return {
    orderedChain,
    discardedFrequencies,
    isChainValid,
    chainLoading,
    chainError,
    matrixPreview,
    matrixLoading,
    matrixError,
    orderedFrequencyIds,
    readyForPreview,
    verifyChain,
    fetchPreviewMatrix,
    resetChain,
    resetMatrix,
    resetAll,
  }
})

import apiClient from '../../../services/apiClient'
import type {
  VerifyChainRequest,
  VerifyChainResponse,
  PreviewMatrixRequest,
  PreviewMatrixResponse,
} from '../interfaces/routeWizard.interface'

export async function verifyAndChainFrequencies(
  request: VerifyChainRequest
): Promise<VerifyChainResponse> {
  const res = await apiClient.post('/routes/verify-chain', request)
  return res.data as VerifyChainResponse
}

export async function getPreviewMatrix(
  request: PreviewMatrixRequest
): Promise<PreviewMatrixResponse> {
  const res = await apiClient.post('/routes/preview-matrix', request)
  return res.data as PreviewMatrixResponse
}

export default {
  verifyAndChainFrequencies,
  getPreviewMatrix,
}

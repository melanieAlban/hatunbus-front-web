export type AssignmentType = 'TRIP' | 'REST' | 'INACTIVE'

export interface VerifyChainRequest {
  frequencyIds: Array<number | string>
}

export interface ChainedFrequency {
  id: number | string
  name: string
  details?: string
}

export interface DiscardedFrequency {
  id: number | string
  name: string
  reason: string
}

export interface VerifyChainResponse {
  isValid: boolean
  orderedChain: ChainedFrequency[]
  discardedFrequencies: DiscardedFrequency[]
}

export interface PreviewMatrixRequest {
  busGroupId: number | string
  orderedFrequencyIds: Array<number | string>
  startDate: string
}

export interface MatrixAssignment {
  date: string
  type: AssignmentType
  frequencyName: string | null
}

export interface MatrixRow {
  busUnit: string
  assignments: MatrixAssignment[]
}

export interface PreviewMatrixResponse {
  dates: string[]
  rows: MatrixRow[]
}

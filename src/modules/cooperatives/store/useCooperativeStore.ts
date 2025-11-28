import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as service from '../services/cooperativeService'
import type { CooperativeDto, CreateCooperativePayload, UpdateCooperativePayload } from '../interfaces/cooperative.interface'

export const useCooperativeStore = defineStore('cooperatives', () => {
  const items = ref<CooperativeDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      items.value = await service.listCooperatives()
    } catch (e: any) {
      error.value = e?.message || 'Error cargando cooperativas'
    } finally {
      loading.value = false
    }
  }

  async function fetchActive() {
    loading.value = true
    error.value = null
    try {
      items.value = await service.listActiveCooperatives()
    } catch (e: any) {
      error.value = e?.message || 'Error cargando cooperativas activas'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    error.value = null
    try {
      const c = await service.getCooperativeById(id)
      return c
    } catch (e: any) {
      error.value = e?.message || 'Error cargando cooperativa'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateCooperativePayload) {
    loading.value = true
    error.value = null
    try {
      const created = await service.createCooperative(payload)
      items.value.unshift(created)
      return created
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error creando cooperativa'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createMultipart(payload: CreateCooperativePayload, file: File) {
    loading.value = true
    error.value = null
    try {
      const created = await service.createCooperativeMultipart(payload, file)
      items.value.unshift(created)
      return created
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error creando cooperativa (multipart)'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateCooperativePayload) {
    loading.value = true
    error.value = null
    try {
      // Use multipart update to match backend that expects multipart/form-data
      const updated = await service.updateCooperativeMultipart(id, payload)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0) items.value.splice(idx, 1, updated)
      return updated
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error actualizando cooperativa'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMultipart(id: string, payload: UpdateCooperativePayload, file?: File) {
    loading.value = true
    error.value = null
    try {
      const updated = await service.updateCooperativeMultipart(id, payload, file)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0) {
        // Replace with server response
        items.value.splice(idx, 1, updated)
        // If the payload contained an explicit `active` value, prefer it in the UI
        if (typeof payload.active !== 'undefined') {
          const target = items.value[idx]
          if (target) target.active = Boolean(payload.active)
        }
      }
      return updated
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error actualizando cooperativa (multipart)'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    error.value = null
    try {
      await service.deleteCooperative(id)
      items.value = items.value.filter(i => i.id !== id)
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error eliminando cooperativa'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deactivate(id: string) {
    loading.value = true
    error.value = null
    try {
      await service.deactivateCooperative(id)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0 && items.value[idx]) items.value[idx]!.active = false
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error desactivando cooperativa'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, fetchAll, fetchActive, fetchById, create, createMultipart, update, updateMultipart, remove, deactivate }
})

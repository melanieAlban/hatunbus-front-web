import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as service from '../services/driverService'
import type { DriverDto, CreateDriverPayload, UpdateDriverPayload } from '../interfaces/driver.interface'

export const useDriverStore = defineStore('conductores', () => {
  const items = ref<DriverDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchByCooperative(cooperativeId: string) {
    loading.value = true
    error.value = null
    try {
      items.value = await service.listByCooperative(cooperativeId)
      return items.value
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando conductores'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchActiveByCooperative(cooperativeId: string) {
    loading.value = true
    error.value = null
    try {
      items.value = await service.listActiveByCooperative(cooperativeId)
      return items.value
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando conductores activos'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    error.value = null
    try {
      const d = await service.getDriverById(id)
      return d
    } catch (e: any) {
      error.value = e?.message || 'Error cargando conductor'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateDriverPayload) {
    loading.value = true
    error.value = null
    try {
      const created = await service.createDriver(payload)
      items.value.unshift(created)
      return created
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error creando conductor'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateDriverPayload) {
    loading.value = true
    error.value = null
    try {
      const updated = await service.updateDriver(id, payload)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0) items.value.splice(idx, 1, updated)
      return updated
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error actualizando conductor'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    error.value = null
    try {
      await service.deleteDriver(id)
      items.value = items.value.filter(i => i.id !== id)
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error eliminando conductor'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deactivate(id: string) {
    loading.value = true
    error.value = null
    try {
      await service.deactivateDriver(id)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0 && items.value[idx]) items.value[idx]!.active = false
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error desactivando conductor'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, fetchByCooperative, fetchActiveByCooperative, fetchById, create, update, remove, deactivate }
})

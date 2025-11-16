import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as service from '../services/busService'
import type { BusDto, CreateBusRequest, UpdateBusPayload, BusStatus, SeatDto } from '../interfaces/bus.interface'

export const useBusStore = defineStore('buses', () => {
  const items = ref<BusDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchByCooperative(cooperativeId: string) {
    loading.value = true
    error.value = null
    try {
      items.value = await service.listByCooperative(cooperativeId)
      return items.value
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando buses'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchByCooperatives(cooperativeIds: string[]) {
    loading.value = true
    error.value = null
    try {
      const lists = await Promise.all(
        cooperativeIds.map(id => service.listByCooperative(id).catch(() => []))
      )
      const merged: BusDto[] = []
      const seen = new Set<string>()
      for (const list of lists) {
        for (const bus of list) {
          if (!seen.has(bus.id)) {
            merged.push(bus)
            seen.add(bus.id)
          }
        }
      }
      items.value = merged
      return items.value
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando buses'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchByCooperativeAndStatus(cooperativeId: string, status: BusStatus) {
    loading.value = true
    error.value = null
    try {
      items.value = await service.listByCooperativeAndStatus(cooperativeId, status)
      return items.value
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando buses por estado'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    error.value = null
    try {
      const bus = await service.getBusById(id)
      return bus
    } catch (e: any) {
      error.value = e?.message || 'Error cargando bus'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchSeats(id: string): Promise<SeatDto[]> {
    loading.value = true
    error.value = null
    try {
      const seats = await service.getBusSeats(id)
      return seats
    } catch (e: any) {
      error.value = e?.message || 'Error cargando asientos del bus'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateBusRequest, file?: File) {
    loading.value = true
    error.value = null
    try {
      const created = await service.createBus(payload, file)
      items.value.unshift(created)
      return created
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error creando bus'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createMultipart(payload: CreateBusRequest, file: File) {
    loading.value = true
    error.value = null
    try {
      const created = await service.createBus(payload, file)
      items.value.unshift(created)
      return created
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error creando bus (multipart)'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateBusPayload, file?: File) {
    loading.value = true
    error.value = null
    try {
      const updated = await service.updateBus(id, payload, file)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0) items.value.splice(idx, 1, updated)
      return updated
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error actualizando bus'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMultipart(id: string, payload: UpdateBusPayload, file?: File) {
    loading.value = true
    error.value = null
    try {
      const updated = await service.updateBus(id, payload, file)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0) items.value.splice(idx, 1, updated)
      return updated
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error actualizando bus (multipart)'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function changeStatus(id: string, status: BusStatus) {
    loading.value = true
    error.value = null
    try {
      await service.changeStatus(id, status)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0 && items.value[idx]) {
        items.value[idx].status = status
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cambiando estado del bus'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    error.value = null
    try {
      await service.deleteBus(id)
      items.value = items.value.filter(i => i.id !== id)
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error eliminando bus'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    error,
    fetchByCooperative,
    fetchByCooperatives,
    fetchByCooperativeAndStatus,
    fetchById,
    fetchSeats,
    create,
    createMultipart,
    update,
    updateMultipart,
    changeStatus,
    remove
  }
})

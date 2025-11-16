import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as service from '../services/userService'
import type { UserCoopDto, CreateUserPayload, UpdateUserPayload } from '../interfaces/user.interface'

export const useUserStore = defineStore('users-coop', () => {
  const items = ref<UserCoopDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Si se pasa `cooperativeId`, lista usuarios de esa cooperativa.
  // Si no se pasa, intenta una lista general (si el backend la soporta).
  async function fetchAll(cooperativeId?: string) {
    loading.value = true
    error.value = null
    try {
      if (cooperativeId) {
        items.value = await service.listByCooperative(cooperativeId)
      } else {
        // Intentar listar todos (si el backend expone /usuarios)
        items.value = await service.listUsers()
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando usuarios'
    } finally {
      loading.value = false
    }
  }

  async function fetchByCooperative(cooperativeId: string) {
    loading.value = true
    error.value = null
    try {
      items.value = await service.listByCooperative(cooperativeId)
      return items.value
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando usuarios por cooperativa'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchClerksByCooperative(cooperativeId: string) {
    loading.value = true
    error.value = null
    try {
      items.value = await service.listClerksByCooperative(cooperativeId)
      return items.value
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando oficinistas'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Fetch users for multiple cooperatives and merge results (unique by id)
  async function fetchByCooperatives(cooperativeIds: string[]) {
    loading.value = true
    error.value = null
    try {
      const lists = await Promise.all(cooperativeIds.map(id => service.listByCooperative(id).catch(() => [])))
      const merged: UserCoopDto[] = []
      const seen = new Set<string>()
      for (const list of lists) {
        for (const u of list) {
          if (!seen.has(u.id)) {
            merged.push(u)
            seen.add(u.id)
          }
        }
      }
      items.value = merged
      return items.value
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error cargando usuarios'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    error.value = null
    try {
      const u = await service.getUserById(id)
      return u
    } catch (e: any) {
      error.value = e?.message || 'Error cargando usuario'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateUserPayload) {
    loading.value = true
    error.value = null
    try {
      const created = await service.createUser(payload)
      items.value.unshift(created)
      return created
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error creando usuario'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateUserPayload) {
    loading.value = true
    error.value = null
    try {
      const updated = await service.updateUser(id, payload)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0) items.value.splice(idx, 1, updated)
      return updated
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error actualizando usuario'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    error.value = null
    try {
      await service.deleteUser(id)
      items.value = items.value.filter(i => i.id !== id)
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error eliminando usuario'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deactivate(id: string) {
    loading.value = true
    error.value = null
    try {
      await service.deactivateUser(id)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0) items.value[idx].active = false
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error desactivando usuario'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function activate(id: string) {
    loading.value = true
    error.value = null
    try {
      await service.activateUser(id)
      const idx = items.value.findIndex(i => i.id === id)
      if (idx >= 0) items.value[idx].active = true
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error activando usuario'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, fetchAll, fetchById, fetchByCooperative, fetchClerksByCooperative, fetchByCooperatives, create, update, remove, deactivate, activate }
})

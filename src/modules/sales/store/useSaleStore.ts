import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PurchaseDto } from '../interfaces/sale.interface'
import * as saleService from '../services/saleService'

export const useSaleStore = defineStore('sales', () => {
  const purchases = ref<PurchaseDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAllPurchases() {
    loading.value = true
    error.value = null
    try {
      purchases.value = await saleService.getAllPurchases()
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las compras'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPurchasesByUser(userId: string) {
    loading.value = true
    error.value = null
    try {
      purchases.value = await saleService.getPurchasesByUser(userId)
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las compras'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPurchasesByCooperative(cooperativeId: string) {
    loading.value = true
    error.value = null
    try {
      purchases.value = await saleService.getPurchasesByCooperative(cooperativeId)
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las compras'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelPurchase(id: string) {
    loading.value = true
    error.value = null
    try {
      const cancelled = await saleService.cancelPurchase(id)
      // Actualizar en la lista
      const index = purchases.value.findIndex(p => p.id === id)
      if (index !== -1) {
        purchases.value[index] = cancelled
      }
      return cancelled
    } catch (err: any) {
      error.value = err.message || 'Error al cancelar la compra'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    purchases,
    loading,
    error,
    fetchAllPurchases,
    fetchPurchasesByUser,
    fetchPurchasesByCooperative,
    cancelPurchase
  }
})

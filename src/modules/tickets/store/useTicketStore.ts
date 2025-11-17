import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as ticketService from '../services/ticketService'
import type { CreatePurchaseRequest, PurchaseDto, TicketDto, TripSummary } from '../interfaces/ticket.interface'

export const useTicketStore = defineStore('ticket', () => {
  const currentPurchase = ref<PurchaseDto | null>(null)
  const purchases = ref<PurchaseDto[]>([])
  const availableTrips = ref<TripSummary[]>([])
  const loading = ref(false)

  async function createPurchase(request: CreatePurchaseRequest): Promise<PurchaseDto> {
    loading.value = true
    try {
      const purchase = await ticketService.createPurchase(request)
      currentPurchase.value = purchase
      return purchase
    } finally {
      loading.value = false
    }
  }

  async function confirmPayment(purchaseId: string): Promise<PurchaseDto> {
    loading.value = true
    try {
      const purchase = await ticketService.confirmPayment(purchaseId)
      currentPurchase.value = purchase
      return purchase
    } finally {
      loading.value = false
    }
  }

  async function cancelPurchase(purchaseId: string): Promise<PurchaseDto> {
    loading.value = true
    try {
      const purchase = await ticketService.cancelPurchase(purchaseId)
      currentPurchase.value = purchase
      return purchase
    } finally {
      loading.value = false
    }
  }

  async function loadPurchaseById(id: string): Promise<PurchaseDto> {
    loading.value = true
    try {
      const purchase = await ticketService.getPurchaseById(id)
      currentPurchase.value = purchase
      return purchase
    } finally {
      loading.value = false
    }
  }

  async function loadPurchasesByUser(userId: string): Promise<void> {
    loading.value = true
    try {
      purchases.value = await ticketService.listPurchasesByUser(userId)
    } finally {
      loading.value = false
    }
  }

  async function loadAvailableTrips(cooperativeId?: string): Promise<void> {
    loading.value = true
    try {
      availableTrips.value = await ticketService.getAvailableTrips(cooperativeId)
    } finally {
      loading.value = false
    }
  }

  async function searchTrips(date: string, origin: string, destination: string, cooperativeId?: string): Promise<void> {
    loading.value = true
    try {
      console.log('[Store] Buscando viajes con parámetros:', { date, origin, destination, cooperativeId })
      let trips = await ticketService.searchTrips(date, origin, destination)
      console.log('[Store] Viajes recibidos del servicio:', trips.length)
      if (trips.length > 0 && trips[0]) {
        console.log('[Store] Primera fecha de viaje:', trips[0].date)
      }
      
      // Filtrar por cooperativa si se proporciona
      if (cooperativeId) {
        const beforeFilter = trips.length
        trips = trips.filter(trip => trip.cooperativeId === cooperativeId)
        console.log(`[Store] Filtrado por cooperativa: ${beforeFilter} -> ${trips.length} viajes`)
      }
      
      availableTrips.value = trips
      console.log('[Store] availableTrips actualizado:', availableTrips.value.length)
    } finally {
      loading.value = false
    }
  }

  async function loadTicketsByTrip(tripId: string): Promise<TicketDto[]> {
    loading.value = true
    try {
      return await ticketService.listTicketsByTrip(tripId)
    } finally {
      loading.value = false
    }
  }

  function clearCurrentPurchase() {
    currentPurchase.value = null
  }

  return {
    currentPurchase,
    purchases,
    availableTrips,
    loading,
    createPurchase,
    confirmPayment,
    cancelPurchase,
    loadPurchaseById,
    loadPurchasesByUser,
    loadAvailableTrips,
    searchTrips,
    loadTicketsByTrip,
    clearCurrentPurchase
  }
})

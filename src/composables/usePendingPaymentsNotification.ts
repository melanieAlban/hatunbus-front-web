import { ref, onMounted, onUnmounted } from 'vue'
import paymentService from '../modules/payments/services/paymentService'

const pendingCount = ref(0)
const lastCount = ref(0)
let intervalId: number | null = null

export function usePendingPaymentsNotification() {
  const checkPendingPayments = async () => {
    try {
      const payments = await paymentService.getPendingPayments()
      pendingCount.value = payments.length

      // Si hay nuevos pagos pendientes, mostrar notificación del navegador
      if (pendingCount.value > lastCount.value && lastCount.value > 0) {
        showBrowserNotification(pendingCount.value - lastCount.value)
      }

      lastCount.value = pendingCount.value
    } catch (error) {
      console.error('Error al verificar pagos pendientes:', error)
    }
  }

  const showBrowserNotification = (newCount: number) => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones')
      return
    }

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification('🔔 Nuevos Pagos Pendientes', {
          body: `Tienes ${newCount} nuevo${newCount > 1 ? 's' : ''} pago${newCount > 1 ? 's' : ''} pendiente${newCount > 1 ? 's' : ''} por revisar`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'pending-payments',
          requireInteraction: false,
          silent: false
        })

        // Auto-cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000)

        // Opcional: hacer algo al hacer clic
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
        
        console.log('✅ Notificación mostrada')
      } catch (error) {
        console.error('Error al mostrar notificación:', error)
      }
    } else {
      console.warn('Permisos de notificación no concedidos. Estado:', Notification.permission)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones')
      return false
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Permisos de notificación ya concedidos')
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('⛔ Permisos de notificación denegados por el usuario')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      console.log('Resultado de solicitud de permisos:', permission)
      return permission === 'granted'
    } catch (error) {
      console.error('Error al solicitar permisos:', error)
      return false
    }
  }

  const startPolling = (intervalMs: number = 120000) => { // 2 minutos por defecto
    checkPendingPayments() // Verificar inmediatamente
    intervalId = window.setInterval(checkPendingPayments, intervalMs)
  }

  const stopPolling = () => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return {
    pendingCount,
    checkPendingPayments,
    requestNotificationPermission,
    startPolling,
    stopPolling
  }
}

<template>
  <div class="admin-layout">
    <header class="admin-header" :style="headerStyles">
      <div class="brand">
        <img :src="currentLogo" alt="Logo" class="logo-img" />
        <span class="title">{{ customization.name }}</span>
      </div>
      <div class="header-actions">
        <div class="notification-wrapper">
          <Button 
            icon="pi pi-bell" 
            class="notif-btn" 
            text 
            aria-label="Notificaciones"
            @click.stop="toggleNotifications"
            v-badge="pendingCount > 0 ? pendingCount : null"
          />
          
          <!-- Panel de Notificaciones -->
          <div v-if="showNotifications" class="notifications-panel" v-click-outside="closeNotifications" @click.stop>
            <div class="notifications-header">
              <h3>Notificaciones</h3>
              <Button 
                icon="pi pi-times" 
                text 
                size="small"
                @click="closeNotifications"
              />
            </div>
            
            <div class="notifications-body">
              <div v-if="pendingCount === 0" class="no-notifications">
                <i class="pi pi-check-circle"></i>
                <p>No hay pagos pendientes</p>
              </div>
              
              <div v-else class="notification-item" @click="goToPendingPayments">
                <div class="notification-icon">
                  <i class="pi pi-money-bill"></i>
                </div>
                <div class="notification-content">
                  <h4>Pagos Pendientes</h4>
                  <p>Tienes {{ pendingCount }} pago{{ pendingCount > 1 ? 's' : '' }} pendiente{{ pendingCount > 1 ? 's' : '' }} por revisar</p>
                  <small>Click para ver detalles</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="admin-content">
      <aside class="sidebar" :style="sidebarStyles">
        <SidebarMenu />
      </aside>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SidebarMenu from '../layouts/SidebarMenu.vue'
import { useAuthStore } from '../modules/auth/store/useAuthStore'
import { useCooperativeCustomization } from '../composables/useCooperativeCustomization'
import { usePendingPaymentsNotification } from '../composables/usePendingPaymentsNotification'
import Button from 'primevue/button'
import defaultLogo from '../assets/hatunbus2-logo.png'

const auth = useAuthStore()
const customization = useCooperativeCustomization()
const router = useRouter()

// Notificaciones
const showNotifications = ref(false)
const { pendingCount, requestNotificationPermission, startPolling, stopPolling } = usePendingPaymentsNotification()

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  console.log('🔔 Toggle notifications:', showNotifications.value)
}

const closeNotifications = () => {
  showNotifications.value = false
  console.log('❌ Close notifications')
}

const goToPendingPayments = () => {
  router.push('/admin/pending-payments')
  closeNotifications()
}

// Directiva personalizada para cerrar al hacer click fuera
const vClickOutside = {
  mounted(el: HTMLElement & { clickOutsideEvent?: (event: Event) => void }, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: HTMLElement & { clickOutsideEvent?: (event: Event) => void }) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  }
}

// Verificar permisos del usuario
const userRole = computed(() => {
  const u = auth.user as any
  return u?.role ? String(u.role).toUpperCase() : null
})

const canSeePendingPayments = computed(() => {
  const allowedRoles = ['ADMIN', 'CLERK', 'COOPERATIVE']
  return userRole.value && allowedRoles.includes(userRole.value)
})

// Cargar customización al montar
onMounted(async () => {
  await auth.restoreFromStorage()
  await customization.loadCooperativeCustomization()
  
  // Iniciar polling de notificaciones si tiene permisos
  if (canSeePendingPayments.value) {
    await requestNotificationPermission()
    startPolling(120000) // Verificar cada 2 minutos
  }
})

onUnmounted(() => {
  stopPolling()
})

// Logo: usa el de la cooperativa si existe, sino el default
const currentLogo = computed(() => {
  return customization.logo.value || defaultLogo
})

// Estilos dinámicos para header
const headerStyles = computed(() => ({
  background: `linear-gradient(90deg, ${customization.colors.value.primary}, ${customization.colors.value.secondary})`,
  color: 'white',
}))

// Estilos dinámicos para sidebar
const sidebarStyles = computed(() => ({
  '--sidebar-accent': customization.colors.value.primary,
}))

function onLogout() {
  auth.logoutAction()
  window.location.href = '/login'
}

const userName = computed(() => {
  const u = auth.user as any
  return u ? `${u.firstNames || ''} ${u.lastNames || ''}`.trim() : ''
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.admin-layout {
  position: fixed;
  inset: 0; /* top:0; right:0; bottom:0; left:0 */
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  overflow: hidden;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  height: 80px;
  flex-shrink: 0;
  width: 100%;
  transition: background 0.3s ease;
}

.brand {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 60px;
  margin-right: 0.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  object-fit: contain;
}

.brand .title{
  font-weight: 700;
  font-size: 1.15rem;
  color: white;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notification-wrapper {
  position: relative;
}

.notif-btn {
  color: white !important;
}

.notifications-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 360px;
  max-height: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  
  h3 {
    margin: 0;
    font-size: 1rem;
    color: #1e293b;
  }
}

.notifications-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.no-notifications {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  
  i {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    display: block;
    color: #10b981;
  }
  
  p {
    margin: 0;
  }
}

.notification-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #f8fafc;
  }
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fef3c7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  i {
    color: #f59e0b;
    font-size: 1.25rem;
  }
}

.notification-content {
  flex: 1;
  
  h4 {
    margin: 0 0 0.25rem 0;
    font-size: 0.95rem;
    color: #1e293b;
  }
  
  p {
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
    color: #475569;
  }
  
  small {
    color: #94a3b8;
    font-size: 0.75rem;
  }
}

.logout-btn {
  border-color: var(--app-accent) !important;
  color: var(--app-accent) !important;
  height: 35px;
}

.logout-btn:hover {
  background: var(--app-accent) !important;
  color: white !important;
}

.admin-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background: var(--beige-bone);
  border-right: 1px solid var(--gray-medium);
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  background: var(--card-bg);
  overflow: auto;
  padding: 1.5rem 1.5rem 1.5rem 2rem; /* top right bottom left -> separa contenido del sidebar */
}

/* Reset completo para el contenido del router */
:deep(.main-content > *) {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

:deep(.main-content > div) {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>

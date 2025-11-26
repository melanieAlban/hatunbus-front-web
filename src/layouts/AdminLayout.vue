<template>
  <div class="admin-layout">
    <header class="admin-header" :style="headerStyles">
      <div class="brand">
        <img :src="currentLogo" alt="Logo" class="logo-img" />
        <span class="title">{{ customization.name }}</span>
      </div>
      <div class="header-actions">
        <Button icon="pi pi-bell" class="notif-btn" text aria-label="Notificaciones" />
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
import { computed, onMounted } from 'vue'
import SidebarMenu from '../layouts/SidebarMenu.vue'
import { useAuthStore } from '../modules/auth/store/useAuthStore'
import { useCooperativeCustomization } from '../composables/useCooperativeCustomization'
import Button from 'primevue/button'
import defaultLogo from '../assets/hatunbus2-logo.png'

const auth = useAuthStore()
const customization = useCooperativeCustomization()

// Cargar customización al montar
onMounted(async () => {
  await customization.loadCooperativeCustomization()
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
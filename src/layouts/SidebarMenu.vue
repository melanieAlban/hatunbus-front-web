<template>
  <nav class="sidebar-menu">
    <!-- Opciones de menú -->
    <div class="menu-section">
      <ul class="menu-list">
        <li v-for="item in visibleMenu" :key="item.path || item.label" class="menu-item">
          <!-- Item con hijos (submenú) -->
          <template v-if="item.children && item.children.length > 0">
            <div 
              class="menu-link menu-link--parent" 
              @click="toggleSubmenu(item.label)"
              :class="{ 'menu-link--expanded': expandedMenus.has(item.label) }"
            >
              <i v-if="item.icon" :class="item.icon + ' menu-icon'" aria-hidden="true"></i>
              <span class="menu-label">{{ item.label }}</span>
              <i 
                class="pi pi-chevron-down submenu-arrow" 
                :class="{ 'submenu-arrow--expanded': expandedMenus.has(item.label) }"
              ></i>
            </div>
            <ul v-show="expandedMenus.has(item.label)" class="submenu-list">
              <li v-for="child in item.children" :key="child.path" class="submenu-item">
                <router-link 
                  :to="child.path!" 
                  class="menu-link menu-link--child"
                  :class="{ 'menu-link--active': isChildActive(child.path!) }"
                  custom
                  v-slot="{ navigate }"
                >
                  <div @click="navigate" style="display: flex; align-items: center; gap: 0.75rem; width: 100%;">
                    <i v-if="child.icon" :class="child.icon + ' menu-icon'" aria-hidden="true"></i>
                    <span class="menu-label">{{ child.label }}</span>
                  </div>
                </router-link>
              </li>
            </ul>
          </template>

          <!-- Item normal sin hijos -->
          <router-link 
            v-else
            :to="item.path!" 
            class="menu-link" 
            exact-active-class="menu-link--active"
          >
            <i v-if="item.icon" :class="item.icon + ' menu-icon'" aria-hidden="true"></i>
            <span class="menu-label">{{ item.label }}</span>
            <Badge 
              v-if="item.path === '/admin/pending-payments' && pendingCount > 0" 
              :value="pendingCount" 
              severity="warning"
              class="payment-badge"
            />
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Información de usuario fija en la parte inferior -->
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">
          <img v-if="avatar" :src="avatar" alt="avatar" class="avatar-img" />
          <i v-else class="pi pi-user avatar-placeholder"></i>
        </div>
        <div class="user-meta">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ userRole }}</div>
        </div>
        <Button 
          icon="pi pi-sign-out" 
          text 
          @click="onLogout"
          class="logout-btn"
          v-tooltip="'Cerrar sesión'"
        />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { adminMenu } from '../modules/admin/menu.config'
import { useAuthStore } from '../modules/auth/store/useAuthStore'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import { usePendingPaymentsNotification } from '../composables/usePendingPaymentsNotification'

const auth = useAuthStore()
const route = useRoute()
const role = computed(() => (auth.user as any)?.role)

// Control de submenús expandidos
const expandedMenus = ref<Set<string>>(new Set())

function toggleSubmenu(label: string) {
  if (expandedMenus.value.has(label)) {
    expandedMenus.value.delete(label)
  } else {
    expandedMenus.value.add(label)
  }
}

// Función para determinar si un hijo está activo
function isChildActive(path: string): boolean {
  const url = new URL(path, window.location.origin)
  const pathMatch = route.path === url.pathname
  const tabParam = url.searchParams.get('tab')
  const currentTab = route.query.tab
  
  return pathMatch && tabParam === currentTab
}

// Notificaciones de pagos pendientes
const { pendingCount, requestNotificationPermission, startPolling, stopPolling } = usePendingPaymentsNotification()

// Iniciar polling si el usuario tiene permisos para ver pagos pendientes
const userRoleUpper = computed(() => {
  const u = auth.user as any
  return u?.role ? String(u.role).toUpperCase() : null
})

const canSeePendingPayments = computed(() => {
  const allowedRoles = ['ADMIN', 'CLERK', 'COOPERATIVE']
  return userRoleUpper.value && allowedRoles.includes(userRoleUpper.value)
})

onMounted(async () => {
  if (canSeePendingPayments.value) {
    await requestNotificationPermission()
    startPolling(120000) // Verificar cada 2 minutos
  }
})

onUnmounted(() => {
  stopPolling()
})

const visibleMenu = computed(() => {
  const roleKey = role.value ? String(role.value).toUpperCase() : null
  return adminMenu.filter(item => {
    if (!item.roles || item.roles.length === 0) return true
    if (!roleKey) return false
    return item.roles.map(r => String(r).toUpperCase()).includes(roleKey)
  })
})

const userName = computed(() => {
  const u = auth.user as any
  if (!u) return ''
  return `${u.firstNames || ''} ${u.lastNames || ''}`.trim()
})

const userRole = computed(() => {
  const u = auth.user as any
  if (!u?.role) return 'Usuario'
  return u.role.charAt(0).toUpperCase() + u.role.slice(1)
})

const avatar = computed(() => {
  const u = auth.user as any
  return u?.profilePhoto || null
})

function onLogout() {
  try { 
    auth.logoutAction() 
  } catch (e) { 
    console.error('Error al cerrar sesión:', e)
  }
  window.location.href = '/login'
}
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  background: var(--beige-bone);
  display: flex;
  flex-direction: column;
  padding: 0;
}

.menu-section {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: block;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  color: var(--app-text);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.menu-link:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--app-text);
  border-left-color: var(--sidebar-accent, var(--app-accent));
}

.menu-link--active {
  background: var(--sidebar-accent, var(--app-accent));
  color: var(--white-bone);
  border-left-color: var(--sidebar-accent, var(--app-accent));
  font-weight: 500;
}

.menu-link--active .menu-icon {
  color: var(--white-bone);
}

/* Menú padre con submenú */
.menu-link--parent {
  cursor: pointer;
  position: relative;
  border-left: 4px solid transparent;
}

.menu-link--parent:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Flecha del submenú */
.submenu-arrow {
  margin-left: auto;
  font-size: 0.85rem;
  transition: transform 0.2s ease;
}

.submenu-arrow--expanded {
  transform: rotate(180deg);
}

/* Lista de submenú */
.submenu-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background: transparent;
}

.submenu-item {
  display: block;
}

/* Items hijos del submenú */
.menu-link--child {
  padding-left: 3.5rem;
  font-size: 0.9rem;
  border-left: 4px solid transparent;
  background: transparent;
  color: var(--app-text);
}

.menu-link--child:hover {
  background: rgba(0, 0, 0, 0.05) !important;
  color: var(--app-text) !important;
  border-left-color: var(--sidebar-accent, var(--app-accent));
}

.menu-link--child.menu-link--active {
  background: var(--sidebar-accent, var(--app-accent)) !important;
  color: var(--white-bone) !important;
  border-left-color: var(--sidebar-accent, var(--app-accent));
  font-weight: 500;
}

.menu-link--child.menu-link--active .menu-icon {
  color: var(--white-bone) !important;
}

.menu-link--child .menu-icon {
  font-size: 1rem;
  color: var(--sidebar-accent, var(--app-accent));
}

.menu-icon {
  font-size: 1.2rem;
  color: var(--sidebar-accent, var(--app-accent));
  width: 24px;
  text-align: center;
  transition: color 0.2s ease;
}

.menu-label {
  font-size: 0.95rem;
  flex: 1;
}

.sidebar-footer {
  margin-top: auto;
  padding: 1rem;
  border-top: 1px solid var(--gray-medium);
  background: var(--beige-bone);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gray-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: var(--app-text);
  font-size: 1.25rem;
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--app-text);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: #000;
  margin-top: 2px;
}

.logout-btn {
  color: var(--sidebar-accent, var(--app-accent)) !important;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logout-btn:hover {
  background: var(--sidebar-accent, var(--app-accent)) !important;
  color: white !important;
}
</style>
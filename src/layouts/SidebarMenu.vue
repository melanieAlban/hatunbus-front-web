<template>
  <nav class="sidebar-menu">
    <!-- Opciones de menú -->
    <div class="menu-section">
      <ul class="menu-list">
        <li v-for="item in visibleMenu" :key="item.path" class="menu-item">
          <router-link :to="item.path" class="menu-link" exact-active-class="menu-link--active">
            <i v-if="item.icon" :class="item.icon + ' menu-icon'" aria-hidden="true"></i>
            <span class="menu-label">{{ item.label }}</span>
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
import { computed } from 'vue'
import { adminMenu } from '../modules/admin/menu.config'
import { useAuthStore } from '../modules/auth/store/useAuthStore'
import Button from 'primevue/button'

const auth = useAuthStore()
const role = computed(() => (auth.user as any)?.role)

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
  border-left-color: var(--gray-medium);
}

.menu-link--active {
  background: var(--app-accent);
  color: var(--white-bone);
  border-left-color: var(--app-accent);
  font-weight: 500;
}

.menu-link--active .menu-icon {
  color: var(--white-bone);
}

.menu-icon {
  font-size: 1.2rem;
  color: var(--app-accent);
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
  color: var(--gray-medium);
  margin-top: 2px;
}

.logout-btn {
  color: var(--app-accent) !important;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logout-btn:hover {
  background: var(--app-accent) !important;
  color: white !important;
}
</style>
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { getRouteRoles } from './permissions'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../modules/auth/views/LoginView.vue'),
  },
  {
    path: '/',
    name: 'Home',
    redirect: '/login',
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('../views/Forbidden.vue')
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('../modules/admin/views/DashboardView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminDashboard') } },
      { path: 'cooperatives', name: 'AdminCooperatives', component: () => import('../modules/cooperatives/views/CooperativesView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminCooperatives') } },
      { path: 'users', name: 'AdminUsers', component: () => import('../modules/users-coop/views/UsersCoopView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminUsers') } },
      { path: 'roles', name: 'AdminRoles', component: () => import('../modules/admin/views/RolesView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminRoles') } },
      { path: 'route-sheet', name: 'AdminRouteSheet', component: () => import('../modules/admin/views/RouteSheetView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminRouteSheet') } },
      { path: 'reports', name: 'AdminReports', component: () => import('../modules/admin/views/ReportsView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminReports') } },
      { path: 'frequencies', name: 'AdminFrequencies', component: () => import('../modules/admin/views/FrequenciesView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminFrequencies') } },
      { path: 'buses', name: 'AdminBuses', component: () => import('../modules/buses/views/BusesView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminBuses') } },
      { path: 'drivers', name: 'AdminDrivers', component: () => import('../modules/conductores/views/DriversView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminDrivers') } },
      { path: 'sales', name: 'AdminSales', component: () => import('../modules/sales/views/SalesView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminSales') } },
      { path: 'tickets', name: 'AdminTickets', component: () => import('../modules/tickets/views/TicketSaleView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminTickets') } },
      { path: 'personalize', name: 'AdminPersonalize', component: () => import('../modules/admin/views/PersonalizeView.vue'), meta: { requiresAuth: true, roles: getRouteRoles('AdminPersonalize') } },
    ]
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // Importación relativa en lugar de alias
  const { useAuthStore } = await import('../modules/auth/store/useAuthStore')
  const auth = useAuthStore()

  // Intentar restaurar usuario y token desde storage si es necesario
  // (restoreFromStorage ahora es async y poblará `user` si hay token válido)
  try {
    await auth.restoreFromStorage()
  } catch (e) { /* ignore */ }

  const requiresAuth = to.matched.some(r => (r.meta as any)?.requiresAuth)
  const requiredRoles: string[] = to.matched.flatMap(r => (r.meta as any)?.roles || ((r.meta as any)?.requiresAdmin ? ['ADMIN'] : []))

  if (requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (requiredRoles.length > 0) {
    const role = (auth.user as any)?.role
    if (!role || !requiredRoles.includes(role)) {
      return next({ name: 'Forbidden' })
    }
  }
  return next()
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // Importación relativa en lugar de alias
  const { useAuthStore } = await import('../modules/auth/store/useAuthStore')
  const auth = useAuthStore()
  
  if (auth && !auth.token) {
    auth.restoreFromStorage()
  }

  const requiresAuth = to.matched.some(r => (r.meta as any)?.requiresAuth)
  if (requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  return next()
})

export default router
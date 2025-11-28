export type UserRole = 'ADMIN' | 'COOPERATIVE' | 'CLERK'

type PermissionMap = Record<string, UserRole[]>

export const routePermissions: PermissionMap = {
  AdminDashboard: ['ADMIN', 'COOPERATIVE', 'CLERK'],
  AdminCooperatives: ['ADMIN'],
  AdminUsers: ['ADMIN', 'COOPERATIVE'],
  AdminRoles: ['ADMIN'],
  AdminRoutesFrequencies: ['ADMIN', 'COOPERATIVE'],
  AdminRouteSheet: ['ADMIN', 'COOPERATIVE'],
  AdminReports: ['ADMIN', 'COOPERATIVE', 'CLERK'],
  AdminBuses: ['ADMIN', 'COOPERATIVE'],
  AdminDrivers: ['ADMIN', 'COOPERATIVE'],
  AdminSales: ['ADMIN', 'COOPERATIVE', 'CLERK'],
  AdminTickets: ['ADMIN', 'COOPERATIVE', 'CLERK'],
  AdminPendingPayments: ['ADMIN', 'COOPERATIVE', 'CLERK'],
  AdminPersonalize: ['ADMIN', 'COOPERATIVE'],
}

export function getRouteRoles(name?: keyof typeof routePermissions | string): UserRole[] | undefined {
  if (!name) return undefined
  return routePermissions[name] || undefined
}

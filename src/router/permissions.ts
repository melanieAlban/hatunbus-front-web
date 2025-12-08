export type UserRole = 'ADMIN' | 'COOPERATIVE' | 'CLERK'

type PermissionMap = Record<string, UserRole[]>

export const routePermissions: PermissionMap = {
  AdminDashboard: ['COOPERATIVE', 'CLERK'],
  AdminCooperatives: ['ADMIN'],
  AdminUsers: ['ADMIN', 'COOPERATIVE'],
  AdminRoles: ['COOPERATIVE'],
  AdminRoutesFrequencies: ['COOPERATIVE'],
  AdminRouteSheet: ['COOPERATIVE'],
  AdminRouteSheetWizard: ['COOPERATIVE'],
  AdminReports: ['COOPERATIVE', 'CLERK'],
  AdminBuses: ['ADMIN', 'COOPERATIVE'],
  AdminDrivers: ['ADMIN', 'COOPERATIVE'],
  AdminSales: ['COOPERATIVE', 'CLERK'],
  AdminTickets: ['COOPERATIVE', 'CLERK'],
  AdminPendingPayments: ['COOPERATIVE', 'CLERK'],
  AdminPersonalize: ['COOPERATIVE'],
}

export function getRouteRoles(name?: keyof typeof routePermissions | string): UserRole[] | undefined {
  if (!name) return undefined
  return routePermissions[name] || undefined
}

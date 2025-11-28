import { getRouteRoles } from '../../router/permissions'

export type MenuItem = {
  label: string
  path: string
  icon?: string
  roles?: string[]
}

export const adminMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/admin', icon: 'pi pi-home', roles: getRouteRoles('AdminDashboard') },
  { label: 'Cooperativas', path: '/admin/cooperatives', icon: 'pi pi-building', roles: getRouteRoles('AdminCooperatives') },
  { label: 'Usuarios', path: '/admin/users', icon: 'pi pi-users', roles: getRouteRoles('AdminUsers') },
  { label: 'Roles', path: '/admin/roles', icon: 'pi pi-lock', roles: getRouteRoles('AdminRoles') },
  { label: 'Rutas y Frecuencias', path: '/admin/routes-frequencies', icon: 'pi pi-map', roles: getRouteRoles('AdminRoutesFrequencies') },
  { label: 'Reportes', path: '/admin/reports', icon: 'pi pi-chart-line', roles: getRouteRoles('AdminReports') },
  { label: 'Hoja de Ruta', path: '/admin/route-sheet', icon: 'pi pi-calendar', roles: getRouteRoles('AdminRouteSheet') },
  { label: 'Buses', path: '/admin/buses', icon: 'pi pi-car', roles: getRouteRoles('AdminBuses') },
  { label: 'Conductores', path: '/admin/drivers', icon: 'pi pi-user', roles: getRouteRoles('AdminDrivers') },
  { label: 'Ventas', path: '/admin/sales', icon: 'pi pi-money-bill', roles: getRouteRoles('AdminSales') },
  { label: 'Venta de Boletos', path: '/admin/tickets', icon: 'pi pi-ticket', roles: getRouteRoles('AdminTickets') },
  { label: 'Pagos Pendientes', path: '/admin/pending-payments', icon: 'pi pi-clock', roles: getRouteRoles('AdminPendingPayments') },
  { label: 'Personalizar', path: '/admin/personalize', icon: 'pi pi-palette', roles: getRouteRoles('AdminPersonalize') },
]

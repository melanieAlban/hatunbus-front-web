export type MenuItem = {
  label: string
  path: string
  icon?: string
  roles?: string[]
}

export const adminMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/admin', icon: 'pi pi-home', roles: ['ADMIN', 'COOPERATIVE', 'CLERK'] },
  { label: 'Cooperativas', path: '/admin/cooperatives', icon: 'pi pi-building', roles: ['ADMIN'] },
  { label: 'Usuarios', path: '/admin/users', icon: 'pi pi-users', roles: ['ADMIN', 'COOPERATIVE'] },
  { label: 'Roles', path: '/admin/roles', icon: 'pi pi-lock', roles: ['ADMIN'] },
  { label: 'Reportes', path: '/admin/reports', icon: 'pi pi-chart-line', roles: ['ADMIN', 'COOPERATIVE', 'CLERK'] },
  { label: 'Frecuencias', path: '/admin/frequencies', icon: 'pi pi-clock', roles: ['COOPERATIVE','ADMIN'] },
  { label: 'Buses', path: '/admin/buses', icon: 'pi pi-car', roles: ['COOPERATIVE','ADMIN'] },
  { label: 'Conductores', path: '/admin/drivers', icon: 'pi pi-user', roles: ['COOPERATIVE','ADMIN'] },
  { label: 'Ventas', path: '/admin/sales', icon: 'pi pi-money-bill', roles: ['COOPERATIVE', 'ADMIN', 'CLERK'] },
  { label: 'Venta de Boletos', path: '/admin/tickets', icon: 'pi pi-ticket', roles: ['COOPERATIVE', 'CLERK','ADMIN'] },
  { label: 'Personalizar', path: '/admin/personalize', icon: 'pi pi-palette', roles: ['ADMIN', 'COOPERATIVE'] },
  { label: 'Perfil', path: '/profile', icon: 'pi pi-user' },
]

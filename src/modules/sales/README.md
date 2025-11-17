# Módulo de Ventas

Este módulo gestiona la visualización y administración de las ventas/compras realizadas en el sistema.

## Estructura

```
sales/
├── components/
│   └── PurchaseDetailsDialog.vue  # Diálogo para ver detalles de una compra
├── interfaces/
│   └── sale.interface.ts          # Interfaces (reutiliza las de tickets)
├── services/
│   └── saleService.ts             # Servicios API para ventas
├── store/
│   └── useSaleStore.ts            # Store Pinia para gestión de estado
├── views/
│   └── SalesView.vue              # Vista principal con tabla de ventas
├── index.ts                        # Exportaciones del módulo
└── README.md                       # Este archivo
```

## Características

### Vista Principal (SalesView)
- **Tabla de Ventas**: Listado completo con paginación
- **Filtros Avanzados**: Por búsqueda, estado, tipo y fecha
- **Estadísticas Rápidas**: Total ventas, confirmadas, pendientes e ingresos
- **Acciones**: Ver detalles, imprimir boletos, cancelar compra

### Diálogo de Detalles (PurchaseDetailsDialog)
- **Información Completa**: Todos los datos de la compra
- **Listado de Boletos**: Cada boleto con su información detallada
- **Códigos QR**: Visualización de QR de cada boleto
- **Impresión**: Formato optimizado para imprimir todos los boletos

## Uso

### En el Router

```typescript
import { SalesView } from '@/modules/sales'

{
  path: '/admin/sales',
  name: 'Sales',
  component: SalesView,
  meta: { requiresAuth: true, roles: ['ADMIN', 'COOPERATIVE', 'CLERK'] }
}
```

### En el Menú de Administración

```typescript
{
  label: 'Ventas',
  icon: 'pi pi-shopping-cart',
  to: '/admin/sales'
}
```

## Permisos

- **ADMIN**: Ve todas las compras del sistema
- **COOPERATIVE**: Ve solo compras de su cooperativa
- **CLERK**: Ve solo compras de su cooperativa

## API Endpoints Usados

- `GET /api/compras` - Obtener todas las compras
- `GET /api/compras/cooperativa/{id}` - Obtener compras por cooperativa
- `GET /api/compras/{id}` - Obtener detalles de una compra
- `POST /api/compras/{id}/cancelar` - Cancelar una compra

## Funcionalidades

### Filtros
1. **Búsqueda**: Por ID de compra, nombre de pasajero o cédula
2. **Estado**: Pendiente, Confirmada, Cancelada, Expirada
3. **Tipo**: En Línea o Presencial
4. **Fecha**: Selección por calendario

### Acciones por Compra
1. **Ver Detalles**: Abre diálogo con información completa
2. **Imprimir Boletos**: Imprime todos los boletos de la compra
3. **Cancelar**: Cancela la compra (solo si está PENDING o CONFIRMED)

### Estadísticas
- Total de ventas filtradas
- Número de confirmadas
- Número de pendientes
- Ingresos totales (solo confirmadas)

## Estilos

- Diseño responsivo adaptable
- Tabla con scroll horizontal en móviles
- Cards informativos para estadísticas
- Sistema de colores consistente con el diseño general

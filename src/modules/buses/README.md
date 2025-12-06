# Módulo de Buses

Este módulo gestiona toda la funcionalidad relacionada con los buses de las cooperativas.

## Estructura

```
buses/
├── components/
│   ├── BusList.vue          # Tabla con listado de buses
│   └── BusForm.vue          # Formulario modal para crear/editar buses
├── interfaces/
│   └── bus.interface.ts     # Interfaces TypeScript para Bus, BusDto, etc.
├── services/
│   └── busService.ts        # Servicios API para operaciones CRUD de buses
├── store/
│   └── useBusStore.ts       # Store de Pinia para gestión de estado de buses
├── views/
│   └── BusesView.vue        # Vista principal del módulo
├── index.ts                 # Exportaciones del módulo
└── README.md                # Esta documentación
```

## Características

- **Gestión completa de buses**: Crear, editar, listar y eliminar buses
- **Filtros avanzados**: Por placa, unidad, marca de chasis, carrocería y estado
- **Paginación**: Tabla con paginación configurable
- **Estados de bus**: Activo, Inactivo, Mantenimiento
- **Información de mantenimiento**: Kilómetros totales, próximo mantenimiento
- **Fotos de buses**: Carga de imágenes con vista previa
- **Validaciones**: Formato de placa AAA-1234, rango de asientos (10-60)
- **Integración con cooperativas**: Asociación de buses a cooperativas específicas

## Uso

```typescript
import { useBusStore } from '@/modules/buses'

const busStore = useBusStore()

// Cargar buses de una cooperativa
await busStore.fetchByCooperative(cooperativeId)

// Crear un nuevo bus
await busStore.create({
  cooperativeId: 'uuid',
  plate: 'ABC-1234',
  chassisBrand: 'Mercedes Benz',
  bodyBrand: 'Marcopolo',
  seatCount: 40
})
```

## Interfaces Principales

### BusDto
```typescript
interface BusDto {
  id: string
  cooperativeId: string
  plate: string
  chassisBrand: string
  bodyBrand: string
  seatCount: number
  unitNumber?: number
  status: BusStatus
  totalKilometers?: number
  lastMaintenanceDate?: string
  nextMaintenanceKm?: number
  photoUrl?: string
}
```

### BusStatus
```typescript
enum BusStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}
```

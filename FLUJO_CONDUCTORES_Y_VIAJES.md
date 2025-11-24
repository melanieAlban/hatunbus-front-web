# Flujo de Conductores y Viajes en Hatunbus

## Resumen del Problema

**Síntoma:** Cuando se venden tickets desde el frontend web, los conductores no ven esos viajes en su app móvil.

**Causa raíz:** No es que falte asignar el conductor al vender el ticket. El conductor ya DEBE estar asignado al trip ANTES de vender tickets.

## Arquitectura del Sistema

### Modelo de Datos

```
Cooperative
    ↓
Frequency (patrón operativo diario)
    ↓
FrequencySegment (un tramo específico: ruta + hora de salida)
    ↓
Trip (instancia real de un viaje en una fecha específica)
    - mainDriver (conductor asignado)
    - bus (bus asignado)
    - date (fecha del viaje)
    - status (SCHEDULED, IN_PROGRESS, COMPLETED, etc.)
```

### Flujo Operativo Correcto

#### 1. Configuración Inicial (Admin)
1. Crear **Frequencies** con sus **FrequencySegments**
   - Ejemplo: Frecuencia "Día Impar"
     - Segmento 1: AMBATO → QUITO a las 06:00
     - Segmento 2: QUITO → LOJA a las 18:00

2. Generar **RouteSheet** automática (`POST /hojas-de-ruta/generar-automatica`)
   - Asigna buses y conductores a cada segmento
   - Estado: DRAFT

3. Revisar y aprobar la RouteSheet
   - Cambiar estado a ACTIVE

#### 2. Generación de Viajes (Trips)
**Endpoint:** `POST /viajes/generar`

Este proceso:
- Lee la RouteSheet ACTIVA
- Crea Trips para los próximos 60 días
- **ASIGNA automáticamente** el conductor desde `RouteSheetDetail.primaryDriver`

```java
Trip.builder()
    .frequencySegment(segment)
    .bus(detail.getBus())
    .mainDriver(detail.getPrimaryDriver())  // ← CONDUCTOR ASIGNADO AQUÍ
    .date(date)
    .status(TripStatus.SCHEDULED)
    .build()
```

#### 3. Venta de Tickets (Frontend Web)
**Endpoint:** `POST /purchases`

Cuando se vende un ticket:
- Se busca un Trip YA EXISTENTE
- El Trip ya tiene conductor asignado
- Solo se crea el Ticket asociado al Trip
- **NO se modifica el conductor del Trip**

#### 4. Vista del Conductor (App Móvil)
**Endpoint:** `GET /viajes/conductor`

Devuelve trips donde:
- `trip.mainDriver.user.id` = conductor autenticado
- `trip.status` = SCHEDULED o IN_PROGRESS

## Diagnóstico del Problema

Si un conductor NO ve sus viajes en la app móvil, puede ser por:

### Causa 1: Trips No Generados ❌
**Síntomas:**
- No hay trips disponibles para vender
- Error al buscar viajes en el frontend web

**Solución:**
1. Verificar que existe una RouteSheet ACTIVA
2. Ejecutar generación de trips: `POST /viajes/generar?cooperativeId={id}`

### Causa 2: Conductor No Asignado en RouteSheet ❌
**Síntomas:**
- Hay trips disponibles para vender
- Los tickets se venden correctamente
- El conductor NO ve esos viajes en su app

**Solución:**
1. Revisar la RouteSheet en el backend:
   ```sql
   SELECT rsd.id, rsd.primary_driver_id, u.first_names, u.last_names
   FROM route_sheet_details rsd
   LEFT JOIN drivers d ON d.id = rsd.primary_driver_id
   LEFT JOIN users u ON u.id = d.user_id
   WHERE rsd.route_sheet_id = '<route_sheet_id>';
   ```

2. Verificar que el conductor tiene ID válido
3. Re-generar trips si es necesario

### Causa 3: Usuario No Tiene Rol DRIVER ❌
**Síntomas:**
- El usuario puede vender tickets
- No ve la opción de conductor en la app

**Solución:**
```sql
SELECT u.id, u.email, u.roles
FROM users u
WHERE u.email = 'conductor@example.com';
```

Verificar que `roles` incluya 'DRIVER'.

## Mejoras Recomendadas para Frontend Web

### 1. Mostrar Conductor en TicketSaleView ✅

Actualmente, el frontend web muestra:
- Origen y destino
- Hora de salida
- Bus (placa)
- Asientos disponibles

**Falta mostrar:**
- Nombre del conductor asignado

#### Código Actual (TicketSaleView.vue)
```vue
<div class="trip-header">
  <div class="trip-route">
    <i class="pi pi-arrow-right"></i>
    <strong>{{ trip.routeOrigin }} → {{ trip.routeDestination }}</strong>
  </div>
  <Tag :value="trip.busPlate" severity="info" />
</div>
```

#### Código Mejorado
```vue
<div class="trip-header">
  <div class="trip-route">
    <i class="pi pi-arrow-right"></i>
    <strong>{{ trip.routeOrigin }} → {{ trip.routeDestination }}</strong>
  </div>
  <div class="trip-tags">
    <Tag :value="trip.busPlate" severity="info" icon="pi pi-car" />
    <Tag 
      v-if="trip.driverName || trip.mainDriverName" 
      :value="trip.driverName || trip.mainDriverName" 
      severity="success" 
      icon="pi pi-user" 
    />
  </div>
</div>
```

### 2. Validar Trip Antes de Vender ✅

Antes de permitir venta de tickets, validar que:
1. El trip existe
2. El trip tiene conductor asignado
3. El trip está en estado SCHEDULED

```typescript
if (!selectedTrip.value.mainDriverId && !selectedTrip.value.driverId) {
  notifyError('Este viaje no tiene conductor asignado. Contacte al administrador.')
  return
}
```

### 3. Mostrar Información del Conductor en Tickets ✅

En el diálogo de éxito de compra (`PurchaseSuccessDialog.vue`):
```vue
<div class="trip-detail">
  <i class="pi pi-user"></i>
  <span>Conductor: <strong>{{ ticket.driverName || 'Por asignar' }}</strong></span>
</div>
```

## Flujo de Verificación para Debugging

### Paso 1: Verificar RouteSheet
```bash
GET /hojas-de-ruta?cooperativeId={id}
```
Verificar:
- Existe al menos una con `status: ACTIVE`
- Tiene `details` con conductores asignados

### Paso 2: Verificar Trips Generados
```bash
GET /viajes?cooperativeId={id}&date={today}
```
Verificar:
- Existen trips para hoy
- Cada trip tiene `mainDriverId` no nulo

### Paso 3: Verificar Conductor Específico
```bash
GET /viajes/conductor
Authorization: Bearer {driver_token}
```
Verificar:
- El conductor autenticado ve sus trips asignados

### Paso 4: Verificar Tickets Vendidos
```bash
GET /purchases/{purchaseId}
```
Verificar:
- Los tickets tienen `tripId` válido
- El trip del ticket tiene conductor asignado

## Checklist de Solución

- [ ] Verificar que existe RouteSheet ACTIVA
- [ ] Verificar que RouteSheet tiene conductores asignados
- [ ] Ejecutar generación de trips: `POST /viajes/generar`
- [ ] Verificar que trips tienen `mainDriverId` no nulo
- [ ] Verificar que el usuario tiene rol DRIVER
- [ ] Actualizar frontend web para mostrar conductor
- [ ] Validar conductor antes de vender tickets
- [ ] Mostrar conductor en diálogo de éxito de compra

## Endpoints Relevantes

### Backend
- `POST /hojas-de-ruta/generar-automatica?cooperativeId={id}` - Genera RouteSheet
- `PUT /hojas-de-ruta/{id}` - Actualizar RouteSheet (cambiar a ACTIVE)
- `POST /viajes/generar?cooperativeId={id}` - Genera trips desde RouteSheet
- `GET /viajes?cooperativeId={id}` - Lista todos los trips
- `GET /viajes/conductor` - Lista trips del conductor autenticado
- `POST /purchases` - Crear compra (vender tickets)

### Frontend Web
- `TicketSaleView.vue` - Vista de venta de tickets
- `useTicketStore.ts` - Store de tickets
- `ticketService.ts` - Servicio de API de tickets

### Frontend Móvil
- `app/(driver-tabs)/index.tsx` - Vista principal del conductor
- `GET /viajes/conductor` - Carga trips del conductor

## Conclusión

El sistema está diseñado correctamente:
1. **Los conductores se asignan en la RouteSheet**
2. **Los trips se generan CON conductor asignado**
3. **La venta de tickets NO modifica la asignación del conductor**

Si un conductor no ve sus viajes, el problema está en la configuración inicial (RouteSheet o generación de trips), NO en el proceso de venta de tickets.

**Acción recomendada:**
1. Mostrar conductor en frontend web de venta
2. Validar que trip tiene conductor antes de vender
3. Verificar proceso de generación de RouteSheet y Trips

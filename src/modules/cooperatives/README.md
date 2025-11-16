# Módulo Cooperativas

Este módulo contiene la lógica front-end para gestionar cooperativas.

Estructura:

- `interfaces/` - DTOs y tipos TypeScript.
- `services/` - Llamadas a la API (`cooperativas`).
- `store/` - Pinia store para estado y acciones CRUD.
- `components/` - Componentes reutilizables (lista, formulario).
- `views/` - Vistas conectadas a las rutas del panel admin.

Endpoints usados (backend):

- `GET /api/cooperativas`
- `GET /api/cooperativas/activas`
- `GET /api/cooperativas/{id}`
- `POST /api/cooperativas` (ADMIN)
- `PUT /api/cooperativas/{id}` (ADMIN or COOPERATIVE)
- `DELETE /api/cooperativas/{id}` (ADMIN)
- `PATCH /api/cooperativas/{id}/desactivar` (ADMIN)

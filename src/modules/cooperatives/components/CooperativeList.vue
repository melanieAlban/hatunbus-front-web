<template>
  <div class="cooperative-list">
    <!-- Estado de carga -->
    <div v-if="store.loading" class="loading-state">
      <i class="pi pi-spinner pi-spin loading-icon"></i>
      <span>Cargando cooperativas...</span>
    </div>

    <!-- Contenido principal -->
    <div v-else class="content-wrapper">
      <!-- Mensaje de error -->
      <div v-if="store.error" class="error-message">
        <i class="pi pi-exclamation-triangle error-icon"></i>
        <span>{{ store.error }}</span>
      </div>

      <!-- Tabla de cooperativas -->
      <div class="table-container">
        <table class="modern-table">
          <thead class="table-header">
            <tr>
              <th class="table-head name-column">
                <span>Nombre</span>
              </th>
              <th class="table-head ruc-column">
                <span>RUC</span>
              </th>
              <th class="table-head email-column">
                <span>Email</span>
              </th>
              <th class="table-head phone-column">
                <span>Teléfono</span>
              </th>
              <th class="table-head state-column">
                <span>Estado</span>
              </th>
              <th class="table-head actions-column">
                <span>Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="c in filtered" :key="c.id" class="table-row">
              <td class="table-cell name-cell">
                <div class="name-content">
                  <i class="pi pi-car name-icon"></i>
                  <span class="name-text">{{ c.name }}</span>
                </div>
              </td>
              <td class="table-cell ruc-cell">
                <span class="ruc-text">{{ c.ruc }}</span>
              </td>
              
              <td class="table-cell email-cell">
                <div class="email-content">
                  <i class="pi pi-envelope email-icon"></i>
                  <span class="email-text">{{ c.email || '-' }}</span>
                </div>
              </td>
              <td class="table-cell phone-cell">
                <div class="phone-content">
                  <i class="pi pi-phone phone-icon"></i>
                  <span class="phone-text">{{ c.phone || '-' }}</span>
                </div>
              </td>
              <td class="table-cell state-cell">
                <span :class="['status-badge', c.active ? 'status-active' : 'status-inactive']">
                  <i :class="['status-icon', c.active ? 'pi pi-check-circle' : 'pi pi-times-circle']"></i>
                  {{ c.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="table-cell actions-cell">
                <div class="actions-group">
                  <button class="action-btn action-frequencies" @click="$emit('manageFrequencies', c)" title="Gestionar frecuencias">
                    <i class="pi pi-calendar"></i>
                    <span>Frecuencias</span>
                  </button>
                  <button class="action-btn action-edit" @click="$emit('edit', c)" title="Editar cooperativa">
                    <i class="pi pi-pencil"></i>
                    <span>Editar</span>
                  </button>
                  <button class="action-btn action-delete" @click="$emit('delete', c)" title="Eliminar cooperativa">
                    <i class="pi pi-trash"></i>
                    <span>Eliminar</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Estado vacío -->
        <div v-if="filtered.length === 0" class="empty-state">
          <i class="pi pi-inbox empty-icon"></i>
          <h3 class="empty-title">No se encontraron cooperativas</h3>
          <p class="empty-description">
            {{ q ? 'Intenta con otros términos de búsqueda' : 'No hay cooperativas registradas' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useCooperativeStore } from '../store/useCooperativeStore'
import type { CooperativeDto } from '../interfaces/cooperative.interface'

const props = defineProps<{ query?: string }>()
const emit = defineEmits<{
  (e: 'edit', item: CooperativeDto): void
  (e: 'delete', item: CooperativeDto): void
  (e: 'manageFrequencies', item: CooperativeDto): void
}>()

const store = useCooperativeStore()
const q = toRef(props, 'query')

const filtered = computed(() => {
  const list = store.items || []
  const term = (q.value || '').trim().toLowerCase()
  if (!term) return list
  return list.filter(i => {
    return [i.name, i.address, i.email, i.ruc, i.phone].some(field => 
      (field || '').toString().toLowerCase().includes(term)
    )
  })
})
</script>

<style scoped>
.cooperative-list {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Estados de carga y error */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--gray-medium);
  font-size: 1rem;
}

.loading-icon {
  font-size: 1.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  margin: 1rem;
  color: #c32020;
}

.error-icon {
  font-size: 1.25rem;
}

/* Tabla moderna */
.table-container {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg);
}

.table-header {
  background: var(--beige-bone);
  border-bottom: 2px solid var(--gray-light);
}

.table-head {
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 600;
  color: var(--app-text);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.table-body {
  background: var(--card-bg);
}

.table-row {
  border-bottom: 1px solid var(--gray-light);
  transition: all 0.2s ease;
}

.table-row:hover {
  background: rgba(0, 0, 0, 0.02);
}

.table-cell {
  padding: 1rem 1.25rem;
  vertical-align: middle;
}

/* Columnas específicas */
.name-column { min-width: 200px; }
.ruc-column { min-width: 120px; }
.address-column { min-width: 180px; }
.email-column { min-width: 200px; }
.phone-column { min-width: 140px; }
.state-column { min-width: 120px; }
.actions-column { min-width: 260px; }

/* Celdas con contenido enriquecido */
.name-content,
.address-content,
.email-content,
.phone-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.name-icon,
.address-icon,
.email-icon,
.phone-icon {
  color: var(--app-accent);
  font-size: 1rem;
  opacity: 0.7;
}

.name-text {
  font-weight: 600;
  color: var(--app-text);
}

.ruc-text {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: var(--app-text);
}

.address-text,
.email-text,
.phone-text {
  color: var(--app--text);
  font-size: 0.9rem;
}

/* Badges de estado */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-active {
  background: #e6f7ec;
  color: #2b8a3e;
  border: 1px solid #b2f2bb;
}

.status-inactive {
  background: #fff1f0;
  color: #c32020;
  border: 1px solid #ffa8a8;
}

.status-icon {
  font-size: 0.875rem;
}

/* Botones de acción */
.actions-group {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.action-frequencies {
  background: #2196F3;
  color: white;
}

.action-frequencies:hover {
  background: #1976D2;
  transform: translateY(-1px);
}

.action-edit {
  background: var(--app-accent);
  color: white;
}

.action-edit:hover {
  background: var(--app-accent);
  opacity: 0.9;
  transform: translateY(-1px);
}

.action-delete {
  background: transparent;
  color: #e53935;
  border: 1px solid #e53935;
}

.action-delete:hover {
  background: #e53935;
  color: white;
  transform: translateY(-1px);
}

/* Estado vacío */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--gray-medium);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--app-text);
}

.empty-description {
  font-size: 0.9rem;
  max-width: 300px;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .table-head,
  .table-cell {
    padding: 0.75rem 1rem;
  }
  
  .actions-group {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .action-btn {
    justify-content: center;
    padding: 0.375rem 0.5rem;
  }
  
  .action-btn span {
    display: none;
  }
  
  .name-content,
  .address-content,
  .email-content,
  .phone-content {
    gap: 0.25rem;
  }
}
</style>
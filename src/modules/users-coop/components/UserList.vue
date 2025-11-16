<template>
    <div class="user-list">
        <!-- Estado de carga -->
        <div v-if="store.loading" class="loading-state">
            <i class="pi pi-spinner pi-spin loading-icon"></i>
            <span>Cargando usuarios...</span>
        </div>

        <!-- Contenido principal -->
        <div v-else class="content-wrapper">
            <!-- Mensaje de error -->
            <div v-if="store.error" class="error-message">
                <i class="pi pi-exclamation-triangle error-icon"></i>
                <span>{{ store.error }}</span>
            </div>

            <!-- Tabla de usuarios -->
            <div class="table-container">
                <table class="modern-table">
                    <thead class="table-header">
                        <tr>
                            <th class="table-head name-column">
                                <div class="header-filter">
                                    <span>Nombre</span>
                                    <InputText v-model="filters.name" placeholder="Filtrar..." class="filter-input"
                                        @input="onFilterChange" />
                                </div>
                            </th>
                            <th class="table-head email-column">
                                <div class="header-filter">
                                    <span>Email</span>
                                    <InputText v-model="filters.email" placeholder="Filtrar..." class="filter-input"
                                        @input="onFilterChange" />
                                </div>
                            </th>
                            <th class="table-head role-column">
                                <div class="header-filter">
                                    <span>Rol</span>
                                    <Dropdown v-model="filters.role" :options="roleOptions" placeholder="Todos"
                                        class="filter-dropdown" optionLabel="label" optionValue="value"
                                        @change="onFilterChange" showClear />
                                </div>
                            </th>
                            <th class="table-head state-column">
                                <div class="header-filter">
                                    <span>Estado</span>
                                    <Dropdown v-model="filters.active" :options="statusOptions" placeholder="Todos"
                                        class="filter-dropdown" optionLabel="label" optionValue="value"
                                        @change="onFilterChange" showClear />
                                </div>
                            </th>
                            <th class="table-head actions-column">
                                <span>Acciones</span>
                                <Button v-if="hasActiveFilters" icon="pi pi-times"
                                    class="p-button-text p-button-sm clear-filters-btn" @click="clearFilters"
                                    v-tooltip="'Limpiar filtros'" />
                            </th>
                        </tr>
                    </thead>
                    <tbody class="table-body">
                        <tr v-for="u in paginatedUsers" :key="u.id" class="table-row">
                            <td class="table-cell name-cell">
                                <div class="name-content">
                                    <i class="pi pi-user name-icon"></i>
                                    <span class="name-text">{{ u.firstNames + ' ' + u.lastNames }}</span>
                                </div>
                            </td>
                            <td class="table-cell email-cell">
                                <div class="email-content">
                                    <i class="pi pi-envelope email-icon"></i>
                                    <span class="email-text">{{ u.email || '-' }}</span>
                                </div>
                            </td>
                            <td class="table-cell role-cell">
                                <span class="role-text">{{ translateRole(u.role) || '-' }}</span>
                            </td>
                            <td class="table-cell state-cell">
                                <span :class="['status-badge', u.active ? 'status-active' : 'status-inactive']">
                                    <i
                                        :class="['status-icon', u.active ? 'pi pi-check-circle' : 'pi pi-times-circle']"></i>
                                    {{ u.active ? 'Activo' : 'Inactivo' }}
                                </span>
                            </td>
                            <td class="table-cell actions-cell">
                                <div class="actions-group">
                                    <button class="action-btn action-edit" @click="$emit('edit', u)"
                                        title="Editar usuario">
                                        <i class="pi pi-pencil"></i>
                                        <span>Editar</span>
                                    </button>
                                    <!-- <button class="action-btn action-delete" @click="$emit('delete', u)"
                                        title="Eliminar usuario">
                                        <i class="pi pi-trash"></i>
                                        <span>Eliminar</span>
                                    </button> -->
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Estado vacío -->
                <div v-if="filteredUsers.length === 0" class="empty-state">
                    <i class="pi pi-users empty-icon"></i>
                    <p class="empty-description">
                        {{ hasActiveFilters ? 'Intenta con otros filtros' : 'No hay usuarios registrados' }}
                    </p>
                    <Button v-if="hasActiveFilters" icon="pi pi-times" label="Limpiar filtros"
                        class="p-button-outlined p-button-sm mt-2" @click="clearFilters" />
                </div>

                <!-- Paginación -->
                <div v-if="filteredUsers.length > 0" class="pagination-container">
                    <div class="pagination-info">
                        Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ filteredUsers.length }} usuarios
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn pagination-prev" @click="prevPage" :disabled="currentPage === 1"
                            title="Página anterior">
                            <i class="pi pi-chevron-left"></i>
                        </button>

                        <div class="pagination-pages">
                            <button v-for="page in visiblePages" :key="page" class="pagination-page"
                                :class="{ 'pagination-page-active': page === currentPage }" @click="goToPage(page)">
                                {{ page }}
                            </button>
                            <span v-if="showEllipsis" class="pagination-ellipsis">...</span>
                        </div>

                        <button class="pagination-btn pagination-next" @click="nextPage"
                            :disabled="currentPage === totalPages" title="Página siguiente">
                            <i class="pi pi-chevron-right"></i>
                        </button>
                    </div>
                    <div class="pagination-size">
                        <label for="pageSize" class="size-label">Mostrar:</label>
                        <select id="pageSize" v-model="pageSize" class="size-select" @change="onPageSizeChange">
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, toRef, ref, watch } from 'vue'
import { useUserStore } from '../store/useUserStore'
import { useAuthStore } from '../../auth/store/useAuthStore'
import type { UserCoopDto } from '../interfaces/user.interface'

// Components
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Tooltip from 'primevue/tooltip'

const props = defineProps<{ query?: string }>()
const emit = defineEmits<{
    (e: 'edit', item: UserCoopDto): void
    (e: 'delete', item: UserCoopDto): void
}>()

const store = useUserStore()
const authStore = useAuthStore()
const q = toRef(props, 'query')

// Verificar si el usuario logueado es COOPERATIVE
const isCooperative = computed(() => authStore.user?.role === 'COOPERATIVE')

// Filtros
const filters = ref({
    name: '',
    email: '',
    role: null,
    active: null
})

// Opciones para dropdowns con traducción de roles
const roleTranslations: Record<string, string> = {
    'CLIENT': 'Cliente',
    'ADMIN': 'Admin',
    'DRIVER': 'Conductor',
    'CLERK': 'Oficinista',
    'COOPERATIVE': 'Cooperativa'
}

const roleOptions = computed(() => {
    const roles = new Set(store.items?.map(item => item.role).filter(Boolean))
    return Array.from(roles).map(role => ({ 
        label: roleTranslations[role] || role, 
        value: role 
    }))
})

const statusOptions = ref([
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
])

// Función helper para traducir roles
const translateRole = (role: string) => {
    return roleTranslations[role] || role
}

// Paginación
const currentPage = ref(1)
const pageSize = ref(10)

// Computed properties
const hasActiveFilters = computed(() => {
    return Object.values(filters.value).some(value =>
        value !== null && value !== '' && value !== undefined
    )
})

const filteredUsers = computed(() => {
    let list = store.items || []

    // Si el usuario es COOPERATIVE, filtrar solo DRIVER y CLERK
    if (isCooperative.value) {
        list = list.filter(i => i.role === 'DRIVER' || i.role === 'CLERK')
    }

    // Aplicar filtro de búsqueda global
    const term = (q.value || '').trim().toLowerCase()
    if (term) {
        list = list.filter(i => {
            return [i.firstNames, i.lastNames, i.email, i.role].some(field =>
                (field || '').toString().toLowerCase().includes(term)
            )
        })
    }

    // Aplicar filtros individuales
    if (filters.value.name) {
        const nameFilter = filters.value.name.toLowerCase()
        list = list.filter(i =>
            `${i.firstNames} ${i.lastNames}`.toLowerCase().includes(nameFilter)
        )
    }

    if (filters.value.email) {
        const emailFilter = filters.value.email.toLowerCase()
        list = list.filter(i =>
            (i.email || '').toLowerCase().includes(emailFilter)
        )
    }

    if (filters.value.role !== null) {
        list = list.filter(i => i.role === filters.value.role)
    }

    if (filters.value.active !== null) {
        list = list.filter(i => i.active === filters.value.active)
    }

    return list
})

// Cálculos de paginación
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize.value))
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)
const endIndex = computed(() => Math.min(currentPage.value * pageSize.value, filteredUsers.value.length))
const paginatedUsers = computed(() =>
    filteredUsers.value.slice(startIndex.value, endIndex.value)
)

// Páginas visibles para la paginación
const visiblePages = computed(() => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages.value, start + maxVisible - 1)

    // Ajustar inicio si estamos cerca del final
    start = Math.max(1, end - maxVisible + 1)

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }
    return pages
})

const showEllipsis = computed(() => totalPages.value > visiblePages.value.length)

// Métodos de filtrado
const onFilterChange = () => {
    currentPage.value = 1 // Reset a primera página al cambiar filtros
}

const clearFilters = () => {
    filters.value = {
        name: '',
        email: '',
        role: null,
        active: null
    }
    currentPage.value = 1
}

// Métodos de paginación
const goToPage = (page: number) => {
    currentPage.value = page
}

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++
    }
}

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--
    }
}

const onPageSizeChange = () => {
    currentPage.value = 1 // Reset a primera página al cambiar tamaño
}

// Reset pagination when search changes
watch(q, () => {
    currentPage.value = 1
})
</script>

<style scoped>
.user-list {
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
    padding: 0.75rem 1.25rem;
    text-align: left;
    font-weight: 600;
    color: var(--app-text);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
}

.header-filter {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--gray-light);
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
}

:deep(.filter-dropdown) {
    width: 100%;
}

:deep(.filter-dropdown .p-dropdown) {
    width: 100%;
    background: white;
}

:deep(.filter-dropdown .p-dropdown .p-dropdown-label) {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

.clear-filters-btn {
    margin-top: 0.5rem;
    color: var(--gray-medium) !important;
}

.clear-filters-btn:hover {
    color: var(--app-accent) !important;
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
.name-column {
    min-width: 220px;
}

.email-column {
    min-width: 220px;
}

.role-column {
    min-width: 140px;
}

.state-column {
    min-width: 140px;
}

.actions-column {
    min-width: 160px;
}

/* Celdas con contenido enriquecido */
.name-content,
.email-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.name-icon,
.email-icon {
    color: var(--app-accent);
    font-size: 1rem;
    opacity: 0.7;
}

.name-text {
    font-weight: 600;
    color: var(--app-text);
}

.role-text {
    font-weight: 500;
    color: var(--app-text);
    background: var(--surface-50);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
}

.email-text {
    color: var(--app-text);
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

/* Paginación */
.pagination-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    background: var(--card-bg);
    border-top: 1px solid var(--gray-light);
    gap: 1rem;
}

.pagination-info {
    color: var(--gray-medium);
    font-size: 0.875rem;
    white-space: nowrap;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.pagination-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--gray-light);
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--app-text);
}

.pagination-btn:hover:not(:disabled) {
    background: var(--surface-50);
    border-color: var(--app-accent);
    color: var(--app-accent);
}

.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination-pages {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.pagination-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    border: 1px solid var(--gray-light);
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    color: var(--app-text);
}

.pagination-page:hover {
    background: var(--surface-50);
    border-color: var(--app-accent);
}

.pagination-page-active {
    background: var(--app-accent);
    border-color: var(--app-accent);
    color: white;
}

.pagination-ellipsis {
    padding: 0 0.5rem;
    color: var(--gray-medium);
    font-size: 0.875rem;
}

.pagination-size {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
}

.size-label {
    color: var(--gray-medium);
    font-size: 0.875rem;
}

.size-select {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--gray-light);
    border-radius: 6px;
    background: white;
    color: var(--app-text);
    font-size: 0.875rem;
    cursor: pointer;
    transition: border-color 0.2s ease;
}

.size-select:hover {
    border-color: var(--app-accent);
}

.size-select:focus {
    outline: none;
    border-color: var(--app-accent);
}

/* Responsive */
@media (max-width: 768px) {

    .table-head,
    .table-cell {
        padding: 0.75rem 1rem;
    }

    .header-filter {
        gap: 0.25rem;
    }

    .filter-input {
        padding: 0.375rem 0.5rem;
        font-size: 0.8rem;
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
    .email-content {
        gap: 0.25rem;
    }

    .name-column,
    .email-column {
        min-width: 150px;
    }

    .pagination-container {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }

    .pagination-info {
        order: 3;
    }

    .pagination-controls {
        order: 1;
    }

    .pagination-size {
        order: 2;
    }
}
</style>
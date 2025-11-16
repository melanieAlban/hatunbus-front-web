<template>
    <div class="bus-list">
        <!-- Estado de carga -->
        <div v-if="store.loading" class="loading-state">
            <i class="pi pi-spinner pi-spin loading-icon"></i>
            <span>Cargando buses...</span>
        </div>

        <!-- Contenido principal -->
        <div v-else class="content-wrapper">
            <!-- Mensaje de error -->
            <div v-if="store.error" class="error-message">
                <i class="pi pi-exclamation-triangle error-icon"></i>
                <span>{{ store.error }}</span>
            </div>

            <!-- Tabla de buses -->
            <div class="table-container">
                <table class="modern-table">
                    <thead class="table-header">
                        <tr>
                            <th class="table-head plate-column">
                                <div class="header-filter">
                                    <span>Placa</span>
                                    <InputText v-model="filters.plate" placeholder="Filtrar..." class="filter-input"
                                        @input="onFilterChange" />
                                </div>
                            </th>
                            <th class="table-head unit-column">
                                <div class="header-filter">
                                    <span>Unidad</span>
                                    <InputText v-model="filters.unitNumber" placeholder="Filtrar..." class="filter-input"
                                        @input="onFilterChange" />
                                </div>
                            </th>
                            <th class="table-head brand-column">
                                <div class="header-filter">
                                    <span>Marca Chasis</span>
                                    <InputText v-model="filters.chassisBrand" placeholder="Filtrar..." class="filter-input"
                                        @input="onFilterChange" />
                                </div>
                            </th>
                            <th class="table-head body-column">
                                <div class="header-filter">
                                    <span>Marca Carrocería</span>
                                    <InputText v-model="filters.bodyBrand" placeholder="Filtrar..." class="filter-input"
                                        @input="onFilterChange" />
                                </div>
                            </th>
                            <th class="table-head seats-column">
                                <div class="header-filter">
                                    <span>Asientos</span>
                                </div>
                            </th>
                            <th class="table-head status-column">
                                <div class="header-filter">
                                    <span>Estado</span>
                                    <Dropdown v-model="filters.status" :options="statusOptions" placeholder="Todos"
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
                        <tr v-for="bus in paginatedBuses" :key="bus.id" class="table-row">
                            <td class="table-cell plate-cell">
                                <div class="plate-content">
                                    <i class="pi pi-car plate-icon"></i>
                                    <span class="plate-text">{{ bus.plate }}</span>
                                </div>
                            </td>
                            <td class="table-cell unit-cell">
                                <span class="unit-text">{{ bus.unitNumber || '-' }}</span>
                            </td>
                            <td class="table-cell brand-cell">
                                <span class="brand-text">{{ bus.chassisBrand || '-' }}</span>
                            </td>
                            <td class="table-cell body-cell">
                                <span class="body-text">{{ bus.bodyBrand || '-' }}</span>
                            </td>
                            <td class="table-cell seats-cell">
                                <span class="seats-badge">
                                    <i class="pi pi-users"></i>
                                    {{ bus.seatCount }}
                                </span>
                            </td>
                            <td class="table-cell status-cell">
                                <span :class="['status-badge', `status-${bus.status.toLowerCase()}`]">
                                    <i :class="['status-icon', getStatusIcon(bus.status)]"></i>
                                    {{ translateStatus(bus.status) }}
                                </span>
                            </td>
                            <td class="table-cell actions-cell">
                                <div class="actions-group">
                                    <button class="action-btn action-view" @click="$emit('view', bus)"
                                        title="Ver detalles">
                                        <i class="pi pi-eye"></i>
                                        <span>Ver</span>
                                    </button>
                                    <button class="action-btn action-edit" @click="$emit('edit', bus)"
                                        title="Editar bus">
                                        <i class="pi pi-pencil"></i>
                                        <span>Editar</span>
                                    </button>
                                    <button class="action-btn action-delete" @click="$emit('delete', bus)"
                                        title="Eliminar bus">
                                        <i class="pi pi-trash"></i>
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Estado vacío -->
                <div v-if="filteredBuses.length === 0" class="empty-state">
                    <i class="pi pi-car empty-icon"></i>
                    <p class="empty-description">
                        {{ hasActiveFilters ? 'Intenta con otros filtros' : 'No hay buses registrados' }}
                    </p>
                    <Button v-if="hasActiveFilters" icon="pi pi-times" label="Limpiar filtros"
                        class="p-button-outlined p-button-sm mt-2" @click="clearFilters" />
                </div>

                <!-- Paginación -->
                <div v-if="filteredBuses.length > 0" class="pagination-container">
                    <div class="pagination-info">
                        Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ filteredBuses.length }} buses
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
import { useBusStore } from '../store/useBusStore'
import { BusStatus, type BusDto } from '../interfaces/bus.interface'

// Components
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Tooltip from 'primevue/tooltip'

const props = defineProps<{ query?: string }>()
const emit = defineEmits<{
    (e: 'edit', item: BusDto): void
    (e: 'delete', item: BusDto): void
}>()

const store = useBusStore()
const q = toRef(props, 'query')

// Filtros
const filters = ref({
    plate: '',
    unitNumber: '',
    chassisBrand: '',
    bodyBrand: '',
    status: null as BusStatus | null
})

// Opciones para dropdown de estado
const statusOptions = ref([
    { label: 'Activo', value: BusStatus.ACTIVE },
    { label: 'Inactivo', value: BusStatus.INACTIVE },
    { label: 'Mantenimiento', value: BusStatus.MAINTENANCE }
])

// Paginación
const currentPage = ref(1)
const pageSize = ref(10)

// Computed properties
const hasActiveFilters = computed(() => {
    return Object.values(filters.value).some(value =>
        value !== null && value !== '' && value !== undefined
    )
})

const filteredBuses = computed(() => {
    let list = store.items || []

    // Aplicar filtro de búsqueda global
    const term = (q.value || '').trim().toLowerCase()
    if (term) {
        list = list.filter(bus => {
            return [
                bus.plate,
                bus.unitNumber?.toString(),
                bus.chassisBrand,
                bus.bodyBrand,
                bus.status
            ].some(field =>
                (field || '').toString().toLowerCase().includes(term)
            )
        })
    }

    // Aplicar filtros individuales
    if (filters.value.plate) {
        const plateFilter = filters.value.plate.toLowerCase()
        list = list.filter(bus => bus.plate.toLowerCase().includes(plateFilter))
    }

    if (filters.value.unitNumber) {
        const unitFilter = filters.value.unitNumber
        list = list.filter(bus =>
            bus.unitNumber?.toString().includes(unitFilter)
        )
    }

    if (filters.value.chassisBrand) {
        const brandFilter = filters.value.chassisBrand.toLowerCase()
        list = list.filter(bus =>
            (bus.chassisBrand || '').toLowerCase().includes(brandFilter)
        )
    }

    if (filters.value.bodyBrand) {
        const bodyFilter = filters.value.bodyBrand.toLowerCase()
        list = list.filter(bus =>
            (bus.bodyBrand || '').toLowerCase().includes(bodyFilter)
        )
    }

    if (filters.value.status !== null) {
        list = list.filter(bus => bus.status === filters.value.status)
    }

    return list
})

// Cálculos de paginación
const totalPages = computed(() => Math.ceil(filteredBuses.value.length / pageSize.value))
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)
const endIndex = computed(() => Math.min(currentPage.value * pageSize.value, filteredBuses.value.length))
const paginatedBuses = computed(() =>
    filteredBuses.value.slice(startIndex.value, endIndex.value)
)

// Páginas visibles para la paginación
const visiblePages = computed(() => {
    const pages: number[] = []
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
        plate: '',
        unitNumber: '',
        chassisBrand: '',
        bodyBrand: '',
        status: null
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

// Helper functions
const translateStatus = (status: BusStatus): string => {
    const translations: Record<BusStatus, string> = {
        [BusStatus.ACTIVE]: 'Activo',
        [BusStatus.INACTIVE]: 'Inactivo',
        [BusStatus.MAINTENANCE]: 'Mantenimiento'
    }
    return translations[status] || status
}

const getStatusIcon = (status: BusStatus): string => {
    const icons: Record<BusStatus, string> = {
        [BusStatus.ACTIVE]: 'pi pi-check-circle',
        [BusStatus.INACTIVE]: 'pi pi-times-circle',
        [BusStatus.MAINTENANCE]: 'pi pi-wrench'
    }
    return icons[status] || 'pi pi-circle'
}

// Reset pagination when search changes
watch(q, () => {
    currentPage.value = 1
})
</script>

<style scoped>
.bus-list {
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
.plate-column {
    min-width: 180px;
}

.unit-column {
    min-width: 120px;
}

.brand-column {
    min-width: 180px;
}

.body-column {
    min-width: 180px;
}

.seats-column {
    min-width: 120px;
}

.status-column {
    min-width: 160px;
}

.actions-column {
    min-width: 200px;
}

/* Celdas con contenido enriquecido */
.plate-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.plate-icon {
    color: var(--app-accent);
    font-size: 1rem;
    opacity: 0.7;
}

.plate-text {
    font-weight: 600;
    color: var(--app-text);
    font-family: monospace;
    font-size: 1.1rem;
}

.unit-text,
.brand-text,
.body-text {
    color: var(--app-text);
    font-size: 0.9rem;
}

.seats-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    background: var(--surface-50);
    color: var(--app-text);
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

.status-maintenance {
    background: #fff9db;
    color: #e67700;
    border: 1px solid #ffd43b;
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

.action-view {
    background: #2196F3;
    color: white;
}

.action-view:hover {
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

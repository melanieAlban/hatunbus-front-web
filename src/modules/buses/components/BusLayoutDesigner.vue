<template>
  <div class="bus-layout-designer">
    <!-- Panel de herramientas lateral -->
    <div class="designer-container">
      <div class="sidebar-tools">
        <!-- Tipos de Asiento -->
        <div class="tool-category">
          <div class="category-header">
            <i class="pi pi-circle"></i>
            <h4>Asientos</h4>
          </div>
          <div class="tool-grid">
            <button v-for="tool in seatTools" :key="tool.type"
              :class="['tool-card', tool.type, { active: selectedTool === tool.type }]"
              @click="selectedTool = tool.type as any" draggable="true" @dragstart="onDragStart(tool.type)"
              @dragend="onDragEnd" :title="tool.label">
              <i :class="tool.icon"></i>
              <span>{{ tool.label }}</span>
            </button>
          </div>
        </div>

        <!-- Elementos Especiales -->
        <div class="tool-category">
          <div class="category-header">
            <i class="pi pi-building"></i>
            <h4>Elementos</h4>
          </div>
          <div class="tool-grid">
            <button v-for="tool in specialTools" :key="tool.type"
              :class="['tool-card', tool.type, { active: selectedTool === tool.type }]"
              @click="selectedTool = tool.type as any" draggable="true" @dragstart="onDragStart(tool.type)"
              @dragend="onDragEnd" :title="tool.label">
              <i :class="tool.icon"></i>
              <span>{{ tool.label }}</span>
            </button>
          </div>
        </div>

        <!-- Configuración del Grid -->
        <div class="tool-category">
          <div class="category-header">
            <i class="pi pi-cog"></i>
            <h4>Configuración</h4>
          </div>
          <div class="config-section">
            <div class="config-item">
              <label>
                <span>Filas</span>
                <input type="number" v-model.number="rows" min="6" max="15" @change="adjustGrid" />
              </label>
            </div>
            <div class="config-item">
              <label>
                <span>Columnas</span>
                <input type="number" :value="5" disabled title="Fijo: 2 asientos | pasillo | 2 asientos" />
              </label>
            </div>
          </div>
        </div>

        <!-- Acciones Rápidas -->
        <div class="tool-category">
          <div class="category-header">
            <i class="pi pi-bolt"></i>
            <h4>Acciones</h4>
          </div>
          <div class="quick-actions">
            <Button label="Auto-llenar" icon="pi pi-bolt" @click="autoFill" size="small" outlined class="action-btn" />
            <Button label="Limpiar Todo" icon="pi pi-trash" @click="clearAll" severity="danger" size="small" outlined
              class="action-btn" />
          </div>
        </div>
      </div>

      <!-- Área principal del bus -->
      <div class="main-area">
        <!-- Indicador de arrastre -->
        <div v-if="draggedTool" class="drag-indicator">
          <i class="pi pi-hand-pointer"></i>
          <span>Suelta sobre una celda para colocar: {{ getToolLabel(draggedTool) }}</span>
        </div>

        <div class="bus-container">
          <div class="bus-header">
            <i class="pi pi-arrow-up"></i>
            <span>Frente del Bus (Conductor)</span>
          </div>

          <div class="bus-layout" :style="gridStyle">
            <div v-for="(cell, index) in grid" :key="index" :class="['cell', cell.type, getCellClass(index), {
                selected: cell.selected,
                'drag-over': dragOverIndex === index,
                'editable': isCellEditable(index)
              }]" @click="handleCellClick(index)" @contextmenu.prevent="handleRightClick(index)"
              @dragover.prevent="onDragOver($event, index)" @drop="onDrop($event, index)"
              @dragleave="onDragLeave($event, index)">
              <div v-if="cell.type === 'seat'" class="seat-content">
                <i :class="getSeatIcon(cell.seatType)"></i>
                <span class="seat-number">{{ cell.number }}</span>
              </div>
              <div v-else-if="cell.type === 'bathroom'" class="special-content">
                <i class="pi pi-home"></i>
                <span>Baño</span>
              </div>
              <div v-else-if="cell.type === 'door'" class="special-content">
                <i class="pi pi-sign-in"></i>
                <span>Puerta</span>
              </div>
              <div v-else-if="cell.type === 'stairs'" class="special-content">
                <i class="pi pi-sort-alt"></i>
                <span>Escalera</span>
              </div>
              <div v-else-if="cell.type === 'aisle'" class="special-content">
                <i class="pi pi-box"></i>
                <span>Pasillo</span>
              </div>
              <div v-else-if="cell.type === 'empty'" class="empty-content">
                <!-- Espacio vacío -->
              </div>
            </div>
          </div>

          <div class="bus-footer">
            <i class="pi pi-arrow-down"></i>
            <span>Parte Trasera</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen al final -->
    <div class="summary-card">
      <div class="summary-header">
        <i class="pi pi-chart-bar"></i>
        <h4>Resumen de Configuración</h4>
      </div>
      <div class="summary-content">
        <div class="stat-card total">
          <div class="stat-icon">
            <i class="pi pi-ticket"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Asientos</span>
            <span class="stat-value">{{ totalSeats }}</span>
          </div>
        </div>
        <div class="stat-card normal" v-if="seatsByType.NORMAL > 0">
          <div class="stat-icon">
            <i class="pi pi-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Normal</span>
            <span class="stat-value">{{ seatsByType.NORMAL }}</span>
          </div>
        </div>
        <div class="stat-card vip" v-if="seatsByType.VIP > 0">
          <div class="stat-icon">
            <i class="pi pi-star"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">VIP</span>
            <span class="stat-value">{{ seatsByType.VIP }}</span>
          </div>
        </div>
        <div class="stat-card semi-bed" v-if="seatsByType.SEMI_BED > 0">
          <div class="stat-icon">
            <i class="pi pi-minus"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Semi-cama</span>
            <span class="stat-value">{{ seatsByType.SEMI_BED }}</span>
          </div>
        </div>
        <div class="stat-card bed" v-if="seatsByType.BED > 0">
          <div class="stat-icon">
            <i class="pi pi-align-justify"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Cama</span>
            <span class="stat-value">{{ seatsByType.BED }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Button from 'primevue/button'

// --- Definición de tipos para la corrección ---
// Definimos un tipo que englobe todas las herramientas para una mejor tipificación
type ToolType = 'seat-NORMAL' | 'seat-VIP' | 'seat-SEMI_BED' | 'seat-BED' | 'bathroom' | 'door' | 'stairs' | 'empty' | 'eraser'

// Asumimos la existencia de SeatType como estaba en el original
enum SeatType {
  NORMAL = 'NORMAL',
  VIP = 'VIP',
  SEMI_BED = 'SEMI_BED',
  BED = 'BED'
}

interface Cell {
  type: 'empty' | 'seat' | 'bathroom' | 'door' | 'stairs' | 'aisle'
  seatType?: SeatType
  number?: number
  selected?: boolean
}
// ----------------------------------------------


const props = defineProps<{
  initialRows?: number
  initialCols?: number
  initialSeats?: any[]
}>()

const emit = defineEmits<{
  (e: 'update:seats', seats: any[]): void
}>()

const rows = ref(props.initialRows || 10)
const cols = ref(5) // Fijo: 2 izq + pasillo + 2 der
const selectedTool = ref<ToolType>('seat-NORMAL') // Usamos ToolType
const grid = ref<Cell[]>([])
const draggedTool = ref<string | null>(null)
const dragOverIndex = ref<number | null>(null)
const isInitialized = ref(false) // Bandera para evitar que el watch reinicialice

const seatTools = [
  { type: 'seat-NORMAL', label: 'Normal', icon: 'pi pi-circle' },
  { type: 'seat-VIP', label: 'VIP', icon: 'pi pi-star' },
  { type: 'seat-SEMI_BED', label: 'Semi-cama', icon: 'pi pi-minus' },
  { type: 'seat-BED', label: 'Cama', icon: 'pi pi-align-justify' }
]

const specialTools = [
  { type: 'bathroom', label: 'Baño', icon: 'pi pi-home' },
  { type: 'door', label: 'Puerta', icon: 'pi pi-sign-in' },
  { type: 'stairs', label: 'Escalera', icon: 'pi pi-sort-alt' },
  { type: 'aisle', label: 'Pasillo', icon: 'pi pi-box' },
  { type: 'eraser', label: 'Borrar', icon: 'pi pi-eraser' }
]

// Combinar todas las herramientas para búsqueda
const allTools = [...seatTools, ...specialTools]

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
  gridTemplateRows: `repeat(${rows.value}, 1fr)`
}))

const totalSeats = computed(() => {
  return grid.value.filter(c => c.type === 'seat').length
})

const seatsByType = computed(() => {
  const counts = {
    NORMAL: 0,
    VIP: 0,
    SEMI_BED: 0,
    BED: 0
  }

  grid.value.forEach(cell => {
    if (cell.type === 'seat' && cell.seatType) {
      counts[cell.seatType]++
    }
  })

  return counts
})

// Función auxiliar para obtener etiqueta de herramienta
function getToolLabel(toolType: string): string {
  const tool = allTools.find(t => t.type === toolType)
  return tool?.label || toolType
}

// Función para verificar si una celda es editable
function isCellEditable(index: number): boolean {
  const col = index % cols.value
  const row = Math.floor(index / cols.value)
  // El pasillo central (columna 2) NO es editable, EXCEPTO en la última fila
  if (col === 2 && row !== rows.value - 1) return false
  return true
}

// Función para obtener clase especial por posición (pasillo)
function getCellClass(index: number) {
  const col = index % cols.value
  const row = Math.floor(index / cols.value)
  // Columna central es pasillo, EXCEPTO en la última fila
  if (col === 2 && row !== rows.value - 1) return 'aisle'
  return ''
}

// Drag & Drop functions
function onDragStart(toolType: string) {
  draggedTool.value = toolType
  // MODIFICACIÓN: Sincronizar selectedTool al inicio del arrastre.
  // Esto asegura que, si arrastras un Baño, el siguiente clic use el Baño.
  selectedTool.value = toolType as ToolType
}

function onDragEnd() {
  draggedTool.value = null
  dragOverIndex.value = null
}

function onDragOver(event: DragEvent, index: number) {
  event.preventDefault()

  // Solo permitir drag over en celdas editables
  if (!isCellEditable(index)) return

  dragOverIndex.value = index
}

function onDragLeave(event: DragEvent, index: number) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null
  }
}

function onDrop(event: DragEvent, index: number) {
  event.preventDefault()
  dragOverIndex.value = null

  // Verificar si la celda es editable
  if (!isCellEditable(index)) return

  if (!draggedTool.value) return

  applyToolToCell(index, draggedTool.value)

  // Se eliminó la línea de sincronización de selectedTool de aquí
  // porque ahora se hace en onDragStart, lo cual es más consistente.
}


function applyToolToCell(index: number, toolType: string) {
  if (!grid.value[index]) return

  // Crear el nuevo objeto según el tipo
  let newCell: Cell
  let needsRenumber = false
  
  if (toolType === 'eraser') {
    // Borrador: celda vacía
    // Si la celda era un asiento, necesitamos renumerar
    needsRenumber = grid.value[index].type === 'seat'
    newCell = { type: 'empty' }
  } else if (toolType.startsWith('seat-')) {
    // Colocar asiento - siempre renumerar
    needsRenumber = true
    const seatType = toolType.replace('seat-', '') as SeatType
    newCell = {
      type: 'seat',
      seatType: seatType
    }
  } else {
    // Colocar elemento especial (baño, puerta, escalera, pasillo)
    // Si la celda era un asiento, necesitamos renumerar
    needsRenumber = grid.value[index].type === 'seat'
    newCell = {
      type: toolType as 'bathroom' | 'door' | 'stairs' | 'aisle'
    }
  }
  
  // Usar splice para forzar reactividad en Vue 3
  grid.value.splice(index, 1, newCell)
  
  // Solo renumerar si afectamos asientos
  if (needsRenumber) {
    renumberSeats()
  }
  
  emitSeats()
}

function initializeGrid() {
  const totalCells = rows.value * cols.value
  grid.value = Array(totalCells).fill(null).map((_, index) => {
    const col = index % cols.value
    const row = Math.floor(index / cols.value)
    // Columna 2 (central) es pasillo, EXCEPTO en la última fila
    if (col === 2 && row !== rows.value - 1) {
      return { type: 'empty' } // Pasillo central protegido
    }
    return { type: 'empty' } // Otras celdas inicialmente vacías (incluyendo última fila col 2)
  })
}

function adjustGrid() {
  initializeGrid()
  emitSeats()
}

function handleCellClick(index: number) {
  // Verificar si la celda es editable
  if (!isCellEditable(index)) return

  // Usa selectedTool.value, que ahora está sincronizado por los clicks en los botones y por el onDragStart
  applyToolToCell(index, selectedTool.value)
}

function handleRightClick(index: number) {
  // Verificar si la celda es editable
  if (!isCellEditable(index)) return
  
  // Click derecho cicla entre tipos de asiento
  const cell = grid.value[index]
  if (!cell) return
  
  if (cell.type === 'seat') {
    const types = [SeatType.NORMAL, SeatType.VIP, SeatType.SEMI_BED, SeatType.BED]
    const currentIndex = types.indexOf(cell.seatType!)
    const nextIndex = (currentIndex + 1) % types.length
    
    // Usar splice para forzar reactividad
    grid.value.splice(index, 1, {
      ...cell,
      seatType: types[nextIndex]
    })
    
    renumberSeats()
    emitSeats()
  }
}

function renumberSeats() {
  let seatNumber = 1
  // Solo actualizar el número en asientos, sin tocar otras celdas
  for (let i = 0; i < grid.value.length; i++) {
    const cell = grid.value[i]
    if (cell && cell.type === 'seat') {
      // Usar splice para actualizar solo esta celda
      grid.value.splice(i, 1, {
        ...cell,
        number: seatNumber++
      })
    }
  }
}

function getSeatIcon(seatType?: SeatType) {
  switch (seatType) {
    case SeatType.VIP:
      return 'pi pi-star'
    case SeatType.SEMI_BED:
      return 'pi pi-minus'
    case SeatType.BED:
      return 'pi pi-align-justify'
    default:
      return 'pi pi-circle'
  }
}

function clearAll() {
  initializeGrid()
  emitSeats()
}

function autoFill() {
  // Auto-llenar con patrón estándar: 2 asientos | pasillo | 2 asientos
  // Crear un nuevo array en lugar de modificar el existente
  grid.value = grid.value.map((cell, index) => {
    const col = index % cols.value
    const row = Math.floor(index / cols.value)

    // Columna 2 (central): siempre pasillo
    if (col === 2) {
      return { type: 'empty' }
    }

    // Primera fila: puerta a la izquierda
    if (row === 0 && col === 0) {
      return { type: 'door' }
    }

    // Última fila: baño en las últimas columnas
    if (row === rows.value - 1 && col >= 3) {
      return { type: 'bathroom' }
    }

    // Resto: asientos normales
    return {
      type: 'seat',
      seatType: SeatType.NORMAL
    }
  })

  renumberSeats()
  emitSeats()
}

function emitSeats() {
  const seats = grid.value
    .filter(c => c.type === 'seat')
    .map(c => ({
      number: c.number!,
      type: c.seatType!,
      row: Math.floor(grid.value.indexOf(c) / cols.value) + 1,
      column: (grid.value.indexOf(c) % cols.value) + 1,
      floor: 1
    }))

  emit('update:seats', seats)
}

// Inicializar
initializeGrid()

// Si hay asientos iniciales, cargarlos (solo una vez al inicio)
watch(() => props.initialSeats, (seats) => {
  // Evitar que el watch reinicialice después de la carga inicial
  if (isInitialized.value) return
  
  if (seats && seats.length > 0) {
    // Reconstruir grid desde asientos
    initializeGrid()
    seats.forEach(seat => {
      const index = (seat.row - 1) * cols.value + (seat.column - 1)
      if (index >= 0 && index < grid.value.length && isCellEditable(index)) {
        grid.value[index] = {
          type: 'seat',
          seatType: seat.type,
          number: seat.number
        }
      }
    })
    renumberSeats()
  }
  
  // Marcar como inicializado para que no vuelva a ejecutarse
  isInitialized.value = true
}, { immediate: true })
</script>
<style scoped>
.bus-layout-designer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
}

/* Layout Container */
.designer-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* Sidebar */
.sidebar-tools {
  position: sticky;
  top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tool-category {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.category-header i {
  font-size: 1.1rem;
  color: var(--app-accent, #0d6efd);
}

.category-header h4 {
  margin: 0;
  font-size: 0.875rem;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

/* Tool Grid */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.75rem 0.5rem;
  border: 2px solid;
  border-radius: 10px;
  cursor: grab;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  min-height: 70px;
  user-select: none;
}

.tool-card:active {
  cursor: grabbing;
}

.tool-card i {
  font-size: 1.5rem;
  flex-shrink: 0;
  pointer-events: none;
}

.tool-card span {
  line-height: 1.2;
  pointer-events: none;
}

.tool-card:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tool-card.active {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  border-width: 3px;
}

/* Colores específicos para cada tipo de botón */
.tool-card.seat-NORMAL {
  background: linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%);
  border-color: #2196f3;
  color: #0d47a1;
}

.tool-card.seat-NORMAL:hover {
  background: linear-gradient(135deg, #bbdefb 0%, #e3f2fd 100%);
  border-color: #1976d2;
}

.tool-card.seat-NORMAL.active {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  border-color: #1565c0;
  color: white;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

.tool-card.seat-VIP {
  background: linear-gradient(135deg, #fff3e0 0%, #fffaf5 100%);
  border-color: #ff9800;
  color: #e65100;
}

.tool-card.seat-VIP:hover {
  background: linear-gradient(135deg, #ffe0b2 0%, #fff3e0 100%);
  border-color: #f57c00;
}

.tool-card.seat-VIP.active {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  border-color: #ef6c00;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

.tool-card.seat-SEMI_BED {
  background: linear-gradient(135deg, #f3e5f5 0%, #faf5fb 100%);
  border-color: #9c27b0;
  color: #6a1b9a;
}

.tool-card.seat-SEMI_BED:hover {
  background: linear-gradient(135deg, #e1bee7 0%, #f3e5f5 100%);
  border-color: #7b1fa2;
}

.tool-card.seat-SEMI_BED.active {
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
  border-color: #6a1b9a;
  color: white;
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.4);
}

.tool-card.seat-BED {
  background: linear-gradient(135deg, #e8f5e9 0%, #f5faf5 100%);
  border-color: #4caf50;
  color: #2e7d32;
}

.tool-card.seat-BED:hover {
  background: linear-gradient(135deg, #c8e6c9 0%, #e8f5e9 100%);
  border-color: #388e3c;
}

.tool-card.seat-BED.active {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  border-color: #2e7d32;
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.tool-card.bathroom {
  background: linear-gradient(135deg, #e1f5fe 0%, #f5fbff 100%);
  border-color: #03a9f4;
  color: #01579b;
}

.tool-card.bathroom:hover {
  background: linear-gradient(135deg, #b3e5fc 0%, #e1f5fe 100%);
  border-color: #0288d1;
}

.tool-card.bathroom.active {
  background: linear-gradient(135deg, #03a9f4 0%, #0288d1 100%);
  border-color: #01579b;
  color: white;
  box-shadow: 0 4px 12px rgba(3, 169, 244, 0.4);
}

.tool-card.door {
  background: linear-gradient(135deg, #fff9c4 0%, #fffef5 100%);
  border-color: #fbc02d;
  color: #f57f17;
}

.tool-card.door:hover {
  background: linear-gradient(135deg, #fff59d 0%, #fff9c4 100%);
  border-color: #f9a825;
}

.tool-card.door.active {
  background: linear-gradient(135deg, #fbc02d 0%, #f9a825 100%);
  border-color: #f57f17;
  color: white;
  box-shadow: 0 4px 12px rgba(251, 192, 45, 0.4);
}

.tool-card.stairs {
  background: linear-gradient(135deg, #fce4ec 0%, #fef5f8 100%);
  border-color: #e91e63;
  color: #880e4f;
}

.tool-card.stairs:hover {
  background: linear-gradient(135deg, #f8bbd0 0%, #fce4ec 100%);
  border-color: #c2185b;
}

.tool-card.stairs.active {
  background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
  border-color: #880e4f;
  color: white;
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.4);
}

.tool-card.aisle {
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
  border-color: #9e9e9e;
  color: #424242;
}

.tool-card.aisle:hover {
  background: linear-gradient(135deg, #eeeeee 0%, #f5f5f5 100%);
  border-color: #757575;
}

.tool-card.aisle.active {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
  border-color: #616161;
  color: white;
  box-shadow: 0 4px 12px rgba(158, 158, 158, 0.4);
}

.tool-card.eraser {
  background: linear-gradient(135deg, #ffebee 0%, #fff5f5 100%);
  border-color: #f44336;
  color: #b71c1c;
}

.tool-card.eraser:hover {
  background: linear-gradient(135deg, #ffcdd2 0%, #ffebee 100%);
  border-color: #e53935;
}

.tool-card.eraser.active {
  background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
  border-color: #c62828;
  color: white;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

/* Config Section */
.config-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.config-item {
  display: flex;
  flex-direction: column;
}

.config-item label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.config-item label span {
  color: #6c757d;
}

.config-item input {
  padding: 0.5rem 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s;
  font-size: 1.25rem;
}

.config-item input:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.config-item input:hover {
  border-color: #adb5bd;
}

.config-item input:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-btn {
  width: 100%;
}

/* Main Area */
.main-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Drag Indicator */
.drag-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

.drag-indicator i {
  font-size: 1.25rem;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.8;
  }
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-4px);
  }
}

/* Bus Container */
.bus-container {
  background: white;
  border: 2px solid #495057;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.bus-header,
.bus-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #495057 0%, #343a40 100%);
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  margin: -0.5rem 0 1.25rem 0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bus-header i,
.bus-footer i {
  font-size: 1.1rem;
}

.bus-footer {
  margin: 1.25rem 0 -0.5rem 0;
}

/* Grid Layout */
.bus-layout {
  display: grid;
  gap: 6px;
  padding: 1.5rem;
  background: linear-gradient(180deg, #f1f3f5 0%, #e9ecef 100%);
  border-radius: 12px;
  min-height: 350px;
  max-width: 600px;
  margin: 0 auto;
}

.cell {
  aspect-ratio: 0.85;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  background: white;
  position: relative;
  min-height: 50px;
  font-size: 0.75rem;
}

.cell:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
  border-width: 3px;
}

.cell.drag-over {
  background: rgba(13, 110, 253, 0.1);
  border-color: #0d6efd;
  border-style: dashed;
  border-width: 3px;
  transform: scale(1.05);
}

/* Pasillo central - siempre visible y no editable */
.cell.aisle {
  background: repeating-linear-gradient(45deg,
      #f8f9fa,
      #f8f9fa 10px,
      #e9ecef 10px,
      #e9ecef 20px) !important;
  border: 2px solid #adb5bd !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}

.cell.aisle:hover {
  transform: none !important;
  box-shadow: none !important;
  border-width: 2px !important;
  background: repeating-linear-gradient(45deg,
      #f8f9fa,
      #f8f9fa 10px,
      #e9ecef 10px,
      #e9ecef 20px) !important;
}

.cell.aisle::after {
  content: 'PASILLO';
  font-size: 0.6rem;
  font-weight: 700;
  color: #6c757d;
  letter-spacing: 1px;
}

.cell.empty:not(.aisle) {
  background: rgba(255, 255, 255, 0.3);
  border: 1px dashed #adb5bd;
  cursor: default;
}

.cell.empty:not(.aisle):hover {
  background: rgba(13, 110, 253, 0.05);
  border-color: #0d6efd;
  transform: scale(1.03);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-width: 2px;
}

.cell.seat {
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.cell.seat:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.cell.seat.seat-NORMAL {
  background: linear-gradient(135deg, #bbdefb 0%, #e3f2fd 100%);
  border-color: #1976d2;
  color: #0d47a1;
}

.cell.seat.seat-VIP {
  background: linear-gradient(135deg, #ffe082 0%, #fff3e0 100%);
  border-color: #f57c00;
  color: #e65100;
}

.cell.seat.seat-SEMI_BED {
  background: linear-gradient(135deg, #ce93d8 0%, #f3e5f5 100%);
  border-color: #7b1fa2;
  color: #4a148c;
}

.cell.seat.seat-BED {
  background: linear-gradient(135deg, #a5d6a7 0%, #e8f5e9 100%);
  border-color: #388e3c;
  color: #1b5e20;
}

.cell.bathroom {
  background: linear-gradient(135deg, #81d4fa 0%, #e1f5fe 100%);
  border-color: #0288d1;
  color: #01579b;
  font-size: 0.7rem;
}

.cell.door {
  background: linear-gradient(135deg, #fff59d 0%, #fff9c4 100%);
  border-color: #f9a825;
  color: #f57f17;
  font-size: 0.7rem;
}

.cell.stairs {
  background: linear-gradient(135deg, #f8bbd0 0%, #fce4ec 100%);
  border-color: #c2185b;
  color: #880e4f;
  font-size: 0.7rem;
}

.cell.aisle {
  background: repeating-linear-gradient(
    45deg,
    #f1f3f5,
    #f1f3f5 8px,
    #dee2e6 8px,
    #dee2e6 16px
  );
  border-color: #868e96;
  color: #495057;
  font-size: 0.7rem;
}

.seat-content,
.special-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.7rem;
  padding: 0.25rem;
}

.seat-content i {
  font-size: 1rem;
  opacity: 0.8;
}

.seat-number {
  font-weight: 800;
  font-size: 0.85rem;
  line-height: 1;
}

.special-content {
  text-align: center;
}

.special-content i {
  font-size: 1.2rem;
  margin-bottom: 0.1rem;
}

/* Summary Card */
.summary-card {
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
  color: white;
}

.summary-header i {
  font-size: 1.5rem;
}

.summary-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-content {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  border: 2px solid;
  flex: 1;
  min-width: 150px;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
}

.stat-icon i {
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;
}

.stat-card.total {
  background: linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%);
  border-color: #2196f3;
  color: #0d47a1;
}

.stat-card.total .stat-icon i {
  color: #2196f3;
}

.stat-card.normal {
  background: linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%);
  border-color: #2196f3;
  color: #0d47a1;
}

.stat-card.normal .stat-icon i {
  color: #2196f3;
}

.stat-card.vip {
  background: linear-gradient(135deg, #fff3e0 0%, #fffaf5 100%);
  border-color: #ff9800;
  color: #e65100;
}

.stat-card.vip .stat-icon i {
  color: #ff9800;
}

.stat-card.semi-bed {
  background: linear-gradient(135deg, #f3e5f5 0%, #faf5fb 100%);
  border-color: #9c27b0;
  color: #6a1b9a;
}

.stat-card.semi-bed .stat-icon i {
  color: #9c27b0;
}

.stat-card.bed {
  background: linear-gradient(135deg, #e8f5e9 0%, #f5faf5 100%);
  border-color: #4caf50;
  color: #2e7d32;
}

.stat-card.bed .stat-icon i {
  color: #4caf50;
}
</style>
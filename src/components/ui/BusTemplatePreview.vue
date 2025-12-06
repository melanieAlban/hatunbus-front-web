<template>
  <div class="bus-template-preview">
    <div v-if="isEmpty" class="empty-preview">
      <i class="pi pi-ban"></i>
      <small>Sin configuración</small>
    </div>
    <div v-else>
      <div class="preview-grid" :style="gridStyle">
        <div
          v-for="index in totalCells"
          :key="index"
          :class="getCellClass(index)"
        >
          <span v-if="getCellData(index)?.type === 'seat'" class="seat-number">
            {{ getCellData(index)?.number }}
          </span>
          <i v-else-if="getCellData(index)?.type === 'bathroom'" class="pi pi-home"></i>
          <i v-else-if="getCellData(index)?.type === 'door'" class="pi pi-sign-in"></i>
          <i v-else-if="getCellData(index)?.type === 'stairs'" class="pi pi-sort-alt"></i>
          <i v-else-if="getCellData(index)?.type === 'aisle'" class="pi pi-box"></i>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

interface Cell {
  type?: 'empty' | 'seat' | 'bathroom' | 'door' | 'stairs' | 'aisle'
  seatType?: 'NORMAL' | 'VIP' | 'SEMI_BED' | 'BED'
  number?: number
  row?: number
  column?: number
  floor?: number
}

interface Props {
  seatConfiguration?: Record<string, any>
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  rows: 10,
})

// Debug: Ver qué datos llegan
watch(() => props.seatConfiguration, (config) => {
  console.log('[BusTemplatePreview] seatConfiguration recibida:', config)
  if (config) {
    console.log('[BusTemplatePreview] Primeras 3 entradas:', Object.entries(config).slice(0, 3))
  }
}, { immediate: true })

const COLUMNS = 5

const totalCells = computed(() => props.rows * COLUMNS)

const isEmpty = computed(() => {
  return !props.seatConfiguration || Object.keys(props.seatConfiguration).length === 0
})

const gridStyle = computed(() => ({
  gridTemplateRows: `repeat(${props.rows}, 1fr)`,
}))

// Convertir el seatConfiguration a un mapa por posición de grid
// Generar el grid visual completo, numerando solo los asientos
const gridMap = computed(() => {
  const map = new Map<number, Cell>()
  if (!props.seatConfiguration) return map

  // 1. Mapear todos los elementos desde seatConfiguration (asientos y especiales)
  const seatIndexes: number[] = []
  for (const [key, cellData] of Object.entries(props.seatConfiguration)) {
    const gridIndex = parseInt(key) + 1
    if (["NORMAL", "VIP", "SEMI_BED", "BED"].includes(cellData)) {
      seatIndexes.push(gridIndex)
      map.set(gridIndex, { type: 'seat', seatType: cellData })
    } else if (["bathroom", "door", "stairs", "aisle"].includes(cellData)) {
      map.set(gridIndex, { type: cellData })
    }
  }

  // 2. Numerar solo los asientos, en orden de aparición visual
  let seatNumber = 1
  for (let i = 1; i <= props.rows * COLUMNS; i++) {
    const cell = map.get(i)
    if (cell && cell.type === 'seat') {
      cell.number = seatNumber++
    }
  }

  return map
})

// Nuevo: Computar el total de asientos reales
const realSeatCount = computed(() => {
  if (!props.seatConfiguration) return 0
  return Object.values(props.seatConfiguration).filter(v => ["NORMAL", "VIP", "SEMI_BED", "BED"].includes(v)).length
})

function getCellData(index: number): Cell | null {
  return gridMap.value.get(index) || null
}

function getCellClass(index: number): string {
  const column = ((index - 1) % COLUMNS) + 1
  const cell = getCellData(index)
  
  const classes = ['preview-cell']
  
  // Aisle column (column 3)
  if (column === 3 && !cell) {
    classes.push('aisle')
  }
  
  if (cell) {
    if (cell.type === 'seat' && cell.seatType) {
      classes.push('seat', cell.seatType.toLowerCase())
    } else if (cell.type && cell.type !== 'empty') {
      classes.push(cell.type)
    }
  }
  
  return classes.join(' ')
}
</script>

<style scoped>
.bus-template-preview {
  width: 100%;
  max-width: 200px;
  margin: 0 auto;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
  padding: 12px;
  background-color: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.preview-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 700;
  border-radius: 4px;
  background-color: #ffffff;
  color: #6c757d;
  transition: transform 0.2s;
}

/* Aisle styling */
.preview-cell.aisle {
  background: repeating-linear-gradient(
    45deg,
    #e9ecef,
    #e9ecef 4px,
    #f8f9fa 4px,
    #f8f9fa 8px
  );
  border: none;
}

/* Seat types */
.preview-cell.seat {
  border: 2px solid #dee2e6;
  color: white;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.preview-cell.seat.normal {
  background-color: #6c757d;
  border-color: #5a6268;
}

.preview-cell.seat.vip {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: #6366f1;
}

.preview-cell.seat.semi_bed {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  border-color: #14b8a6;
}

.preview-cell.seat.bed {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  border-color: #f59e0b;
}

/* Special elements */
.preview-cell.bathroom {
  background-color: #0ea5e9;
  color: white;
  border: 2px solid #0284c7;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.real-seat-count {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 1rem;
  color: #0d47a1;
  font-weight: 700;
}

.preview-cell.door {
  background-color: #10b981;
  color: white;
  border: 2px solid #059669;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.preview-cell.stairs {
  background-color: #f59e0b;
  color: white;
  border: 2px solid #d97706;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.preview-cell i {
  font-size: 12px;
}

.seat-number {
  font-size: 7px;
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  min-height: 150px;
}

.empty-preview i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.empty-preview small {
  font-size: 0.75rem;
  opacity: 0.7;
}
</style>

<template>
  <div class="seat-layout-designer">
    <div class="designer-header">
      <div>
        <h4>Plano de asientos</h4>
        <p class="designer-hint">
          {{ readonly ? 'Vista del plano actual del bus.' : 'Activa o desactiva los asientos tocando cada casilla para construir tu plano ideal.' }}
        </p>
      </div>
      <div class="seat-count-indicator" :class="{ mismatch: seatCountMismatch }">
        <div class="count-badge">
          <span class="count-number">{{ configuredSeats }}</span>
          <span class="count-divider">/</span>
          <span class="count-target">{{ targetSeatCountLabel }}</span>
        </div>
        <span class="count-label">
          {{ seatCountMismatch ? 'Ajusta el plano hasta coincidir con el total definido.' : 'Asientos configurados' }}
        </span>
      </div>
    </div>

    <div v-if="!isReadOnly" class="layout-actions">
      <button type="button" class="designer-btn subtle" @click="resetLayout">
        <i class="pi pi-undo"></i>
        Reiniciar plano
      </button>
      <small class="hint-text">
        Selecciona manualmente cada asiento y deja libre el pasillo central.
      </small>
      <small v-if="limitReached" class="hint-text warning">
        Alcanzaste el número máximo definido para este bus.
      </small>
    </div>

    <div class="bus-shell">
      <div class="bus-front">
        <span>Frente</span>
      </div>
      <div class="layout-grid" v-if="totalRows > 0">
        <div v-for="row in totalRows" :key="`row-${row}`" class="layout-row">
          <div class="seat-side">
            <div
              v-for="column in leftColumns"
              :key="`row-${row}-col-${column}`"
              class="seat-slot"
            >
              <button
                v-if="seatMap.get(`${row}-${column}`)"
                type="button"
                class="seat-cell active"
                :class="{ readonly: isReadOnly }"
                :disabled="isReadOnly"
                @click="toggleSeat(row, column)"
              >
                <span class="seat-code">{{ seatMap.get(`${row}-${column}`)?.code }}</span>
              </button>
              <button
                v-else
                type="button"
                class="seat-cell empty"
                :class="{ readonly: isReadOnly }"
                :disabled="isReadOnly"
                @click="toggleSeat(row, column)"
              >
                <i class="pi pi-plus"></i>
              </button>
            </div>
          </div>

          <div class="bus-aisle">
            <span v-if="row === 1">Pasillo</span>
          </div>

          <div class="seat-side">
            <div
              v-for="column in rightColumns"
              :key="`row-${row}-col-${column}`"
              class="seat-slot"
            >
              <button
                v-if="seatMap.get(`${row}-${column}`)"
                type="button"
                class="seat-cell active"
                :class="{ readonly: isReadOnly }"
                :disabled="isReadOnly"
                @click="toggleSeat(row, column)"
              >
                <span class="seat-code">{{ seatMap.get(`${row}-${column}`)?.code }}</span>
              </button>
              <button
                v-else
                type="button"
                class="seat-cell empty"
                :class="{ readonly: isReadOnly }"
                :disabled="isReadOnly"
                @click="toggleSeat(row, column)"
              >
                <i class="pi pi-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="bus-back">
        <span>Salida</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SeatLayoutItem } from '../interfaces/bus.interface'
import { SeatType } from '../interfaces/bus.interface'

const MAX_COLUMNS = 4
const leftColumns = [1, 2]
const rightColumns = [3, 4]

const props = defineProps<{
  seatCount: number | null
  modelValue: SeatLayoutItem[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SeatLayoutItem[]): void
}>()

const isReadOnly = computed(() => props.readonly ?? false)
const internalLayout = ref<SeatLayoutItem[]>([])
const seatLimit = computed(() =>
  props.seatCount && props.seatCount > 0 ? props.seatCount : null
)

const seatMap = computed(() => {
  const map = new Map<string, SeatLayoutItem>()
  internalLayout.value.forEach(seat => {
    if (seat.row && seat.column) {
      map.set(`${seat.row}-${seat.column}`, seat)
    }
  })
  return map
})

const configuredSeats = computed(() => internalLayout.value.length)
const seatCountMismatch = computed(() => {
  if (seatLimit.value == null) return false
  return configuredSeats.value !== seatLimit.value
})
const limitReached = computed(() => {
  if (seatLimit.value == null) return false
  return configuredSeats.value >= seatLimit.value
})
const targetSeatCountLabel = computed(() => {
  if (seatLimit.value == null) return 'sin límite'
  return seatLimit.value
})

const totalRows = computed(() => {
  const layoutRows = internalLayout.value.reduce(
    (max, seat) => Math.max(max, seat.row || 0),
    0
  )
  const targetRows = seatLimit.value
    ? Math.ceil(seatLimit.value / MAX_COLUMNS)
    : Math.ceil(configuredSeats.value / MAX_COLUMNS)
  return Math.max(layoutRows, targetRows, 1)
})

function emitLayout() {
  emit('update:modelValue', internalLayout.value.map(seat => ({ ...seat })))
}

function buildSeatCode(row: number, column: number) {
  const baseCharCode = 'A'.charCodeAt(0)
  const letter = String.fromCharCode(baseCharCode + (column - 1))
  return `${letter}${row}`
}

function toggleSeat(row: number, column: number) {
  if (isReadOnly.value) return
  const key = `${row}-${column}`
  if (seatMap.value.has(key)) {
    internalLayout.value = internalLayout.value.filter(
      seat => !(seat.row === row && seat.column === column)
    )
  } else {
    if (limitReached.value) return
    internalLayout.value = [
      ...internalLayout.value,
      {
        code: buildSeatCode(row, column),
        row,
        column,
        seatType: SeatType.NORMAL
      }
    ]
  }
  emitLayout()
}

function resetLayout() {
  if (isReadOnly.value) return
  internalLayout.value = []
  emitLayout()
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value || !value.length) {
      internalLayout.value = []
      return
    }
    internalLayout.value = value.map(item => ({ ...item }))
  },
  { immediate: true }
)

watch(
  () => props.seatCount,
  () => {
    if (isReadOnly.value) return
    internalLayout.value = internalLayout.value.map(item => ({ ...item }))
  }
)
</script>

<style scoped>
.seat-layout-designer {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 14px;
  padding: 1.25rem;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.designer-hint {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.seat-count-indicator {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.count-badge {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  font-weight: 600;
}

.count-number {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--app-accent);
}

.count-divider {
  color: var(--text-color-secondary);
}

.count-target {
  font-size: 1.05rem;
  color: var(--text-color);
}

.count-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.seat-count-indicator.mismatch .count-number,
.seat-count-indicator.mismatch .count-target {
  color: #d43c3c;
}

.layout-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.designer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.designer-btn:hover {
  background: var(--app-accent);
  color: #fff;
  border-color: var(--app-accent);
}

.designer-btn.subtle {
  border-style: dashed;
}

.hint-text {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
}

.hint-text.warning {
  color: #d43c3c;
  font-weight: 600;
}

.bus-shell {
  background: linear-gradient(135deg, #fdfdfd, #f5f5f5);
  border: 2px solid var(--surface-border);
  border-radius: 22px;
  padding: 1.5rem 1rem;
  position: relative;
  overflow: hidden;
}

.bus-front,
.bus-back {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.bus-front {
  top: 8px;
}

.bus-back {
  bottom: 8px;
}

.layout-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 0.5rem;
}

.layout-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
}

.seat-side {
  display: grid;
  grid-template-columns: repeat(2, minmax(32px, 1fr));
  gap: 0.45rem;
  justify-items: center;
}

.seat-slot {
  display: flex;
  justify-content: center;
}

.seat-cell {
  width: 38px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(90, 105, 150, 0.3);
  background: #ebf0ff;
  color: #4a5673;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.07);
}

.seat-cell.active {
  background: linear-gradient(135deg, #6080ff, #4658d6);
  color: white;
  border-color: transparent;
}

.seat-cell.empty {
  background: transparent;
  border-style: dashed;
  color: var(--text-color-secondary);
}

.seat-cell.readonly {
  cursor: default;
  opacity: 0.85;
}

.seat-cell i {
  font-size: 0.85rem;
}

.seat-code {
  font-size: 0.85rem;
}

.bus-aisle {
  width: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.bus-aisle::before {
  content: '';
  width: 1px;
  height: 80%;
  background: repeating-linear-gradient(
    to bottom,
    rgba(90, 105, 150, 0.4),
    rgba(90, 105, 150, 0.4) 6px,
    transparent 6px,
    transparent 12px
  );
}

.bus-aisle span {
  margin-top: 0.25rem;
  font-size: 0.6rem;
}

@media (max-width: 768px) {
  .layout-row {
    gap: 0.5rem;
  }

  .seat-cell {
    width: 34px;
    height: 38px;
  }

  .bus-aisle {
    width: 40px;
  }
}
</style>

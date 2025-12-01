<template>
  <section class="matrix-card">
    <div class="matrix-header">
      <div>
        <p class="eyebrow">Paso 3 · Matriz</p>
        <h3>Rotación Finita [Bus x Fecha]</h3>
        <p class="subtext">
          Previsualiza cómo se reparten las frecuencias confirmadas entre los buses del grupo.
        </p>
      </div>
      <div class="legend">
        <div class="legend-item">
          <span class="dot dot-trip"></span>
          <span>Trip</span>
        </div>
        <div class="legend-item">
          <span class="dot dot-rest"></span>
          <span>Parada</span>
        </div>
        <div class="legend-item">
          <span class="dot dot-inactive"></span>
          <span>Sin operación</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="state state-loading">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Generando matriz de previsualización...</span>
    </div>

    <div v-else-if="error" class="state state-error">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="hasData" class="matrix-scroll">
      <div class="matrix-grid" :style="gridStyle">
        <div class="cell cell-header cell-sticky tiny-col">#</div>
        <div class="cell cell-header cell-sticky freq-col">Frecuencia</div>
        <div class="cell cell-header cell-sticky state-col">Estado</div>
        <div
          v-for="date in matrix!.dates"
          :key="date"
          class="cell cell-header"
        >
          <span class="date-label">{{ formatDate(date) }}</span>
          <small class="date-sub">{{ formatDay(date) }}</small>
        </div>

        <template v-for="(row, idx) in gridRows" :key="row.key">
          <template v-if="row.cells && Object.keys(row.cells).length > 0">
            <div class="cell cell-sticky tiny-col cell-index">{{ idx + 1 }}</div>
            <div class="cell cell-sticky freq-col">
              <p class="bus-title">{{ row.label }}</p>
              <small class="bus-sub">{{ row.meta }}</small>
            </div>
            <div class="cell cell-sticky state-col">
              <span :class="['state-chip', stateClass(row.type)]">{{ stateLabel(row.type) }}</span>
            </div>

          <div
            v-for="date in matrix!.dates"
            :key="`${row.key}-${date}`"
            class="cell"
            :class="cellClass(row.cells[date]?.type)"
          >
            <template v-if="row.cells[date]?.type === 'TRIP'">
              <div v-if="row.cells[date]?.buses?.length > 0" class="trip-cell">
                <span
                  v-for="bus in row.cells[date].buses"
                  :key="bus"
                  class="trip-pill"
                >
                  {{ bus }}
                </span>
              </div>
              <div v-else class="empty-trip">
                <span class="muted-text">-</span>
              </div>
            </template>

            <template v-else-if="row.cells[date]?.type === 'REST'">
              <div v-if="row.cells[date]?.buses?.length > 0" class="rest-cell">
                <span class="rest-pill">P</span>
                <div class="rest-buses">
                  <small v-for="bus in row.cells[date].buses" :key="bus" class="rest-bus-num">
                    {{ bus }}
                  </small>
                </div>
              </div>
            </template>

            <template v-else>
              <!-- INACTIVE: Diagonal stripes with bus numbers if any -->
              <div v-if="row.cells[date]?.buses?.length > 0" class="inactive-cell">
                <small v-for="bus in row.cells[date].buses" :key="bus" class="inactive-bus">
                  {{ bus }}
                </small>
              </div>
            </template>
          </div>
          </template>
        </template>
      </div>
    </div>

    <div v-else class="state state-empty">
      <i class="pi pi-table"></i>
      <p>No hay datos de matriz para mostrar.</p>
      <small>Valida la cadena de frecuencias y presiona "Previsualizar matriz" para generar la rotación.</small>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MatrixAssignment, PreviewMatrixResponse } from '../interfaces/routeWizard.interface'

const props = defineProps<{
  matrix: PreviewMatrixResponse | null
  loading?: boolean
  error?: string | null
}>()

const hasData = computed(() => !!props.matrix && props.matrix.dates?.length && props.matrix.rows?.length)

const gridStyle = computed(() => {
  if (!props.matrix) return undefined
  const dateColumns = props.matrix.dates.length
  // Ensure minimum readable width for bus numbers
  const columns = `60px 280px 140px repeat(${dateColumns}, minmax(160px, 1fr))`
  return { gridTemplateColumns: columns }
})

type GridCell = { type: MatrixAssignment['type']; buses: string[] }
type GridRow = { key: string; label: string; meta: string; type: MatrixAssignment['type']; cells: Record<string, GridCell> }

const gridRows = computed<GridRow[]>(() => {
  if (!props.matrix) return []

  const map = new Map<string, GridRow>()

  // First pass: Create rows for all unique frequencies
  for (const busRow of props.matrix.rows) {
    for (const assignment of busRow.assignments) {
      const key =
        assignment.type === 'TRIP' && assignment.frequencyName
          ? `TRIP_${assignment.frequencyName}`
          : assignment.type === 'REST'
            ? 'REST_PARADA'
            : 'INACTIVE_GAP'

      if (!map.has(key)) {
        map.set(key, {
          key,
          label: assignment.frequencyName || (assignment.type === 'REST' ? 'Parada' : 'Sin servicio'),
          meta: assignment.type === 'TRIP' ? 'Viajes programados' : assignment.type === 'REST' ? 'Descanso rotativo' : 'Sin operación',
          type: assignment.type,
          cells: {},
        })
      }
    }
  }

  // Second pass: Initialize all cells with empty arrays
  for (const row of map.values()) {
    for (const date of props.matrix.dates) {
      row.cells[date] = { type: row.type, buses: [] }
    }
  }

  // Third pass: Populate bus assignments
  for (const busRow of props.matrix.rows) {
    for (const assignment of busRow.assignments) {
      const key =
        assignment.type === 'TRIP' && assignment.frequencyName
          ? `TRIP_${assignment.frequencyName}`
          : assignment.type === 'REST'
            ? 'REST_PARADA'
            : 'INACTIVE_GAP'

      const row = map.get(key)
      if (row && row.cells[assignment.date]) {
        row.cells[assignment.date].buses.push(busRow.busUnit)
      }
    }
  }

  return Array.from(map.values())
})

function cellClass(type?: MatrixAssignment['type']) {
  if (!type || type === 'INACTIVE') return 'cell-inactive'
  if (type === 'REST') return 'cell-rest'
  return 'cell-trip'
}

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`)
  const day = String(date.getDate()).padStart(2, '0')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${day} ${months[date.getMonth()] || ''}`
}

function formatDay(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`)
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return days[date.getDay()] || ''
}

function stateLabel(type: MatrixAssignment['type']) {
  if (type === 'REST') return 'Parada'
  if (type === 'INACTIVE') return 'Inactivo'
  return 'Trip'
}

function stateClass(type: MatrixAssignment['type']) {
  if (type === 'REST') return 'chip-rest'
  if (type === 'INACTIVE') return 'chip-inactive'
  return 'chip-trip'
}
</script>

<style scoped>
.matrix-card {
  background: #0b1224;
  border-radius: 16px;
  padding: 1.5rem;
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.8rem;
  color: #22d3ee;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.matrix-header h3 {
  margin: 0.25rem 0;
  font-size: 1.5rem;
}

.subtext {
  margin: 0;
  color: #cbd5e1;
}

.legend {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  font-size: 0.9rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-trip { background: #60a5fa; }
.dot-rest { background: #34d399; }
.dot-inactive { background: #94a3b8; }

.matrix-scroll {
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.matrix-grid {
  display: grid;
  min-width: 960px;
}

.cell {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 72px;
}

.cell-header {
  background: #0f172a;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 2;
  color: #f8fafc;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
}

.cell-sticky {
  position: sticky;
  z-index: 3;
  background: rgba(11, 18, 36, 0.98);
  backdrop-filter: blur(6px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.tiny-col {
  left: 0;
}

.freq-col {
  left: 60px;
}

.state-col {
  left: 340px;
}

.date-label {
  display: block;
  color: #f8fafc;
}

.date-sub {
  color: #cbd5e1;
}

.bus-title {
  margin: 0;
  font-weight: 700;
}

.bus-sub {
  margin: 0;
  color: #cbd5e1;
}

.cell-trip {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(96, 165, 250, 0.12));
  padding: 0.5rem;
}

.trip-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.trip-pill {
  background: rgba(59, 130, 246, 0.85);
  color: white;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.95rem;
  min-width: 50px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.empty-trip {
  color: #64748b;
  font-style: italic;
  font-size: 0.85rem;
}

.muted-text {
  opacity: 0.5;
}

.cell-rest {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(34, 197, 94, 0.12));
  padding: 0.5rem;
}

.rest-cell {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  align-items: center;
}

.rest-pill {
  display: inline-flex;
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  background: #10b981;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.rest-buses {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
}

.rest-bus-num {
  color: #6ee7b7;
  font-weight: 600;
  font-size: 0.8rem;
}

.cell-inactive {
  background: repeating-linear-gradient(
    45deg,
    rgba(148, 163, 184, 0.12),
    rgba(148, 163, 184, 0.12) 8px,
    rgba(148, 163, 184, 0.04) 8px,
    rgba(148, 163, 184, 0.04) 16px
  );
  padding: 0.5rem;
}

.inactive-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
}

.inactive-bus {
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.8rem;
  opacity: 0.7;
}

.state-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
}

.chip-trip {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.chip-rest {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.chip-inactive {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
}

.state-loading {
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.04);
}

.state-error {
  color: #fecdd3;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
}

.state-empty {
  flex-direction: column;
  align-items: flex-start;
  color: #cbd5e1;
  gap: 0.25rem;
}

.state-empty i {
  color: #94a3b8;
}

@media (max-width: 900px) {
  .matrix-header {
    flex-direction: column;
  }

  .legend {
    align-self: flex-start;
  }
}
</style>

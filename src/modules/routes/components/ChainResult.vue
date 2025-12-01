<template>
  <section class="chain-card">
    <div class="chain-header">
      <div>
        <p class="eyebrow">Paso 2 · Encadenado automático</p>
        <h3>Cadena confirmada</h3>
        <p class="subtext">
          Visualiza cómo el backend enlazó las frecuencias y qué se quedó fuera de la rotación.
        </p>
      </div>
      <div class="status-pill" :class="statusClass">
        <i :class="statusIcon"></i>
        <span>{{ statusText }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-block">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Calculando encadenado...</span>
    </div>

    <div v-else class="timeline-wrapper" :class="{ 'timeline-empty': !orderedChain.length }">
      <div v-if="orderedChain.length" class="timeline" :style="timelineStyle">
        <div v-for="(freq, idx) in orderedChain" :key="freq.id" class="timeline-node">
          <div class="node-index">#{{ idx + 1 }}</div>
          <div class="node-body">
            <p class="node-title">{{ freq.name }}</p>
            <p v-if="freq.details" class="node-detail">{{ freq.details }}</p>
          </div>
          <div v-if="idx < orderedChain.length - 1" class="node-connector">
            <div class="connector-line"></div>
            <i class="pi pi-arrow-right connector-icon"></i>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <i class="pi pi-link"></i>
        <p>Sin cadena confirmada todavía.</p>
        <small>Selecciona frecuencias y ejecuta la validación para ver el orden sugerido.</small>
      </div>
    </div>

    <div class="discarded" v-if="discardedFrequencies.length">
      <div class="discarded-header">
        <i class="pi pi-exclamation-triangle"></i>
        <div>
          <p class="discarded-title">Frecuencias excluidas</p>
          <small>Estas no entraron en la rotación por falta de conexión.</small>
        </div>
      </div>
      <ul class="discarded-list">
        <li v-for="freq in discardedFrequencies" :key="freq.id">
          <div class="pill pill-error">{{ freq.name }}</div>
          <span class="reason">{{ freq.reason }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChainedFrequency, DiscardedFrequency } from '../interfaces/routeWizard.interface'

const props = defineProps<{
  orderedChain: ChainedFrequency[]
  discardedFrequencies: DiscardedFrequency[]
  isValid: boolean | null
  loading?: boolean
}>()

const statusClass = computed(() => {
  if (props.loading) return 'pill-info'
  if (props.isValid === true) return 'pill-success'
  if (props.isValid === false) return 'pill-error'
  return 'pill-secondary'
})

const statusIcon = computed(() => {
  if (props.loading) return 'pi pi-spin pi-spinner'
  if (props.isValid === true) return 'pi pi-check-circle'
  if (props.isValid === false) return 'pi pi-times-circle'
  return 'pi pi-info-circle'
})

const statusText = computed(() => {
  if (props.loading) return 'Validando'
  if (props.isValid === true) return 'Cadena válida'
  if (props.isValid === false) return 'Requiere ajustes'
  return 'Pendiente'
})

const timelineStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.max(props.orderedChain.length, 1)}, minmax(220px, 1fr))`,
}))
</script>

<style scoped>
.chain-card {
  background: linear-gradient(135deg, #0f172a 0%, #111827 70%);
  color: #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.chain-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #22d3ee;
}

.chain-header h3 {
  margin: 0.25rem 0;
  font-size: 1.5rem;
  color: #f8fafc;
}

.subtext {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.95rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.status-pill i {
  font-size: 1rem;
}

.pill-success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.pill-error {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

.pill-info {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
}

.pill-secondary {
  background: rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
}

.timeline-wrapper {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  padding: 1rem;
  overflow-x: auto;
}

.timeline {
  display: grid;
  gap: 1rem;
  align-items: stretch;
}

.timeline-node {
  position: relative;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04));
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 12px;
  padding: 1rem;
  min-height: 120px;
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.15);
}

.node-index {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  font-weight: 700;
  color: #bfdbfe;
}

.node-title {
  margin: 0 0 0.35rem 0;
  font-size: 1.05rem;
  color: #f8fafc;
}

.node-detail {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.9rem;
}

.node-connector {
  position: absolute;
  top: 50%;
  right: -0.75rem;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
  gap: 0.25rem;
}

.connector-line {
  width: 28px;
  height: 2px;
  background: rgba(148, 163, 184, 0.5);
}

.connector-icon {
  color: #60a5fa;
}

.loading-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: #cbd5e1;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 0.35rem;
  padding: 1.25rem;
  color: #cbd5e1;
}

.empty-state i {
  font-size: 1.4rem;
  color: #94a3b8;
}

.discarded {
  margin-top: 1.25rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 12px;
  padding: 1rem;
}

.discarded-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  color: #fecdd3;
  margin-bottom: 0.75rem;
}

.discarded-title {
  margin: 0;
  color: #fecdd3;
  font-weight: 700;
}

.discarded-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.discarded-list li {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}

.pill-error {
  background: rgba(248, 113, 113, 0.25);
  color: #fecdd3;
}

.reason {
  color: #f8fafc;
  font-size: 0.9rem;
}

@media (max-width: 1024px) {
  .timeline {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .node-connector {
    display: none;
  }
}
</style>

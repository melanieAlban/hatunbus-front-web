<template>
  <div class="dashboard">
    <h1 class="dashboard-title">Dashboard</h1>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: var(--coop-primary-color, #8B7355)"></i>
      <p>Cargando datos del dashboard...</p>
    </div>

    <!-- Content -->
    <div v-else>
    <!-- KPIs Cards -->
    <div class="kpi-grid">
      <Card class="kpi-card">
        <template #content>
          <div class="kpi-content">
            <div class="kpi-icon" style="background: rgba(var(--coop-primary-rgb, 139, 115, 85), 0.1)">
              <i class="pi pi-dollar" style="color: var(--coop-primary-color, #8B7355)"></i>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Ingresos del Mes</span>
              <span class="kpi-value">{{ formatCurrency(stats.totalRevenue) }}</span>
              <span class="kpi-change positive" v-if="stats.revenueGrowth > 0">
                <i class="pi pi-arrow-up"></i> {{ stats.revenueGrowth }}%
              </span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="kpi-card">
        <template #content>
          <div class="kpi-content">
            <div class="kpi-icon" style="background: rgba(var(--coop-primary-rgb, 139, 115, 85), 0.1)">
              <i class="pi pi-users" style="color: var(--coop-primary-color, #8B7355)"></i>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Pasajeros Totales</span>
              <span class="kpi-value">{{ stats.totalPassengers.toLocaleString() }}</span>
              <span class="kpi-change positive" v-if="stats.passengersGrowth > 0">
                <i class="pi pi-arrow-up"></i> {{ stats.passengersGrowth }}%
              </span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="kpi-card">
        <template #content>
          <div class="kpi-content">
            <div class="kpi-icon" style="background: rgba(var(--coop-primary-rgb, 139, 115, 85), 0.1)">
              <i class="pi pi-car" style="color: var(--coop-primary-color, #8B7355)"></i>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Viajes Completados</span>
              <span class="kpi-value">{{ stats.completedTrips }}</span>
              <span class="kpi-change">
                Este mes
              </span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="kpi-card">
        <template #content>
          <div class="kpi-content">
            <div class="kpi-icon" style="background: rgba(var(--coop-primary-rgb, 139, 115, 85), 0.1)">
              <i class="pi pi-percentage" style="color: var(--coop-primary-color, #8B7355)"></i>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Ocupación Promedio</span>
              <span class="kpi-value">{{ stats.avgOccupancy }}%</span>
              <span class="kpi-change">
                Últimos 30 días
              </span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <Card class="chart-card">
        <template #title>Ingresos vs Gastos (Últimos 7 días)</template>
        <template #content>
          <canvas ref="revenueExpensesChart"></canvas>
        </template>
      </Card>

      <Card class="chart-card">
        <template #title>Top 5 Conductores</template>
        <template #content>
          <canvas ref="driversChart"></canvas>
        </template>
      </Card>
    </div>

    <!-- Second Charts Row -->
    <div class="charts-row">
      <Card class="chart-card">
        <template #title>Pasajeros por Día</template>
        <template #content>
          <canvas ref="passengersChart"></canvas>
        </template>
      </Card>

      <Card class="chart-card">
        <template #title>Ocupación por Bus</template>
        <template #content>
          <canvas ref="occupancyChart"></canvas>
        </template>
      </Card>
    </div>

    <!-- Recent Activity -->
    <Card class="activity-card">
      <template #title>Actividad Reciente</template>
      <template #content>
        <div class="activity-list" v-if="recentTrips.length > 0">
          <div v-for="trip in recentTrips" :key="trip.id" class="activity-item">
            <div class="activity-icon">
              <i class="pi pi-check-circle" style="color: var(--coop-primary-color, #8B7355)"></i>
            </div>
            <div class="activity-details">
              <strong>{{ trip.routeName }}</strong>
              <span class="activity-meta">
                {{ trip.driverName }} • {{ trip.busPlate }} • {{ trip.passengers }} pasajeros
              </span>
            </div>
            <div class="activity-time">
              {{ formatTime(trip.date) }}
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-inbox"></i>
          <span>No hay actividad reciente</span>
        </div>
      </template>
    </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Card from 'primevue/card'
import { Chart, registerables } from 'chart.js'
import { useCooperativeCustomization } from '../../../composables/useCooperativeCustomization'
import { fetchCompletedTrips } from '../../../services/reportService'
import { getPurchasesByCooperative } from '../../sales/services/saleService'
import { useAuthStore } from '../../auth/store/useAuthStore'

Chart.register(...registerables)

const { colors } = useCooperativeCustomization()
const authStore = useAuthStore()

// Referencias a los canvas
const revenueExpensesChart = ref<HTMLCanvasElement>()
const driversChart = ref<HTMLCanvasElement>()
const passengersChart = ref<HTMLCanvasElement>()
const occupancyChart = ref<HTMLCanvasElement>()

// Referencias a las instancias de Chart
let revenueExpensesChartInstance: Chart | null = null
let driversChartInstance: Chart | null = null
let passengersChartInstance: Chart | null = null
let occupancyChartInstance: Chart | null = null

// Estadísticas
const stats = ref({
  totalRevenue: 0,
  revenueGrowth: 0,
  totalPassengers: 0,
  passengersGrowth: 0,
  completedTrips: 0,
  avgOccupancy: 0,
})

// Actividad reciente
const recentTrips = ref<any[]>([])

// Datos para gráficos
const driversData = ref<any[]>([])
const dailyData = ref<any[]>([])
const busOccupancy = ref<any[]>([])

// Estado de carga
const loading = ref(true)

async function loadDashboardData() {
  try {
    loading.value = true
    
    const cooperativeId = authStore.user?.cooperativeId
    
    // Cargar viajes completados de la cooperativa
    const trips = await fetchCompletedTrips(cooperativeId)
    
    // Calcular estadísticas desde los viajes
    let totalPassengers = 0
    let totalTrips = trips.length

    trips.forEach((trip: any) => {
      totalPassengers += trip.occupiedSeats || 0
    })

    // Cargar ventas de la cooperativa para calcular ingresos reales
    let totalRevenue = 0
    if (cooperativeId) {
      try {
        const purchases = await getPurchasesByCooperative(cooperativeId)
        // Sumar el totalAmount de todas las ventas
        totalRevenue = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0)
      } catch (err) {
        console.error('Error al cargar ventas para ingresos:', err)
      }
    }

    stats.value.totalRevenue = totalRevenue
    stats.value.totalPassengers = totalPassengers
    stats.value.completedTrips = totalTrips
    stats.value.avgOccupancy = totalTrips > 0 ? Math.round((totalPassengers / (totalTrips * 40)) * 100) : 0

    // Viajes recientes (últimos 5)
    recentTrips.value = trips.slice(0, 5).map((trip: any) => ({
      id: trip.id,
      routeName: trip.routeName || 'Sin ruta',
      driverName: trip.driverName || trip.mainDriverName || 'Sin conductor',
      busPlate: trip.busPlate || 'Sin placa',
      passengers: trip.occupiedSeats || 0,
      date: new Date(trip.scheduledDepartureTime || trip.date),
    }))
    
    console.log('Viajes recientes:', recentTrips.value)

    // Calcular datos diarios (últimos 7 días)
    const today = new Date()
    dailyData.value = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - (6 - i))
      const dayTrips = trips.filter((t: any) => {
        const tripDate = new Date(t.scheduledDepartureTime || t.date)
        return tripDate.toDateString() === date.toDateString()
      })
      // Estimar ingresos: asumiendo $2.50 por pasajero (precio promedio)
      const avgTicketPrice = 2.50
      return {
        date,
        revenue: dayTrips.reduce((sum: number, t: any) => sum + (avgTicketPrice * (t.occupiedSeats || 0)), 0),
        expenses: dayTrips.reduce((sum: number, t: any) => sum + (avgTicketPrice * (t.occupiedSeats || 0) * 0.6), 0),
        passengers: dayTrips.reduce((sum: number, t: any) => sum + (t.occupiedSeats || 0), 0),
      }
    })
    
    console.log('Datos diarios:', dailyData.value)

    // Agrupar por bus
    const busList: any = {}
    trips.forEach((trip: any) => {
      const plate = trip.busPlate || 'Sin placa'
      if (!busList[plate]) {
        busList[plate] = { totalSeats: 0, occupiedSeats: 0, trips: 0 }
      }
      const busSeats = trip.busSeatsCount || 40
      busList[plate].totalSeats += busSeats
      busList[plate].occupiedSeats += trip.occupiedSeats || 0
      busList[plate].trips++
    })

    busOccupancy.value = Object.entries(busList)
      .map(([plate, data]: [string, any]) => ({
        plate,
        occupancy: data.totalSeats > 0 ? Math.round((data.occupiedSeats / data.totalSeats) * 100) : 0,
      }))
      .sort((a, b) => b.occupancy - a.occupancy)
      .slice(0, 5)
      
    console.log('Ocupación por bus:', busOccupancy.value)

  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 1000 / 60)
  const hours = Math.floor(minutes / 60)
  
  if (minutes < 60) return `Hace ${minutes} min`
  if (hours < 24) return `Hace ${hours} h`
  return date.toLocaleDateString('es-EC')
}

function getCoopColor(alpha: number = 1): string {
  const primary = colors.value.primary || '#8B7355'
  // Convertir hex a rgba
  const hex = primary.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getCoopSecondaryColor(alpha: number = 1): string {
  const secondary = colors.value.secondary || '#A0826D'
  const hex = secondary.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function initCharts() {
  // Chart 1: Ingresos vs Gastos
  if (revenueExpensesChart.value && dailyData.value.length > 0) {
    const ctx = revenueExpensesChart.value.getContext('2d')
    if (ctx) {
      const labels = dailyData.value.map(d => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        return days[d.date.getDay()]
      })
      
      revenueExpensesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Ingresos',
              data: dailyData.value.map(d => d.revenue),
              borderColor: getCoopColor(),
              backgroundColor: getCoopColor(0.1),
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Gastos',
              data: dailyData.value.map(d => d.expenses),
              borderColor: '#e74c3c',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '$' + value,
              },
            },
          },
        },
      })
    }
  }

  // Chart 2: Top Conductores
  if (driversChart.value && driversData.value.length > 0) {
    const ctx = driversChart.value.getContext('2d')
    if (ctx) {
      const topDrivers = [...driversData.value]
        .sort((a, b) => b.totalTrips - a.totalTrips)
        .slice(0, 5)
      
      driversChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topDrivers.map(d => d.driverName),
          datasets: [
            {
              label: 'Viajes',
              data: topDrivers.map(d => d.totalTrips),
              backgroundColor: getCoopColor(0.8),
              borderColor: getCoopColor(),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              beginAtZero: true,
            },
          },
        },
      })
    }
  }

  // Chart 3: Pasajeros por Día
  if (passengersChart.value && dailyData.value.length > 0) {
    const ctx = passengersChart.value.getContext('2d')
    if (ctx) {
      const labels = dailyData.value.map(d => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        return days[d.date.getDay()]
      })
      
      passengersChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Pasajeros',
              data: dailyData.value.map(d => d.passengers),
              backgroundColor: getCoopSecondaryColor(0.8),
              borderColor: getCoopSecondaryColor(),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    }
  }

  // Chart 4: Ocupación por Bus
  if (occupancyChart.value && busOccupancy.value.length > 0) {
    const ctx = occupancyChart.value.getContext('2d')
    if (ctx) {
      occupancyChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: busOccupancy.value.map(b => b.plate),
          datasets: [
            {
              data: busOccupancy.value.map(b => b.occupancy),
              backgroundColor: busOccupancy.value.map((_, i) => {
                if (i === 0) return getCoopColor(0.9)
                if (i === 1) return getCoopColor(0.7)
                if (i === 2) return getCoopColor(0.5)
                if (i === 3) return getCoopSecondaryColor(0.7)
                return getCoopSecondaryColor(0.5)
              }),
              borderWidth: 2,
              borderColor: '#fff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'right',
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return context.label + ': ' + context.parsed + '%'
                },
              },
            },
          },
        },
      })
    }
  }
}

function destroyCharts() {
  revenueExpensesChartInstance?.destroy()
  driversChartInstance?.destroy()
  passengersChartInstance?.destroy()
  occupancyChartInstance?.destroy()
}

onMounted(async () => {
  await loadDashboardData()
  // Esperar un tick para que los canvas estén renderizados
  setTimeout(() => {
    initCharts()
  }, 100)
})

onUnmounted(() => {
  destroyCharts()
})
</script>

<style scoped>
.dashboard {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
}

.loading-container p {
  color: #718096;
  font-size: 1.1rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.kpi-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon i {
  font-size: 1.75rem;
}

.kpi-data {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.kpi-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d3748;
  line-height: 1.2;
}

.kpi-change {
  font-size: 0.8rem;
  color: #718096;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.kpi-change.positive {
  color: #38a169;
  font-weight: 600;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.chart-card canvas {
  height: 300px !important;
}

.activity-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid var(--coop-primary-color, #8B7355);
}

.activity-icon {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon i {
  font-size: 1.25rem;
}

.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-details strong {
  color: #2d3748;
  font-size: 1rem;
}

.activity-meta {
  font-size: 0.875rem;
  color: #718096;
}

.activity-time {
  font-size: 0.875rem;
  color: #a0aec0;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #a0aec0;
}

.empty-state i {
  font-size: 3rem;
}
</style>

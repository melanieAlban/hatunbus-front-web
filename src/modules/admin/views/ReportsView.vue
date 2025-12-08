<template>
  <div class="reports-page">
    <TabView :activeIndex="activeTab" @tab-change="onTabChange">
      <TabPanel value="passengers" header="Reporte de Pasajeros">
        <PassengerReport />
      </TabPanel>
      <TabPanel value="buses" header="Gastos de Buses">
        <BusExpensesReport />
      </TabPanel>
      <TabPanel value="drivers" header="Reporte de Conductores">
        <DriverReport />
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import PassengerReport from '../components/PassengerReport.vue'
import BusExpensesReport from '../components/BusExpensesReport.vue'
import DriverReport from '../components/DriverReport.vue'

const route = useRoute()
const router = useRouter()

// Determinar tab activa basándose en el parámetro de query
const activeTab = ref(0)

function updateActiveTab() {
  const tab = route.query.tab
  if (tab === 'expenses') {
    activeTab.value = 1
  } else if (tab === 'drivers') {
    activeTab.value = 2
  } else {
    activeTab.value = 0
  }
}

// Actualizar cuando cambia la ruta
watch(() => route.query.tab, updateActiveTab, { immediate: true })

// Manejar cambio de tab
function onTabChange(event: any) {
  let newTab = 'passengers'
  if (event.index === 1) {
    newTab = 'expenses'
  } else if (event.index === 2) {
    newTab = 'drivers'
  }
  router.push({ query: { tab: newTab } })
}
</script>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>

<template>
  <div class="route-sheet-list">
    <div class="toolbar">
      <div class="filters">
        <Dropdown
          v-model="selectedStatusFilter"
          :options="statusFilterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos los estados"
          class="filter-dropdown"
        />
      </div>
      <div class="toolbar-actions">
        <button class="btn-ghost" @click="refreshList" :disabled="loading">
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
          Refrescar
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spinner pi-spin"></i>
      <span>Cargando hojas de ruta...</span>
    </div>

    <div v-else-if="error" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <div v-else class="table-wrapper">
      <DataTable
        v-if="filteredRouteSheets.length"
        :value="filteredRouteSheets"
        dataKey="id"
        responsiveLayout="scroll"
        :rows="10"
        :paginator="filteredRouteSheets.length > 10"
        :rowsPerPageOptions="[10, 20, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        class="route-sheet-table"
      >
        <Column field="name" header="Nombre" style="min-width: 240px">
          <template #body="{ data }">
            <div class="name-cell">
              <div class="name">{{ data.name }}</div>
              <div class="meta">
                <Tag
                  :value="getStatusLabel(data.status)"
                  :severity="getStatusSeverity(data.status)"
                  class="mr-2"
                />
                <span class="pill">
                  <i class="pi pi-sitemap"></i>
                  {{ data.generationMode === 'AUTOMATIC' ? 'Automática' : 'Manual' }}
                </span>
              </div>
            </div>
          </template>
        </Column>

        <Column header="Período" style="min-width: 220px">
          <template #body="{ data }">
            <div class="period">
              <i class="pi pi-calendar"></i>
              {{ formatDate(data.startDate) }} — {{ formatDate(data.endDate) }}
            </div>
          </template>
        </Column>

        <Column header="Días" style="width: 90px">
          <template #body="{ data }">
            <span class="strong">{{ getDurationDays(data) }}</span>
          </template>
        </Column>

        <Column header="Detalles" style="width: 110px">
          <template #body="{ data }">
            <Tag :value="data.detailCount || 0" severity="info" />
          </template>
        </Column>

        <Column header="Creado" style="min-width: 170px">
          <template #body="{ data }">
            {{ formatDateTime(data.createdAt) }}
          </template>
        </Column>

        <Column header="Acciones" style="min-width: 200px">
          <template #body="{ data }">
            <div class="row-actions">
              <button class="btn-ghost btn-sm" @click="viewDetails(data)">
                <i class="pi pi-eye"></i>
                Ver Detalles
              </button>
              <button class="btn-ghost btn-sm" @click="viewMatrix(data)">
                <i class="pi pi-table"></i>
                Ver Matriz
              </button>
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-else class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>No hay hojas de ruta generadas</p>
        <p class="hint">Usa el tab "Crear Hoja de Ruta" para generar una nueva</p>
      </div>
    </div>

    <!-- Dialog para ver matriz -->
    <Dialog
      v-model:visible="showMatrixDialog"
      modal
      :style="{ width: '95vw', maxWidth: '1400px', maxHeight: '90vh' }"
      header="Matriz de Rotación"
    >
      <div v-if="selectedSheet" class="matrix-content">
        <div class="matrix-header-info">
          <h3>{{ selectedSheet.name }}</h3>
          <div class="matrix-meta">
            <span><i class="pi pi-calendar"></i> {{ formatDate(selectedSheet.startDate) }} - {{ formatDate(selectedSheet.endDate) }}</span>
            <Tag :value="getDurationDays(selectedSheet) + ' días'" severity="info" />
          </div>
        </div>

        <div v-if="loadingMatrix" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Generando matriz...</span>
        </div>

        <div v-else-if="matrixError" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ matrixError }}</span>
        </div>

        <div v-else-if="matrixData" class="matrix-grid-wrapper">
          <div class="matrix-grid" :style="gridStyles">
            <div class="header-cell sticky-col" style="grid-column: 1;">Hora</div>
            <div class="header-cell sticky-col" style="grid-column: 2;">Ruta</div>
            <div
              v-for="(date, idx) in matrixData.dates"
              :key="date"
              class="header-cell date-header"
              :style="{ gridColumn: idx + 3 }"
            >
              {{ formatMatrixDate(date) }}
            </div>

            <template v-for="(row, rowIdx) in matrixData.rows" :key="rowIdx">
            <div
              class="data-cell sticky-col time-label"
              :style="{ gridColumn: 1, gridRow: rowIdx + 2 }"
              :class="{ 'rest-row': row.type === 'REST', 'deactivated-row': row.deactivated }"
            >
              {{ row.meta }}
            </div>
            <div
              class="data-cell sticky-col route-label"
              :style="{ gridColumn: 2, gridRow: rowIdx + 2 }"
              :class="{ 'rest-row': row.type === 'REST', 'deactivated-row': row.deactivated }"
            >
              {{ row.label }}
            </div>
            <div
              v-for="(date, dateIdx) in matrixData.dates"
              :key="date"
              class="data-cell assignment-cell"
              :style="{ gridColumn: dateIdx + 3, gridRow: rowIdx + 2 }"
              :class="[getCellClass(row.cells[date]), { 'rest-cell': row.type === 'REST', 'deactivated-cell': row.deactivated }]"
            >
                <div v-if="!row.cells[date]?.buses || row.cells[date]?.buses.length === 0" class="empty-cell-content">
                  N/A
                </div>
                <div v-else class="bus-numbers">
                  <span
                    v-for="bus in row.cells[date]?.buses || []"
                    :key="bus"
                    class="bus-number"
                  >
                    {{ bus }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Dialog para ver detalles -->
    <Dialog
      v-model:visible="showDetailsDialog"
      modal
      :style="{ width: '1000px', maxHeight: '90vh' }"
      header="Detalles de Hoja de Ruta"
    >
      <div v-if="selectedSheet" class="details-content">
        <div class="details-header">
          <h3>{{ selectedSheet.name }}</h3>
          <Tag
            :value="getStatusLabel(selectedSheet.status)"
            :severity="getStatusSeverity(selectedSheet.status)"
          />
        </div>

        <div class="details-info">
          <div class="info-row">
            <span class="info-label">Período:</span>
            <span class="info-value">
              {{ formatDate(selectedSheet.startDate) }} - {{ formatDate(selectedSheet.endDate) }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Modo:</span>
            <span class="info-value">
              {{ selectedSheet.generationMode === 'AUTOMATIC' ? 'Automática' : 'Manual' }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Creado:</span>
            <span class="info-value">{{ formatDateTime(selectedSheet.createdAt) }}</span>
          </div>
        </div>

        <div v-if="loadingDetails" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Cargando detalles...</span>
        </div>

        <div v-else-if="sheetDetails.length === 0" class="empty-state">
          <i class="pi pi-info-circle"></i>
          <p>No hay detalles disponibles</p>
        </div>

        <DataTable v-else :value="visibleSheetDetails" :scrollable="true" scrollHeight="400px">
          <Column header="Estado" style="width: 120px">
            <template #body="{ data }">
              <Tag
                v-if="data.deactivated"
                value="Desactivada"
                severity="danger"
                v-tooltip.top="data.deactivationReason || 'Desactivada'"
              />
              <Tag v-else value="Activa" severity="success" />
            </template>
          </Column>
          <Column header="Frecuencia" style="min-width: 250px">
            <template #body="{ data }">
              <div :class="{ 'deactivated-text': data.deactivated }">
                <div style="font-weight: 600; margin-bottom: 4px;">
                  {{ data.routeOrigin }} → {{ data.routeDestination }}
                </div>
                <div style="font-size: 0.9em; color: var(--text-color-secondary);">
                  {{ data.departureTime }}
                </div>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { success, error as notifyError, confirm } from "@/lib/notifier";
import Dropdown from "primevue/dropdown";
import Tag from "primevue/tag";
import Dialog from "primevue/dialog";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import apiClient from "@/services/apiClient";

interface RouteSheetDto {
  id: string;
  cooperativeId: string;
  name: string;
  startDate: string;
  endDate: string;
  generationMode: "AUTOMATIC" | "MANUAL";
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  detailCount?: number;
}

interface RouteSheetDetailDto {
  id: string;
  routeSheetId: string;
  frequencySegmentId: string;
  routeName: string;
  routeOrigin: string;
  routeDestination: string;
  departureTime: string;
  frequencyName: string;
  segmentOrder: number;
  busId: string;
  busPlate: string;
  busBrand: string;
  primaryDriverId: string;
  driverName: string;
  driverLicense: string;
  operatingDays?: string[];
  busUnitNumber?: number;
  createdAt: string;
  deactivated?: boolean;
  deactivatedAt?: string;
  deactivationReason?: string;
}

const auth = useAuthStore();

const loading = ref(false);
const error = ref<string | null>(null);
const routeSheets = ref<RouteSheetDto[]>([]);
const selectedGroupFilter = ref<string | null>(null);
const selectedStatusFilter = ref<string | null>(null);
const showDetailsDialog = ref(false);
const selectedSheet = ref<RouteSheetDto | null>(null);
const loadingDetails = ref(false);
const sheetDetails = ref<RouteSheetDetailDto[]>([]);
const showMatrixDialog = ref(false);
const loadingMatrix = ref(false);
const matrixError = ref<string | null>(null);
const matrixData = ref<any>(null);

const visibleSheetDetails = computed(() =>
  sheetDetails.value.filter((detail) => !isCompositeSegment(detail) && !detail.deactivated)
);

const groupFilterOptions = ref([{ label: "Todos los grupos", value: null }]);

const statusFilterOptions = ref([
  { label: "Todos los estados", value: null },
  { label: "Activas", value: "ACTIVE" },
  { label: "Inactivas", value: "INACTIVE" },
  { label: "Archivadas", value: "ARCHIVED" },
]);

const filteredRouteSheets = computed(() => {
  let filtered = routeSheets.value;

  if (selectedStatusFilter.value) {
    filtered = filtered.filter(
      (sheet) => sheet.status === selectedStatusFilter.value
    );
  }

  return filtered;
});

onMounted(() => {
  loadRouteSheets();
});

async function loadRouteSheets() {
  if (!auth.user?.cooperativeId) return;

  loading.value = true;
  error.value = null;
  try {
    const response = await apiClient.get(
      `/hojas-ruta/cooperativa/${auth.user.cooperativeId}`
    );
    routeSheets.value = response.data;
  } catch (err: any) {
    error.value =
      err?.response?.data?.message || "Error al cargar las hojas de ruta";
    console.error("Error loading route sheets:", err);
  } finally {
    loading.value = false;
  }
}

async function refreshList() {
  await loadRouteSheets();
  success(
    "Lista actualizada",
    "Las hojas de ruta se han actualizado correctamente"
  );
}

defineExpose({
  reload: loadRouteSheets,
});

async function viewDetails(sheet: RouteSheetDto) {
  selectedSheet.value = sheet;
  showDetailsDialog.value = true;
  loadingDetails.value = true;

  try {
    const response = await apiClient.get(`/hojas-ruta/${sheet.id}/detalles`);
    sheetDetails.value = response.data;
  } catch (err: any) {
    notifyError("Error", "No se pudieron cargar los detalles");
    console.error("Error loading details:", err);
  } finally {
    loadingDetails.value = false;
  }
}

async function viewMatrix(sheet: RouteSheetDto) {
  selectedSheet.value = sheet;
  showMatrixDialog.value = true;
  loadingMatrix.value = true;
  matrixError.value = null;

  try {
    const response = await apiClient.get(`/hojas-ruta/${sheet.id}/detalles`);
    const details: RouteSheetDetailDto[] = response.data.filter(
      (d) => !isCompositeSegment(d)
    );
    matrixData.value = buildMatrixFromDetails(details, sheet);
  } catch (err: any) {
    matrixError.value =
      err?.response?.data?.message || "No se pudo cargar la matriz";
    console.error("Error loading matrix:", err);
  } finally {
    loadingMatrix.value = false;
  }
}

function buildMatrixFromDetails(
  details: RouteSheetDetailDto[],
  sheet: RouteSheetDto
) {
  const start = new Date(sheet.startDate + "T00:00:00");
  const end = new Date(sheet.endDate + "T00:00:00");
  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const [dateString] = d.toISOString().split("T");
    if (dateString) {
      dates.push(dateString);
    }
  }

  const dayNames = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const allBuses = new Set<number>();

  const frequencyMap = new Map<
    string,
    {
      frequencyName: string;
      firstOrigin: string;
      lastDestination: string;
      firstTime: string;
      deactivated: boolean;
      segments: Map<
        string,
        { time: string; origin: string; destination: string; order: number }
      >;
      busesByDate: Map<string, Set<number>>;
    }
  >();

  for (const detail of details) {
    const freqName = detail.frequencyName;
    if (!freqName) continue;

    const busNumber = detail.busUnitNumber;
    if (busNumber) allBuses.add(busNumber);

    if (!frequencyMap.has(freqName)) {
      frequencyMap.set(freqName, {
        frequencyName: freqName,
        firstOrigin: "",
        lastDestination: "",
        firstTime: "99:99",
        deactivated: false,
        segments: new Map(),
        busesByDate: new Map(),
      });
    }

    const freq = frequencyMap.get(freqName)!;
    if (detail.deactivated) {
      freq.deactivated = true;
    }
    const segOrder = detail.segmentOrder ?? 0;
    const time = detail.departureTime?.toString().substring(0, 5) || "00:00";

    const segKey = `${detail.routeOrigin}-${detail.routeDestination}`;
    if (!freq.segments.has(segKey)) {
      freq.segments.set(segKey, {
        time,
        origin: detail.routeOrigin || "",
        destination: detail.routeDestination || "",
        order: segOrder,
      });
    }

    const currentSeg = freq.segments.get(segKey)!;
    if (
      segOrder <=
      Math.min(...Array.from(freq.segments.values()).map((s) => s.order))
    ) {
      freq.firstOrigin = detail.routeOrigin || "";
      if (time < freq.firstTime) freq.firstTime = time;
    }
    if (
      segOrder >=
      Math.max(...Array.from(freq.segments.values()).map((s) => s.order))
    ) {
      freq.lastDestination = detail.routeDestination || "";
    }

    const operatingDays = detail.operatingDays ?? [];

    if (busNumber && operatingDays.length > 0) {
      for (const date of dates) {
        const dayOfWeek = new Date(date + "T00:00:00").getDay();
        const fullDay = dayNames[dayOfWeek];
        if (operatingDays.includes(fullDay)) {
          if (!freq.busesByDate.has(date)) {
            freq.busesByDate.set(date, new Set());
          }
          freq.busesByDate.get(date)!.add(busNumber);
        }
      }
    }
  }

  const freqArray = Array.from(frequencyMap.values());
  const orderedFrequencies = orderFrequenciesAsChain(freqArray);

  const rows: Array<{
    label: string;
    meta: string;
    type: string;
    deactivated?: boolean;
    cells: Record<string, { type: string; buses: number[] }>;
  }> = [];

  for (const freq of orderedFrequencies) {
    const segmentsArray = Array.from(freq.segments.values()).sort(
      (a, b) => a.order - b.order
    );

    const label = segmentsArray
      .map((s) => `${s.origin} - ${s.destination}`)
      .join("\n");
    const meta = segmentsArray.map((s) => s.time).join("\n");

    const cells: Record<string, { type: string; buses: number[] }> = {};
    for (const date of dates) {
      const buses = freq.busesByDate.get(date);
      const busArray = buses
        ? Array.from(buses)
            .filter((value): value is number => typeof value === "number")
            .sort((a, b) => a - b)
        : [];
      cells[date] = {
        type: "TRIP",
        buses: busArray.length > 0 ? [busArray[0]] : [],
      };
    }

    rows.push({ label, meta, type: "TRIP", cells, deactivated: (freq as any).deactivated });
  }

  const paradaCells: Record<string, { type: string; buses: number[] }> = {};
  for (const date of dates) {
    const busesWorking = new Set<number>();
    rows.forEach((row) =>
      row.cells[date]?.buses.forEach((b) => busesWorking.add(b))
    );
    const busesResting = Array.from(allBuses)
      .filter((b) => !busesWorking.has(b))
      .sort((a, b) => a - b);
    paradaCells[date] = { type: "REST", buses: busesResting };
  }

  rows.push({ label: "PARADA", meta: "", type: "REST", cells: paradaCells });

  return { dates, rows };
}

function orderFrequenciesAsChain(
  frequencies: Array<{
    frequencyName: string;
    firstOrigin: string;
    lastDestination: string;
    firstTime: string;
    segments: Map<string, any>;
    busesByDate: Map<string, Set<number>>;
  }>
) {
  if (frequencies.length <= 1) return frequencies;

  let bestChain: typeof frequencies = [];

  for (const potentialStart of frequencies) {
    const currentChain: typeof frequencies = [];
    const used = new Set<string>();

    let current: typeof potentialStart | undefined = potentialStart;

    while (current) {
      currentChain.push(current);
      used.add(current.frequencyName);

      const destination = current.lastDestination;
      current = frequencies.find(
        (f) => !used.has(f.frequencyName) && f.firstOrigin === destination
      );
    }

    if (currentChain.length > bestChain.length) {
      bestChain = currentChain;
    }
  }

  const usedNames = new Set(bestChain.map((f) => f.frequencyName));
  for (const freq of frequencies) {
    if (!usedNames.has(freq.frequencyName)) {
      bestChain.push(freq);
    }
  }

  return bestChain;
}

const gridStyles = computed(() => {
  const numCols = (matrixData.value?.dates.length || 0) + 2;
  return {
    gridTemplateColumns: `80px 280px repeat(${
      matrixData.value?.dates.length || 0
    }, 120px)`,
  };
});

function getCellClass(cell: any) {
  if (!cell || !cell.buses || cell.buses.length === 0) return "cell-empty";
  return "cell-has-buses";
}

function formatMatrixDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

async function changeStatus(sheet: RouteSheetDto, newStatus: string) {
  try {
    await apiClient.patch(`/hojas-ruta/${sheet.id}/estado?estado=${newStatus}`);
    success(
      "Estado actualizado",
      `Hoja de ruta ${newStatus === "ACTIVE" ? "activada" : "desactivada"}`
    );
    await loadRouteSheets();
  } catch (err: any) {
    notifyError(
      "Error",
      err?.response?.data?.message || "No se pudo cambiar el estado"
    );
  }
}

async function deleteSheet(sheet: RouteSheetDto) {
  const confirmed = await confirm({
    title: "Eliminar Hoja de Ruta",
    message: `¿Estás seguro de eliminar "${sheet.name}"? Esta acción no se puede deshacer.`,
    acceptLabel: "Sí, Eliminar",
    rejectLabel: "Cancelar",
  });

  if (!confirmed) return;

  try {
    await apiClient.delete(`/hojas-ruta/${sheet.id}`);
    success("Eliminada", "Hoja de ruta eliminada correctamente");
    await loadRouteSheets();
  } catch (err: any) {
    notifyError(
      "Error",
      err?.response?.data?.message || "No se pudo eliminar la hoja de ruta"
    );
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "Activa",
    INACTIVE: "Inactiva",
    ARCHIVED: "Archivada",
  };
  return map[status] || status;
}

function getStatusSeverity(
  status: string
): "success" | "danger" | "warning" | "info" {
  const map: Record<string, "success" | "danger" | "warning" | "info"> = {
    ACTIVE: "success",
    INACTIVE: "warning",
    ARCHIVED: "danger",
  };
  return map[status] || "info";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDurationDays(sheet: RouteSheetDto): number {
  const start = new Date(sheet.startDate + "T00:00:00");
  const end = new Date(sheet.endDate + "T00:00:00");
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

function isCompositeSegment(detail: { segmentOrder?: number }) {
  return detail.segmentOrder !== undefined && detail.segmentOrder >= 900;
}
</script>

<style scoped>
.route-sheet-list {
  padding: 1rem 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-dropdown {
  min-width: 180px;
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: #64748b;
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
}

.empty-state .hint {
  font-size: 0.875rem;
  color: #94a3b8;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
}

.table-wrapper {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.route-sheet-table :deep(.p-datatable-thead > tr > th) {
  background: #0f172a;
  color: white;
  font-weight: 700;
  border: none;
}

.route-sheet-table :deep(.p-datatable-tbody > tr > td) {
  border: none;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.name-cell .name {
  font-weight: 700;
  color: var(--app-text);
}

.name-cell .meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  background: #eef2ff;
  color: #312e81;
  border-radius: 6px;
  font-size: 0.85rem;
}

.period {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e293b;
}

.strong {
  font-weight: 700;
  color: #0f172a;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-ghost:hover {
  background: #f8fafc;
  color: #1e293b;
}

.btn-sm {
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
}

.btn-warning {
  color: #f59e0b;
}

.btn-success {
  color: #10b981;
}

.btn-danger {
  color: #ef4444;
}

.details-content {
  padding: 1rem 0;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.details-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--app-text);
}

.details-info {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #64748b;
}

.info-value {
  color: var(--app-text);
}

/* Matrix styles */
.matrix-content {
  padding: 1rem 0;
}

.matrix-header-info {
  margin-bottom: 1.5rem;
}

.matrix-header-info h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--app-text);
}

.matrix-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9375rem;
  color: #64748b;
}

.matrix-meta i {
  color: #3b82f6;
}

.matrix-grid-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 65vh;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}

.matrix-grid {
  display: grid;
  gap: 0;
  min-width: min-content;
}

.header-cell {
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  padding: 0.875rem 1rem;
  font-weight: 700;
  font-size: 0.875rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 2px solid #3b82f6;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.header-cell.sticky-col {
  left: 0;
  z-index: 4;
}

.header-cell:nth-child(2) {
  left: 80px;
}

.date-header {
  min-width: 120px;
  text-transform: capitalize;
  font-size: 0.8125rem;
}

.data-cell {
  padding: 0.5rem;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  font-size: 0.875rem;
}

.data-cell.sticky-col {
  position: sticky;
  background: #f8fafc;
  font-weight: 600;
  z-index: 2;
  justify-content: flex-start;
  padding-left: 0.75rem;
}

.data-cell.sticky-col:nth-child(1) {
  left: 0;
}

.data-cell.sticky-col:nth-child(2) {
  left: 80px;
}

.time-label {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 700;
  font-family: "Courier New", monospace;
}

.route-label {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
  white-space: pre-line;
  line-height: 1.4;
}

.rest-row {
  background: #fef3c7 !important;
  color: #92400e;
  font-weight: 700;
}

.deactivated-row {
  background: #fee2e2 !important;
  color: #991b1b;
  font-weight: 700;
}

.assignment-cell {
  transition: all 0.15s ease;
}

.assignment-cell:hover {
  background: #f1f5f9;
}

.cell-empty {
  background: repeating-linear-gradient(
    45deg,
    #f8f9fa,
    #f8f9fa 10px,
    #e9ecef 10px,
    #e9ecef 20px
  );
}

.empty-cell-content {
  color: #6c757d;
  font-weight: 600;
  font-size: 0.875rem;
  text-align: center;
  opacity: 0.7;
}

.rest-cell {
  background: #fef3c7 !important;
}

.deactivated-cell {
  background: #fee2e2 !important;
  border-color: #fecdd3;
}

.bus-numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
  align-items: center;
}

.bus-number {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8125rem;
  min-width: 32px;
  text-align: center;
}

.deactivated-text {
  color: #9ca3af;
  text-decoration: line-through;
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }

  .list-header {
    flex-direction: column;
  }
}
</style>

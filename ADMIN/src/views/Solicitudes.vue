<template>
  <AdminLayout>
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white/90 flex items-center gap-3">
          <Bell class="w-6 h-6 text-brand-500" /> Solicitudes Pendientes
        </h2>
        <span class="bg-brand-500 text-white text-sm font-bold px-3 py-1 rounded-full">{{ solicitudes.length }}</span>
      </div>
      
      <div v-if="solicitudes.length === 0" class="text-center py-20 text-gray-500 dark:text-gray-400 text-lg italic bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        No hay solicitudes pendientes en este momento.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="solicitud in solicitudes" :key="solicitud.id" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-theme-xs relative overflow-hidden flex flex-col justify-between h-full">
          <div class="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
          <div class="mb-4">
            <div class="flex justify-between items-start mb-3">
              <span class="text-xs font-bold tracking-wider uppercase text-warning-600 bg-warning-50 px-2 py-1 rounded-md dark:bg-warning-500/10 dark:text-warning-400">Pendiente</span>
              <span class="text-xs text-gray-400 font-medium">{{ formatDate(solicitud.created_at) }}</span>
            </div>
            
            <h4 class="font-bold text-gray-800 dark:text-white/90 text-lg leading-tight mb-1">{{ solicitud.title }}</h4>
            <p class="text-base font-medium text-brand-600 dark:text-brand-400 mb-4">{{ solicitud.nombre || 'Sin nombre' }}</p>
            
            <div class="space-y-2">
              <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CalendarIcon stroke-width="2" class="w-4 h-4 text-gray-400" /> 
                <span class="font-semibold">{{ formatEventDate(solicitud.start_date) }}</span>
              </p>
              <p v-if="solicitud.celular" class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Phone stroke-width="2" class="w-4 h-4 text-gray-400" /> 
                {{ solicitud.celular }}
              </p>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
            <button @click="handleConfirmSolicitud(solicitud.id)" class="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 text-sm font-semibold transition-colors">
              <Check class="w-4 h-4" /> Confirmar
            </button>
            <button @click="openReagendar(solicitud)" class="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 text-sm font-semibold transition-colors">
              <CalendarEdit class="w-4 h-4" /> Reagendar
            </button>
            <button @click="handleRejectSolicitud(solicitud.id)" class="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 text-sm font-semibold transition-colors">
              <X class="w-4 h-4" /> Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Reagendar -->
    <Teleport to="body">
      <div v-if="showReagendarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="closeReagendar">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <CalendarEdit class="w-5 h-5 text-blue-500" /> Reagendar Cita
            </h3>
            <button @click="closeReagendar" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div v-if="selectedSolicitud" class="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ selectedSolicitud.title }}</p>
            <p class="text-sm text-blue-600 dark:text-blue-400">{{ selectedSolicitud.nombre }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Fecha actual: {{ formatEventDate(selectedSolicitud.start_date) }}</p>
          </div>

          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nueva fecha</label>
              <input
                v-model="nuevaFecha"
                type="date"
                :min="today"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nuevo horario</label>
              <select
                v-model="nuevoHorario"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Selecciona un horario</option>
                <option v-for="h in horarios" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button @click="closeReagendar" class="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-semibold transition-colors">
              Cancelar
            </button>
            <button
              @click="handleReagendar"
              :disabled="!nuevaFecha || !nuevoHorario || reagendando"
              class="flex-1 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span v-if="reagendando">Guardando...</span>
              <span v-else>Confirmar cambio</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { Bell, Check, X, Calendar as CalendarIcon, Phone, CalendarClock as CalendarEdit } from 'lucide-vue-next'
import API_BASE_URL from '@/config/api'

const solicitudes = ref([])
const showReagendarModal = ref(false)
const selectedSolicitud = ref(null)
const nuevaFecha = ref('')
const nuevoHorario = ref('')
const reagendando = ref(false)

const today = computed(() => new Date().toISOString().split('T')[0])

const horarios = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00'
]

onMounted(async () => {
  await fetchSolicitudes();
})

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return isNaN(date) ? '' : date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

const formatEventDate = (dateStr) => {
  if (!dateStr) return 'Fecha no definida';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

const fetchSolicitudes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/solicitudes`);
    if (response.ok) {
      solicitudes.value = await response.json();
    }
  } catch (err) {
    console.error('Error fetching solicitudes:', err);
  }
}

const openReagendar = (solicitud) => {
  selectedSolicitud.value = solicitud;
  nuevaFecha.value = '';
  nuevoHorario.value = '';
  showReagendarModal.value = true;
}

const closeReagendar = () => {
  showReagendarModal.value = false;
  selectedSolicitud.value = null;
  nuevaFecha.value = '';
  nuevoHorario.value = '';
}

const handleReagendar = async () => {
  if (!nuevaFecha.value || !nuevoHorario.value || !selectedSolicitud.value) return;
  reagendando.value = true;
  try {
    const newDateTime = `${nuevaFecha.value}T${nuevoHorario.value}:00`;
    const response = await fetch(`${API_BASE_URL}/api/solicitudes/${selectedSolicitud.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'rescheduled',
        fecha: nuevaFecha.value,
        horario: nuevoHorario.value + ':00',
        start_date: newDateTime
      })
    });
    if (response.ok) {
      closeReagendar();
      await fetchSolicitudes();
    }
  } catch (err) {
    console.error('Error reagendando:', err);
  } finally {
    reagendando.value = false;
  }
}

const handleConfirmSolicitud = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/solicitudes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' })
    });
    if (response.ok) {
      await fetchSolicitudes();
    }
  } catch (err) {
    console.error('Error confirming solicitud:', err);
  }
}

const handleRejectSolicitud = async (id) => {
  if (!confirm('¿Estás seguro de rechazar esta solicitud?')) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/solicitudes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    });
    if (response.ok) {
      await fetchSolicitudes();
    }
  } catch (err) {
    console.error('Error rejecting solicitud:', err);
  }
}
</script>

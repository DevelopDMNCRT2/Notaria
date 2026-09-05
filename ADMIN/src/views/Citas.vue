<template>
  <AdminLayout>
    <div class="flex flex-col xl:flex-row gap-6 items-start">
      
      <!-- CONTENEDOR DEL CALENDARIO (Lado Izquierdo) -->
      <div
        class="flex-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
      >
        <div class="custom-calendar w-full">
          <FullCalendar ref="calendarRef" class="min-h-screen" :options="calendarOptions" />
        </div>

        <!-- Modal para Ver/Eliminar Cita -->
        <Modal v-if="isOpen" @close="closeModal">
          <template #body>
            <div
              class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8 shadow-2xl z-[9999]"
            >
              <div class="flex justify-between items-center mb-5">
                <h5 class="font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
                  {{ selectedEvent ? 'Detalles de la Cita' : 'Agendar Cita' }}
                </h5>
                <button @click="closeModal" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  ✖
                </button>
              </div>
              
              <div class="mt-4 space-y-6">
                <!-- TRAMITE -->
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Trámite / Título
                  </label>
                  <input
                    v-model="eventTitle"
                    type="text"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>

                <!-- INFO CLIENTE -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Nombre del Cliente
                    </label>
                    <input
                      v-model="eventNombre"
                      type="text"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Celular
                    </label>
                    <input
                      v-model="eventCelular"
                      type="text"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>

                <!-- FECHAS -->
                <div class="grid grid-cols-1 gap-6">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Fecha y Hora de Cita
                    </label>
                    <input
                      v-model="eventStartDate"
                      type="datetime-local"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 mt-8 modal-footer sm:justify-end">
                <button
                  @click="closeModal"
                  class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto transition-colors"
                >
                  Cerrar
                </button>

                <button
                  v-if="selectedEvent"
                  @click="handleDeleteEvent"
                  class="flex w-full justify-center rounded-lg border border-error-500 bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 sm:w-auto transition-colors"
                >
                  Eliminar Cita
                </button>

                <button
                  @click="handleAddOrUpdateEvent"
                  class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto transition-colors"
                >
                  {{ selectedEvent ? 'Actualizar' : 'Agendar' }}
                </button>
              </div>
            </div>
          </template>
        </Modal>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from '@/components/ui/Modal.vue'
import { Calendar as CalendarIcon, Phone } from 'lucide-vue-next'
import API_BASE_URL from '@/config/api'

const currentPageTitle = ref('Citas')

const calendarRef = ref(null)
const isOpen = ref(false)
const selectedEvent = ref(null)
const eventTitle = ref('')
const eventNombre = ref('')
const eventCelular = ref('')
const eventStartDate = ref('')
const events = ref([])


onMounted(async () => {
  await fetchCitas();
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

const fetchCitas = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/citas`);
    if (response.ok) {
      events.value = await response.json();
    }
  } catch (err) {
    console.error('Error fetching citas:', err);
  }
}

const openModal = () => {
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
  resetModalFields()
}

const resetModalFields = () => {
  eventTitle.value = ''
  eventNombre.value = ''
  eventCelular.value = ''
  eventStartDate.value = ''
  selectedEvent.value = null
}

const handleDateSelect = (selectInfo) => {
  resetModalFields()
  eventStartDate.value = selectInfo.startStr
  eventEndDate.value = selectInfo.endStr.includes('T') 
    ? selectInfo.endStr.split('T')[0] 
    : selectInfo.endStr || selectInfo.startStr
  openModal()
}

const handleEventClick = (clickInfo) => {
  const event = clickInfo.event
  selectedEvent.value = event
  eventTitle.value = event.title
  eventNombre.value = event.extendedProps.nombre || ''
  eventCelular.value = event.extendedProps.celular || ''
  
  if (event.start) {
    const tzOffset = event.start.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(event.start - tzOffset)).toISOString().slice(0, 16);
    eventStartDate.value = localISOTime;
  } else {
    eventStartDate.value = ''
  }
  openModal()
}

const handleAddOrUpdateEvent = async () => {
  if (!eventTitle.value || !eventStartDate.value) return;

  const eventData = {
    title: eventTitle.value,
    nombre: eventNombre.value,
    celular: eventCelular.value,
    start: eventStartDate.value,
    status: 'confirmado'
  }

  try {
    const isUpdate = selectedEvent.value && selectedEvent.value.id;
    const url = isUpdate 
      ? `${API_BASE_URL}/api/citas/${selectedEvent.value.id}` 
      : `${API_BASE_URL}/api/citas`;
    const method = isUpdate ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (response.ok) {
      await fetchCitas();
      closeModal();
    }
  } catch (err) {
    console.error('Error saving/updating cita:', err);
  }
}

const handleDeleteEvent = async () => {
  if (selectedEvent.value) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/citas/${selectedEvent.value.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchCitas();
        closeModal();
      }
    } catch (err) {
      console.error('Error deleting cita:', err);
    }
  }
}

const renderEventContent = (eventInfo) => {
  const colorClass = 'fc-bg-primary'
  const timeStr = eventInfo.event.start ? eventInfo.event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
  const nombre = eventInfo.event.extendedProps.nombre || '';
  
  return {
    html: `
      <div class="event-fc-color flex flex-col ${colorClass} p-2 rounded-lg w-full relative z-10 cursor-pointer overflow-hidden border-l-4 border-current">
        <div class="flex items-center justify-between mb-0.5">
          <span class="text-[10px] font-bold uppercase opacity-80">${timeStr}</span>
        </div>
        <div class="fc-event-title font-bold text-xs truncate">${eventInfo.event.title}</div>
        <div class="text-[10px] opacity-90 truncate">${nombre}</div>
      </div>
    `,
  }
}

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridDay',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGrid3Day,timeGridDay',
  },
  views: {
    timeGrid3Day: {
      type: 'timeGrid',
      duration: { days: 3 },
      buttonText: '3 días'
    }
  },
  hiddenDays: [0], // 0 is Sunday
  allDaySlot: false, // Ocultar la fila "all-day"
  slotMinTime: '09:00:00', // Hora de inicio general
  slotMaxTime: '17:00:00', // Hora de fin general (exclusivo, permite ver las 16:00)
  businessHours: [
    {
      daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
      startTime: '09:00',
      endTime: '17:00' // Para permitir citas a las 16:00
    },
    {
      daysOfWeek: [6], // Sábado
      startTime: '09:00',
      endTime: '14:00' // Para permitir citas a las 13:00
    }
  ],
  selectConstraint: 'businessHours', // Impide agendar fuera de este horario
  expandRows: true, // Expandir filas para rellenar la altura de forma simétrica
  locale: 'es', // Set calendar language to Spanish
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    list: 'Agenda'
  },
  events: events,
  selectable: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventContent: renderEventContent,
})
</script>

<style>
/* Refinamientos extra para FullCalendar en este template */
.fc-theme-standard .fc-scrollgrid {
  border-color: transparent !important;
}
.fc-theme-standard th, .fc-theme-standard td {
  border-color: #f3f4f6 !important;
}
.dark .fc-theme-standard th, .dark .fc-theme-standard td {
  border-color: #1f2937 !important;
}
.fullcalendar-right-sidebar .fc-toolbar.fc-header-toolbar {
  flex-wrap: wrap;
  gap: 0.5rem;
}
.fullcalendar-right-sidebar .fc-toolbar-chunk:first-child,
.fullcalendar-right-sidebar .fc-toolbar-chunk:last-child {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* --- SCROLLBAR CUSTOMIZATION --- */
/* Esto oculta las flechas nativas del scrollbar en Windows y estiliza la barra */
.fc-scroller::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.fc-scroller::-webkit-scrollbar-track {
  background: transparent;
}
.fc-scroller::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
.dark .fc-scroller::-webkit-scrollbar-thumb {
  background-color: #475569;
}
.fc-scroller::-webkit-scrollbar-button {
  display: none !important; /* Oculta las flechas arriba/abajo */
}

/* --- BOTONES DEL CALENDARIO --- */
.fc .fc-button-primary {
  background-color: #3b82f6 !important; /* Azul (blue-500) */
  border-color: #3b82f6 !important;
  text-transform: capitalize;
  font-weight: 500;
  box-shadow: none !important;
  color: #ffffff !important;
}
.fc .fc-button-primary:hover {
  background-color: #2563eb !important; /* Azul más oscuro (blue-600) al hacer hover */
  border-color: #2563eb !important;
}
.fc .fc-button-primary:disabled {
  opacity: 0.6;
}

/* Botones selectores de vista cuando no están activos */
.fc-header-toolbar.fc-toolbar .fc-toolbar-chunk:last-child .fc-button:not(.fc-button-active) {
  background-color: #e2e8f0 !important; /* Gris claro (slate-200) */
  border-color: #e2e8f0 !important;
  color: #475569 !important; /* Texto gris */
}
.fc-header-toolbar.fc-toolbar .fc-toolbar-chunk:last-child .fc-button:not(.fc-button-active):hover {
  background-color: #cbd5e1 !important; /* slate-300 al hacer hover */
}

/* Botón "Hoy" cuando no está activo */
.fc-header-toolbar.fc-toolbar .fc-toolbar-chunk:first-child .fc-button-primary:not(.fc-button-icon) {
   /* Dejar que mantenga el color azul por defecto, o se puede ajustar si es necesario */
}

/* --- TEXTO DEL CALENDARIO --- */
.fc-toolbar-title {
  color: #1e293b !important; /* Título del Mes/Año */
  font-weight: 700 !important;
  text-transform: capitalize; /* Iniciar meses con mayúscula */
}

/* Encabezados de los días (DOM, LUN, etc) */
.fc .fc-col-header-cell-cushion {
  color: #334155 !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
}

/* Números de los días */
.fc .fc-daygrid-day-number {
  color: #475569 !important;
  font-weight: 500 !important;
  padding: 10px !important;
}

/* Días de otros meses */
.fc .fc-day-other .fc-daygrid-day-number {
  color: #cbd5e1 !important;
}

/* Event Colors Based on Tailadmin Default Configuration */
.fc-v-event, .fc-daygrid-event {
  background: none !important;
  border: none !important;
  padding: 0 !important;
}

.fc-bg-primary { background-color: rgba(66, 133, 244, 0.1); color: #4285F4; border-color: #4285F4; }
.fc-bg-success { background-color: rgba(52, 168, 83, 0.1); color: #34A853; border-color: #34A853; }
.fc-bg-warning { background-color: rgba(251, 188, 5, 0.1); color: #FBBC05; border-color: #FBBC05; }
.fc-bg-danger { background-color: rgba(234, 67, 53, 0.1); color: #EA4335; border-color: #EA4335; }

.dark .fc-bg-primary { background-color: rgba(66, 133, 244, 0.2); }
.dark .fc-bg-success { background-color: rgba(52, 168, 83, 0.2); }
.dark .fc-bg-warning { background-color: rgba(251, 188, 5, 0.2); }
.dark .fc-bg-danger { background-color: rgba(234, 67, 53, 0.2); }

@media (min-width: 1280px) {
  .custom-calendar {
    min-width: 0; 
  }
}
</style>

<template>
  <AdminLayout>
    <div class="space-y-6">
      
      <!-- Card de Memoria S3 -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-theme-xs">
        <h3 class="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
          <HardDrive class="w-5 h-5 text-brand-500" /> Almacenamiento en Nube
        </h3>
        <div v-if="loadingStorage" class="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Calculando espacio...
        </div>
        <div v-else-if="storageError" class="text-sm text-red-500">Error al cargar: {{ storageError }}</div>
        <div v-else class="flex flex-col gap-2">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Usado: <strong>{{ storage.usedGB }} GB</strong></span>
            <span>Límite: <strong>{{ storage.limitGB }} GB</strong></span>
          </div>
          <!-- Barra de progreso S3 -->
          <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
            <div
              class="h-2.5 rounded-full transition-all duration-700"
              :class="storage.usedPercent > 80 ? 'bg-red-500' : storage.usedPercent > 60 ? 'bg-warning-500' : 'bg-brand-500'"
              :style="`width: ${storage.usedPercent}%`"
            ></div>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ storage.usedPercent }}% del espacio total utilizado</p>
        </div>
      </div>

      <!-- Herramienta de Subida a AWS -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-theme-xs">
        <h3 class="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
          <UploadCloud class="w-5 h-5 text-brand-500" /> Subir Archivos a AWS
        </h3>
        
        <!-- Input oculto de archivos -->
        <input ref="fileInputRef" type="file" class="hidden" @change="uploadToS3" />

        <!-- Drag & Drop Zone -->
        <div
          class="w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group"
          :class="uploading
            ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-500/10'
            : 'border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-gray-800/20'"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform"
            :class="uploading ? 'bg-brand-500 text-white scale-110' : 'bg-brand-100 dark:bg-brand-500/20 text-brand-500 group-hover:scale-110'"
          >
            <UploadCloud v-if="!uploading" class="w-8 h-8" />
            <svg v-else class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
            {{ uploading ? 'Subiendo archivo...' : 'Arrastra tus archivos aquí' }}
          </h4>
          <p class="text-sm text-gray-500 text-center max-w-sm">
            {{ uploading ? uploadStatus : 'Soporta PDF, DOCX, XLSX, imágenes y más. Haz clic o arrastra para subir a la nube.' }}
          </p>
          <!-- Barra de progreso -->
          <div v-if="uploading" class="w-full max-w-xs mt-5 bg-brand-100 dark:bg-brand-500/20 rounded-full h-1.5 overflow-hidden">
            <div class="h-1.5 bg-brand-500 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>

      <!-- Toast de notificación -->
      <Transition name="toast">
        <div
          v-if="toast.show"
          class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium"
          :class="toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'"
        >
          <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5 shrink-0" />
          <XCircle v-else class="w-5 h-5 shrink-0" />
          {{ toast.message }}
        </div>
      </Transition>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import { UploadCloud, HardDrive, CheckCircle, XCircle } from "lucide-vue-next";
import API_BASE_URL from '@/config/api';

const fileInputRef = ref(null);
const uploading = ref(false);
const uploadStatus = ref('');
const toast = ref({ show: false, type: 'success', message: '' });

// --- Almacenamiento real ---
const storage = ref({ usedGB: 0, limitGB: 50, usedPercent: 0 });
const loadingStorage = ref(true);
const storageError = ref('');

const fetchStorage = async () => {
  loadingStorage.value = true;
  storageError.value = '';
  try {
    const res = await fetch(`${API_BASE_URL}/api/storage`);
    if (!res.ok) throw new Error('Error al obtener almacenamiento');
    storage.value = await res.json();
  } catch (err) {
    storageError.value = err.message;
    console.error('Error fetching storage:', err);
  } finally {
    loadingStorage.value = false;
  }
};

onMounted(() => {
  fetchStorage();
});

const showToast = (type, message) => {
  toast.value = { show: true, type, message };
  setTimeout(() => { toast.value.show = false; }, 4000);
};

const triggerFileInput = () => {
  if (!uploading.value) fileInputRef.value?.click();
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  if (file) uploadFile(file);
};

const uploadToS3 = (event) => {
  const file = event.target.files[0];
  if (file) uploadFile(file);
  event.target.value = '';
};

const uploadFile = async (file) => {
  uploading.value = true;
  uploadStatus.value = `Preparando ${file.name}...`;

  try {
    uploadStatus.value = 'Obteniendo permiso de subida...';
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    });

    if (!response.ok) throw new Error('Error al obtener URL de subida');
    const { uploadUrl, key } = await response.json();

    uploadStatus.value = `Subiendo ${file.name}...`;
    const result = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!result.ok) throw new Error('Error al subir a S3');

    uploadStatus.value = '¡Subida completa!';
    showToast('success', `"${file.name}" subido exitosamente a AWS.`);
    // Refrescar el almacenamiento real después de subir
    await fetchStorage();
    console.log('Ruta en S3:', key);
  } catch (error) {
    console.error('Error al subir:', error);
    uploadStatus.value = `Error: ${error.message}`;
    showToast('error', `Error al subir: ${error.message}`);
  } finally {
    uploading.value = false;
    setTimeout(() => { uploadStatus.value = ''; }, 3000);
  }
};
</script>

<style scoped>
.animate-progress {
  width: 40%;
  animation: progress-slide 1.4s ease-in-out infinite;
}
@keyframes progress-slide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(1rem) scale(0.95);
}
</style>

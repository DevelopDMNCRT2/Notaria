<template>
  <AdminLayout>
    <div class="space-y-6">
      
      <!-- Buscador y Categorías -->
      <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div class="relative w-full sm:w-96">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input v-model="searchQuery" type="text" placeholder="Buscar por nombre, cliente, o folio..." class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-theme-xs transition-shadow" />
        </div>
        
        <div class="flex gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-2 sm:pb-0">
          <button @click="activeFilter = 'todos'" :class="activeFilter === 'todos' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Todos</button>
          <button @click="activeFilter = 'pdf'" :class="activeFilter === 'pdf' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">PDFs</button>
          <button @click="activeFilter = 'doc'" :class="activeFilter === 'doc' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Word</button>
          <button @click="activeFilter = 'xls'" :class="activeFilter === 'xls' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Excel</button>
          <button @click="activeFilter = 'ppt'" :class="activeFilter === 'ppt' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Presentaciones</button>
          <button @click="activeFilter = 'img'" :class="activeFilter === 'img' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Imágenes</button>
          <button @click="activeFilter = 'zip'" :class="activeFilter === 'zip' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Comprimidos</button>
          <button @click="activeFilter = 'media'" :class="activeFilter === 'media' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors">Audio/Video</button>
        </div>
      </div>

      <!-- Tabla de Archivos -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-theme-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead class="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th scope="col" class="px-6 py-4 font-semibold">Nombre</th>
                <th scope="col" class="px-6 py-4 font-semibold">Formato</th>
                <th scope="col" class="px-6 py-4 font-semibold">Fecha de subida</th>
                <th scope="col" class="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingFiles" class="border-b border-gray-100 dark:border-gray-700">
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">Cargando archivos...</td>
              </tr>
              <tr v-else-if="filteredFiles.length === 0" class="border-b border-gray-100 dark:border-gray-700">
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">No se encontraron archivos.</td>
              </tr>
              <tr v-for="(file, i) in filteredFiles" :key="i" class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="px-6 py-4 font-medium text-gray-800 dark:text-white/90 flex items-center gap-3">
                  <div :class="['p-2 rounded-lg', file.colorClass]">
                    <component :is="file.icon" class="w-5 h-5" />
                  </div>
                  <span class="truncate max-w-[200px] sm:max-w-[400px]" :title="file.name">{{ file.name }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium">{{ file.format }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">{{ file.uploadDate }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <button @click="openFile(file.url)" class="p-2 text-brand-500 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 rounded-xl transition-colors" title="Ver">
                      <Eye class="w-4.5 h-4.5" />
                    </button>
                    <a :href="file.url" target="_blank" download class="p-2 text-brand-500 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 rounded-xl transition-colors" title="Descargar">
                      <Download class="w-4.5 h-4.5" />
                    </a>
                    <button @click="shareFile(file)" class="p-2 text-green-500 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 rounded-xl transition-colors" title="Compartir">
                      <Share2 class="w-4.5 h-4.5" />
                    </button>
                    <button @click="deleteFile(file.name)" class="p-2 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl transition-colors" title="Eliminar">
                      <Trash2 class="w-4.5 h-4.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import { Search, FileText, Image as ImageIcon, FileSpreadsheet, Download, Presentation, Archive, Film, Eye, Trash2, Share2 } from "lucide-vue-next";
import API_BASE_URL from '@/config/api';

const recentFiles = ref([]);
const loadingFiles = ref(true);
const searchQuery = ref('');
const activeFilter = ref('todos');

const filteredFiles = computed(() => {
  return recentFiles.value.filter(file => {
    // Search filter
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // Category filter
    let matchesCategory = true;
    const ext = getExtension(file.name);
    
    if (activeFilter.value === 'pdf') {
      matchesCategory = ext === 'pdf';
    } else if (activeFilter.value === 'doc') {
      matchesCategory = ['doc', 'docx'].includes(ext);
    } else if (activeFilter.value === 'xls') {
      matchesCategory = ['xls', 'xlsx', 'csv'].includes(ext);
    } else if (activeFilter.value === 'ppt') {
      matchesCategory = ['ppt', 'pptx'].includes(ext);
    } else if (activeFilter.value === 'img') {
      matchesCategory = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
    } else if (activeFilter.value === 'media') {
      matchesCategory = ['mp3', 'mp4', 'wav', 'avi', 'mov', 'mkv'].includes(ext);
    } else if (activeFilter.value === 'zip') {
      matchesCategory = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
    }
    
    return matchesSearch && matchesCategory;
  });
});

const openFile = (url) => {
  window.open(url, '_blank');
};

const shareFile = async (file) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Compartir archivo: ${file.name}`,
        text: `Revisa este archivo: ${file.name}`,
        url: file.url
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error al compartir:', err);
      }
    }
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(file.url).then(() => {
      alert('Enlace copiado al portapapeles. Tu navegador no soporta compartir directamente.');
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
      alert('No se pudo copiar el enlace.');
    });
  }
};

const deleteFile = async (fileName) => {
  if (confirm(`¿Estás seguro de que deseas eliminar el archivo "${fileName}"?`)) {
    // Aquí iría la lógica para llamar a la API de eliminación
    alert("Función de eliminación en desarrollo.");
  }
};

// ============================================================
// --- CARGAR ARCHIVOS DESDE S3 ---
// ============================================================
const fetchFiles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/files`);
    if (!response.ok) throw new Error('Error al cargar archivos');
    const files = await response.json();

    recentFiles.value = files.map(f => ({
      name: f.name,
      size: formatFileSize(f.size),
      icon: getFileIconByName(f.name),
      colorClass: getFileColorByName(f.name),
      url: f.url,
      format: getExtension(f.name).toUpperCase() || 'Desconocido',
      uploadDate: f.lastModified ? new Date(f.lastModified).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES')
    }));
  } catch (error) {
    console.error('Error cargando archivos:', error);
  } finally {
    loadingFiles.value = false;
  }
};

onMounted(() => {
  fetchFiles();
});

// ============================================================
// --- HELPERS ---
// ============================================================
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getExtension = (name) => (name.split('.').pop() || '').toLowerCase();

const getFileIconByName = (name) => {
  const ext = getExtension(name);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return ImageIcon;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['ppt', 'pptx'].includes(ext)) return Presentation;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return Archive;
  if (['mp3', 'mp4', 'wav', 'avi', 'mov', 'mkv'].includes(ext)) return Film;
  return FileText;
};

const getFileColorByName = (name) => {
  const ext = getExtension(name);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500';
  if (ext === 'pdf') return 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400';
  if (['ppt', 'pptx'].includes(ext)) return 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400';
  if (['mp3', 'mp4', 'wav', 'avi', 'mov', 'mkv'].includes(ext)) return 'bg-pink-50 text-pink-500 dark:bg-pink-500/10 dark:text-pink-400';
  return 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400';
};
</script>

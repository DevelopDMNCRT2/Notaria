<template>
  <AdminLayout>
    <div class="mb-5 flex justify-end mt-4">
      <button 
        @click="openModal" 
        class="inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-2.5 text-center font-medium text-white hover:bg-brand-600 shadow-theme-xs transition-shadow lg:px-8 xl:px-10"
      >
        Agregar Nuevo
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-theme-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead class="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-300">
            <tr>
              <th scope="col" class="px-6 py-4 font-semibold">Nombre</th>
              <th scope="col" class="px-6 py-4 font-semibold">Correo</th>
              <th scope="col" class="px-6 py-4 font-semibold">Usuario</th>
              <th scope="col" class="px-6 py-4 font-semibold">Rol</th>
              <th scope="col" class="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="users.length === 0" class="border-b border-gray-100 dark:border-gray-700">
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                No hay usuarios registrados.
              </td>
            </tr>
            <tr
              v-for="(user, index) in users"
              :key="index"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="px-6 py-4 font-medium text-gray-800 dark:text-white/90">
                {{ user.nombre }}
              </td>
              <td class="px-6 py-4">
                {{ user.correo }}
              </td>
              <td class="px-6 py-4">
                {{ user.usuario }}
              </td>
              <td class="px-6 py-4">
                <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-white/90">
                  {{ user.rol }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-3">
                  <button @click="openModal('view', user)" class="p-2 text-brand-500 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 rounded-xl transition-colors" title="Ver">
                    <Eye class="w-4.5 h-4.5" />
                  </button>
                  <button @click="openModal('edit', user)" class="p-2 text-brand-500 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 rounded-xl transition-colors" title="Editar">
                    <Pencil class="w-4.5 h-4.5" />
                  </button>
                  <button @click="deleteUser(user.id)" class="p-2 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl transition-colors" title="Borrar">
                    <Trash2 class="w-4.5 h-4.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal v-if="isModalOpen" @close="closeModal" :fullScreenBackdrop="true">
      <template #body>
        <div class="relative w-full max-w-lg p-6 bg-white rounded-xl shadow-lg dark:bg-gray-900 z-50">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-white/90">
              {{ modalMode === 'create' ? 'Nuevo Usuario' : modalMode === 'edit' ? 'Editar Usuario' : 'Detalles del Usuario' }}
            </h3>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ✖
            </button>
          </div>
          
          <form @submit.prevent="saveUser" class="space-y-4">
            <div>
              <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <input v-model="formData.nombre" :disabled="modalMode === 'view'" type="text" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed" />
            </div>
            
            <div>
              <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Correo</label>
              <input v-model="formData.correo" :disabled="modalMode === 'view'" type="email" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed" />
            </div>
            
            <div>
              <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Usuario</label>
              <input v-model="formData.usuario" :disabled="modalMode === 'view'" type="text" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed" />
            </div>

            <!-- Campos de Contraseña para CREAR -->
            <div v-if="modalMode === 'create'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                <input v-model="formData.password" type="password" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
                <input v-model="formData.confirmPassword" type="password" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white" />
              </div>
            </div>

            <!-- Campo Único de Contraseña Bloqueado para EDITAR y VER -->
            <div v-else>
              <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
              <input v-model="formData.password" type="text" disabled class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed" />
            </div>

            <p v-if="passwordMismatch && modalMode === 'create'" class="text-sm text-error-500">Las contraseñas no coinciden.</p>
            
            <div>
              <label class="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
              <select v-model="formData.rol" :disabled="modalMode === 'view'" required class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed">
                <option value="Sistemas">Sistemas</option>
                <option value="Administrador">Administrador</option>
                <option value="Operativo">Operativo</option>
              </select>
            </div>
            
            <div class="flex justify-end pt-4 gap-3">
              <button type="button" @click="closeModal" class="px-5 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                {{ modalMode === 'view' ? 'Cerrar' : 'Cancelar' }}
              </button>
              <button v-if="modalMode !== 'view'" type="submit" :disabled="passwordMismatch" class="px-5 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ modalMode === 'edit' ? 'Guardar Cambios' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Eye, Pencil, Trash2 } from "lucide-vue-next";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import Modal from "@/components/ui/Modal.vue";
import API_BASE_URL from "@/config/api";

const currentPageTitle = ref("Usuarios");

const users = ref([]);
const isModalOpen = ref(false);
const modalMode = ref('create'); // 'create', 'view', 'edit'
const selectedUserId = ref(null);

const formData = ref({
  nombre: "",
  correo: "",
  usuario: "",
  password: "",
  confirmPassword: "",
  rol: "Operativo"
});

onMounted(async () => {
  await fetchUsers();
});

const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/usuarios`);
    if (response.ok) {
      users.value = await response.json();
    }
  } catch (err) {
    console.error('Error fetching users:', err);
  }
};

const passwordMismatch = computed(() => {
  if (!formData.value.password && !formData.value.confirmPassword) return false;
  return formData.value.password !== formData.value.confirmPassword;
});

const openModal = (mode = 'create', user = null) => {
  modalMode.value = mode;
  if (user) {
    selectedUserId.value = user.id;
    formData.value = {
      nombre: user.nombre,
      correo: user.correo,
      usuario: user.usuario,
      password: user.password || "",
      confirmPassword: "",
      rol: user.rol
    };
  } else {
    selectedUserId.value = null;
    formData.value = {
      nombre: "",
      correo: "",
      usuario: "",
      password: "",
      confirmPassword: "",
      rol: "Operativo"
    };
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const saveUser = async () => {
  if (passwordMismatch.value) return;
  
  try {
    const url = modalMode.value === 'edit' 
      ? `${API_BASE_URL}/api/usuarios/${selectedUserId.value}` 
      : `${API_BASE_URL}/api/usuarios`;
    const method = modalMode.value === 'edit' ? 'PUT' : 'POST';

    const payload = { ...formData.value };
    // If edit and no password provided, remove it from payload
    if (modalMode.value === 'edit' && !payload.password) {
      delete payload.password;
      delete payload.confirmPassword;
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      await fetchUsers();
      closeModal();
    }
  } catch (err) {
    console.error('Error saving user:', err);
  }
};

const deleteUser = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      await fetchUsers();
    }
  } catch (err) {
    console.error('Error deleting user:', err);
  }
};
</script>

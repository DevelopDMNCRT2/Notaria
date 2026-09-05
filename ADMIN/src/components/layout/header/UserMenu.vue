<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="block mr-1 font-medium text-theme-sm">{{ currentUser?.nombre || 'Administrador' }}</span>
      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ currentUser?.nombre || 'Administrador' }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ currentUser?.correo || '' }}
        </span>
        <span v-if="currentUser?.rol" class="mt-1 inline-block text-[10px] font-semibold uppercase bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full dark:bg-brand-500/10 dark:text-brand-400">
          {{ currentUser?.rol }}
        </span>
      </div>

      <div class="pt-4 pb-3 border-b border-gray-200 dark:border-gray-800" />

      <button
        @click="signOut"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full text-left"
      >
        <LogoutIcon class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
        Cerrar Sesión
      </button>
    </div>
    <!-- Dropdown End -->
  </div>
</template>

<script setup>
import { ChevronDownIcon, LogoutIcon } from '@/icons'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const dropdownOpen = ref(false)
const dropdownRef = ref(null)

const currentUser = computed(() => {
  const raw = localStorage.getItem('notaria_user')
  return raw ? JSON.parse(raw) : null
})

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const signOut = () => {
  localStorage.removeItem('notaria_user')
  closeDropdown()
  router.push('/signin')
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

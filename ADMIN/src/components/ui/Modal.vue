<template>
  <div class="fixed inset-0 flex items-center justify-center overflow-y-auto z-[99999] p-4">
    <div
      v-if="fullScreenBackdrop !== false"
      class="fixed inset-0 h-full w-full bg-slate-900/60 backdrop-blur-md transition-all duration-300"
      aria-hidden="true"
      @click="$emit('close')"
    ></div>
    <slot name="body"></slot>
  </div>
</template>

<script setup lang="ts">
interface ModalProps {
  fullScreenBackdrop?: boolean
}

withDefaults(defineProps<ModalProps>(), {
  fullScreenBackdrop: true
})
defineEmits(['close'])
</script>

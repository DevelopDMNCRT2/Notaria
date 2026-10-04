<template>
  <textarea
    v-if="multiline"
    ref="el"
    class="g-input g-textarea"
    :value="modelValue"
    rows="3"
    placeholder="Escribe aquí tu respuesta…"
    enterkeyhint="enter"
    @input="onInput"
    @keydown.enter="onEnter"
  />
  <input
    v-else
    ref="el"
    class="g-input"
    type="text"
    :value="modelValue"
    placeholder="Escribe aquí tu respuesta…"
    enterkeyhint="next"
    @input="onInput"
    @keydown.enter="onEnter"
  />
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'

const props = defineProps({ modelValue: { type: String, default: '' }, multiline: Boolean, autofocus: Boolean })
const emit = defineEmits(['update:modelValue', 'enter'])
const el = ref(null)

// En celular, Enter en textarea es salto de línea (no hay Shift); en escritorio Enter avanza.
const isTouch = matchMedia('(pointer: coarse)').matches

const grow = () => {
  if (!props.multiline || !el.value) return
  el.value.style.height = 'auto'
  el.value.style.height = Math.min(el.value.scrollHeight + 2, window.innerHeight * 0.5) + 'px'
}
const onInput = (e) => {
  emit('update:modelValue', e.target.value)
  grow()
}
const onEnter = (e) => {
  if (e.isComposing) return
  if (props.multiline && (e.shiftKey || isTouch)) return
  e.preventDefault()
  emit('enter')
}

watch(() => props.modelValue, () => nextTick(grow))
onMounted(() => {
  grow()
  // Sin autofocus en touch: abrir el teclado en cada slide tapa la pregunta.
  if (props.autofocus && !isTouch) el.value?.focus({ preventScroll: true })
})
</script>

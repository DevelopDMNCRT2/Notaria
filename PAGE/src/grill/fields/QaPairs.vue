<template>
  <div class="g-qa">
    <div v-for="(p, i) in list" :key="i" class="g-qa-card">
      <div class="g-qa-head">
        <span>Pregunta {{ i + 1 }}</span>
        <button class="g-link g-danger" type="button" @click="remove(i)">Quitar</button>
      </div>
      <input class="g-input g-input-sm" :value="p.q" placeholder="Como la dice la gente…" @input="set(i, 'q', $event.target.value)" />
      <textarea class="g-input g-textarea g-input-sm" rows="2" :value="p.a" placeholder="Respuesta que daría la Lic…" @input="set(i, 'a', $event.target.value)" />
    </div>
    <button class="g-btn g-btn-ghost g-block" type="button" @click="addPair">+ Agregar pregunta</button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ modelValue: { type: Array, default: null } })
const emit = defineEmits(['update:modelValue'])

// Copia local para que las tarjetas vacías recién agregadas no desaparezcan
const list = ref(props.modelValue?.length ? props.modelValue.map((p) => ({ ...p })) : [{ q: '', a: '' }])
watch(
  () => props.modelValue,
  (v) => {
    if (v && JSON.stringify(v) !== JSON.stringify(list.value.filter((p) => p.q || p.a))) list.value = v.map((p) => ({ ...p }))
  }
)

const commit = () => emit('update:modelValue', list.value.filter((p) => p.q.trim() || p.a.trim()).map((p) => ({ q: p.q, a: p.a })))
const set = (i, f, v) => {
  list.value[i][f] = v
  commit()
}
const addPair = () => list.value.push({ q: '', a: '' })
const remove = (i) => {
  list.value.splice(i, 1)
  if (!list.value.length) list.value.push({ q: '', a: '' })
  commit()
}
</script>

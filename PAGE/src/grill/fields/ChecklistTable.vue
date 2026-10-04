<template>
  <div class="g-checklist">
    <div v-for="(row, i) in rows" :key="row.label" class="g-check-row" :class="{ off: row.offered === 'no' }">
      <div class="g-check-label">
        {{ row.label }}
        <button v-if="row.custom" class="g-link g-danger" type="button" @click="remove(i)">Quitar</button>
      </div>
      <div class="g-check-controls">
        <div class="g-seg" role="group" :aria-label="`¿Ofrecen ${row.label}?`">
          <button type="button" :class="{ on: row.offered === 'si' }" @click="set(i, 'offered', 'si')">Sí</button>
          <button type="button" :class="{ on: row.offered === 'no' }" @click="set(i, 'offered', 'no')">No</button>
        </div>
        <div v-if="row.offered !== 'no'" class="g-seg g-seg-sm" role="group" aria-label="Frecuencia">
          <button v-for="f in freqs" :key="f.v" type="button" :class="{ on: row.frequency === f.v }" @click="set(i, 'frequency', f.v)">
            {{ f.l }}
          </button>
        </div>
      </div>
    </div>
    <form class="g-add-row" @submit.prevent="add">
      <input v-model="newLabel" class="g-input g-input-sm" placeholder="Agregar otro trámite…" enterkeyhint="done" />
      <button class="g-btn g-btn-ghost" type="submit" :disabled="!newLabel.trim()">Agregar</button>
    </form>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ items: { type: Array, default: () => [] }, modelValue: { type: Array, default: null } })
const emit = defineEmits(['update:modelValue'])
const freqs = [
  { v: 'alta', l: 'Alta' },
  { v: 'media', l: 'Media' },
  { v: 'baja', l: 'Baja' },
]
const newLabel = ref('')

// Ítems de la configuración + guardados (incluye los agregados por ella)
const rows = computed(() => {
  const saved = props.modelValue || []
  const byLabel = Object.fromEntries(saved.map((r) => [r.label, r]))
  const base = props.items.map((label) => ({ label, offered: null, frequency: null, custom: false, ...byLabel[label] }))
  const custom = saved.filter((r) => r.custom && !props.items.includes(r.label))
  return [...base, ...custom]
})

const commit = (list) => {
  // Solo se guardan filas con algún dato o agregadas a mano
  emit('update:modelValue', list.filter((r) => r.custom || r.offered || r.frequency).map(({ label, offered, frequency, custom }) => ({ label, offered, frequency, custom })))
}
const set = (i, field, v) => {
  const list = rows.value.map((r) => ({ ...r }))
  list[i][field] = list[i][field] === v ? null : v
  if (field === 'offered' && v === 'no') list[i].frequency = null
  commit(list)
}
const add = () => {
  const label = newLabel.value.trim()
  if (!label || rows.value.some((r) => r.label.toLowerCase() === label.toLowerCase())) return
  commit([...rows.value, { label, offered: 'si', frequency: null, custom: true }])
  newLabel.value = ''
}
const remove = (i) => commit(rows.value.filter((_, j) => j !== i))
</script>

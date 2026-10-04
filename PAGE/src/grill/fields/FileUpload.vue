<template>
  <div class="g-upload">
    <label class="g-drop" :class="{ busy: progress !== null }">
      <input type="file" multiple :accept="accept" :disabled="progress !== null" @change="onPick" />
      <span v-if="progress === null"><strong>Toca para elegir archivos</strong><br /><small>Fotos o PDF · máx. {{ maxSizeMB }} MB c/u</small></span>
      <span v-else>Subiendo… {{ Math.round(progress * 100) }}%</span>
      <span class="g-drop-bar" :style="{ width: (progress || 0) * 100 + '%' }" />
    </label>
    <p v-if="error" class="g-error">{{ error }}</p>
    <ul v-if="files.length" class="g-files">
      <li v-for="f in files" :key="f.id">
        <span class="g-file-icon">{{ f.mime === 'application/pdf' ? 'PDF' : 'IMG' }}</span>
        <span class="g-file-name">{{ f.original_name }}<small>{{ (f.size / 1024 / 1024).toFixed(1) }} MB</small></span>
        <button class="g-link g-danger" type="button" @click="remove(f)">Quitar</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadFiles, deleteFile } from '../api'

const props = defineProps({ questionKey: String, files: Array, accept: String, maxSizeMB: { type: Number, default: 15 } })
const emit = defineEmits(['update:files'])
const progress = ref(null)
const error = ref('')

async function onPick(e) {
  const picked = [...e.target.files]
  e.target.value = ''
  error.value = ''
  const tooBig = picked.filter((f) => f.size > props.maxSizeMB * 1024 * 1024)
  const ok = picked.filter((f) => f.size <= props.maxSizeMB * 1024 * 1024)
  if (tooBig.length) error.value = `Pesan más de ${props.maxSizeMB} MB: ${tooBig.map((f) => f.name).join(', ')}`
  // Lotes de 3 para que el celular no se quede atorado con muchos MB a la vez
  for (let i = 0; i < ok.length; i += 3) {
    const chunk = ok.slice(i, i + 3)
    progress.value = 0
    try {
      const data = await uploadFiles(props.questionKey, chunk, (p) => (progress.value = (i + p * chunk.length) / ok.length))
      emit('update:files', data.files)
    } catch (err) {
      error.value = err.message
      break
    }
  }
  progress.value = null
}

async function remove(f) {
  if (!confirm(`¿Quitar "${f.original_name}"?`)) return
  try {
    const data = await deleteFile(f.id)
    emit('update:files', data.files)
  } catch (err) {
    error.value = err.message
  }
}
</script>

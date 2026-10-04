// Cliente del grill: carga, autoguardado con debounce y respaldo local de cambios pendientes.
import { reactive } from 'vue'

const base = '/api/grill/s'

export const token = (location.pathname.match(/\/grill\/([A-Za-z0-9_-]{20,})/) || [])[1] || null

const pendingKey = token ? `grill_pending_${token.slice(0, 12)}` : null

export const saveState = reactive({ status: 'idle', savedAt: null }) // idle | saving | saved | error

async function request(path, opts = {}) {
  const res = await fetch(`${base}/${token}${path}`, {
    ...opts,
    headers: opts.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Error de red'), { status: res.status })
  return data
}

export const loadSession = () => request('')

// ---------- Autoguardado ----------
// pending: { "question_key#repeat_index": { question_key, repeat_index, value, ask_lic } }
let pending = readLocalPending()
let timer = null
let inflight = null

function readLocalPending() {
  try {
    return JSON.parse(localStorage.getItem(pendingKey) || '{}')
  } catch {
    return {}
  }
}
function writeLocalPending() {
  try {
    if (Object.keys(pending).length) localStorage.setItem(pendingKey, JSON.stringify(pending))
    else localStorage.removeItem(pendingKey)
  } catch {
    /* sin storage: el debounce sigue guardando en servidor */
  }
}

export const getLocalPending = () => ({ ...pending })

export function queueAnswer(question_key, repeat_index, value, ask_lic, delay = 800) {
  pending[`${question_key}#${repeat_index}`] = { question_key, repeat_index, value, ask_lic }
  writeLocalPending()
  saveState.status = 'saving'
  clearTimeout(timer)
  timer = setTimeout(flush, delay)
}

export async function flush() {
  clearTimeout(timer)
  if (inflight) await inflight.catch(() => {})
  const batch = Object.values(pending)
  if (!batch.length) {
    if (saveState.status === 'saving') saveState.status = 'saved'
    return
  }
  const sent = { ...pending }
  saveState.status = 'saving'
  inflight = request('/answers', { method: 'PUT', body: JSON.stringify({ answers: batch }) })
  try {
    await inflight
    // Quita solo lo enviado (si cambió mientras tanto, se queda pendiente)
    for (const [k, v] of Object.entries(sent)) if (pending[k] === v) delete pending[k]
    writeLocalPending()
    saveState.status = Object.keys(pending).length ? 'saving' : 'saved'
    saveState.savedAt = new Date()
    if (Object.keys(pending).length) timer = setTimeout(flush, 300)
  } catch (err) {
    saveState.status = 'error'
    timer = setTimeout(flush, 5000) // reintento
  } finally {
    inflight = null
  }
}

// Al cerrar o mandar al fondo la pestaña: envío best-effort con keepalive.
function flushOnExit() {
  const batch = Object.values(pending)
  if (!batch.length) return
  try {
    fetch(`${base}/${token}/answers`, {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: batch }),
    })
  } catch {
    /* queda en localStorage y se reenvía al volver */
  }
}
if (token) {
  addEventListener('pagehide', flushOnExit)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushOnExit())
}

export const saveProgress = (last_step) =>
  request('/progress', { method: 'PUT', body: JSON.stringify({ last_step }) }).catch(() => {})

export const addGroupItem = (group) => request(`/group/${group}`, { method: 'POST' })
export const removeGroupItem = (group, index) => request(`/group/${group}/${index}`, { method: 'DELETE' })
export const submitSession = () => request('/submit', { method: 'POST' })
export const deleteFile = (id) => request(`/files/${id}`, { method: 'DELETE' })

// Subida con progreso (XHR para tener onprogress)
export function uploadFiles(questionKey, files, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    for (const f of files) form.append('files', f)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${base}/${token}/files/${encodeURIComponent(questionKey)}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => {
      let data = {}
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        /* respuesta no JSON */
      }
      xhr.status < 300 ? resolve(data) : reject(new Error(data.error || (xhr.status === 413 ? 'Archivo demasiado grande' : 'No se pudo subir')))
    }
    xhr.onerror = () => reject(new Error('Sin conexión'))
    xhr.send(form)
  })
}

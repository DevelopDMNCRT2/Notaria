<template>
  <AdminLayout>
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white/90 flex items-center gap-3">
          <ClipboardList class="w-6 h-6 text-brand-500" /> Cuestionario del asistente
        </h2>
        <button v-if="token" @click="logout" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">Cerrar acceso</button>
      </div>

      <!-- Re-autenticación -->
      <form
        v-if="!token"
        @submit.prevent="login"
        class="max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col gap-4"
      >
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Las respuestas del cuestionario son confidenciales. Confirma tus credenciales para verlas.
        </p>
        <input v-model="cred.usuario" autocomplete="username" placeholder="Usuario" class="h-11 rounded-lg border border-gray-300 px-4 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
        <input v-model="cred.password" type="password" autocomplete="current-password" placeholder="Contraseña" class="h-11 rounded-lg border border-gray-300 px-4 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button class="h-11 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600">Entrar</button>
      </form>

      <template v-else>
        <!-- Nueva sesión -->
        <form @submit.prevent="createSession" class="flex flex-wrap gap-3 items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <input v-model="newName" placeholder="Nombre de quien contesta (ej. Haydé)" class="flex-1 min-w-[200px] h-11 rounded-lg border border-gray-300 px-4 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
          <button class="h-11 px-5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 flex items-center gap-2">
            <Plus class="w-4 h-4" /> Crear link
          </button>
        </form>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <div v-if="!sessions.length" class="text-center py-16 text-gray-500 dark:text-gray-400 italic bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          Aún no hay cuestionarios. Crea un link arriba.
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div v-for="s in sessions" :key="s.id" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col gap-3">
            <div class="flex justify-between items-start gap-3">
              <div>
                <h4 class="font-bold text-gray-800 dark:text-white/90 text-lg">{{ s.respondent_name || `Sesión #${s.id}` }}</h4>
                <p class="text-xs text-gray-400">Creada {{ fmt(s.created_at) }} · Última edición {{ fmt(s.updated_at) }}</p>
              </div>
              <span
                class="text-xs font-bold uppercase px-2 py-1 rounded-md whitespace-nowrap"
                :class="s.status === 'submitted' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400'"
              >{{ s.status === 'submitted' ? `Enviado ${fmt(s.submitted_at)}` : 'En progreso' }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300">{{ s.answers_count }} respuestas · {{ s.files_count }} archivos</p>

            <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
              <code class="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{{ linkFor(s) }}</code>
              <button @click="copy(s)" class="text-xs font-semibold text-brand-600 dark:text-brand-400 whitespace-nowrap">{{ copied === s.id ? 'Copiado ✓' : 'Copiar link' }}</button>
            </div>

            <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button @click="openPreview(s)" class="btn-soft bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><Eye class="w-4 h-4" /> Ver</button>
              <button @click="download(s, 'md')" class="btn-soft bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><Download class="w-4 h-4" /> Markdown</button>
              <button @click="download(s, 'json')" class="btn-soft bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><Download class="w-4 h-4" /> JSON</button>
              <button @click="remove(s)" class="btn-soft bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 ml-auto"><Trash2 class="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Vista previa del export -->
    <Teleport to="body">
      <div v-if="preview" class="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="preview = null">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">{{ preview.session.respondent_name || 'Sesión' }}</h3>
            <button @click="preview = null" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
          </div>
          <div class="overflow-y-auto p-5 space-y-6">
            <section v-for="sec in preview.sections" :key="sec.key">
              <h4 class="font-bold text-brand-600 dark:text-brand-400 mb-3">{{ sec.title }}</h4>
              <div v-for="q in sec.questions" :key="q.key" class="mb-4">
                <template v-if="q.type === 'repeatable_group'">
                  <p v-if="!q.items.length" class="text-sm italic text-gray-400">Sin fichas</p>
                  <details v-for="(item, n) in q.items" :key="n" class="mb-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <summary class="cursor-pointer font-semibold text-gray-800 dark:text-white/90">Ficha {{ n + 1 }}: {{ item.fields[0].value || '(sin nombre)' }}</summary>
                    <div v-for="f in item.fields" :key="f.key" class="mt-2">
                      <p class="text-xs font-semibold text-gray-500">{{ f.text }}</p>
                      <AnswerText :a="f" />
                    </div>
                  </details>
                </template>
                <template v-else>
                  <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ q.text }}</p>
                  <ul v-if="q.type === 'file_upload'" class="text-sm mt-1">
                    <li v-if="!q.files.length" class="italic text-gray-400">Sin archivos</li>
                    <li v-for="f in q.files" :key="f.id">
                      <button @click="openFile(f)" class="text-brand-600 dark:text-brand-400 underline">{{ f.original_name }}</button>
                      <span class="text-gray-400"> · {{ (f.size / 1024 / 1024).toFixed(1) }} MB</span>
                    </li>
                  </ul>
                  <AnswerText v-else :a="q" />
                </template>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import { ClipboardList, Download, Eye, Plus, Trash2, X } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import API_BASE_URL from '@/config/api'

interface GrillSession {
  id: number
  token: string
  respondent_name: string | null
  status: string
  created_at: string
  updated_at: string
  submitted_at: string | null
  answers_count: number
  files_count: number
}

const TOKEN_KEY = 'grill_admin_token'
const token = ref<string | null>(sessionStorage.getItem(TOKEN_KEY))
const cred = reactive({ usuario: JSON.parse(localStorage.getItem('notaria_user') || '{}').usuario || '', password: '' })
const error = ref('')
const sessions = ref<GrillSession[]>([])
const publicBase = ref('')
const newName = ref('')
const copied = ref<number | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const preview = ref<any>(null)

// Respuesta de texto / checklist / pares Q&A
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnswerText = (props: { a: any }) => {
  const { value, ask_lic } = props.a
  const nodes = []
  if (ask_lic) nodes.push(h('span', { class: 'inline-block text-xs font-bold bg-warning-50 text-warning-600 px-2 py-0.5 rounded mr-2' }, 'Preguntar a la Lic'))
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) {
    if (!ask_lic) nodes.push(h('span', { class: 'text-sm italic text-gray-400' }, 'Sin respuesta'))
  } else if (Array.isArray(value)) {
    nodes.push(
      h('ul', { class: 'text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 mt-1' },
        value.map((v) => h('li', v.label ? `${v.label} — ${v.offered === 'si' ? 'Sí' : v.offered === 'no' ? 'No' : '?'}${v.frequency ? ` (${v.frequency})` : ''}` : `P: ${v.q} → R: ${v.a}`))
      )
    )
  } else {
    nodes.push(h('p', { class: 'text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line mt-1' }, String(value)))
  }
  return h('div', nodes)
}
AnswerText.props = ['a']

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}/api/grill/admin${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.value}` },
  })
  if (res.status === 401) {
    logout()
    throw new Error('Tu acceso expiró, vuelve a entrar.')
  }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Error del servidor')
  return res
}

async function login() {
  error.value = ''
  const res = await fetch(`${API_BASE_URL}/api/grill/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cred),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    error.value = data.error || 'No se pudo entrar'
    return
  }
  token.value = data.token
  sessionStorage.setItem(TOKEN_KEY, data.token)
  cred.password = ''
  load()
}

function logout() {
  token.value = null
  sessionStorage.removeItem(TOKEN_KEY)
}

async function load() {
  try {
    const data = await (await api('/sessions')).json()
    sessions.value = data.sessions
    publicBase.value = data.public_base_url
  } catch (e) {
    error.value = (e as Error).message
  }
}

async function createSession() {
  try {
    await api('/sessions', { method: 'POST', body: JSON.stringify({ respondent_name: newName.value }) })
    newName.value = ''
    load()
  } catch (e) {
    error.value = (e as Error).message
  }
}

async function remove(s: GrillSession) {
  if (!confirm(`¿Eliminar el cuestionario de ${s.respondent_name || 'esta sesión'} con todas sus respuestas y archivos? No se puede deshacer.`)) return
  await api(`/sessions/${s.id}`, { method: 'DELETE' })
  load()
}

// Si no hay GRILL_PUBLIC_URL, se asume la landing pública en el mismo host, puerto de PAGE.
const linkFor = (s: GrillSession) => `${publicBase.value || `${location.protocol}//${location.hostname}:9189`}/grill/${s.token}`

async function copy(s: GrillSession) {
  await navigator.clipboard.writeText(linkFor(s))
  copied.value = s.id
  setTimeout(() => (copied.value = null), 1500)
}

async function saveBlob(res: Response, fallbackName: string) {
  const name = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/.exec(res.headers.get('Content-Disposition') || '')?.[1] || fallbackName
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url
  a.download = decodeURIComponent(name)
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function download(s: GrillSession, format: 'md' | 'json') {
  try {
    await saveBlob(await api(`/sessions/${s.id}/export?format=${format}&download=1`), `grill-${s.id}.${format}`)
  } catch (e) {
    error.value = (e as Error).message
  }
}

async function openPreview(s: GrillSession) {
  try {
    preview.value = await (await api(`/sessions/${s.id}/export`)).json()
  } catch (e) {
    error.value = (e as Error).message
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function openFile(f: any) {
  const win = window.open('', '_blank')
  try {
    const res = await api(`/files/${f.id}`)
    if (!win) return saveBlob(res, f.original_name)
    win.location.href = URL.createObjectURL(await res.blob())
  } catch (e) {
    win?.close()
    error.value = (e as Error).message
  }
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—')

onMounted(() => token.value && load())
</script>

<style scoped>
.btn-soft {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}
</style>

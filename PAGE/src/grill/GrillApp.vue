<template>
  <div class="g-app">
    <!-- Encabezado -->
    <header class="g-header">
      <div class="g-progress"><span :style="{ width: progressPct + '%' }" /></div>
      <div class="g-header-row">
        <img src="/logo_notaria.jpeg" alt="Notaría 196" class="g-logo" />
        <span class="g-save" :class="saveState.status" aria-live="polite">{{ saveLabel }}</span>
        <button v-if="ready" class="g-menu-btn" type="button" aria-label="Índice de secciones" @click="menuOpen = true">
          <span /><span /><span />
        </button>
      </div>
    </header>

    <main class="g-main">
      <div v-if="loadError" class="g-slide g-center">
        <h1 class="g-title">Este link no funciona</h1>
        <p class="g-lead">{{ loadError }}</p>
      </div>
      <div v-else-if="!ready" class="g-slide g-center"><div class="g-spinner" /></div>

      <Transition v-else :name="dir > 0 ? 'g-fwd' : 'g-back'" mode="out-in">
        <section :key="slideKey" class="g-slide" @keydown.enter="onSlideEnter">
          <!-- Bienvenida -->
          <template v-if="stepId === 'welcome'">
            <img src="/logo_notaria.jpeg" alt="" class="g-hero-logo" />
            <p class="g-kicker">{{ session.respondent_name ? `Hola, ${session.respondent_name}` : 'Notaría Pública 196' }}</p>
            <h1 class="g-title">{{ cfg.welcome.title }}</h1>
            <p class="g-lead">{{ cfg.welcome.text }}</p>
            <ul class="g-tips">
              <li>Una pregunta por pantalla. Todas son opcionales.</li>
              <li>Si no sabes algo, usa <strong>“Preguntar a la Lic”</strong>.</li>
              <li>Puedes cerrar y volver a este mismo link cuando quieras.</li>
            </ul>
            <div class="g-actions-col">
              <button v-if="resumeIndex > 0" class="g-btn g-btn-primary g-block" type="button" @click="resume">
                Continuar donde me quedé
              </button>
              <button class="g-btn g-block" :class="resumeIndex > 0 ? 'g-btn-ghost' : 'g-btn-primary'" type="button" @click="go(1)">
                {{ resumeIndex > 0 ? 'Empezar desde el inicio' : 'Comenzar' }}
              </button>
            </div>
          </template>

          <!-- Final -->
          <template v-else-if="stepId === 'final'">
            <p class="g-kicker">Último paso</p>
            <template v-if="!justSubmitted">
              <h1 class="g-title">¿Listo para enviar?</h1>
              <p class="g-lead">
                Contestaste <strong>{{ answeredCount }}</strong> de {{ totalCount }} preguntas
                <template v-if="groups.ficha"> y llenaste <strong>{{ groups.ficha }}</strong> {{ groups.ficha === 1 ? 'ficha' : 'fichas' }} de trámite</template>.
                <template v-if="askLicCount"> Marcaste {{ askLicCount }} para preguntar a la Lic.</template>
              </p>
              <p v-if="session.status === 'submitted'" class="g-note">Ya lo habías enviado. Puedes volver a enviarlo con tus cambios.</p>
              <div class="g-actions-col">
                <button class="g-btn g-btn-primary g-block" type="button" :disabled="submitting" @click="submit">
                  {{ submitting ? 'Enviando…' : session.status === 'submitted' ? 'Enviar de nuevo' : 'Enviar respuestas' }}
                </button>
              </div>
              <p v-if="submitError" class="g-error">{{ submitError }}</p>
            </template>
            <template v-else>
              <div class="g-check-big">✓</div>
              <h1 class="g-title">{{ cfg.thanks.title }}</h1>
              <p class="g-lead">{{ cfg.thanks.text }}</p>
              <button class="g-btn g-btn-ghost" type="button" @click="go(1)">Revisar mis respuestas</button>
            </template>
          </template>

          <!-- Pregunta -->
          <template v-else-if="q">
            <p class="g-kicker">Sección {{ sectionNumber }} de {{ cfg.sections.length }} · {{ section.title }}</p>
            <p v-if="showIntro" class="g-intro">{{ section.intro }}</p>

            <!-- Fichas (repeatable_group) -->
            <template v-if="q.type === 'repeatable_group'">
              <template v-if="editing === null">
                <h2 class="g-question">{{ q.text }}</h2>
                <p v-if="q.help" class="g-help">{{ q.help }}</p>
                <div v-if="suggestions.length" class="g-suggest">
                  <p>Marcaste “Sí” en: <strong>{{ suggestions.join(', ') }}</strong></p>
                  <button class="g-btn g-btn-primary g-btn-sm" type="button" :disabled="busy" @click="createSuggested">
                    Crear {{ suggestions.length === 1 ? 'su ficha' : `sus ${suggestions.length} fichas` }}
                  </button>
                </div>
                <ul class="g-fichas">
                  <li v-for="i in groups[q.key]" :key="i" class="g-ficha">
                    <button class="g-ficha-main" type="button" @click="openFicha(i - 1)">
                      <strong>{{ fichaName(i - 1) || `Ficha ${i} (sin nombre)` }}</strong>
                      <small>{{ fichaAnswered(i - 1) }} de {{ q.fields.length }} respondidas</small>
                    </button>
                    <button class="g-link g-danger" type="button" @click="removeFicha(i - 1)">Quitar</button>
                  </li>
                </ul>
                <button class="g-btn g-btn-ghost g-block" type="button" :disabled="busy" @click="addFicha()">
                  + {{ groups[q.key] ? 'Agregar otro trámite' : 'Agregar un trámite' }}
                </button>
              </template>
              <template v-else>
                <button class="g-link g-back-link" type="button" @click="closeFicha">← Lista de fichas</button>
                <p class="g-ficha-title">
                  Ficha {{ editing + 1 }}<template v-if="fichaName(editing)"> · {{ fichaName(editing) }}</template>
                  <small>Pregunta {{ fieldIdx + 1 }} de {{ q.fields.length }}</small>
                </p>
                <h2 class="g-question">{{ field.text }}</h2>
                <TextField
                  :model-value="textValue(field.key, editing)"
                  :multiline="field.type === 'textarea'"
                  autofocus
                  @update:model-value="setValue(field.key, editing, $event)"
                  @enter="next"
                />
                <AskLic :active="ans(field.key, editing).ask_lic" @toggle="toggleAskLic(field.key, editing)" />
              </template>
            </template>

            <template v-else>
              <h2 class="g-question">{{ q.text }}</h2>
              <p v-if="q.help" class="g-help">{{ q.help }}</p>

              <TextField
                v-if="q.type === 'text' || q.type === 'textarea'"
                :model-value="textValue(q.key, 0)"
                :multiline="q.type === 'textarea'"
                autofocus
                @update:model-value="setValue(q.key, 0, $event)"
                @enter="next"
              />
              <ChecklistTable
                v-else-if="q.type === 'checklist_table'"
                :items="q.items"
                :model-value="ans(q.key, 0).value"
                @update:model-value="setValue(q.key, 0, $event, 300)"
              />
              <QaPairs v-else-if="q.type === 'qa_pairs'" :model-value="ans(q.key, 0).value" @update:model-value="setValue(q.key, 0, $event)" />
              <FileUpload
                v-else-if="q.type === 'file_upload'"
                :question-key="q.key"
                :files="files.filter((f) => f.question_key === q.key)"
                :accept="q.accept"
                :max-size-m-b="q.maxSizeMB"
                @update:files="files = $event"
              />

              <AskLic v-if="q.type !== 'file_upload'" :active="ans(q.key, 0).ask_lic" @toggle="toggleAskLic(q.key, 0)" />
            </template>
          </template>
        </section>
      </Transition>
    </main>

    <!-- Navegación -->
    <nav v-if="ready && stepIndex > 0" class="g-nav">
      <button class="g-btn g-btn-ghost" type="button" @click="prev">Anterior</button>
      <button v-if="stepId !== 'final'" class="g-btn g-btn-primary" type="button" @click="next">
        {{ editing !== null && fieldIdx === q.fields.length - 1 ? 'Terminar ficha' : 'Siguiente' }}
      </button>
      <span class="g-nav-hint">Enter ↵</span>
    </nav>

    <!-- Índice de secciones -->
    <Transition name="g-fade">
      <div v-if="menuOpen" class="g-sheet-backdrop" @click.self="menuOpen = false">
        <div class="g-sheet" role="dialog" aria-label="Secciones">
          <div class="g-sheet-head">
            <strong>Secciones</strong>
            <button class="g-link" type="button" @click="menuOpen = false">Cerrar</button>
          </div>
          <button v-for="(s, i) in cfg.sections" :key="s.key" class="g-sheet-item" type="button" @click="jumpToSection(s.key)">
            <span class="g-sheet-num">{{ i + 1 }}</span>
            <span>{{ s.title }}</span>
            <small>{{ sectionAnswered(s.key) }}</small>
          </button>
          <button class="g-sheet-item" type="button" @click="jump(steps.length - 1)">
            <span class="g-sheet-num">✓</span><span>Enviar respuestas</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, h } from 'vue'
import * as api from './api'
import TextField from './fields/TextField.vue'
import ChecklistTable from './fields/ChecklistTable.vue'
import QaPairs from './fields/QaPairs.vue'
import FileUpload from './fields/FileUpload.vue'

const { saveState } = api

// Botón "Preguntar a la Lic"
const AskLic = (props, { emit }) =>
  h('button', { type: 'button', class: ['g-asklic', { on: props.active }], 'aria-pressed': props.active, onClick: () => emit('toggle') },
    props.active ? '✓ Se preguntará a la Lic' : 'No sé · Preguntar a la Lic')
AskLic.props = ['active']
AskLic.emits = ['toggle']

const ready = ref(false)
const loadError = ref('')
const cfg = ref(null)
const session = ref({})
const answers = reactive({}) // "key#idx" -> { value, ask_lic }
const files = ref([])
const groups = reactive({})
const stepIndex = ref(0)
const dir = ref(1)
const editing = ref(null) // índice de ficha en edición
const fieldIdx = ref(0)
const busy = ref(false)
const menuOpen = ref(false)
const submitting = ref(false)
const submitError = ref('')
const justSubmitted = ref(false)
const resumeStep = ref(null)

// ---------- Pasos ----------
const steps = computed(() => (cfg.value ? ['welcome', ...cfg.value.questions.map((q) => q.key), 'final'] : []))
const stepId = computed(() => steps.value[stepIndex.value])
const q = computed(() => cfg.value?.questions.find((x) => x.key === stepId.value))
const field = computed(() => (editing.value !== null ? q.value.fields[fieldIdx.value] : null))
const section = computed(() => cfg.value.sections.find((s) => s.key === q.value?.section) || {})
const sectionNumber = computed(() => cfg.value.sections.indexOf(section.value) + 1)
const showIntro = computed(() => section.value.intro && editing.value === null && cfg.value.questions.find((x) => x.section === section.value.key) === q.value)
const slideKey = computed(() => `${stepId.value}|${editing.value}|${fieldIdx.value}|${justSubmitted.value}`)
const progressPct = computed(() => (steps.value.length ? (stepIndex.value / (steps.value.length - 1)) * 100 : 0))
const resumeIndex = computed(() => {
  const id = (resumeStep.value || '').split('@')[0]
  const i = steps.value.indexOf(id)
  return i > 0 ? i : 0
})

// ---------- Respuestas ----------
const EMPTY = Object.freeze({ value: null, ask_lic: false })
const ans = (key, idx) => answers[`${key}#${idx}`] || EMPTY
const textValue = (key, idx) => (typeof ans(key, idx).value === 'string' ? ans(key, idx).value : '')
const isAnswered = (a) => a.ask_lic || (a.value != null && !(typeof a.value === 'string' && !a.value.trim()) && !(Array.isArray(a.value) && !a.value.length))

function setValue(key, idx, value, delay) {
  const cur = ans(key, idx)
  answers[`${key}#${idx}`] = { value, ask_lic: cur.ask_lic }
  api.queueAnswer(key, idx, value, cur.ask_lic, delay)
}
function toggleAskLic(key, idx) {
  const cur = ans(key, idx)
  answers[`${key}#${idx}`] = { value: cur.value, ask_lic: !cur.ask_lic }
  api.queueAnswer(key, idx, cur.value, !cur.ask_lic, 0)
}

const simpleQuestions = computed(() => cfg.value.questions.filter((x) => x.type !== 'repeatable_group'))
const totalCount = computed(() => simpleQuestions.value.length)
const answeredCount = computed(() =>
  simpleQuestions.value.filter((x) => (x.type === 'file_upload' ? files.value.some((f) => f.question_key === x.key) : isAnswered(ans(x.key, 0)))).length
)
const askLicCount = computed(() => Object.values(answers).filter((a) => a.ask_lic).length)
function sectionAnswered(sectionKey) {
  const qs = cfg.value.questions.filter((x) => x.section === sectionKey)
  const parts = []
  const simple = qs.filter((x) => x.type !== 'repeatable_group')
  if (simple.length) {
    const n = simple.filter((x) => (x.type === 'file_upload' ? files.value.some((f) => f.question_key === x.key) : isAnswered(ans(x.key, 0)))).length
    parts.push(`${n}/${simple.length}`)
  }
  for (const g of qs.filter((x) => x.type === 'repeatable_group')) parts.push(`${groups[g.key] || 0} fichas`)
  return parts.join(' · ')
}

// ---------- Fichas ----------
const fichaName = (i) => textValue(q.value.titleField, i).trim()
const fichaAnswered = (i) => q.value.fields.filter((f) => isAnswered(ans(f.key, i))).length
const suggestions = computed(() => {
  if (q.value?.type !== 'repeatable_group' || !q.value.prefillFrom) return []
  const offered = (ans(q.value.prefillFrom, 0).value || []).filter((r) => r.offered === 'si').map((r) => r.label)
  const existing = new Set(Array.from({ length: groups[q.value.key] || 0 }, (_, i) => fichaName(i).toLowerCase()))
  return offered.filter((l) => !existing.has(l.toLowerCase()))
})

async function addFicha(name, open = true) {
  busy.value = true
  try {
    const { index, count } = await api.addGroupItem(q.value.key)
    groups[q.value.key] = count
    if (name) setValue(q.value.titleField, index, name, 0)
    if (open) openFicha(index)
    return index
  } catch (err) {
    alert('No se pudo agregar la ficha. Revisa tu conexión e intenta de nuevo.')
  } finally {
    busy.value = false
  }
}
async function createSuggested() {
  for (const name of [...suggestions.value]) await addFicha(name, false)
  await api.flush()
}
async function removeFicha(i) {
  const name = fichaName(i) || `Ficha ${i + 1}`
  if (!confirm(`¿Quitar la ficha "${name}" y todas sus respuestas?`)) return
  busy.value = true
  try {
    await api.flush()
    const { count } = await api.removeGroupItem(q.value.key, i)
    // Recorre localmente las respuestas de las fichas posteriores
    for (const f of q.value.fields) {
      for (let j = i; j < groups[q.value.key]; j++) {
        const nextA = answers[`${f.key}#${j + 1}`]
        if (nextA) answers[`${f.key}#${j}`] = nextA
        else delete answers[`${f.key}#${j}`]
      }
    }
    groups[q.value.key] = count
  } catch {
    alert('No se pudo quitar la ficha. Intenta de nuevo.')
  } finally {
    busy.value = false
  }
}
function openFicha(i) {
  dir.value = 1
  editing.value = i
  fieldIdx.value = 0
  remember()
}
function closeFicha() {
  dir.value = -1
  editing.value = null
  fieldIdx.value = 0
  api.flush()
  remember()
}

// ---------- Navegación ----------
// Debounce: evita que llamadas rápidas lleguen desordenadas al servidor
let rememberTimer = null
const remember = () => {
  clearTimeout(rememberTimer)
  rememberTimer = setTimeout(() => api.saveProgress(editing.value !== null ? `${stepId.value}@${editing.value}:${fieldIdx.value}` : stepId.value), 250)
}

function go(i) {
  if (i < 0 || i >= steps.value.length) return
  dir.value = i >= stepIndex.value ? 1 : -1
  stepIndex.value = i
  editing.value = null
  fieldIdx.value = 0
  justSubmitted.value = false
  api.flush()
  remember()
  scrollTo({ top: 0 })
}
function next() {
  if (editing.value !== null) {
    if (fieldIdx.value < q.value.fields.length - 1) {
      dir.value = 1
      fieldIdx.value++
      api.flush()
      remember()
    } else closeFicha()
    return
  }
  if (stepId.value !== 'final') go(stepIndex.value + 1)
}
function prev() {
  if (editing.value !== null) {
    if (fieldIdx.value > 0) {
      dir.value = -1
      fieldIdx.value--
      remember()
    } else closeFicha()
    return
  }
  go(stepIndex.value - 1)
}
function resume() {
  const [id, pos] = (resumeStep.value || '').split('@')
  go(steps.value.indexOf(id))
  if (pos && q.value?.type === 'repeatable_group') {
    const [i, k] = pos.split(':').map(Number)
    if (i < (groups[q.value.key] || 0)) {
      editing.value = i
      fieldIdx.value = Math.min(k || 0, q.value.fields.length - 1)
      remember()
    }
  }
}
const jump = (i) => {
  menuOpen.value = false
  go(i)
}
const jumpToSection = (key) => jump(steps.value.indexOf(cfg.value.questions.find((x) => x.section === key).key))

// Enter fuera de campos de texto (ej. en el catálogo o lista de fichas) avanza
function onSlideEnter(e) {
  const t = e.target
  if (e.shiftKey || e.isComposing || ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(t.tagName)) return
  e.preventDefault()
  next()
}
onMounted(() =>
  addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target === document.body && ready.value && !menuOpen.value) {
      stepIndex.value === 0 ? (resumeIndex.value ? resume() : go(1)) : onSlideEnter(e)
    }
  })
)

async function submit() {
  submitting.value = true
  submitError.value = ''
  try {
    await api.flush()
    if (api.saveState.status === 'error') throw new Error()
    await api.submitSession()
    session.value.status = 'submitted'
    justSubmitted.value = true
  } catch {
    submitError.value = 'No se pudo enviar. Revisa tu conexión e intenta de nuevo; tus respuestas siguen guardadas.'
  } finally {
    submitting.value = false
  }
}

const saveLabel = computed(() => {
  if (!ready.value) return ''
  return { saving: 'Guardando…', saved: 'Guardado ✓', error: 'Sin conexión · reintentando', idle: 'Se guarda solo' }[saveState.status]
})

// ---------- Carga ----------
onMounted(async () => {
  if (!api.token) {
    loadError.value = 'Pide de nuevo el link completo.'
    return
  }
  try {
    const data = await api.loadSession()
    cfg.value = data.config
    session.value = data.session
    Object.assign(groups, data.session.groups)
    files.value = data.files
    for (const a of data.answers) answers[`${a.question_key}#${a.repeat_index}`] = { value: a.answer?.value ?? null, ask_lic: !!a.answer?.ask_lic }
    // Cambios que no alcanzaron a llegar al servidor (se cerró sin conexión)
    const pending = api.getLocalPending()
    for (const p of Object.values(pending)) answers[`${p.question_key}#${p.repeat_index}`] = { value: p.value, ask_lic: p.ask_lic }
    if (Object.keys(pending).length) api.flush()
    resumeStep.value = data.session.last_step
    ready.value = true
  } catch (err) {
    loadError.value = err.status === 404 ? 'El link no es válido. Pide uno nuevo.' : 'No hay conexión con el servidor. Intenta en un momento.'
  }
})
</script>

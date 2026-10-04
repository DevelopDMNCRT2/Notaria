// ============================================================
// Cuestionario (grill) de requerimientos de la Notaría.
// Edita aquí textos, orden o preguntas sin tocar la UI.
//
// Tipos: text | textarea | checklist_table | repeatable_group | qa_pairs | file_upload
// Cada respuesta se guarda con su question_key; si cambias una key,
// las respuestas viejas quedan en BD pero dejan de mostrarse.
// ============================================================

const welcome = {
  title: 'Cuestionario del Asistente Notarial',
  text:
    'Con estas respuestas el asistente de la notaría va a contestar con datos reales y con seguridad, sin inventar. ' +
    'Puedes contestarlo en partes: todo se guarda solo. Lo más importante son las fichas por trámite y la agenda.',
};

const thanks = {
  title: '¡Gracias!',
  text: 'Con esto armamos el asistente. Si te acuerdas de algo más, vuelve a este mismo link.',
};

const sections = [
  { key: 'contact', title: 'Datos de contacto y operación' },
  { key: 'channel', title: 'Canal y horario de atención' },
  { key: 'catalog', title: 'Catálogo de trámites' },
  {
    key: 'ficha',
    title: 'Ficha por trámite',
    intro:
      'Llena una ficha por cada trámite que ofrecen. Si tienen hojas de requisitos impresas, súbelas en la última sección y aquí llena solo precio, tiempo y cita.',
  },
  {
    key: 'agenda',
    title: 'Disponibilidad y agenda de citas',
    intro: 'La agenda vivirá en el admin de la notaría y se enlazará con el calendario personal de la Lic.',
  },
  { key: 'confirm', title: 'Confirmación y recordatorios' },
  { key: 'faq', title: 'Preguntas frecuentes' },
  { key: 'tone', title: 'Tono profesional y casos que pasan a la Lic' },
  { key: 'privacy', title: 'Privacidad' },
  { key: 'material', title: 'Material' },
];

const questions = [
  // --- Sección 1 ---
  { key: 'contact.names', section: 'contact', type: 'textarea', text: 'Nombre completo del Notario Titular y de la Lic. ¿Cómo debe referirse a ellos el asistente frente a clientes?' },
  { key: 'contact.address', section: 'contact', type: 'textarea', text: 'Dirección completa, referencias para llegar y si hay estacionamiento.' },
  { key: 'contact.hours', section: 'contact', type: 'textarea', text: 'Horario de oficina por día. ¿Abren sábados? ¿Qué días festivos o vacaciones cierran este año?' },
  { key: 'contact.channels', section: 'contact', type: 'textarea', text: 'Teléfono, WhatsApp y correo oficiales que el asistente puede compartir.' },
  { key: 'contact.escalation', section: 'contact', type: 'textarea', text: 'Cuando el asistente no pueda resolver algo, ¿a quién se lo pasa y por qué medio?' },

  // --- Sección 2 ---
  { key: 'channel.inbound', section: 'channel', type: 'textarea', text: '¿Por dónde llegan hoy los clientes: WhatsApp, llamadas o ambos? ¿Más o menos cuántos al día?' },
  { key: 'channel.number', section: 'channel', type: 'textarea', text: '¿El asistente contesta en el WhatsApp actual de la notaría o en un número nuevo?' },
  { key: 'channel.schedule', section: 'channel', type: 'textarea', text: '¿Contesta a toda hora o solo en horario de oficina? Fuera de horario, ¿puede agendar o solo tomar datos?' },
  { key: 'channel.handoff', section: 'channel', type: 'textarea', text: 'Cuando la Lic quiera contestar ella misma una conversación, ¿cómo lo avisa?' },

  // --- Sección 3 ---
  {
    key: 'catalog.services',
    section: 'catalog',
    type: 'checklist_table',
    text: '¿Qué trámites ofrecen y con qué frecuencia llegan?',
    help: 'Marca Sí/No y la frecuencia. Puedes agregar trámites que no estén en la lista.',
    items: [
      'Compraventa de inmueble',
      'Compraventa con crédito (Infonavit, Fovissste, bancario)',
      'Testamento',
      'Poderes (generales y especiales)',
      'Donación',
      'Adjudicación por herencia / sucesiones',
      'Cancelación de hipoteca',
      'Constitución de sociedades',
      'Actas de asamblea / protocolizaciones',
      'Fe de hechos',
      'Ratificación de firmas / cotejo de documentos',
      'Régimen de condominio / lotificación',
    ],
  },
  { key: 'catalog.not_offered', section: 'catalog', type: 'textarea', text: 'Trámites que NO hacen pero la gente pregunta seguido: ¿qué responde el asistente y a dónde los canaliza?' },

  // --- Sección 4 ---
  {
    key: 'ficha',
    section: 'ficha',
    type: 'repeatable_group',
    text: 'Fichas por trámite',
    help: 'Una ficha por cada trámite. Puedes crear las fichas de los trámites que marcaste "Sí" en el catálogo.',
    prefillFrom: 'catalog.services',
    titleField: 'ficha.name',
    fields: [
      { key: 'ficha.name', type: 'text', text: 'Trámite' },
      { key: 'ficha.explanation', type: 'textarea', text: 'Explicación breve para el cliente, como lo diría la Lic (1 o 2 frases)' },
      { key: 'ficha.documents', type: 'textarea', text: 'Documentos que trae cada parte (vendedor, comprador, otorgante, etc.)' },
      { key: 'ficha.special_cases', type: 'textarea', text: 'Casos especiales (casados, extranjeros, menores, empresas, finados)' },
      { key: 'ficha.fee_range', type: 'textarea', text: 'Precio aproximado de honorarios (rango en pesos) y qué incluye' },
      { key: 'ficha.extra_costs', type: 'textarea', text: 'Gastos aparte (impuestos, registro, avalúo, certificados): monto o cómo se calcula' },
      { key: 'ficha.deposit', type: 'text', text: '¿Se pide anticipo? ¿Cuánto?' },
      { key: 'ficha.payment_methods', type: 'text', text: 'Formas de pago aceptadas' },
      { key: 'ficha.time_to_signing', type: 'text', text: 'Tiempo desde que entregan papeles hasta la firma' },
      { key: 'ficha.time_to_delivery', type: 'text', text: 'Tiempo hasta entregar el testimonio o documento final' },
      { key: 'ficha.appointment', type: 'text', text: '¿Requiere cita? Duración de la cita' },
      { key: 'ficha.signers', type: 'textarea', text: 'Quién debe presentarse a firmar' },
      { key: 'ficha.common_errors', type: 'textarea', text: 'Errores frecuentes de los clientes' },
    ],
  },
  { key: 'pricing.policy', section: 'ficha', type: 'textarea', text: '¿El asistente puede dar el rango de precio tal cual, o debe decir "desde $X" y aclarar que el monto final se confirma al revisar documentos?' },

  // --- Sección 5 ---
  { key: 'agenda.access', section: 'agenda', type: 'textarea', text: '¿Quién más, aparte de la Lic, debe poder ver o mover citas?' },
  { key: 'agenda.slots', section: 'agenda', type: 'textarea', text: 'Días y horarios en que se pueden dar citas.' },
  { key: 'agenda.durations', section: 'agenda', type: 'textarea', text: 'Duración de cada tipo de cita: primera consulta, revisión de documentos, firma.' },
  { key: 'agenda.capacity', section: 'agenda', type: 'text', text: '¿Cuántas citas pueden atender al mismo tiempo?' },
  { key: 'agenda.lead_time', section: 'agenda', type: 'textarea', text: '¿Con cuánta anticipación mínima se agenda? ¿Se aceptan citas el mismo día?' },
  { key: 'agenda.available_now', section: 'agenda', type: 'textarea', text: 'Cuando preguntan "¿están disponibles ahora?", ¿significa que la oficina está abierta o que la Lic puede atender en ese momento? ¿Cómo lo sabría el asistente?' },
  { key: 'agenda.needs_approval', section: 'agenda', type: 'textarea', text: '¿Qué trámites o casos NO puede agendar el asistente sin aprobación de la Lic?' },
  { key: 'agenda.required_data', section: 'agenda', type: 'textarea', text: 'Datos que debe pedir para agendar.' },
  { key: 'agenda.cost', section: 'agenda', type: 'textarea', text: '¿Las citas tienen costo o requieren anticipo para apartarse?' },

  // --- Sección 6 ---
  { key: 'confirm.timing', section: 'confirm', type: 'textarea', text: '¿Cuándo confirma la cita? (un día antes, la mañana del mismo día, ambos)' },
  { key: 'confirm.no_reply', section: 'confirm', type: 'textarea', text: 'Si el cliente no responde la confirmación, ¿se mantiene, se cancela o se avisa a la Lic?' },
  { key: 'confirm.documents_reminder', section: 'confirm', type: 'text', text: '¿El recordatorio incluye la lista de documentos que debe traer?' },
  { key: 'confirm.reschedule', section: 'confirm', type: 'textarea', text: 'Si quiere cancelar o cambiar, ¿el asistente reagenda solo o lo pasa a la Lic?' },
  { key: 'confirm.notify_lic', section: 'confirm', type: 'textarea', text: '¿A la Lic le llega aviso de cada cita nueva, confirmada o cancelada? ¿Por dónde?' },
  { key: 'confirm.no_show_policy', section: 'confirm', type: 'textarea', text: 'Política de retrasos o inasistencias, si la hay.' },

  // --- Sección 7 ---
  { key: 'faq.pairs', section: 'faq', type: 'qa_pairs', text: 'Aparte de requisitos, precio y tiempo, ¿qué otras preguntas llegan seguido? Escríbelas como las dice la gente y la respuesta que daría la Lic.' },
  { key: 'faq.sensitive', section: 'faq', type: 'textarea', text: '¿Llegan preguntas delicadas que el asistente debe esquivar con elegancia? (pagar menos impuestos, escriturar sin un heredero, firmar por otra persona)' },

  // --- Sección 8 ---
  { key: 'tone.formality', section: 'tone', type: 'text', text: '¿Trato de usted o de tú?' },
  { key: 'tone.identity', section: 'tone', type: 'textarea', text: '¿Cómo se presenta? (nombre propio, "asistente de la Notaría", parte del equipo)' },
  { key: 'tone.greetings', section: 'tone', type: 'textarea', text: 'Ejemplos de cómo saluda y se despide la Lic por WhatsApp.' },
  { key: 'tone.vocabulary', section: 'tone', type: 'textarea', text: 'Palabras que la notaría prefiere usar y cuáles evitar.' },
  { key: 'tone.unknown_phrase', section: 'tone', type: 'textarea', text: 'Cuando un dato no esté en sus fichas dirá algo firme como "Le confirmo ese dato con la Licenciada y le respondo hoy". ¿Está bien esa frase o prefieren otra? ¿En cuánto tiempo se le responde al cliente?' },
  { key: 'tone.escalation_cases', section: 'tone', type: 'textarea', text: 'Casos que pasan directo a la Lic (herencias en conflicto, montos altos, cliente molesto, urgencias, asesoría legal específica).' },
  { key: 'tone.never', section: 'tone', type: 'textarea', text: '¿Qué NUNCA debe decir o prometer?' },

  // --- Sección 9 ---
  { key: 'privacy.notice', section: 'privacy', type: 'textarea', text: '¿Tienen aviso de privacidad? (si sí, súbelo en la siguiente sección)' },
  { key: 'privacy.documents_by_chat', section: 'privacy', type: 'textarea', text: '¿El asistente puede recibir fotos de identificaciones o documentos por chat, o solo decir qué traer?' },
  { key: 'privacy.approval', section: 'privacy', type: 'textarea', text: '¿La Lic o el Notario deben aprobar las respuestas del asistente antes de atender clientes reales?' },

  // --- Sección 10 ---
  {
    key: 'material.files',
    section: 'material',
    type: 'file_upload',
    text: 'Sube lo que tengas: hojas de requisitos, tabulador o rangos de honorarios, aviso de privacidad, capturas de conversaciones típicas de WhatsApp (tapando datos personales), citas ya agendadas de las próximas semanas, guías internas.',
    help: 'Imágenes o PDF, máximo 15 MB cada uno.',
    accept: 'image/*,application/pdf',
    maxSizeMB: 15,
  },
];

module.exports = { welcome, thanks, sections, questions };

// Construye el export (JSON y Markdown) de una sesión del grill, agrupado por sección.
const { sections, questions } = require('./questions');

const ASK_LIC_LABEL = 'Preguntar a la Lic';

const isEmptyValue = (v) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

function buildExport(session, answerRows, fileRows) {
  // answers[question_key][repeat_index] = { value, ask_lic, question_text, updated_at }
  const answers = {};
  for (const row of answerRows) {
    const a = row.answer || {};
    answers[row.question_key] = answers[row.question_key] || {};
    answers[row.question_key][row.repeat_index] = {
      value: a.value ?? null,
      ask_lic: !!a.ask_lic,
      question_text: row.question_text,
      updated_at: row.updated_at,
    };
  }
  const used = new Set();
  const take = (key, idx = 0) => {
    used.add(`${key}#${idx}`);
    return answers[key]?.[idx] || null;
  };

  const out = {
    session: {
      id: session.id,
      respondent_name: session.respondent_name,
      status: session.status,
      created_at: session.created_at,
      updated_at: session.updated_at,
      submitted_at: session.submitted_at,
    },
    sections: [],
  };

  for (const section of sections) {
    const sec = { key: section.key, title: section.title, questions: [] };
    for (const q of questions.filter((x) => x.section === section.key)) {
      if (q.type === 'repeatable_group') {
        const indexes = new Set();
        for (const f of q.fields) Object.keys(answers[f.key] || {}).forEach((i) => indexes.add(Number(i)));
        sec.questions.push({
          key: q.key,
          text: q.text,
          type: q.type,
          items: [...indexes].sort((a, b) => a - b).map((idx) => ({
            repeat_index: idx,
            fields: q.fields.map((f) => {
              const a = take(f.key, idx);
              return { key: f.key, text: f.text, type: f.type, value: a?.value ?? null, ask_lic: !!a?.ask_lic };
            }),
          })),
        });
      } else if (q.type === 'file_upload') {
        sec.questions.push({
          key: q.key,
          text: q.text,
          type: q.type,
          files: fileRows
            .filter((f) => f.question_key === q.key)
            .map((f) => ({ id: f.id, original_name: f.original_name, mime: f.mime, size: f.size, path: f.file_path, created_at: f.created_at })),
        });
      } else {
        const a = take(q.key);
        sec.questions.push({ key: q.key, text: q.text, type: q.type, value: a?.value ?? null, ask_lic: !!a?.ask_lic });
      }
    }
    out.sections.push(sec);
  }

  // Respuestas cuya pregunta ya no existe en la configuración: no se pierden.
  const orphans = answerRows.filter((r) => !used.has(`${r.question_key}#${r.repeat_index}`));
  if (orphans.length) {
    out.sections.push({
      key: '_orphans',
      title: 'Respuestas a preguntas que ya no están en el cuestionario',
      questions: orphans.map((r) => ({
        key: r.question_key,
        repeat_index: r.repeat_index,
        text: r.question_text,
        value: r.answer?.value ?? null,
        ask_lic: !!r.answer?.ask_lic,
      })),
    });
  }
  return out;
}

// ---------- Markdown ----------
const indent = (text) => String(text).split('\n').map((l) => `> ${l}`).join('\n');

function renderValue(type, value, askLic) {
  const parts = [];
  if (askLic) parts.push(`**⚠️ ${ASK_LIC_LABEL}**`);
  if (isEmptyValue(value)) {
    if (!askLic) parts.push('_(sin respuesta)_');
    return parts.join('\n\n');
  }
  if (type === 'checklist_table' && Array.isArray(value)) {
    const rows = value
      .filter((i) => i && i.label)
      .map((i) => `| ${i.label.replace(/\|/g, '/')}${i.custom ? ' _(agregado)_' : ''} | ${fmtYesNo(i.offered)} | ${i.frequency || '—'} |`);
    parts.push(['| Trámite | ¿Lo ofrecen? | Frecuencia |', '|---|---|---|', ...rows].join('\n'));
  } else if (type === 'qa_pairs' && Array.isArray(value)) {
    parts.push(
      value
        .filter((p) => p && (p.q || p.a))
        .map((p, i) => `${i + 1}. **P:** ${p.q || '_(vacía)_'}\n   **R:** ${(p.a || '_(vacía)_').replace(/\n/g, '\n   ')}`)
        .join('\n')
    );
  } else if (typeof value === 'string') {
    parts.push(indent(value.trim()));
  } else {
    parts.push('```json\n' + JSON.stringify(value, null, 2) + '\n```');
  }
  return parts.join('\n\n');
}

const fmtYesNo = (v) => (v === 'si' ? 'Sí' : v === 'no' ? 'No' : '—');
const fmtDate = (d) => (d ? new Date(d).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '—');

function toMarkdown(data) {
  const s = data.session;
  const lines = [
    `# Cuestionario del Asistente Notarial — ${s.respondent_name || 'Sin nombre'}`,
    '',
    `- Estado: **${s.status === 'submitted' ? 'Enviado' : 'En progreso'}**`,
    `- Creado: ${fmtDate(s.created_at)} · Última edición: ${fmtDate(s.updated_at)} · Enviado: ${fmtDate(s.submitted_at)}`,
    '',
  ];
  data.sections.forEach((sec, i) => {
    lines.push(`## ${sec.key === '_orphans' ? '' : `${i + 1}. `}${sec.title}`, '');
    for (const q of sec.questions) {
      if (q.type === 'repeatable_group') {
        if (!q.items.length) lines.push(`### ${q.text}`, '', '_(sin fichas)_', '');
        q.items.forEach((item, n) => {
          const name = item.fields.find((f) => f.key.endsWith('.name'))?.value;
          lines.push(`### Ficha ${n + 1}: ${typeof name === 'string' && name.trim() ? name.trim() : '(sin nombre)'}`, '');
          for (const f of item.fields) {
            lines.push(`**${f.text}**`, '', renderValue(f.type, f.value, f.ask_lic), '');
          }
        });
        continue;
      }
      lines.push(`### ${q.text}`, `\`${q.key}\``, '');
      if (q.type === 'file_upload') {
        lines.push(
          q.files.length
            ? q.files.map((f) => `- ${f.original_name} (${f.mime}, ${(f.size / 1024 / 1024).toFixed(2)} MB) — id ${f.id}`).join('\n')
            : '_(sin archivos)_'
        );
      } else {
        lines.push(renderValue(q.type, q.value, q.ask_lic));
      }
      lines.push('');
    }
  });
  return lines.join('\n');
}

module.exports = { buildExport, toMarkdown };

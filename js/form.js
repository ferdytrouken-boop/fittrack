// Formulario de actividad (crear / editar / completar una planificada).
import * as db from './db.js';
import { TYPES, TYPE_ORDER, MUSCLES, REGIONS, RUN_KINDS, FOOT_FORMATS, RESULTS, STATUS } from './catalog.js';
import { icon } from './icons.js';
import { openSheet, toast, ask } from './ui.js';
import { today, fmtDateLong, parseHMS, fmtHMS, paceSec, fmtPace, fmtNum, num, esc } from './utils.js';

const QUICK_MIN = [30, 45, 60, 75, 90, 120];

// Selector de tipo → luego formulario en la misma hoja
export function newActivity({ date = today(), status } = {}) {
  status = status || (date > today() ? 'planned' : 'done');
  const sheet = openSheet(`
    <h2 class="sheet-title">¿Qué actividad?</h2>
    <p class="sheet-sub">${status === 'planned' ? 'Planificar para el' : 'Registrar el'} ${fmtDateLong(date)}</p>
    <div class="type-grid">
      ${TYPE_ORDER.map(t => `
        <button class="type-tile t-${t}" data-type="${t}">
          ${icon(t, 'xl')}<span>${TYPES[t].label}</span>
        </button>`).join('')}
    </div>`);
  sheet.el.addEventListener('click', e => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    renderForm(sheet, { type: b.dataset.type, date, status, duration_min: null, data: {}, notes: '' }, true);
  });
}

export function editActivity(item, overrides = {}) {
  const sheet = openSheet('');
  renderForm(sheet, { ...item, ...overrides }, false);
}

// ── Campos por tipo ─────────────────────────────────────────
const field = (label, input, hint = '') =>
  `<label class="field"><span class="lbl">${label}${hint ? ` <em>${hint}</em>` : ''}</span>${input}</label>`;
const inp = (name, val, attrs = '') =>
  `<input name="${name}" value="${esc(val ?? '')}" ${attrs}>`;
const numInp = (name, val, attrs = '') => inp(name, val, `inputmode="decimal" autocomplete="off" ${attrs}`);
const sel = (name, opts, val, empty = '—') =>
  `<select name="${name}"><option value="">${empty}</option>${opts.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;

function gymFields(d) {
  const chosen = new Set(d.muscles || []);
  const exRows = (d.exercises || []).map(exRow).join('');
  return `
    <div class="field"><span class="lbl">Grupos musculares <em>catálogo</em></span>
      ${REGIONS.map(r => `
        <div class="region"><span class="region-lbl">${r.label}</span>
          <div class="chips">
            ${MUSCLES.filter(m => m.region === r.id).map(m => `
              <label class="chip"><input type="checkbox" name="muscles" value="${m.id}" ${chosen.has(m.id) ? 'checked' : ''}><span>${m.label}</span></label>`).join('')}
          </div></div>`).join('')}
    </div>
    ${field('Rutina', inp('d.routine', d.routine, 'placeholder="Ej. Empuje, Torso, Pierna…"'))}
    <div class="field"><span class="lbl">Ejercicios <em>opcional</em></span>
      <div class="ex-head"><span>Ejercicio</span><span>Series</span><span>Reps</span><span>Kg</span><span></span></div>
      <div class="ex-list">${exRows}</div>
      <datalist id="ex-options"></datalist>
      <button type="button" class="btn ghost sm" data-add-ex>${icon('plus')} Añadir ejercicio</button>
    </div>`;
}
const exRow = (e = {}) => `
  <div class="ex-row">
    <input name="ex.name" list="ex-options" placeholder="Ejercicio" value="${esc(e.name || '')}">
    <input name="ex.sets" inputmode="numeric" placeholder="4" value="${esc(e.sets ?? '')}">
    <input name="ex.reps" inputmode="text" placeholder="10" value="${esc(e.reps ?? '')}">
    <input name="ex.kg" inputmode="decimal" placeholder="—" value="${esc(e.kg ?? '')}">
    <button type="button" class="icon-btn sm" data-del-ex aria-label="Quitar">${icon('close')}</button>
  </div>`;

function runFields(d) {
  return `
    <div class="grid2">
      ${field('Distancia', numInp('d.km', d.km, 'placeholder="0,0"') + '<span class="unit">km</span>')}
      ${field('Tiempo', inp('d.time', d.time_sec ? fmtHMS(d.time_sec) : '', 'inputmode="numeric" placeholder="h:mm:ss"'), '')}
    </div>
    <div class="live-stats" data-run-live></div>
    ${field('Tipo de entreno', sel('d.kind', RUN_KINDS, d.kind))}
    <div class="grid2">
      ${field('FC media', numInp('d.hr_avg', d.hr_avg, 'placeholder="ppm"'))}
      ${field('FC máx.', numInp('d.hr_max', d.hr_max, 'placeholder="ppm"'))}
      ${field('Desnivel +', numInp('d.elev', d.elev, 'placeholder="m"'))}
      ${field('Cadencia', numInp('d.cadence', d.cadence, 'placeholder="ppm"'))}
      ${field('Calorías', numInp('d.kcal', d.kcal, 'placeholder="kcal"'))}
      ${field('Zapatillas', inp('d.shoes', d.shoes, 'placeholder="Modelo"'))}
    </div>`;
}

function footFields(d) {
  return `
    <div class="grid2">
      ${field('Modalidad', sel('d.format', FOOT_FORMATS, d.format || 'Fútbol 7', 'Modalidad'))}
      ${field('Resultado', sel('d.result', RESULTS, d.result))}
      ${field('Goles', numInp('d.goals', d.goals, 'inputmode="numeric" placeholder="0"'))}
      ${field('Asistencias', numInp('d.assists', d.assists, 'inputmode="numeric" placeholder="0"'))}
      ${field('Marcador', inp('d.score', d.score, 'placeholder="5-3"'))}
      ${field('Distancia', numInp('d.km', d.km, 'placeholder="km (reloj)"'))}
    </div>`;
}

function spinFields(d) {
  return `
    <div class="grid2">
      ${field('FTP utilizado', numInp('d.ftp', d.ftp, 'inputmode="numeric" placeholder="W"') + '<span class="unit">W</span>')}
      ${field('Distancia', numInp('d.km', d.km, 'placeholder="0,0"') + '<span class="unit">km</span>')}
      ${field('Potencia media', numInp('d.avg_power', d.avg_power, 'placeholder="W"'))}
      ${field('Cadencia media', numInp('d.cadence', d.cadence, 'placeholder="rpm"'))}
      ${field('FC media', numInp('d.hr_avg', d.hr_avg, 'placeholder="ppm"'))}
      ${field('Calorías', numInp('d.kcal', d.kcal, 'placeholder="kcal"'))}
    </div>
    <div class="live-stats" data-spin-live></div>`;
}

function otherFields(d) {
  return `
    ${field('Nombre de la actividad', inp('d.name', d.name, 'placeholder="Pádel, natación, yoga…"'))}
    ${field('Distancia', numInp('d.km', d.km, 'placeholder="km (opcional)"'))}`;
}
const FIELDS = { gym: gymFields, running: runFields, football: footFields, spinning: spinFields, other: otherFields };

// ── Render ─────────────────────────────────────────────────
function renderForm(sheet, item, isNew) {
  const t = item.type, d = item.data || {};
  const body = sheet.el.querySelector('.sheet-body');
  sheet.el.className = `sheet t-${t}`;
  body.innerHTML = `
    <form class="act-form" novalidate>
      <header class="form-head">
        <span class="form-ic">${icon(t, 'lg')}</span>
        <div><h2 class="sheet-title">${TYPES[t].label}</h2>
          <p class="sheet-sub">${isNew ? 'Nueva actividad' : 'Editar actividad'}</p></div>
      </header>

      <div class="seg" role="radiogroup">
        ${Object.entries(STATUS).map(([k, v]) => `
          <label><input type="radio" name="status" value="${k}" ${item.status === k ? 'checked' : ''}><span>${v}</span></label>`).join('')}
      </div>

      <div class="grid2">
        ${field('Fecha', `<input type="date" name="date" value="${esc(item.date)}" required>`)}
        ${field('Tiempo dedicado', numInp('duration_min', item.duration_min, 'inputmode="numeric" placeholder="min"') + '<span class="unit">min</span>')}
      </div>
      <div class="quick">${QUICK_MIN.map(m => `<button type="button" class="pill" data-min="${m}">${m < 60 ? m + "'" : (m / 60).toString().replace('.', ',') + 'h'}</button>`).join('')}</div>

      ${FIELDS[t](d)}

      <div class="field rpe-field"><span class="lbl">Esfuerzo percibido <em data-rpe-val>${d.rpe ? d.rpe + '/10' : '—'}</em></span>
        <input type="range" min="1" max="10" step="1" name="d.rpe" value="${d.rpe || 6}" ${d.rpe ? '' : 'data-untouched'}>
      </div>
      ${field('Notas', `<textarea name="notes" rows="2" placeholder="Sensaciones, lugar, compañeros…">${esc(item.notes || '')}</textarea>`)}

      <p class="form-error" hidden></p>
      <div class="form-actions">
        ${isNew ? '' : `<button type="button" class="icon-btn danger" data-delete aria-label="Eliminar">${icon('trash')}</button>
                        <button type="button" class="icon-btn" data-dup aria-label="Duplicar">${icon('copy')}</button>`}
        <button type="submit" class="btn primary grow">${icon('check')} Guardar</button>
      </div>
    </form>`;

  const form = body.querySelector('form');
  const $ = s => form.querySelector(s);

  // Estado ↔ visibilidad del esfuerzo
  const syncStatus = () => {
    const st = form.status.value;
    form.classList.toggle('is-planned', st === 'planned');
    $('.rpe-field').hidden = st !== 'done';
  };
  form.addEventListener('change', e => { if (e.target.name === 'status') syncStatus(); if (e.target.name === 'muscles') fillExOptions(); });
  syncStatus();

  // Minutos rápidos
  form.addEventListener('click', e => {
    const q = e.target.closest('[data-min]');
    if (q) { form.duration_min.value = q.dataset.min; return; }
    if (e.target.closest('[data-add-ex]')) {
      $('.ex-list').insertAdjacentHTML('beforeend', exRow());
      $('.ex-list').lastElementChild.querySelector('input').focus();
      return;
    }
    const del = e.target.closest('[data-del-ex]');
    if (del) del.closest('.ex-row').remove();
  });

  // RPE
  const rpe = form.querySelector('[name="d.rpe"]');
  rpe.addEventListener('input', () => { rpe.removeAttribute('data-untouched'); $('[data-rpe-val]').textContent = rpe.value + '/10'; });

  // Sugerencias de ejercicios según grupos elegidos
  function fillExOptions() {
    const dl = $('#ex-options'); if (!dl) return;
    const sel = [...form.querySelectorAll('[name=muscles]:checked')].map(i => i.value);
    const pool = (sel.length ? MUSCLES.filter(m => sel.includes(m.id)) : MUSCLES).flatMap(m => m.exercises);
    dl.innerHTML = [...new Set(pool)].map(x => `<option value="${esc(x)}">`).join('');
  }
  fillExOptions();

  // Cálculos en vivo
  const runLive = $('[data-run-live]');
  const spinLive = $('[data-spin-live]');
  const live = () => {
    if (runLive) {
      const km = num(form['d.km'].value), sec = parseHMS(form['d.time'].value);
      const p = paceSec(sec, km);
      runLive.innerHTML = p ? `<span>${icon('bolt')} Ritmo <b>${fmtPace(p)}</b></span><span>Velocidad <b>${fmtNum(km / (sec / 3600))} km/h</b></span>` : '';
    }
    if (spinLive) {
      const ftp = num(form['d.ftp'].value), ap = num(form['d.avg_power'].value);
      const km = num(form['d.km'].value), mn = num(form.duration_min.value);
      const parts = [];
      if (ftp && ap) parts.push(`<span>${icon('bolt')} Intensidad <b>${Math.round(ap / ftp * 100)}% FTP</b></span>`);
      if (km && mn) parts.push(`<span>Velocidad <b>${fmtNum(km / (mn / 60))} km/h</b></span>`);
      spinLive.innerHTML = parts.join('');
    }
  };
  form.addEventListener('input', e => {
    live();
    // En running, rellenar "tiempo dedicado" a partir del tiempo de carrera
    if (e.target.name === 'd.time' && !form.duration_min.dataset.touched) {
      const sec = parseHMS(e.target.value); if (sec) form.duration_min.value = Math.ceil(sec / 60);
    }
    if (e.target.name === 'duration_min') form.duration_min.dataset.touched = '1';
  });
  if (form.duration_min.value) form.duration_min.dataset.touched = '1';
  live();

  // Eliminar / duplicar
  $('[data-delete]')?.addEventListener('click', async () => {
    if (await ask('¿Eliminar esta actividad?', { ok: 'Eliminar', danger: true })) {
      await db.remove(item.id); sheet.close(); toast('Actividad eliminada');
    }
  });
  $('[data-dup]')?.addEventListener('click', () => {
    const copy = { ...item, id: undefined, created_at: undefined, status: 'planned', date: today() > item.date ? today() : item.date };
    renderForm(sheet, copy, true);
  });

  // Guardar
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const res = collect(form, t);
    const err = validate(res);
    const errEl = $('.form-error');
    if (err) { errEl.textContent = err; errEl.hidden = false; errEl.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    await db.save({ ...item, ...res });
    sheet.close();
    toast(res.status === 'planned' ? 'Actividad planificada' : res.status === 'done' ? '¡Actividad registrada!' : 'Marcada como no realizada');
  });
}

function collect(form, type) {
  const fd = new FormData(form);
  const data = {};
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith('d.') || v === '') continue;
    data[k.slice(2)] = v;
  }
  // Números
  ['km', 'hr_avg', 'hr_max', 'elev', 'cadence', 'kcal', 'goals', 'assists', 'ftp', 'avg_power', 'rpe'].forEach(k => {
    if (data[k] != null) { const n = num(data[k]); if (n == null || isNaN(n)) delete data[k]; else data[k] = n; }
  });
  if (form.querySelector('[name="d.rpe"]')?.hasAttribute('data-untouched') || fd.get('status') !== 'done') delete data.rpe;
  if (type === 'running' && data.time) { data.time_sec = parseHMS(data.time); delete data.time; }
  if (type === 'gym') {
    data.muscles = fd.getAll('muscles');
    const n = fd.getAll('ex.name'), s = fd.getAll('ex.sets'), r = fd.getAll('ex.reps'), w = fd.getAll('ex.kg');
    data.exercises = n.map((name, i) => ({ name: name.trim(), sets: num(s[i]), reps: r[i] || null, kg: num(w[i]) }))
      .filter(x => x.name);
  }
  const dur = num(fd.get('duration_min'));
  return {
    type, status: fd.get('status'), date: fd.get('date'),
    duration_min: dur && !isNaN(dur) ? Math.round(dur) : null,
    data, notes: (fd.get('notes') || '').trim() || null,
  };
}

function validate(r) {
  if (!r.date) return 'Indica la fecha.';
  if (r.status !== 'done') return null; // plan: todo opcional
  if (!r.duration_min) return 'Indica el tiempo dedicado a la actividad (minutos).';
  const d = r.data;
  if (r.type === 'gym' && !d.muscles.length) return 'Selecciona al menos un grupo muscular.';
  if (r.type === 'running' && (!d.km || !d.time_sec)) return 'Indica los km recorridos y el tiempo (h:mm:ss).';
  if (r.type === 'spinning' && (!d.ftp || !d.km)) return 'Indica el FTP utilizado y los km.';
  if (r.type === 'other' && !d.name) return 'Indica el nombre de la actividad.';
  return null;
}

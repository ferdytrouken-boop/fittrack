// FitTrack — aplicación principal
import * as db from './db.js';
import { TYPES, TYPE_ORDER, MUSCLES, MUSCLE_BY_ID, STATUS } from './catalog.js';
import { icon } from './icons.js';
import { openSheet, toast, ask } from './ui.js';
import { newActivity, editActivity } from './form.js';
import { stackedBars, simpleBars, ring } from './charts.js';
import {
  today, addDays, weekStart, weekDays, isoWeek, diffDays, dow, dayNum, monShort, monthLabel,
  fmtDate, fmtDateLong, relDay, fmtMin, fmtHours, fmtHMS, paceSec, fmtPace, fmtNum, esc, fromISO, toISO,
} from './utils.js';

const app = document.getElementById('app');
const state = {
  view: db.prefs.get('view', 'home'),
  planWeek: weekStart(today()),
  histType: 'all',
  histAll: false,
  period: '4w',
};

// ── Helpers de datos ─────────────────────────────────────────
const byDate = (a, b) => a.date.localeCompare(b.date) || (a.created_at || '').localeCompare(b.created_at || '');
const done = () => db.all().filter(a => a.status === 'done');
const sum = (arr, f) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);

function summary(a) {
  const d = a.data || {};
  switch (a.type) {
    case 'gym': {
      const m = (d.muscles || []).map(id => MUSCLE_BY_ID[id]?.label).filter(Boolean);
      const parts = [d.routine, m.join(' · ')].filter(Boolean);
      if (d.exercises?.length) parts.push(`${d.exercises.length} ejercicios`);
      return parts.join(' — ') || 'Sin grupos seleccionados';
    }
    case 'running': {
      const p = paceSec(d.time_sec, d.km);
      return [d.km && `${fmtNum(d.km, 2)} km`, d.time_sec && fmtHMS(d.time_sec), p && fmtPace(p), d.kind].filter(Boolean).join(' · ') || 'Carrera';
    }
    case 'football':
      return [d.format, d.result, d.score, d.goals != null && `${d.goals} gol${d.goals == 1 ? '' : 'es'}`].filter(Boolean).join(' · ') || 'Partido';
    case 'spinning':
      return [d.ftp && `FTP ${d.ftp} W`, d.km && `${fmtNum(d.km)} km`, d.avg_power && `${d.avg_power} W med.`].filter(Boolean).join(' · ') || 'Sesión';
    default:
      return [d.name, d.km && `${fmtNum(d.km)} km`].filter(Boolean).join(' · ') || 'Actividad';
  }
}
const title = a => (a.type === 'other' && a.data?.name) ? a.data.name : TYPES[a.type].label;

function card(a, { showDate = false, action = true } = {}) {
  return `<button class="act-card t-${a.type} st-${a.status}" data-open="${a.id}">
    ${showDate ? `<span class="act-date"><b>${dayNum(a.date)}</b><small>${dow(a.date)}</small></span>` : ''}
    <span class="act-ic">${icon(a.type)}</span>
    <span class="act-body"><b>${esc(title(a))}</b><small>${esc(summary(a))}</small></span>
    <span class="act-meta">${a.duration_min ? `<b>${fmtMin(a.duration_min)}</b>` : ''}
      ${a.status !== 'done' ? `<em class="badge ${a.status}">${STATUS[a.status]}</em>` : ''}</span>
    ${action && a.status === 'planned' && a.date <= today() ? `<span class="act-cta" data-complete="${a.id}">${icon('check')}</span>` : ''}
  </button>`;
}
const empty = (txt, cta = '') => `<div class="empty">${icon('bolt', 'lg')}<p>${txt}</p>${cta}</div>`;

// ── Cabecera y navegación ───────────────────────────────────
const NAV = [
  ['home', 'Hoy', 'home'],
  ['plan', 'Plan', 'calendar'],
  ['history', 'Historial', 'history'],
  ['stats', 'Estadísticas', 'stats'],
];
function syncBadge() {
  if (!db.remoteConfigured) return '';
  if (!db.currentUser()) return '';
  const pend = db.pendingCount();
  const off = !navigator.onLine || !db.isRemote();
  return `<button class="sync ${off || pend ? 'warn' : ''}" data-action="sync" title="Sincronizar">
    ${icon(off ? 'cloudOff' : 'cloud')}${pend ? `<small>${pend}</small>` : ''}</button>`;
}

function render() {
  const views = { home: viewHome, plan: viewPlan, history: viewHistory, stats: viewStats };
  const titles = { home: 'Hoy', plan: 'Planificación', history: 'Historial', stats: 'Estadísticas' };
  app.innerHTML = `
    <header class="topbar">
      <div class="brand"><span class="logo">${icon('bolt')}</span><span>FIT<b>TRACK</b></span></div>
      <h1 class="view-title">${titles[state.view]}</h1>
      <div class="top-actions">${syncBadge()}
        <button class="icon-btn" data-action="settings" aria-label="Ajustes">${icon('settings')}</button></div>
    </header>
    <main class="view view-${state.view}">${views[state.view]()}</main>
    <button class="fab" data-action="add" aria-label="Añadir actividad">${icon('plus')}</button>
    <nav class="tabbar">
      ${NAV.map(([id, lbl, ic]) => `<button class="${state.view === id ? 'on' : ''}" data-nav="${id}">${icon(ic)}<span>${lbl}</span></button>`).join('')}
    </nav>`;
}

// ── Vista: HOY ──────────────────────────────────────────────
function viewHome() {
  const t = today();
  const all = db.all();
  const todays = all.filter(a => a.date === t && a.status !== 'skipped').sort(byDate);
  const ws = weekStart(t), we = addDays(ws, 6);
  const week = all.filter(a => a.date >= ws && a.date <= we);
  const wDone = week.filter(a => a.status === 'done');
  const wTotal = week.filter(a => a.status !== 'skipped').length;
  const wMin = sum(wDone, a => a.duration_min);
  const wKm = sum(wDone.filter(a => a.type === 'running'), a => a.data?.km);
  const overdue = all.filter(a => a.status === 'planned' && a.date < t).sort(byDate);
  const upcoming = all.filter(a => a.status === 'planned' && a.date > t && a.date <= addDays(t, 14)).sort(byDate).slice(0, 5);
  const name = db.prefs.get('name', '');

  // Racha de días activos
  const activeDays = new Set(done().map(a => a.date));
  let streak = 0, d = activeDays.has(t) ? t : addDays(t, -1);
  while (activeDays.has(d)) { streak++; d = addDays(d, -1); }

  const dots = weekDays(ws).map(day => {
    const acts = week.filter(a => a.date === day && a.status !== 'skipped');
    const top = acts.find(a => a.status === 'done') || acts[0];
    return `<div class="wd ${day === t ? 'today' : ''}">
      <small>${dow(day).charAt(0)}</small>
      <span class="dot ${top ? `t-${top.type} ${top.status}` : ''}">${top ? icon(top.type) : ''}</span></div>`;
  }).join('');

  return `
    <section class="hero">
      <p class="hero-date">${fmtDateLong(t)}</p>
      <h2 class="hero-title">${name ? `¡Vamos, ${esc(name)}!` : '¡A por el día!'}</h2>
      <div class="hero-stats">
        ${ring(wTotal ? wDone.length / wTotal : 0, { label: `${wDone.length}/${wTotal || 0}`, sub: 'semana' })}
        <div class="kpis">
          <div class="kpi">${icon('clock')}<b>${fmtMin(wMin)}</b><small>esta semana</small></div>
          <div class="kpi">${icon('route')}<b>${fmtNum(wKm)} km</b><small>corriendo</small></div>
          <div class="kpi">${icon('flame')}<b>${streak} ${streak === 1 ? 'día' : 'días'}</b><small>de racha</small></div>
        </div>
      </div>
      <div class="week-dots">${dots}</div>
    </section>

    ${overdue.length ? `<section class="block warn-block">
      <h3>Pendientes de registrar <span class="count">${overdue.length}</span></h3>
      <p class="muted">Actividades planificadas que ya han pasado. Toca ✓ para completarlas o ábrelas para marcarlas como no realizadas.</p>
      <div class="list">${overdue.slice(0, 5).map(a => card(a, { showDate: true })).join('')}</div></section>` : ''}

    <section class="block">
      <h3>Hoy</h3>
      <div class="list">${todays.length ? todays.map(a => card(a)).join('') :
        empty('Nada planificado para hoy. ¿Día de descanso o toca moverse?',
          `<button class="btn primary sm" data-action="add">${icon('plus')} Registrar actividad</button>`)}</div>
    </section>

    <section class="block">
      <div class="block-head"><h3>Próximos días</h3><button class="link" data-nav="plan">Ver plan ${icon('right')}</button></div>
      <div class="list">${upcoming.length ? upcoming.map(a => card(a, { showDate: true })).join('') :
        empty('No tienes nada planificado. Organiza tus próximas semanas en la pestaña Plan.')}</div>
    </section>`;
}

// ── Vista: PLAN ─────────────────────────────────────────────
function viewPlan() {
  const ws = state.planWeek, days = weekDays(ws), we = days[6], t = today();
  const all = db.all();
  const week = all.filter(a => a.date >= ws && a.date <= we);
  const planned = week.filter(a => a.status === 'planned');
  const plannedMin = sum(week.filter(a => a.status !== 'skipped'), a => a.duration_min);
  const label = `${dayNum(ws)} ${monShort(ws)} – ${dayNum(we)} ${monShort(we)}`;
  const rel = diffDays(weekStart(t), ws) / 7;
  const relTxt = rel === 0 ? 'Esta semana' : rel === 1 ? 'Semana que viene' : rel === -1 ? 'Semana pasada' : rel > 0 ? `Dentro de ${rel} semanas` : `Hace ${-rel} semanas`;

  return `
    <section class="week-nav">
      <button class="icon-btn" data-week="-1" aria-label="Semana anterior">${icon('left')}</button>
      <div class="week-lbl"><small>${relTxt} · S${isoWeek(ws)}</small><b>${label}</b></div>
      <button class="icon-btn" data-week="1" aria-label="Semana siguiente">${icon('right')}</button>
    </section>
    <div class="week-summary">
      <span><b>${week.filter(a => a.status !== 'skipped').length}</b> actividades</span>
      <span><b>${fmtMin(plannedMin)}</b> previstos</span>
      ${rel !== 0 ? `<button class="link" data-week="0">Hoy</button>` : ''}
    </div>
    <section class="days">
      ${days.map(day => {
        const acts = week.filter(a => a.date === day).sort(byDate);
        return `<div class="day ${day === t ? 'today' : ''} ${day < t ? 'past' : ''}">
          <div class="day-head">
            <div class="day-lbl"><b>${dow(day)}</b><span>${dayNum(day)}</span></div>
            <div class="day-acts">${acts.map(a => `
              <button class="pill-act t-${a.type} st-${a.status}" data-open="${a.id}">
                ${icon(a.type)}<span>${esc(title(a))}${a.duration_min ? ` · ${a.duration_min}'` : ''}</span>
                ${a.status === 'done' ? `<i class="ok">${icon('check')}</i>` : ''}
              </button>`).join('') || '<span class="rest">Descanso</span>'}</div>
            <button class="icon-btn add-day" data-add-day="${day}" aria-label="Añadir">${icon('plus')}</button>
          </div></div>`;
      }).join('')}
    </section>
    <section class="block plan-tools">
      <h3>Herramientas del plan</h3>
      <p class="muted">Copia las actividades de esta semana como plan a semanas siguientes (útil para rutinas fijas como el fútbol semanal). Después puedes modificar cualquier día.</p>
      <div class="btn-row">
        <button class="btn ghost" data-copy="1" ${week.length ? '' : 'disabled'}>${icon('copy')} A la semana siguiente</button>
        <button class="btn ghost" data-copy="4" ${week.length ? '' : 'disabled'}>${icon('copy')} A las próximas 4</button>
      </div>
      ${planned.length ? `<button class="btn ghost danger-txt" data-clear-week>${icon('trash')} Borrar lo planificado de esta semana</button>` : ''}
    </section>`;
}

function planData(a) {
  const d = a.data || {};
  const keep = { gym: ['muscles', 'routine', 'exercises'], running: ['kind', 'km'], football: ['format'], spinning: ['ftp'], other: ['name'] }[a.type] || [];
  return Object.fromEntries(keep.filter(k => d[k] != null).map(k => [k, d[k]]));
}
async function copyWeek(n) {
  const ws = state.planWeek, we = addDays(ws, 6);
  const src = db.all().filter(a => a.date >= ws && a.date <= we && a.status !== 'skipped');
  const out = [];
  for (let w = 1; w <= n; w++) {
    src.forEach(a => {
      const date = addDays(a.date, 7 * w);
      const exists = db.all().some(x => x.date === date && x.type === a.type);
      if (!exists) out.push({ type: a.type, status: 'planned', date, duration_min: a.duration_min, data: planData(a), notes: null });
    });
  }
  if (!out.length) return toast('Esas semanas ya tienen esas actividades', 'info');
  await db.saveMany(out);
  toast(`${out.length} actividades planificadas`);
}

// ── Vista: HISTORIAL ────────────────────────────────────────
function viewHistory() {
  let list = db.all().filter(a => state.histAll ? a.date <= today() : a.status === 'done');
  if (state.histType !== 'all') list = list.filter(a => a.type === state.histType);
  list.sort((a, b) => byDate(b, a));
  const months = {};
  list.forEach(a => (months[a.date.slice(0, 7)] ||= []).push(a));

  const chips = ['all', ...TYPE_ORDER].map(t => `<button class="fchip ${state.histType === t ? 'on' : ''} ${t !== 'all' ? 't-' + t : ''}" data-htype="${t}">
    ${t === 'all' ? 'Todas' : icon(t) + TYPES[t].short}</button>`).join('');

  return `
    <div class="filters">${chips}</div>
    <label class="toggle"><input type="checkbox" data-hall ${state.histAll ? 'checked' : ''}><span></span> Incluir planificadas y no realizadas</label>
    ${Object.keys(months).length ? Object.entries(months).map(([ym, acts]) => {
      const dn = acts.filter(a => a.status === 'done');
      const km = sum(dn, a => (a.type === 'running' || a.type === 'spinning' || a.type === 'other') ? a.data?.km : 0);
      return `<section class="month">
        <div class="month-head"><h3>${monthLabel(ym)}</h3>
          <span>${dn.length} ses. · ${fmtHours(sum(dn, a => a.duration_min))}${km ? ` · ${fmtNum(km, 0)} km` : ''}</span></div>
        <div class="list">${acts.map(a => card(a, { showDate: true, action: false })).join('')}</div>
      </section>`;
    }).join('') : empty('Aún no hay actividades registradas. Pulsa + para añadir la primera.')}`;
}

// ── Vista: ESTADÍSTICAS ─────────────────────────────────────
const PERIODS = { '4w': ['4 semanas', 28], '3m': ['3 meses', 91], '12m': ['12 meses', 365], all: ['Todo', null] };

function viewStats() {
  const t = today();
  const [, days] = PERIODS[state.period];
  const all = done();
  const first = all.length ? all.map(a => a.date).sort()[0] : t;
  const from = days ? addDays(t, -days + 1) : first;
  const list = all.filter(a => a.date >= from && a.date <= t);

  const totalMin = sum(list, a => a.duration_min);
  const activeDays = new Set(list.map(a => a.date)).size;
  const byType = TYPE_ORDER.map(tp => {
    const l = list.filter(a => a.type === tp);
    return { tp, n: l.length, min: sum(l, a => a.duration_min) };
  }).filter(x => x.n);
  const maxMin = Math.max(1, ...byType.map(x => x.min));

  // Serie temporal: semanas (≤ 3 meses) o meses
  const monthly = !days || days > 100;
  let buckets = [];
  if (!monthly) {
    const nW = Math.ceil(days / 7);
    for (let i = nW - 1; i >= 0; i--) {
      const ws = addDays(weekStart(t), -7 * i), we = addDays(ws, 6);
      const parts = {};
      list.filter(a => a.date >= ws && a.date <= we).forEach(a => parts[a.type] = (parts[a.type] || 0) + (a.duration_min || 0));
      buckets.push({ label: `S${isoWeek(ws)}`, parts, ws, we });
    }
  } else {
    const start = fromISO(from); start.setDate(1);
    const end = fromISO(t);
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const ym = toISO(d).slice(0, 7);
      const parts = {};
      list.filter(a => a.date.startsWith(ym)).forEach(a => parts[a.type] = (parts[a.type] || 0) + (a.duration_min || 0));
      buckets.push({ label: monShort(ym + '-01'), parts, ym });
    }
  }
  const inBucket = (a, b) => b.ym ? a.date.startsWith(b.ym) : a.date >= b.ws && a.date <= b.we;

  // Running
  const runs = list.filter(a => a.type === 'running' && a.data?.km);
  const runKm = sum(runs, a => a.data.km), runSec = sum(runs, a => a.data.time_sec);
  const paced = runs.filter(a => a.data.time_sec);
  const best = paced.length ? paced.reduce((b, a) => paceSec(a.data.time_sec, a.data.km) < paceSec(b.data.time_sec, b.data.km) ? a : b) : null;
  const longest = runs.length ? runs.reduce((b, a) => a.data.km > b.data.km ? a : b) : null;
  const kmSeries = buckets.map(b => +sum(runs.filter(a => inBucket(a, b)), a => a.data.km).toFixed(1));

  // Spinning
  const spins = list.filter(a => a.type === 'spinning');
  const ftps = spins.filter(a => a.data?.ftp).sort(byDate);
  // Fútbol
  const games = list.filter(a => a.type === 'football');
  const res = r => games.filter(a => a.data?.result === r).length;
  // Gimnasio: grupos musculares
  const gyms = all.filter(a => a.type === 'gym');
  const muscleRows = MUSCLES.map(m => {
    const hits = list.filter(a => a.type === 'gym' && a.data?.muscles?.includes(m.id)).length;
    const last = gyms.filter(a => a.data?.muscles?.includes(m.id)).map(a => a.date).sort().pop();
    return { m, hits, last };
  });
  const maxHits = Math.max(1, ...muscleRows.map(r => r.hits));

  return `
    <div class="filters">${Object.entries(PERIODS).map(([k, [l]]) => `<button class="fchip ${state.period === k ? 'on' : ''}" data-period="${k}">${l}</button>`).join('')}</div>

    <section class="kpi-grid">
      <div class="kpi-card"><small>Sesiones</small><b>${list.length}</b></div>
      <div class="kpi-card"><small>Tiempo total</small><b>${fmtHours(totalMin)}</b></div>
      <div class="kpi-card"><small>Días activos</small><b>${activeDays}</b></div>
      <div class="kpi-card"><small>Media / sesión</small><b>${list.length ? Math.round(totalMin / list.length) + "'" : '—'}</b></div>
    </section>

    <section class="block">
      <h3>Minutos por ${monthly ? 'mes' : 'semana'}</h3>
      ${list.length ? stackedBars(buckets, { fmt: v => Math.round(v) }) : empty('Sin datos en este periodo.')}
      <div class="legend">${TYPE_ORDER.map(tp => `<span class="t-${tp}"><i></i>${TYPES[tp].short}</span>`).join('')}</div>
    </section>

    ${byType.length ? `<section class="block">
      <h3>Reparto por actividad</h3>
      ${byType.map(x => `<div class="hbar t-${x.tp}">
        <span class="hbar-ic">${icon(x.tp)}</span>
        <div class="hbar-main"><div class="hbar-top"><b>${TYPES[x.tp].label}</b><span>${x.n} ses. · ${fmtHours(x.min)}</span></div>
          <div class="hbar-track"><i style="width:${x.min / maxMin * 100}%"></i></div></div></div>`).join('')}
    </section>` : ''}

    <section class="block sport t-running">
      <h3>${icon('running')} Running</h3>
      ${runs.length ? `
      <div class="stat-grid">
        <div><small>Distancia</small><b>${fmtNum(runKm)} km</b></div>
        <div><small>Carreras</small><b>${runs.length}</b></div>
        <div><small>Ritmo medio</small><b>${fmtPace(paceSec(runSec, sum(paced, a => a.data.km)))}</b></div>
        <div><small>Tiempo</small><b>${fmtHMS(runSec)}</b></div>
        <div><small>Mejor ritmo</small><b>${best ? fmtPace(paceSec(best.data.time_sec, best.data.km)) : '—'}</b><em>${best ? fmtDate(best.date) : ''}</em></div>
        <div><small>Más larga</small><b>${longest ? fmtNum(longest.data.km, 2) + ' km' : '—'}</b><em>${longest ? fmtDate(longest.date) : ''}</em></div>
      </div>
      <p class="chart-title">Km por ${monthly ? 'mes' : 'semana'}</p>
      ${simpleBars(kmSeries, buckets.map(b => b.label), { color: 'var(--c-run)', fmt: v => fmtNum(v, v >= 100 ? 0 : 1) })}` : empty('Sin carreras en este periodo.')}
    </section>

    <section class="block sport t-spinning">
      <h3>${icon('spinning')} Spinning</h3>
      ${spins.length ? `<div class="stat-grid">
        <div><small>Sesiones</small><b>${spins.length}</b></div>
        <div><small>Distancia</small><b>${fmtNum(sum(spins, a => a.data?.km))} km</b></div>
        <div><small>Tiempo</small><b>${fmtHours(sum(spins, a => a.duration_min))}</b></div>
        <div><small>FTP actual</small><b>${ftps.length ? ftps[ftps.length - 1].data.ftp + ' W' : '—'}</b>
          <em>${ftps.length > 1 ? `${ftps[ftps.length - 1].data.ftp - ftps[0].data.ftp >= 0 ? '+' : ''}${ftps[ftps.length - 1].data.ftp - ftps[0].data.ftp} W en el periodo` : ''}</em></div>
      </div>
      ${ftps.length > 1 ? `<p class="chart-title">FTP por sesión</p>${simpleBars(ftps.slice(-12).map(a => a.data.ftp), ftps.slice(-12).map(a => dayNum(a.date) + '/' + (fromISO(a.date).getMonth() + 1)), { color: 'var(--c-spin)' })}` : ''}`
      : empty('Sin sesiones de spinning en este periodo.')}
    </section>

    <section class="block sport t-football">
      <h3>${icon('football')} Fútbol</h3>
      ${games.length ? `<div class="stat-grid">
        <div><small>Partidos</small><b>${games.length}</b></div>
        <div><small>Goles</small><b>${sum(games, a => a.data?.goals)}</b></div>
        <div><small>Asistencias</small><b>${sum(games, a => a.data?.assists)}</b></div>
        <div><small>V · E · D</small><b>${res('Victoria')}·${res('Empate')}·${res('Derrota')}</b></div>
      </div>` : empty('Sin partidos en este periodo.')}
    </section>

    <section class="block sport t-gym">
      <h3>${icon('gym')} Grupos musculares</h3>
      <p class="muted">Sesiones en el periodo y días desde la última vez que entrenaste cada grupo.</p>
      <div class="muscles">
        ${muscleRows.map(r => {
          const ago = r.last ? diffDays(r.last, t) : null;
          return `<div class="mrow ${ago == null ? 'never' : ago > 10 ? 'stale' : ''}">
            <span class="mname">${r.m.label}</span>
            <div class="hbar-track"><i style="width:${r.hits / maxHits * 100}%"></i></div>
            <span class="mhits">${r.hits}</span>
            <span class="mago">${ago == null ? '—' : ago === 0 ? 'hoy' : ago + 'd'}</span></div>`;
        }).join('')}
      </div>
    </section>`;
}

// ── Ajustes ─────────────────────────────────────────────────
function openSettings() {
  const u = db.currentUser();
  const last = db.lastSync();
  const sheet = openSheet(`
    <h2 class="sheet-title">Ajustes</h2>
    <div class="settings">
      <label class="field"><span class="lbl">Tu nombre</span><input name="name" value="${esc(db.prefs.get('name', ''))}" placeholder="Para saludarte"></label>

      <div class="set-card">
        <h4>${icon('cloud')} Base de datos</h4>
        ${!db.remoteConfigured ? `<p class="muted">Modo local: los datos se guardan sólo en este móvil. Configura Supabase en <code>js/config.js</code> para guardarlos en la nube (ver README).</p>`
        : u ? `<p>Conectado como <b>${esc(u.email)}</b></p>
               <p class="muted">Última sincronización: ${last ? new Date(last).toLocaleString('es-ES') : 'nunca'} · Pendientes: ${db.pendingCount()}</p>
               <div class="btn-row"><button class="btn ghost" data-s="sync">${icon('cloud')} Sincronizar</button>
               <button class="btn ghost" data-s="logout">Cerrar sesión</button></div>
               ${db.localItems().length ? `<button class="btn ghost" data-s="migrate">Subir ${db.localItems().length} actividades del modo local</button>` : ''}`
        : `<p class="muted">Estás usando el modo local.</p><button class="btn primary" data-s="login">Iniciar sesión / crear cuenta</button>`}
      </div>

      <div class="set-card">
        <h4>${icon('copy')} Copia de seguridad</h4>
        <div class="btn-row">
          <button class="btn ghost" data-s="export">Exportar JSON</button>
          <label class="btn ghost">Importar JSON<input type="file" accept="application/json" data-s-import hidden></label>
        </div>
      </div>

      <div class="set-card">
        <h4>${icon('bolt')} Instalar en Android</h4>
        <p class="muted">En Chrome, abre el menú ⋮ → <b>Añadir a pantalla de inicio</b> / <b>Instalar aplicación</b>.</p>
        <button class="btn ghost" data-s="install" ${deferredInstall ? '' : 'hidden'}>Instalar ahora</button>
      </div>
      <p class="muted center">FitTrack v1.0 · ${db.all().length} actividades guardadas</p>
    </div>`);

  sheet.el.querySelector('[name=name]').addEventListener('change', e => { db.prefs.set('name', e.target.value.trim()); render(); });
  sheet.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    const a = b.dataset.s;
    if (a === 'sync') { await db.sync(); toast('Sincronizado'); sheet.close(); }
    if (a === 'logout') { if (await ask('¿Cerrar sesión en este dispositivo?')) { await db.signOut(); db.prefs.set('skipAuth', false); sheet.close(); boot(); } }
    if (a === 'login') { db.prefs.set('skipAuth', false); sheet.close(); showAuth(); }
    if (a === 'migrate') {
      const list = db.localItems();
      await db.saveMany(list.map(x => ({ ...x, id: undefined })));
      db.clearLocalItems(); toast(`${list.length} actividades subidas`); sheet.close();
    }
    if (a === 'export') exportJSON();
    if (a === 'install' && deferredInstall) { deferredInstall.prompt(); deferredInstall = null; }
  });
  sheet.el.querySelector('[data-s-import]').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const list = Array.isArray(data) ? data : data.activities;
      if (!Array.isArray(list)) throw new Error();
      const ids = new Set(db.all().map(a => a.id));
      const fresh = list.filter(a => a.type && a.date && !ids.has(a.id));
      if (await ask(`Se importarán ${fresh.length} actividades nuevas. ¿Continuar?`)) {
        db.replaceAll([...db.all(), ...fresh]); toast('Importación completada'); sheet.close();
      }
    } catch { toast('El fichero no es válido', 'info'); }
  });
}

function exportJSON() {
  const blob = new Blob([JSON.stringify({ app: 'FitTrack', exported: new Date().toISOString(), activities: db.all() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `fittrack-${today()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ── Pantalla de acceso ──────────────────────────────────────
function showAuth() {
  app.innerHTML = `
    <section class="auth">
      <div class="auth-hero">
        <div class="auth-icons">${['gym', 'running', 'football', 'spinning'].map(t => `<span class="t-${t}">${icon(t)}</span>`).join('')}</div>
        <h1>FIT<b>TRACK</b></h1>
        <p>Registra, planifica y analiza tu actividad física.</p>
      </div>
      <form class="auth-form">
        <label class="field"><span class="lbl">Email</span><input type="email" name="email" autocomplete="email" required></label>
        <label class="field"><span class="lbl">Contraseña</span><input type="password" name="password" autocomplete="current-password" minlength="6" required></label>
        <p class="form-error" hidden></p>
        <button class="btn primary" name="mode" value="in">Entrar</button>
        <button class="btn ghost" name="mode" value="up">Crear cuenta</button>
        <button type="button" class="link center" data-skip>Usar sin cuenta (sólo en este móvil)</button>
      </form>
    </section>`;
  const form = app.querySelector('form');
  const err = form.querySelector('.form-error');
  let mode = 'in';
  form.querySelectorAll('[name=mode]').forEach(b => b.addEventListener('click', () => mode = b.value));
  form.addEventListener('submit', async e => {
    e.preventDefault(); err.hidden = true;
    const email = form.email.value.trim(), pw = form.password.value;
    form.classList.add('busy');
    try {
      if (mode === 'up') {
        const r = await db.signUp(email, pw);
        if (!r.session) { err.textContent = 'Cuenta creada. Revisa tu email para confirmarla y después pulsa Entrar.'; err.hidden = false; err.classList.add('ok'); return; }
      } else await db.signIn(email, pw);
      start();
      const local = db.localItems();
      if (local.length && await ask(`Tienes ${local.length} actividades guardadas en modo local. ¿Subirlas a tu cuenta?`, { ok: 'Subir' })) {
        await db.saveMany(local.map(x => ({ ...x, id: undefined }))); db.clearLocalItems(); toast('Actividades subidas');
      }
    } catch (ex) {
      err.textContent = /Invalid login/i.test(ex.message) ? 'Email o contraseña incorrectos.' : ex.message; err.hidden = false; err.classList.remove('ok');
    } finally { form.classList.remove('busy'); }
  });
  form.querySelector('[data-skip]').addEventListener('click', () => { db.prefs.set('skipAuth', true); start(); });
}

// ── Eventos globales ────────────────────────────────────────
app.addEventListener('click', async e => {
  const el = e.target.closest('[data-nav],[data-action],[data-open],[data-complete],[data-week],[data-add-day],[data-copy],[data-clear-week],[data-htype],[data-period]');
  if (!el) return;
  const ds = el.dataset;
  // ✓ dentro de una tarjeta: completar
  const comp = e.target.closest('[data-complete]');
  if (comp) { e.stopPropagation(); const a = db.get(comp.dataset.complete); if (a) editActivity(a, { status: 'done' }); return; }
  if (ds.nav) { state.view = ds.nav; db.prefs.set('view', ds.nav); render(); window.scrollTo(0, 0); }
  else if (ds.action === 'add') newActivity({ date: state.view === 'plan' && state.planWeek > today() ? state.planWeek : today() });
  else if (ds.action === 'settings') openSettings();
  else if (ds.action === 'sync') { await db.sync(); toast(db.pendingCount() ? 'Sin conexión: se sincronizará más tarde' : 'Sincronizado', db.pendingCount() ? 'info' : 'ok'); }
  else if (ds.open) { const a = db.get(ds.open); if (a) editActivity(a); }
  else if (ds.week) { state.planWeek = ds.week === '0' ? weekStart(today()) : addDays(state.planWeek, 7 * Number(ds.week)); render(); }
  else if (ds.addDay) newActivity({ date: ds.addDay });
  else if (ds.copy) copyWeek(Number(ds.copy));
  else if ('clearWeek' in ds) {
    const ws = state.planWeek, we = addDays(ws, 6);
    const pl = db.all().filter(a => a.status === 'planned' && a.date >= ws && a.date <= we);
    if (await ask(`¿Borrar ${pl.length} actividades planificadas de esta semana?`, { ok: 'Borrar', danger: true })) {
      for (const a of pl) await db.remove(a.id);
      toast('Plan de la semana borrado');
    }
  }
  else if (ds.htype) { state.histType = ds.htype; render(); }
  else if (ds.period) { state.period = ds.period; render(); }
});
app.addEventListener('change', e => { if (e.target.matches('[data-hall]')) { state.histAll = e.target.checked; render(); } });

// Instalación PWA
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
window.addEventListener('online', render);
window.addEventListener('offline', render);

// ── Arranque ────────────────────────────────────────────────
let started = false;
function start() {
  if (!started) { db.onChange(() => { if (!document.querySelector('.auth')) render(); }); started = true; }
  render();
  if (new URLSearchParams(location.search).has('add')) { history.replaceState(null, '', './'); newActivity(); }
}
async function boot() {
  app.innerHTML = `<div class="splash">${icon('bolt', 'xl')}</div>`;
  await db.init();
  if (db.hasSupabase() && !db.currentUser() && !db.prefs.get('skipAuth', false)) showAuth();
  else start();
}
boot();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

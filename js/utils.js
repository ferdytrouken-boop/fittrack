// Utilidades de fechas y formato (semana empieza en lunes).
const pad = n => String(n).padStart(2, '0');

export const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => toISO(new Date());
export const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const weekStart = iso => { const d = fromISO(iso); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return toISO(d); };
export const weekDays = startIso => Array.from({ length: 7 }, (_, i) => addDays(startIso, i));
export const diffDays = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);

export function isoWeek(iso) {
  const d = fromISO(iso); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DOW_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MON_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const dow = iso => DOW[fromISO(iso).getDay()];
export const dowLong = iso => DOW_L[fromISO(iso).getDay()];
export const dayNum = iso => fromISO(iso).getDate();
export const monShort = iso => MON[fromISO(iso).getMonth()];
export const monthLabel = ym => { const [y, m] = ym.split('-').map(Number); return `${MON_L[m - 1]} ${y}`; };
export const fmtDate = iso => { const d = fromISO(iso); return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
export const fmtDateLong = iso => { const d = fromISO(iso); return `${DOW_L[d.getDay()]}, ${d.getDate()} de ${MON_L[d.getMonth()]}`; };
export function relDay(iso) {
  const n = diffDays(today(), iso);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  return fmtDate(iso);
}

// Duraciones
export const fmtMin = m => {
  m = Math.round(m || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};
export const fmtHours = m => (m / 60).toFixed(m >= 600 ? 0 : 1).replace('.', ',') + ' h';

// hh:mm:ss ⇄ segundos
export function parseHMS(str) {
  if (!str) return null;
  const p = String(str).trim().split(':').map(Number);
  if (p.some(isNaN)) return null;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return p[0] * 60; // sólo minutos
}
export function fmtHMS(sec) {
  if (sec == null) return '';
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
export const paceSec = (sec, km) => (sec && km ? sec / km : null);
export const fmtPace = p => { if (!p) return '—'; const r = Math.round(p); return `${Math.floor(r / 60)}:${pad(r % 60)} /km`; };
export const fmtNum = (n, d = 1) => (n == null || isNaN(n) ? '—' : Number(n).toFixed(d).replace('.', ','));
export const num = v => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

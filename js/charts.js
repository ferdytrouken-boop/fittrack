// Gráficos SVG ligeros.
import { TYPES } from './catalog.js';
import { esc } from './utils.js';

// Barras apiladas: buckets = [{ label, parts: { gym: 60, running: 45 } }]
export function stackedBars(buckets, { fmt = v => Math.round(v), height = 150, highlightLast = true, color = 'var(--accent)' } = {}) {
  const W = 320, H = height, padB = 20, padT = 16;
  const totals = buckets.map(b => Object.values(b.parts).reduce((a, c) => a + c, 0));
  const max = Math.max(1, ...totals);
  const n = buckets.length, gap = n > 10 ? 3 : 6;
  const bw = (W - gap * (n - 1)) / n;
  let bars = '';
  buckets.forEach((b, i) => {
    let y = H - padB;
    const x = i * (bw + gap);
    const keys = [...Object.keys(TYPES), ...Object.keys(b.parts).filter(k => !TYPES[k])];
    keys.forEach(t => {
      const v = b.parts[t] || 0; if (!v) return;
      const col = TYPES[t]?.color || color, name = TYPES[t]?.label || '';
      const h = (v / max) * (H - padB - padT);
      y -= h;
      bars += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h - 1.5, 1)}" rx="3" style="fill:${col}"><title>${esc(b.label)} ${name}: ${fmt(v)}</title></rect>`;
    });
    if (totals[i] && (n <= 12 || i === n - 1))
      bars += `<text x="${x + bw / 2}" y="${y - 4}" class="ch-val">${fmt(totals[i])}</text>`;
    const showLbl = n <= 12 || i % Math.ceil(n / 8) === 0 || i === n - 1;
    if (showLbl) bars += `<text x="${x + bw / 2}" y="${H - 5}" class="ch-lbl ${highlightLast && i === n - 1 ? 'hl' : ''}">${esc(b.label)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    <line x1="0" x2="${W}" y1="${H - padB + .5}" y2="${H - padB + .5}" class="ch-axis"/>${bars}</svg>`;
}

// Barras simples de un color
export function simpleBars(values, labels, { color = 'var(--accent)', fmt = v => v, height = 120 } = {}) {
  return stackedBars(values.map((v, i) => ({ label: labels[i], parts: { _: v } })), { fmt, height, color });
}

// Anillo de progreso
export function ring(pct, { size = 88, stroke = 9, label = '', sub = '' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-width="${stroke}"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg><div class="ring-txt"><b>${label}</b><small>${sub}</small></div></div>`;
}

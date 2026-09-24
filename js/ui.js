// Componentes de interfaz genéricos: hoja inferior, toast y diálogo.
import { icon } from './icons.js';
import { esc } from './utils.js';

const root = () => document.getElementById('overlay-root');

export function openSheet(html, { onClose, cls = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-backdrop"></div>
    <section class="sheet ${cls}" role="dialog" aria-modal="true">
      <div class="sheet-grip"></div>
      <button class="icon-btn sheet-close" data-close aria-label="Cerrar">${icon('close')}</button>
      <div class="sheet-body">${html}</div>
    </section>`;
  root().appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => {
    wrap.classList.remove('open');
    setTimeout(() => wrap.remove(), 250);
    history.state?.sheet && history.back();
    window.removeEventListener('popstate', onPop);
    onClose && onClose();
  };
  const onPop = () => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 250); window.removeEventListener('popstate', onPop); };
  // Botón "atrás" de Android cierra la hoja
  history.pushState({ sheet: true }, '');
  window.addEventListener('popstate', onPop);
  wrap.querySelector('.sheet-backdrop').addEventListener('click', close);
  wrap.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  return { el: wrap.querySelector('.sheet'), close };
}

let toastTimer;
export function toast(msg, kind = 'ok') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.className = `toast ${kind}`;
  t.innerHTML = `${icon(kind === 'ok' ? 'check' : 'bolt')}<span>${esc(msg)}</span>`;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

export function ask(message, { ok = 'Aceptar', cancel = 'Cancelar', danger = false } = {}) {
  return new Promise(resolve => {
    const d = document.createElement('div');
    d.className = 'dialog-wrap';
    d.innerHTML = `<div class="dialog">
      <p>${esc(message)}</p>
      <div class="dialog-actions">
        <button class="btn ghost" data-v="0">${esc(cancel)}</button>
        <button class="btn ${danger ? 'danger' : 'primary'}" data-v="1">${esc(ok)}</button>
      </div></div>`;
    root().appendChild(d);
    requestAnimationFrame(() => d.classList.add('open'));
    d.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b && e.target !== d) return;
      d.remove(); resolve(b ? b.dataset.v === '1' : false);
    });
  });
}

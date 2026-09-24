// Capa de datos: caché local (localStorage) + sincronización con Supabase.
// Funciona sin conexión: los cambios se guardan en una cola ("outbox")
// y se envían a Supabase en cuanto vuelve la conexión.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const TABLE = 'activities';
const COLS = ['id', 'type', 'status', 'date', 'duration_min', 'data', 'notes', 'created_at', 'updated_at'];

export const remoteConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let sb = null;          // cliente supabase
let user = null;        // usuario autenticado
let items = [];         // actividades en memoria
let listeners = new Set();
let syncing = false;

const ls = {
  get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const scope = () => (user ? user.id : 'local');
const kItems = () => `ft_items_${scope()}`;
const kOutbox = () => `ft_outbox_${scope()}`;

function load() { items = ls.get(kItems(), []); }
function persist() { ls.set(kItems(), items); emit(); }
function emit() { listeners.forEach(fn => fn(items)); }

export const onChange = fn => (listeners.add(fn), () => listeners.delete(fn));
export const all = () => items;
export const get = id => items.find(i => i.id === id);
export const currentUser = () => user;
export const isRemote = () => Boolean(sb && user);

export const uuid = () =>
  (crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }));

// ── Inicialización ────────────────────────────────────────────
export async function init() {
  if (remoteConfigured) {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      const { data } = await sb.auth.getSession();
      user = data.session?.user || null;
      sb.auth.onAuthStateChange((_e, session) => {
        const prev = user?.id;
        user = session?.user || null;
        if (prev !== user?.id) { load(); emit(); if (user) sync(); }
      });
    } catch (e) {
      // Sin conexión y sin la librería en caché: seguimos con lo que haya en local
      console.warn('Supabase no disponible', e);
      const last = ls.get('ft_last_user', null);
      if (last) user = last;
    }
  }
  if (user) ls.set('ft_last_user', { id: user.id, email: user.email });
  load();
  window.addEventListener('online', () => sync());
  if (isRemote()) sync();
  return user;
}

// ── Autenticación ────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  user = data.user; ls.set('ft_last_user', { id: user.id, email: user.email });
  load(); await sync(); return user;
}
export async function signUp(email, password) {
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  if (data.session) { user = data.user; load(); await sync(); }
  return data;
}
export async function signOut() {
  if (sb) await sb.auth.signOut();
  user = null; ls.del('ft_last_user'); load(); emit();
}
export const hasSupabase = () => Boolean(sb);

// ── CRUD ─────────────────────────────────────────────────────
export async function save(item) {
  const now = new Date().toISOString();
  const rec = { ...item, id: item.id || uuid(), updated_at: now, created_at: item.created_at || now };
  const i = items.findIndex(x => x.id === rec.id);
  if (i >= 0) items[i] = rec; else items.push(rec);
  persist();
  queue({ op: 'upsert', id: rec.id });
  return rec;
}
export async function saveMany(list) {
  const now = new Date().toISOString();
  list.forEach(item => {
    const rec = { ...item, id: item.id || uuid(), updated_at: now, created_at: now };
    items.push(rec); queue({ op: 'upsert', id: rec.id }, false);
  });
  persist(); flushSoon();
}
export async function remove(id) {
  items = items.filter(x => x.id !== id);
  persist();
  queue({ op: 'delete', id });
}
export function replaceAll(list) {
  items = list.map(x => ({ ...x, id: x.id || uuid() }));
  persist();
  items.forEach(x => queue({ op: 'upsert', id: x.id }, false));
  flushSoon();
}

// ── Sincronización ───────────────────────────────────────────
function queue(entry, flush = true) {
  if (!user) return; // en modo local no hace falta cola
  const ob = ls.get(kOutbox(), []).filter(e => e.id !== entry.id);
  ob.push(entry); ls.set(kOutbox(), ob);
  if (flush) flushSoon();
}
let t = null;
function flushSoon() { clearTimeout(t); t = setTimeout(() => sync(), 300); }

export const pendingCount = () => (user ? ls.get(kOutbox(), []).length : 0);

function toRow(it) {
  const r = {}; COLS.forEach(c => { if (it[c] !== undefined) r[c] = it[c]; });
  r.user_id = user.id; return r;
}

export async function sync() {
  if (!isRemote() || syncing || !navigator.onLine) { emit(); return; }
  syncing = true;
  try {
    // 1) Enviar cambios pendientes
    let ob = ls.get(kOutbox(), []);
    const ups = ob.filter(e => e.op === 'upsert').map(e => get(e.id)).filter(Boolean).map(toRow);
    const dels = ob.filter(e => e.op === 'delete').map(e => e.id);
    for (let i = 0; i < ups.length; i += 200) {
      const { error } = await sb.from(TABLE).upsert(ups.slice(i, i + 200));
      if (error) throw error;
    }
    if (dels.length) {
      const { error } = await sb.from(TABLE).delete().in('id', dels);
      if (error) throw error;
    }
    ls.set(kOutbox(), []);
    // 2) Descargar el estado del servidor
    const all = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from(TABLE).select(COLS.join(',')).order('date').range(from, from + 999);
      if (error) throw error;
      all.push(...data);
      if (data.length < 1000) break;
    }
    items = all;
    ls.set('ft_last_sync', new Date().toISOString());
    persist();
  } catch (e) {
    console.warn('Error de sincronización', e);
    emit();
  } finally { syncing = false; }
}
export const lastSync = () => ls.get('ft_last_sync', null);

// Datos del modo local (para migrarlos a la cuenta)
export const localItems = () => ls.get('ft_items_local', []);
export function clearLocalItems() { ls.del('ft_items_local'); }

// Preferencias
export const prefs = {
  get: (k, d) => ls.get('ft_pref_' + k, d),
  set: (k, v) => ls.set('ft_pref_' + k, v),
};

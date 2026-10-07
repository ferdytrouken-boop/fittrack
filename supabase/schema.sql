-- ═══════════════════════════════════════════════════════════════
--  FitTrack · Esquema de base de datos para Supabase (PostgreSQL)
--  Ejecuta este script completo en: Supabase → SQL Editor → New query → Run
--
--  ¿Ya habías ejecutado una versión anterior? Este script es seguro de
--  volver a ejecutar: no borra datos, solo actualiza reglas y añade lo
--  que falte (p. ej. la tabla "weights" para el seguimiento de peso).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.activities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type          text not null check (type in ('gym', 'abs', 'running', 'cycling', 'walking', 'elliptical', 'spinning', 'football', 'other')),
  status        text not null default 'done' check (status in ('planned', 'done', 'skipped')),
  date          date not null,
  duration_min  integer check (duration_min is null or duration_min between 0 and 1440),
  -- Datos específicos de cada deporte:
  --   gym:        { muscles: ['pecho','triceps'], routine, exercises: [{name, sets, reps, kg}], rpe }
  --   abs:        { sets, reps, rpe }
  --   running:    { km, time_sec, kind, hr_avg, hr_max, elev, cadence, kcal, shoes, rpe }
  --   cycling:    { km, time_sec, kind, elev, cadence, avg_power, hr_avg, kcal, bike, rpe }
  --   walking:    { km, time_sec, kind, steps, elev, hr_avg, kcal, rpe }
  --   elliptical: { resistance, km, cadence, hr_avg, kcal, rpe }
  --   spinning:   { ftp, km, avg_power, cadence, hr_avg, kcal, rpe }
  --   football:   { format, result, score, goals, assists, km, rpe }
  --   other:      { name, km, rpe }
  data          jsonb not null default '{}'::jsonb,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists activities_user_date_idx on public.activities (user_id, date);

-- Si la tabla ya existía con una lista de tipos distinta, renovamos la
-- regla para que acepte también 'cycling', 'walking', 'elliptical' y 'abs'
-- (Tabla de abdominales, como actividad independiente) — y sigue aceptando 'spinning'.
alter table public.activities drop constraint if exists activities_type_check;
alter table public.activities add constraint activities_type_check
  check (type in ('gym', 'abs', 'running', 'cycling', 'walking', 'elliptical', 'spinning', 'football', 'other'));

-- ── Seguridad a nivel de fila: cada usuario sólo ve y modifica lo suyo ──
alter table public.activities enable row level security;

drop policy if exists "activities_select_own" on public.activities;
drop policy if exists "activities_insert_own" on public.activities;
drop policy if exists "activities_update_own" on public.activities;
drop policy if exists "activities_delete_own" on public.activities;

create policy "activities_select_own" on public.activities
  for select to authenticated using (user_id = auth.uid());
create policy "activities_insert_own" on public.activities
  for insert to authenticated with check (user_id = auth.uid());
create policy "activities_update_own" on public.activities
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "activities_delete_own" on public.activities
  for delete to authenticated using (user_id = auth.uid());

-- ── Peso corporal ──────────────────────────────────────────────
create table if not exists public.weights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date          date not null,
  weight_kg     numeric not null check (weight_kg > 0 and weight_kg < 400),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists weights_user_date_idx on public.weights (user_id, date);

alter table public.weights enable row level security;

drop policy if exists "weights_select_own" on public.weights;
drop policy if exists "weights_insert_own" on public.weights;
drop policy if exists "weights_update_own" on public.weights;
drop policy if exists "weights_delete_own" on public.weights;

create policy "weights_select_own" on public.weights
  for select to authenticated using (user_id = auth.uid());
create policy "weights_insert_own" on public.weights
  for insert to authenticated with check (user_id = auth.uid());
create policy "weights_update_own" on public.weights
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "weights_delete_own" on public.weights
  for delete to authenticated using (user_id = auth.uid());

-- ── Vista útil para consultas rápidas desde el SQL Editor ──
create or replace view public.activities_summary
with (security_invoker = true) as
select
  date_trunc('week', date)::date                      as week,
  type,
  count(*) filter (where status = 'done')             as sessions,
  sum(duration_min) filter (where status = 'done')    as minutes,
  sum((data->>'km')::numeric) filter (where status = 'done') as km
from public.activities
group by 1, 2
order by 1 desc, 2;

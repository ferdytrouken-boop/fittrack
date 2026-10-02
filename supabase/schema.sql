-- ═══════════════════════════════════════════════════════════════
--  FitTrack · Esquema de base de datos para Supabase (PostgreSQL)
--  Ejecuta este script completo en: Supabase → SQL Editor → New query → Run
--
--  ¿Ya habías ejecutado una versión anterior (con "spinning")? Este script
--  es seguro de volver a ejecutar: no borra datos, solo actualiza la regla
--  de qué valores admite la columna "type". Basta con pegarlo y pulsar Run.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.activities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type          text not null check (type in ('gym', 'running', 'cycling', 'walking', 'elliptical', 'football', 'other')),
  status        text not null default 'done' check (status in ('planned', 'done', 'skipped')),
  date          date not null,
  duration_min  integer check (duration_min is null or duration_min between 0 and 1440),
  -- Datos específicos de cada deporte:
  --   gym:        { muscles: ['pecho','triceps'], routine, exercises: [{name, sets, reps, kg}], rpe }
  --   running:    { km, time_sec, kind, hr_avg, hr_max, elev, cadence, kcal, shoes, rpe }
  --   cycling:    { km, time_sec, kind, elev, cadence, avg_power, hr_avg, kcal, bike, rpe }
  --   walking:    { km, time_sec, kind, steps, elev, hr_avg, kcal, rpe }
  --   elliptical: { resistance, km, cadence, hr_avg, kcal, rpe }
  --   football:   { format, result, score, goals, assists, km, rpe }
  --   other:      { name, km, rpe }
  data          jsonb not null default '{}'::jsonb,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists activities_user_date_idx on public.activities (user_id, date);

-- Si la tabla ya existía (versión con "spinning"), renovamos la lista de
-- tipos válidos para que acepte los nuevos ('cycling', 'walking', 'elliptical').
alter table public.activities drop constraint if exists activities_type_check;
alter table public.activities add constraint activities_type_check
  check (type in ('gym', 'running', 'cycling', 'walking', 'elliptical', 'football', 'other'));

-- Actividades antiguas de "spinning" pasan a clasificarse como "cycling"
-- (bicicleta) conservando sus datos.
update public.activities set type = 'cycling' where type = 'spinning';

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

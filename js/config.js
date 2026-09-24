// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE SUPABASE
//  1. Crea un proyecto gratis en https://supabase.com
//  2. Ve a Project Settings → API y copia:
//       - Project URL          → SUPABASE_URL
//       - anon / public key    → SUPABASE_ANON_KEY
//  La "anon key" es pública por diseño: la seguridad la dan las
//  políticas RLS del fichero supabase/schema.sql.
//
//  Si dejas estos valores vacíos, la app funciona en "modo local"
//  (los datos se guardan sólo en el móvil).
// ─────────────────────────────────────────────────────────────
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

# ⚡ FitTrack

App móvil (PWA para Android) para **registrar y planificar tu actividad física**: gimnasio por grupos musculares, running, fútbol, spinning y otras actividades.

- **Código**: GitHub (gratis) + **GitHub Pages** para publicarla.
- **Base de datos**: **Supabase** (PostgreSQL gratuito), con login y sincronización entre dispositivos.
- **Funciona sin conexión**: los cambios se guardan en el móvil y se sincronizan al volver la cobertura.

---

## Funcionalidades

| | |
|---|---|
| 🏋️ **Gimnasio** | Catálogo de 14 grupos musculares (tren superior, core, tren inferior), rutina y ejercicios con series/reps/kg (sugerencias según los grupos elegidos). |
| 🏃 **Running** | Km, tiempo (h:mm:ss) → **ritmo y velocidad automáticos**, tipo de entreno, FC media/máx, desnivel, cadencia, calorías, zapatillas. |
| ⚽ **Fútbol** | Modalidad (F7, F11, sala…), resultado, marcador, goles, asistencias, km. |
| 🚴 **Spinning** | **FTP utilizado**, tiempo y km (obligatorios) + potencia media (→ % FTP), cadencia, FC, kcal. |
| ⏱️ **Todas** | Tiempo dedicado (obligatorio al registrar), esfuerzo percibido 1–10, notas e icono propio. |
| 📅 **Plan** | Vista semanal, planificar semanas futuras, copiar la semana a la siguiente o a las próximas 4, editar/mover/borrar, marcar como realizada o no realizada. |
| 📜 **Historial** | Por meses, con filtros por deporte y totales. |
| 📊 **Estadísticas** | Minutos por semana/mes, reparto por deporte, récords de running, evolución del FTP, balance de fútbol y **días desde que entrenaste cada grupo muscular**. |
| 💾 **Backup** | Exportar / importar JSON desde Ajustes. |

---

## Estructura

```
fittrack/
├── index.html              ← página principal
├── manifest.webmanifest    ← hace que sea instalable en Android
├── sw.js                   ← service worker (modo sin conexión)
├── css/styles.css
├── icons/                  ← iconos de la app
├── js/
│   ├── config.js           ← ⚠️ AQUÍ van tus claves de Supabase
│   ├── app.js              ← vistas (Hoy, Plan, Historial, Estadísticas)
│   ├── form.js             ← formulario de actividades
│   ├── catalog.js          ← deportes, grupos musculares y ejercicios
│   ├── db.js               ← almacenamiento local + sincronización Supabase
│   └── charts.js, ui.js, icons.js, utils.js
└── supabase/schema.sql     ← script de la base de datos
```

No hay que compilar nada: son ficheros estáticos.

---

## Puesta en marcha (≈15 minutos)

### 1. Base de datos en Supabase

1. Crea una cuenta gratuita en <https://supabase.com> y pulsa **New project** (elige región *West EU* y una contraseña).
2. En el menú izquierdo: **SQL Editor → New query**, pega el contenido de `supabase/schema.sql` y pulsa **Run**.
3. Ve a **Project Settings → API** y copia:
   - **Project URL** (p. ej. `https://abcd1234.supabase.co`)
   - **anon public key**
4. Abre `js/config.js` y pégalos:
   ```js
   export const SUPABASE_URL = 'https://abcd1234.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```
   > La *anon key* es pública por diseño; tus datos están protegidos por las políticas RLS del script (cada usuario sólo ve lo suyo). **Nunca** pongas la `service_role` key.

5. **Authentication → Providers → Email**: déjalo activado. Si no quieres confirmar el email al registrarte, desactiva *Confirm email* (más cómodo para uso personal).

### 2. Repositorio en GitHub

1. Crea una cuenta en <https://github.com> y un repositorio nuevo, por ejemplo `fittrack` (**público**: GitHub Pages es gratis en repos públicos).
2. Sube el contenido de esta carpeta. Desde la web: **Add file → Upload files** y arrastra todos los ficheros y carpetas. O con git:
   ```bash
   cd fittrack
   git init && git add . && git commit -m "FitTrack v1"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/fittrack.git
   git push -u origin main
   ```

### 3. Publicar con GitHub Pages

1. En el repo: **Settings → Pages**.
2. *Source*: **Deploy from a branch** → Branch **main** / carpeta **/(root)** → **Save**.
3. En 1–2 minutos tendrás la app en `https://TU_USUARIO.github.io/fittrack/`.
4. Vuelve a Supabase → **Authentication → URL Configuration** y pon esa dirección como **Site URL** (para que los emails de confirmación lleven a tu app).

### 4. Instalar en tu Android

1. Abre la URL en **Chrome** del móvil.
2. Menú **⋮ → Instalar aplicación** (o *Añadir a pantalla de inicio*).
3. Aparecerá el icono ⚡ **FitTrack** y se abrirá a pantalla completa como una app nativa.
4. Crea tu cuenta con email y contraseña (o usa *modo local* sin cuenta).

---

## Uso rápido

- **➕ (botón verde)**: registrar o planificar una actividad. Si la fecha es futura, queda como *Planificada*.
- **Plan**: navega por semanas con ‹ ›, pulsa **+** en un día para planificar. Toca una actividad para editarla, cambiarle la fecha o marcarla como *Realizada / No realizada*.
- **Copiar semana**: prepara una semana tipo (p. ej. fútbol el jueves, spinning el sábado…) y cópiala a las siguientes 4 semanas.
- **Hoy**: resumen semanal, racha, lo de hoy y **pendientes de registrar** (lo planificado que ya pasó). El botón ✓ abre el formulario para completar los datos.
- **Icono de nube** (arriba): estado de sincronización. Si aparece un número, son cambios pendientes de subir.

## Actualizar la app

Edita los ficheros, súbelos a GitHub y en 1–2 minutos se publica. Si cambias ficheros, incrementa `VERSION` en `sw.js` (p. ej. `fittrack-v1.0.1`) para que el móvil descargue la nueva versión.

## Personalizar

- **Añadir ejercicios o grupos musculares**: `js/catalog.js` (`MUSCLES`).
- **Colores**: variables al principio de `css/styles.css` (`--accent`, `--c-gym`, `--c-run`…).
- **Nuevos tipos de entreno de running / modalidades de fútbol**: `RUN_KINDS`, `FOOT_FORMATS` en `js/catalog.js`.

## Notas sobre los planes gratuitos

- **Supabase Free**: suficiente de sobra para uso personal. En el plan gratuito, los proyectos **sin actividad durante unos 7 días se pausan**; si ocurre, entra en el panel de Supabase y pulsa *Restore* (no se pierden datos). Usando la app con regularidad no pasa.
- **GitHub Pages**: gratis en repositorios públicos. El código es público pero **tus datos no**: están en Supabase protegidos por login.
- Haz de vez en cuando **Ajustes → Exportar JSON** como copia extra.

## Consultar tus datos con SQL

En Supabase → SQL Editor:
```sql
-- Resumen semanal por deporte
select * from activities_summary limit 40;

-- Km corridos por mes
select date_trunc('month', date)::date mes, sum((data->>'km')::numeric) km
from activities where type = 'running' and status = 'done'
group by 1 order by 1 desc;
```
  

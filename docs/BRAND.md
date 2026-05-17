# BRAND.md — HRScout Design System v1

> **Status:** Locked v1 (2026-05-17) · **Owner:** `hr-scout-brand` subagent
> **Audiencia:** Engineering, Product, futuros colaboradores
> **NO es:** guía de logo, library de íconos, motion system, ni component patterns (cada uno va en doc separado cuando se necesite)

Este documento define la identidad visual y verbal canónica de HRScout. Si algo en código contradice este doc, lo que está en código se ajusta — no al revés. El doc se actualiza solo via PR con review explícita de Christian.

---

## 1. Audit del estado actual (snapshot 2026-05-17)

### 1.1 Lo que tenemos hoy

**`src/constants/colors.js`** — 4 grupos funcionales con 11 hex únicos:
- `RANK_COLORS` (oro / plata / bronce)
- `SCORE_COLORS` (suitable / review / notSuitable)
- `MODE_COLORS` (tool_use / ai / agentic / local)
- `DIST_COLORS` (rangos de score)

**Glass tokens inline en `src/App.jsx` líneas 28-35:**

```js
const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
};
```

**Easing inline en `App.jsx` línea 26:** `const APPLE_EASE = [0.16, 1, 0.3, 1];`

### 1.2 Inconsistencias detectadas

| # | Problema | Severidad |
|---|---|---|
| 1 | `#6366F1` (primary canon §19 #7) **no existe en `colors.js`**. Solo aparece en mermaid del README. | Alta |
| 2 | `#818CF8` se usa en `MODE_COLORS.ai` Y en `DIST_COLORS["60-80"]` con semánticas distintas | Media |
| 3 | `#F59E0B` aparece 3 veces con semánticas distintas (oro / warning / agentic) | Media |
| 4 | Glass tokens viven inline en `App.jsx`, no reutilizables | Alta |
| 5 | Sin tokens de **texto** — cada componente decide su `color: '#fff'` o `rgba(255,255,255,0.X)` | Alta |
| 6 | Sin escala de **spacing** ni **radius** — `borderRadius: 16` hardcoded en glass, otros componentes podrían usar 12, 8, 20 | Media |
| 7 | Sin tokens de **font-family** ni **type scale** — Inter mencionado en system prompt pero no canonizado en código | Alta |

### 1.3 Qué es CANON (no se toca)

- Color primary `#6366F1` (decisión §15 #7 + §19)
- Glass card style (`rgba(255,255,255,0.03)` + `blur(12px)` + `borderRadius: 16`)
- Apple easing `[0.16, 1, 0.3, 1]`
- Dark default
- Inter en body
- Estructura semántica de `SCORE_COLORS` (suitable / review / notSuitable)

### 1.4 Plan de migración

**Estrategia híbrida (decisión Christian 2026-05-17):**
- **Sweep parcial:** componentes nuevos y los que se tocan en Phase 1 (landing rewrite + dashboard + auth pages) usan tokens canónicos desde el primer día
- **Gradual:** componentes legacy del demo (`App.jsx` actual con su `glass` inline) migran cuando se toquen por otra razón. No hacemos sweep destructivo.
- Re-export compat en `colors.js` para que ningún import existente rompa.

---

## 2. Paleta canonical

### 2.1 Primary (locked por decisión §19 #7)

```js
primary: {
  50:  '#EEF2FF',
  100: '#E0E7FF',
  300: '#A5B4FC',
  500: '#6366F1',   // CANON — brand primary
  600: '#4F46E5',   // hover
  700: '#4338CA',   // active / pressed
}
```

**Por qué indigo:** serio sin ser corporativo aburrido. Diferenciado de fintech (cyan) y de health-tech (verde/teal).

### 2.2 Neutrales (dark-first con alpha en blanco)

```js
neutral: {
  0:    '#FFFFFF',
  50:   'rgba(255,255,255,0.95)',   // text primary on dark
  100:  'rgba(255,255,255,0.80)',   // text secondary on dark
  300:  'rgba(255,255,255,0.50)',   // text muted on dark
  500:  'rgba(255,255,255,0.20)',   // borders strong
  700:  'rgba(255,255,255,0.06)',   // borders subtle (glass)
  800:  'rgba(255,255,255,0.03)',   // surface glass
  900:  '#0B0B12',                  // canvas dark
  950:  '#050508',                  // deepest dark
}
```

**Por qué dark-first con alpha:** glass requiere transparencias sobre fondo oscuro. Definir el blanco con alpha lo hace componible con cualquier background dark sin recalcular.

### 2.3 Estados semánticos

```js
state: {
  success: { base: '#10B981', soft: 'rgba(16,185,129,0.15)' },
  warning: { base: '#F59E0B', soft: 'rgba(245,158,11,0.15)' },
  danger:  { base: '#EF4444', soft: 'rgba(239,68,68,0.15)' },
  info:    { base: '#818CF8', soft: 'rgba(129,140,248,0.15)' },
}
```

Mismos hex que ya usa el producto (no rompe visual existente), pero con variant `soft` para badges/pills/highlights.

### 2.4 Light theme (DEFERRED a Phase 2)

**Decisión 2026-05-17:** light theme NO entra en MVP. El toggle existente en el demo se OCULTA hasta tener bandwidth para implementarlo bien. Mostrar un toggle roto baja confianza más que no tenerlo.

Pre-spec del light theme (para cuando se retome):

```js
neutralLight: {
  900: '#0F172A',   // text primary
  700: '#334155',   // text secondary
  500: '#64748B',   // text muted
  300: '#CBD5E1',   // borders
  100: '#F1F5F9',   // surface raised
  0:   '#FFFFFF',   // canvas
}
```

### 2.5 Mapping a tokens semánticos (API pública)

Componentes nuevos consumen estos tokens, NUNCA los hex directamente:

| Token | Dark value | Uso |
|---|---|---|
| `--color-canvas` | `neutral.900` | Background del body |
| `--color-surface-glass` | `neutral.800` | Cards principales |
| `--color-surface-raised` | `rgba(255,255,255,0.05)` | Modales, panels elevados |
| `--color-border-subtle` | `neutral.700` | Borders de cards |
| `--color-border-strong` | `neutral.500` | Borders de inputs activos |
| `--color-text-primary` | `neutral.50` | Headings + body principal |
| `--color-text-secondary` | `neutral.100` | Body secundario |
| `--color-text-muted` | `neutral.300` | Captions, hints |
| `--color-accent` | `primary.500` | CTA principal, links |
| `--color-accent-hover` | `primary.600` | Hover de CTA |
| `--color-success` | `state.success.base` | Score "Strong", confirmaciones |
| `--color-warning` | `state.warning.base` | Score "Partial", alerts soft |
| `--color-danger` | `state.danger.base` | Score "Not aligned", errores |
| `--color-info` | `state.info.base` | Score range 60-80, info badges |

**Regla absoluta:** ningún componente nuevo importa hex literal. Si necesitás un color que no existe como token, lo proponés antes de usarlo.

---

## 3. Tipografía

### 3.1 Font family

```js
font: {
  body: '"Inter", system-ui, -apple-system, sans-serif',
  mono: '"Inter", system-ui, monospace',   // mismo Inter con tabular-nums
}
```

**Decisión 2026-05-17:**
- **Inter self-hosted** via `@fontsource/inter` (~30 KB). NO Google Fonts CDN (privacy + CLS).
- **Sin JetBrains Mono.** Para scores numéricos alineados usamos Inter con `font-variant-numeric: tabular-nums` — 0 KB extra, alineamiento perfecto.

### 3.2 Type scale

| Token | Size | Line-height | Weight | Uso |
|---|---|---|---|---|
| `--text-display` | 48px | 1.1 | 700 | Hero landing (1 por página) |
| `--text-h1` | 36px | 1.2 | 700 | Títulos de sección |
| `--text-h2` | 28px | 1.25 | 600 | Subsecciones |
| `--text-h3` | 22px | 1.3 | 600 | Card titles |
| `--text-h4` | 18px | 1.4 | 600 | Mini-headings |
| `--text-body` | 16px | 1.5 | 400 | Cuerpo base |
| `--text-body-sm` | 14px | 1.5 | 400 | Body denso |
| `--text-caption` | 12px | 1.4 | 500 | Labels, helpers |
| `--text-overline` | 11px | 1.3 | 600 | UPPERCASE tags, letter-spacing 0.08em |

**Mobile (≤480px):** display baja a 36px, h1 a 28px. El resto se mantiene.

**Weights permitidos:** 400, 500, 600, 700. **NO** 300, 800, 900.

### 3.3 Cuándo usar tabular-nums

```jsx
<span style={{ fontVariantNumeric: 'tabular-nums' }}>87</span>
<span> / 100</span>
```

Reservado para: número de score, conteos, IDs cortos, versión de modelo. El resto usa proportional nums (default).

---

## 4. Spacing, radius, shadows

### 4.1 Spacing scale

```js
space: {
  0:   '0',
  1:   '4px',
  2:   '8px',
  3:   '12px',
  4:   '16px',
  5:   '24px',
  6:   '32px',
  7:   '48px',
  8:   '64px',
  9:   '96px',    // section spacing landing
}
```

### 4.2 Border radius

```js
radius: {
  sm:   '6px',     // pills, badges
  md:   '12px',    // inputs, buttons
  lg:   '16px',    // cards (matches glass canon)
  xl:   '24px',    // modales grandes
  full: '9999px',  // avatars, dots
}
```

### 4.3 Shadow tokens

```js
shadow: {
  glass:      '0 1px 0 0 rgba(255,255,255,0.04) inset',
  raised:     '0 8px 24px -8px rgba(0,0,0,0.5)',
  floating:   '0 20px 40px -12px rgba(0,0,0,0.6)',
  glowAccent: '0 0 0 1px rgba(99,102,241,0.4), 0 8px 24px -8px rgba(99,102,241,0.3)',
}
```

`glowAccent` reservado para CTA primary hover + modal de upgrade. No abusar — pierde fuerza.

---

## 5. Voice & tone

> Esta sección complementa al `hr-scout-sales-psych`. Si hay conflicto, sales-psych gana en CTAs y headlines comerciales; este doc gana en UI strings y microcopy.

### 5.1 Principios

1. **Tuteo siempre.** Reclutadoras MX freelance son peers, no clientes premium.
2. **Español MX profesional, no neutro acartonado.**
3. **Concreto > abstracto.** "Analiza 100 CVs en 5 min" > "Optimiza tu pipeline de talento".
4. **Una idea por oración.** Frases largas se parten.
5. **Verbo en imperativo amable para CTAs.** "Empieza", "Subí", "Analiza" — no "Comenzar", no "Click aquí".
6. **NUNCA prometemos contratación.** Decimos "ayuda a", "sugiere", "filtra". Disclaimer "decisión final humana" obligatorio.

### 5.2 Diccionario de voz

| Decí esto ✓ | NO esto ✗ |
|---|---|
| candidato | talento, recurso humano |
| filtrar | shortlistear, screenear |
| puntuación / score | scoring, calificación holística |
| vacante | requisición, posición |
| reclutadora | talent acquisition specialist |
| análisis | assessment, evaluación 360 |
| contratar | onboardear, fichar |
| revisar | curatear, evaluar |

### 5.3 Microcopy canónico

| Contexto | Texto |
|---|---|
| Botón upload CV | "Subí tu CV" |
| Empty state CVs | "Aún no agregaste candidatos. Empezá pegando un texto o subiendo un PDF." |
| Error de API | "No pudimos conectar con el motor de análisis. Reintentá en unos segundos." |
| Confirmación score | "Score generado en 3.2s · modo Claude" |
| Trial expirado | "Tu prueba de 14 días terminó. Elegí un plan para seguir analizando." |
| Disclaimer en análisis | "Esta puntuación es una herramienta de apoyo. La decisión final de contratación es tuya." |

### 5.4 Tono por superficie

| Superficie | Tono |
|---|---|
| Landing hero | Directo, confiado, sin hype |
| Producto in-app | Neutro, eficiente, sin emojis |
| Errores | Empático breve, accionable |
| Onboarding tour | Cálido, primera persona ("Te muestro cómo…") |
| Emails transaccionales | Profesional cercano, firma "Christian" (founder-led) |
| Legales | Formal estándar (acá sí "usted") |

---

## 6. Do / Don't

### 6.1 Visual — DON'T

| ✗ | Por qué |
|---|---|
| Emojis tipo rocket/fuego/sparkle en CTAs o headlines | Audience reclutadora profesional, no founder-bro |
| Gradientes neón / cyber 80s | Anti-fintech-HR, anti-confianza |
| Light theme como default | Glass + dark es ventaja diferencial |
| Sombras drop-shadow agresivas en dark | El contraste viene del blur |
| Bordes de 2px+ en cards | Glass requiere bordes sutiles (1px alpha bajo) |
| Border-radius full en cards rectangulares | Solo en pills/avatars/dots |
| Color verde como primary | "Compra/dinero" es banking-vibes |
| Pasteles saturados | Anti-serio |
| Animaciones spring/bouncy | Apple easing es canon |
| Stock photos "diverse team smiling at laptop" | Cliché, baja confianza |
| Iconografía hand-drawn / sketchy | Anti-profesional |
| 3+ font-families en una pantalla | Inter es el único, ES EL LÍMITE |

### 6.2 Visual — DO

| ✓ | Por qué |
|---|---|
| Glass cards con bordes sutiles + blur 12px | Canon establecido |
| Indigo `#6366F1` como único accent dominante | Brand recognition |
| Íconos line-style (Lucide u otro line set) | Profesional, neutral |
| Whitespace generoso en landing (space-9 entre sections) | Confianza percibida ↑ |
| Motion sutil con Apple easing | Canónico |
| Datos reales en demos (no Lorem) | Demos creíbles convierten |

### 6.3 Voice — DON'T

| ✗ | Por qué |
|---|---|
| "Revoluciona tu RRHH" | Hype vacío |
| "AI-powered platform" | Anglicismo perezoso |
| "Solución integral 360°" | Buzzword bingo |
| "Garantiza la mejor contratación" | Claim absoluto = riesgo legal |
| "Click aquí" | Anti-UX desde 2005 |
| "Optimizamos tu pipeline de talento" | Jerga inflada |
| Mayúsculas en CTAs ("EMPEZAR AHORA") | Grita |
| Tres signos !!! | Anti-profesional |
| Comparar contratar candidatos con café/Netflix/Uber | Trivializa decisiones de carrera |

### 6.4 Voice — DO

| ✓ | Por qué |
|---|---|
| "Filtrá 100 CVs en 5 minutos" | Específico, verificable |
| "Sin sesgos. Sin lectura repetitiva." | Concreto, paralelismo limpio |
| "Score 0-100. Decisión 100% tuya." | Compliance + autonomía |
| Founder-led ("Hablar con Christian") | Decisión §19 C5 |
| Datos numéricos en proof points | Confianza |

---

## 7. Accesibilidad mínima

No es opcional. Sin contraste o sin focus, el componente NO se mergea.

| Regla | Estándar |
|---|---|
| Contraste body text | WCAG **AA** (4.5:1) mínimo |
| Contraste headlines + CTAs | WCAG **AAA** (7:1) objetivo |
| Focus visible | Outline 2px `var(--color-accent)` + offset 2px. NUNCA `outline:none` sin reemplazo |
| Tamaño táctil mínimo | 44×44px en mobile (Apple HIG) |
| Iconos sin texto | `aria-label` obligatorio |
| Color como único transmisor de info | Prohibido — siempre acompañar con texto/ícono |
| Animaciones | Respetar `prefers-reduced-motion` |
| Font-size mínimo | 14px en UI densa, 16px en cuerpo |
| Tap targets adyacentes | ≥ 8px entre ellos |

**Lighthouse objetivo:** ≥ 90 mobile + desktop antes de launch (Day 9 según spec §13).

---

## 8. Fuera de scope de este doc

Cada uno irá en su propio archivo cuando se necesite:

- **Logo design** → `docs/BRAND-LOGO.md` (post-landing rewrite, para diseñar viendo contextos reales: header, favicon, OG card, PDF report)
- **Animation system** → `docs/MOTION.md`
- **Iconografía library** → `docs/ICONS.md`
- **Component patterns** → `docs/COMPONENTS.md` (engineering-led)
- **Email design** → cuando se monten templates Resend
- **Imagery / fotografía** → cuando empiecen blogposts u OG cards

---

## 9. Implementación

La materialización de §2-4 vive en `src/constants/tokens.js`. Ese archivo es la API runtime que componentes consumen. Si cambia este doc, cambia tokens.js en el mismo PR.

Las CSS vars se inyectan via `cssVars()` que retorna un string aplicado al `:root` por el ThemeProvider del frontend (a crear en Phase 1 Día 7).

---

*Última actualización: 2026-05-17 · Christian Hernandez*

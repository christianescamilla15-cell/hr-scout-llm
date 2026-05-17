// Design tokens — single source of truth for color, type, spacing, radius, shadow, motion.
// Spec: docs/BRAND.md. Any change here requires the same change in BRAND.md in the same PR.

export const PALETTE = {
  primary: {
    50:  '#EEF2FF',
    100: '#E0E7FF',
    300: '#A5B4FC',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
  },
  neutral: {
    0:    '#FFFFFF',
    50:   'rgba(255,255,255,0.95)',
    100:  'rgba(255,255,255,0.80)',
    300:  'rgba(255,255,255,0.50)',
    500:  'rgba(255,255,255,0.20)',
    700:  'rgba(255,255,255,0.06)',
    800:  'rgba(255,255,255,0.03)',
    900:  '#0B0B12',
    950:  '#050508',
  },
  state: {
    success: { base: '#10B981', soft: 'rgba(16,185,129,0.15)' },
    warning: { base: '#F59E0B', soft: 'rgba(245,158,11,0.15)' },
    danger:  { base: '#EF4444', soft: 'rgba(239,68,68,0.15)' },
    info:    { base: '#818CF8', soft: 'rgba(129,140,248,0.15)' },
  },
};

export const SEMANTIC_DARK = {
  canvas:           PALETTE.neutral[900],
  surfaceGlass:     PALETTE.neutral[800],
  surfaceRaised:    'rgba(255,255,255,0.05)',
  borderSubtle:     PALETTE.neutral[700],
  borderStrong:     PALETTE.neutral[500],
  textPrimary:      PALETTE.neutral[50],
  textSecondary:    PALETTE.neutral[100],
  textMuted:        PALETTE.neutral[300],
  accent:           PALETTE.primary[500],
  accentHover:      PALETTE.primary[600],
  accentActive:     PALETTE.primary[700],
  success:          PALETTE.state.success.base,
  successSoft:      PALETTE.state.success.soft,
  warning:          PALETTE.state.warning.base,
  warningSoft:      PALETTE.state.warning.soft,
  danger:           PALETTE.state.danger.base,
  dangerSoft:       PALETTE.state.danger.soft,
  info:             PALETTE.state.info.base,
  infoSoft:         PALETTE.state.info.soft,
};

export const FONT = {
  body: '"Inter", system-ui, -apple-system, sans-serif',
  mono: '"Inter", system-ui, monospace',
};

export const TEXT = {
  display:  { size: '48px', lineHeight: '1.1',  weight: 700, mobileSize: '36px' },
  h1:       { size: '36px', lineHeight: '1.2',  weight: 700, mobileSize: '28px' },
  h2:       { size: '28px', lineHeight: '1.25', weight: 600 },
  h3:       { size: '22px', lineHeight: '1.3',  weight: 600 },
  h4:       { size: '18px', lineHeight: '1.4',  weight: 600 },
  body:     { size: '16px', lineHeight: '1.5',  weight: 400 },
  bodySm:   { size: '14px', lineHeight: '1.5',  weight: 400 },
  caption:  { size: '12px', lineHeight: '1.4',  weight: 500 },
  overline: { size: '11px', lineHeight: '1.3',  weight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
};

export const SPACE = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
  9: '96px',
};

export const RADIUS = {
  sm:   '6px',
  md:   '12px',
  lg:   '16px',
  xl:   '24px',
  full: '9999px',
};

export const SHADOW = {
  glass:      '0 1px 0 0 rgba(255,255,255,0.04) inset',
  raised:     '0 8px 24px -8px rgba(0,0,0,0.5)',
  floating:   '0 20px 40px -12px rgba(0,0,0,0.6)',
  glowAccent: '0 0 0 1px rgba(99,102,241,0.4), 0 8px 24px -8px rgba(99,102,241,0.3)',
};

export const MOTION = {
  ease: {
    apple: [0.16, 1, 0.3, 1],
    standard: [0.4, 0, 0.2, 1],
  },
  duration: {
    fast: 150,
    base: 250,
    slow: 400,
  },
};

const dashCase = (k) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

export function cssVars(theme = 'dark') {
  if (theme !== 'dark') {
    throw new Error(`Theme "${theme}" not implemented yet. Light theme deferred to Phase 2 per BRAND.md §2.4.`);
  }
  const lines = [];
  for (const [k, v] of Object.entries(SEMANTIC_DARK)) {
    lines.push(`  --color-${dashCase(k)}: ${v};`);
  }
  for (const [k, v] of Object.entries(SPACE)) {
    lines.push(`  --space-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(RADIUS)) {
    lines.push(`  --radius-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(SHADOW)) {
    lines.push(`  --shadow-${dashCase(k)}: ${v};`);
  }
  lines.push(`  --font-body: ${FONT.body};`);
  lines.push(`  --font-mono: ${FONT.mono};`);
  for (const [k, t] of Object.entries(TEXT)) {
    lines.push(`  --text-${dashCase(k)}-size: ${t.size};`);
    lines.push(`  --text-${dashCase(k)}-line-height: ${t.lineHeight};`);
    lines.push(`  --text-${dashCase(k)}-weight: ${t.weight};`);
  }
  return `:root {\n${lines.join('\n')}\n}`;
}

// Convenience export — what most components import directly.
export const TOKENS = {
  color: SEMANTIC_DARK,
  palette: PALETTE,
  font: FONT,
  text: TEXT,
  space: SPACE,
  radius: RADIUS,
  shadow: SHADOW,
  motion: MOTION,
};

export default TOKENS;

import { describe, it, expect } from 'vitest';
import {
  PALETTE,
  SEMANTIC_DARK,
  FONT,
  TEXT,
  SPACE,
  RADIUS,
  SHADOW,
  MOTION,
  TOKENS,
  cssVars,
} from '../tokens';

describe('tokens — palette', () => {
  it('primary 500 is the canonical brand indigo', () => {
    expect(PALETTE.primary[500]).toBe('#6366F1');
  });

  it('exposes neutral, primary and state scales', () => {
    expect(Object.keys(PALETTE)).toEqual(['primary', 'neutral', 'state']);
  });

  it('state scales have both base and soft variants', () => {
    for (const key of ['success', 'warning', 'danger', 'info']) {
      expect(PALETTE.state[key]).toHaveProperty('base');
      expect(PALETTE.state[key]).toHaveProperty('soft');
    }
  });
});

describe('tokens — semantic dark', () => {
  it('accent semantic points at primary 500', () => {
    expect(SEMANTIC_DARK.accent).toBe(PALETTE.primary[500]);
  });

  it('text tokens descend in alpha (primary > secondary > muted)', () => {
    const alpha = (rgba) => parseFloat(rgba.match(/[\d.]+\)$/)?.[0] ?? 1);
    expect(alpha(SEMANTIC_DARK.textPrimary)).toBeGreaterThan(alpha(SEMANTIC_DARK.textSecondary));
    expect(alpha(SEMANTIC_DARK.textSecondary)).toBeGreaterThan(alpha(SEMANTIC_DARK.textMuted));
  });
});

describe('tokens — type scale', () => {
  it('display is the largest and h4 the smallest heading', () => {
    expect(parseInt(TEXT.display.size, 10)).toBeGreaterThan(parseInt(TEXT.h1.size, 10));
    expect(parseInt(TEXT.h1.size, 10)).toBeGreaterThan(parseInt(TEXT.h4.size, 10));
  });

  it('only permitted weights are used (400-700)', () => {
    const allowed = new Set([400, 500, 600, 700]);
    for (const [, v] of Object.entries(TEXT)) {
      expect(allowed.has(v.weight)).toBe(true);
    }
  });
});

describe('tokens — spacing', () => {
  it('scale starts at 0 and goes up to space-9 (96px)', () => {
    expect(SPACE[0]).toBe('0');
    expect(SPACE[9]).toBe('96px');
  });
});

describe('tokens — radius', () => {
  it('lg radius matches glass canon (16px)', () => {
    expect(RADIUS.lg).toBe('16px');
  });
});

describe('tokens — motion', () => {
  it('apple easing matches the canonical inline value from App.jsx', () => {
    expect(MOTION.ease.apple).toEqual([0.16, 1, 0.3, 1]);
  });
});

describe('tokens — cssVars', () => {
  it('emits a :root rule with semantic color vars', () => {
    const css = cssVars('dark');
    expect(css).toMatch(/^:root \{/);
    expect(css).toMatch(/--color-accent: #6366F1;/);
    expect(css).toMatch(/--space-4: 16px;/);
    expect(css).toMatch(/--radius-lg: 16px;/);
    expect(css).toMatch(/--font-body: "Inter"/);
  });

  it('throws for unimplemented themes (light deferred to Phase 2)', () => {
    expect(() => cssVars('light')).toThrow(/Light theme deferred/);
  });
});

describe('tokens — default export', () => {
  it('TOKENS default aggregates all groups', () => {
    expect(TOKENS).toHaveProperty('color');
    expect(TOKENS).toHaveProperty('palette');
    expect(TOKENS).toHaveProperty('font');
    expect(TOKENS).toHaveProperty('text');
    expect(TOKENS).toHaveProperty('space');
    expect(TOKENS).toHaveProperty('radius');
    expect(TOKENS).toHaveProperty('shadow');
    expect(TOKENS).toHaveProperty('motion');
  });

  it('TOKENS.color === SEMANTIC_DARK', () => {
    expect(TOKENS.color).toBe(SEMANTIC_DARK);
  });
});

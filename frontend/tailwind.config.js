/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  // Preflight is disabled on purpose: the app ships an existing, hand-tuned reset
  // in globals.css shared by CSS Modules. Keeping it off avoids regressions while
  // still exposing the full Tailwind utility layer for new components.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Colors resolve to CSS variables via color-mix() so Tailwind's opacity
      // modifiers (e.g. `bg-surface/85`) compile correctly against them.
      colors: {
        primary: {
          DEFAULT: withAlpha('--color-primary'),
          dark: withAlpha('--color-primary-dark'),
          light: withAlpha('--color-primary-light'),
          soft: withAlpha('--color-primary-soft'),
        },
        success: { DEFAULT: withAlpha('--color-success'), soft: withAlpha('--color-success-soft') },
        warning: { DEFAULT: withAlpha('--color-warning'), soft: withAlpha('--color-warning-soft') },
        danger: { DEFAULT: withAlpha('--color-danger'), soft: withAlpha('--color-danger-soft') },
        info: { DEFAULT: withAlpha('--color-info'), soft: withAlpha('--color-info-soft') },
        ink: { DEFAULT: withAlpha('--color-ink'), soft: withAlpha('--color-ink-soft') },
        muted: withAlpha('--color-muted'),
        line: withAlpha('--color-line'),
        surface: {
          DEFAULT: withAlpha('--color-surface'),
          alt: withAlpha('--color-surface-alt'),
        },
        canvas: withAlpha('--color-bg'),
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
      },
      borderRadius: {
        // Restrained scale (10-20px) so every surface shares the same family.
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-lg)',
        '2xl': 'var(--radius-xl)',
        '3xl': '20px',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      maxWidth: {
        container: 'var(--container)',
      },
      transitionDuration: {
        DEFAULT: '160ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 500ms ease both',
      },
    },
  },
  plugins: [],
};

// Tailwind treats `<alpha-value>` as a placeholder it fills in with the opacity
// modifier (defaulting to 1), so wrapping a CSS variable this way keeps both
// solid colors and `/opacity` variants working.
function withAlpha(cssVariable) {
  return `color-mix(in srgb, var(${cssVariable}) <alpha-value>, transparent)`;
}
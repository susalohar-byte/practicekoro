/** @type {import('tailwindcss').Config} */
// Colours mirror the Flutter app's design system (lib/core/components/ui.dart, class UI).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1F48E8', dark: '#1736C4', soft: '#EAF0FF' },
        brand: '#0158FC',
        page: '#F7F8FC',
        surface: '#F6F7FB',
        line: '#E9ECF3',
        ink: { DEFAULT: '#111827', soft: '#374151' },
        muted: '#6B7280',
        faint: '#9CA3AF',
        purple: { DEFAULT: '#8B5CF6', soft: '#F3EEFF' },
        success: { DEFAULT: '#16A34A', bright: '#22C55E', soft: '#ECFDF3' },
        danger: { DEFAULT: '#DC2626', soft: '#FEF2F2' },
        gold: { DEFAULT: '#F59E0B', bright: '#FACC15', soft: '#FFF8E6' },
        orange: '#F97316',
        teal: '#0EA5E9',
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
        bengali: ['"Noto Sans Bengali"', 'Inter', 'sans-serif'],
        tiro: ['"Tiro Bangla"', '"Noto Serif Bengali"', 'serif'],
      },
      borderRadius: { card: '14px' },
      boxShadow: {
        card: '0 4px 16px rgba(31, 58, 138, 0.05)',
        raised: '0 8px 24px rgba(31, 58, 138, 0.10)',
      },
      backgroundImage: {
        hero: 'linear-gradient(135deg, #1F48E8 0%, #4F46E5 55%, #8B3CF0 100%)',
      },
    },
  },
  plugins: [],
};

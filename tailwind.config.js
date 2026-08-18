/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand: near-black. `navy` is canonical; `orange` kept as alias for back-compat.
        navy: {
          50: '#F2F2F2', 100: '#E3E3E3', 200: '#C7C7C7', 300: '#A3A3A3',
          400: '#6E6E6E', 500: '#333333', 600: '#0A0A0A', 700: '#000000',
          800: '#000000', 900: '#000000',
        },
        orange: {
          50: '#F2F2F2', 100: '#E3E3E3', 200: '#C7C7C7', 300: '#A3A3A3',
          400: '#6E6E6E', 500: '#333333', 600: '#0A0A0A', 700: '#000000',
          800: '#000000', 900: '#000000',
        },
        paper: {
          0: '#FFFFFF', 50: '#FAFAFA', 100: '#F2F2F2', 200: '#E5E5E5',
          300: '#D4D4D4', 400: '#A3A3A3', 500: '#737373',
        },
        ink: {
          50: '#737373', 100: '#525252', 200: '#262626', 300: '#0A0A0A', 400: '#000000',
        },
        leaf: { 50: '#F0FDF4', 500: '#16A34A' },
        gold: { 50: '#FFFBEB', 500: '#D97706' },
        rust: { 50: '#FEF2F2', 500: '#DC2626' },
      },
      fontFamily: {
        // Single family, everywhere — no serif. Inter carries the whole
        // interface; Google Sans Flex (self-hosted) is the fallback.
        display: ['Inter', '"Google Sans Flex Display"', '"Google Sans Flex"', 'system-ui', 'sans-serif'],
        mono: ['Inter', '"Google Sans Flex"', '-apple-system', 'system-ui', 'sans-serif'],
        body: ['Inter', '"Google Sans Flex"', '-apple-system', 'system-ui', 'sans-serif'],
        data: ['Inter', '"Google Sans Flex Display"', '"Google Sans Flex"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        md: '14px', lg: '18px', xl: '22px', '2xl': '28px', pill: '999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.03)',
        sm: '0 2px 6px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
        md: '0 8px 20px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)',
        lg: '0 20px 44px rgba(0, 0, 0, 0.09), 0 4px 12px rgba(0, 0, 0, 0.05)',
        accent: '0 6px 18px rgba(10, 10, 10, 0.22)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        snap: 'cubic-bezier(0.4, 0, 0.1, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

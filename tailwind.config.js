/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand: deep navy. `navy` is canonical; `orange` kept as alias for back-compat.
        navy: {
          50: '#EDEEF4', 100: '#D6D9E7', 200: '#AEB4CD', 300: '#828BB0',
          400: '#525C8E', 500: '#2C3568', 600: '#171E45', 700: '#121839',
          800: '#0D112A', 900: '#070A1A',
        },
        orange: {
          50: '#EDEEF4', 100: '#D6D9E7', 200: '#AEB4CD', 300: '#828BB0',
          400: '#525C8E', 500: '#2C3568', 600: '#171E45', 700: '#121839',
          800: '#0D112A', 900: '#070A1A',
        },
        paper: {
          0: '#FFFFFF', 50: '#F7F8FA', 100: '#EEF0F4', 200: '#E1E5EB',
          300: '#CBD1DA', 400: '#98A0AD', 500: '#6B727E',
        },
        ink: {
          50: '#6E665A', 100: '#4D463C', 200: '#2E2A23', 300: '#1A1611', 400: '#0E0C09',
        },
        leaf: { 50: '#E6F1EA', 500: '#2F8F5C' },
        gold: { 50: '#F8EFD9', 500: '#C58B2A' },
        rust: { 50: '#F8E1DE', 500: '#C73428' },
      },
      fontFamily: {
        display: ['Cormorant', 'Cormorant Garamond', 'Georgia', 'serif'],
        // Two families only — Space Mono retired. mono/body both Google Sans Flex.
        mono: ['"Google Sans Flex"', 'Inter', '-apple-system', 'system-ui', 'sans-serif'],
        body: ['"Google Sans Flex"', 'Inter', '-apple-system', 'system-ui', 'sans-serif'],
        data: ['"Google Sans Flex Display"', '"Google Sans Flex"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        md: '12px', lg: '16px', xl: '20px', '2xl': '24px', pill: '999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(64, 38, 14, 0.04)',
        sm: '0 2px 6px rgba(64, 38, 14, 0.05), 0 1px 2px rgba(64, 38, 14, 0.04)',
        md: '0 8px 24px rgba(64, 38, 14, 0.07), 0 2px 6px rgba(64, 38, 14, 0.05)',
        lg: '0 24px 48px rgba(64, 38, 14, 0.10), 0 4px 12px rgba(64, 38, 14, 0.06)',
        accent: '0 8px 24px rgba(23, 30, 69, 0.28)',
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

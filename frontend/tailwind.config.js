/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#D2C4B0",
        input: "#FFFFFF",
        ring: "#3A8B3A",
        background: "#F5EBDD",
        foreground: "#2C3E2D",
        primary: {
          DEFAULT: "#0A4F2A",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#3A8B3A",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#926F3F",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#C04638",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#E8DFD0",
          foreground: "#5C6B5D",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#2C3E2D",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#2C3E2D",
        },
        chart: {
          '1': '#0A4F2A',
          '2': '#3A8B3A',
          '3': '#926F3F',
          '4': '#D4A373',
          '5': '#E9EDC9'
        }
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
        handwriting: ['"Dancing Script"', 'cursive'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};

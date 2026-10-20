import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // As famílias vêm das variáveis: Source Serif 4 nas telas públicas (Estudo aberto),
        // Playfair Display + DM Sans na conta, no painel e no admin.
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          medium: "hsl(var(--foreground-medium))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          label: "hsl(var(--primary-label))",
          soft: "hsl(var(--primary-soft))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          light: "hsl(var(--destructive-light))",
          border: "hsl(var(--destructive-border))",
          text: "hsl(var(--destructive-text))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          text: "hsl(var(--accent-text))",
          light: "hsl(var(--accent-light))",
        },
        estimate: {
          DEFAULT: "hsl(var(--estimate))",
          light: "hsl(var(--estimate-light))",
          border: "hsl(var(--estimate-border))",
          text: "hsl(var(--estimate-text))",
        },
        // Estudo aberto (só existem com a classe `estudo` no <html>, isto é, nas telas públicas)
        tinta: {
          DEFAULT: "hsl(var(--foreground))",
          78: "hsl(var(--tinta-78))",
          70: "hsl(var(--tinta-70))",
        },
        papel: "hsl(var(--background))",
        ciano: {
          DEFAULT: "hsl(var(--ciano))",
          100: "hsl(var(--ciano-100))",
          200: "hsl(var(--ciano-200))",
          400: "hsl(var(--ciano-400))",
          600: "hsl(var(--ciano-600))",
          700: "hsl(var(--ciano-700))",
          800: "hsl(var(--ciano-800))",
          900: "hsl(var(--ciano-900))",
        },
        magenta: {
          DEFAULT: "hsl(var(--magenta))",
          100: "hsl(var(--magenta-100))",
          700: "hsl(var(--magenta-700))",
        },
        neutro: {
          100: "hsl(var(--neutro-100))",
          200: "hsl(var(--neutro-200))",
          300: "hsl(var(--neutro-300))",
          400: "hsl(var(--neutro-400))",
          500: "hsl(var(--neutro-500))",
          600: "hsl(var(--neutro-600))",
          700: "hsl(var(--neutro-700))",
          800: "hsl(var(--neutro-800))",
        },
        cost: "hsl(var(--cost))",
        trilho: "hsl(var(--trilho))",
        mapa: {
          fundo: "hsl(var(--mapa-fundo))",
          grade: "hsl(var(--mapa-grade))",
        },
        escala: {
          1: "hsl(var(--escala-1))",
          2: "hsl(var(--escala-2))",
          3: "hsl(var(--escala-3))",
          4: "hsl(var(--escala-4))",
          5: "hsl(var(--escala-5))",
        },
        serie: {
          1: "hsl(var(--serie-1))",
          2: "hsl(var(--serie-2))",
          3: "hsl(var(--serie-3))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        elevated: "var(--shadow-elevated)",
        segmented: "var(--shadow-segmented)",
        dialog: "var(--shadow-dialog)",
        sheet: "var(--shadow-sheet)",
        marcador: "var(--shadow-marcador)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 3s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

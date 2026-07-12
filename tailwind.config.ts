import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        "border-soft": "hsl(var(--border-soft))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        cream: "hsl(var(--card-cream))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", dark: "hsl(var(--primary-dark))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        income: "hsl(var(--income))",
        expense: "hsl(var(--expense))",
        amber: "hsl(var(--accent-amber))",
        terra: "hsl(var(--accent-terra))",
        "accent-purple": "hsl(var(--accent-purple))",
        "accent-teal": "hsl(var(--accent-teal))",
        "accent-blue": "hsl(var(--accent-blue))",
        dark: {
          panel: "hsl(var(--dark-panel))",
          "panel-foreground": "hsl(var(--dark-panel-foreground))",
          "panel-muted": "hsl(var(--dark-panel-muted))",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        chip: "var(--radius-chip)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(9px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { fadeUp: "fadeUp 0.4s ease" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

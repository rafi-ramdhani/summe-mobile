/** @type {import('tailwindcss').Config} */
// Mirrors summe-web's design tokens (summe-web/src/global.css) so component
// classes read identically. Token values live in src/global.css (light + .dark).
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "fg-default": "var(--color-fg-default)",
        "fg-default-emphasized": "var(--color-fg-default-emphasized)",
        "fg-strong": "var(--color-fg-strong)",
        "fg-strong-emphasized": "var(--color-fg-strong-emphasized)",
        "fg-muted": "var(--color-fg-muted)",
        "fg-muted-emphasized": "var(--color-fg-muted-emphasized)",
        "fg-inverse": "var(--color-fg-inverse)",
        "fg-inverse-emphasized": "var(--color-fg-inverse-emphasized)",

        "bg-base": "var(--color-bg-base)",
        "bg-base-emphasized": "var(--color-bg-base-emphasized)",
        "bg-subtle": "var(--color-bg-subtle)",
        "bg-subtle-emphasized": "var(--color-bg-subtle-emphasized)",
        "bg-raised": "var(--color-bg-raised)",
        "bg-raised-emphasized": "var(--color-bg-raised-emphasized)",

        border: "var(--color-border-default)",
        "border-subtle": "var(--color-border-subtle)",
        "border-subtle-emphasized": "var(--color-border-subtle-emphasized)",
        "border-default": "var(--color-border-default)",
        "border-default-emphasized": "var(--color-border-default-emphasized)",
        "border-strong": "var(--color-border-strong)",
        "border-strong-emphasized": "var(--color-border-strong-emphasized)",

        "positive-fg": "var(--color-positive-fg)",
        "positive-fg-emphasized": "var(--color-positive-fg-emphasized)",
        "positive-bg": "var(--color-positive-bg)",
        "positive-bg-emphasized": "var(--color-positive-bg-emphasized)",
        "negative-fg": "var(--color-negative-fg)",
        "negative-fg-emphasized": "var(--color-negative-fg-emphasized)",
        "negative-bg": "var(--color-negative-bg)",
        "negative-bg-emphasized": "var(--color-negative-bg-emphasized)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
      },
      fontFamily: {
        grotesk: ["SpaceGrotesk_400Regular"],
        "grotesk-medium": ["SpaceGrotesk_500Medium"],
        "grotesk-bold": ["SpaceGrotesk_700Bold"],
        mono: ["SpaceMono_400Regular"],
        "mono-bold": ["SpaceMono_700Bold"],
      },
    },
  },
  plugins: [],
};

---
trigger:
  glob: "src/**/*.{css,tsx,jsx}"
description: Tailwind v4 design tokens and Arabic typography standards.
---

# Tailwind v4 Design Tokens & Typography Rule

The design system runs on **Tailwind CSS v4** (`@import "tailwindcss";` in `src/index.css`).

### 1. Semantic Surface Tokens
- Avoid ad-hoc background classes like `dark:bg-[#12131A]`, `dark:bg-[#0c0e17]`, or `dark:bg-[#141622]`.
- Connect components to the semantic elevation scale:
  - Base canvas: `bg-[var(--bg-main)] text-[var(--text-main)]`
  - Layer 1 cards: `bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800`
  - Floating overlays: `bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md`

### 2. Arabic Typographic Integrity
- **Font weight cap:** Arabic font weight must never exceed `700` (`font-bold`). Never apply `font-extrabold` or `font-black` to Arabic text, as it smudges letter interior eyelets.
- **Letter spacing:** Never apply tracking/letter-spacing (`tracking-wide`, `tracking-tight`) to Arabic text, which severs cursive ligatures.
- **Line height:** Arabic religious and poetic text (`tashkeel-text`, `quranic-text`) must maintain `line-height: 2.2` or greater to prevent diacritical collision.

### 3. Touch & Gestures
- Never apply `data-no-swipe="true"` to container wrappers or layout roots. Reserve `data-no-swipe` exclusively for sliders, maps, or embedded interactive mini-canvases.
- Maintain minimum touch target size of 44x44px for mobile interactive controls.

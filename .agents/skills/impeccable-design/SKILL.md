---
name: impeccable-design
description: Enforces the Impeccable UI/UX Design System (critique, colorize, animate, delight, clarify, polish) with Habitline tokens, Framer Motion cubic-bezier(0.16, 1, 0.3, 1) physics, and tactile celebratory micro-interactions.
---

# Impeccable Design & Micro-Interaction Skill (PM-03)

## 1. Core Philosophy
Eliminates generic "AI slop" layouts in favor of intentional, high-craft mobile-first interfaces inspired by **Impeccable (`impeccable.style`)** and **Habitline**:
- **Operate Mode (Dashboards & Trackers):** High-contrast Obsidian stages (`#141517`), dopamine-inducing Pastel Bento surfaces (`#d4f5dc` Mint, `#bce8c2` Completed Mint, `#e2defc` Lavender, `#fce2e6` Rose, `#fde6d8` Amber), and electric accents (`#1eb814` Emerald, `#ff5500` Flame, `#5448e8` Indigo).
- **Zero Dead Zones:** Every visual metric, circular ring, calendar day pill, prayer card, and progress bar must be 100% interactive with both a primary tap action and a fast 1-tap completion shortcut where applicable.

## 2. The 6 Impeccable Passes
1. **`/impeccable critique`:** Audit visual hierarchy, cognitive load, scan speed on 390x844 mobile viewports, and information density.
2. **`/impeccable colorize`:** Map every surface to motivating circadian or semantic pastel tokens with WCAG AA contrast.
3. **`/impeccable animate`:**
   - Use exponential deceleration (`cubic-bezier(0.16, 1, 0.3, 1)`) or tuned Framer Motion springs (`stiffness: 400, damping: 30`).
   - Animate only GPU-composited properties (`transform`, `opacity`) and use `layoutId` for sliding active indicators.
   - Respect `@media (prefers-reduced-motion: reduce)`.
4. **`/impeccable delight`:**
   - Trigger localized `canvas-confetti` particle bursts from the exact tap origin (`clientX / innerWidth`, `clientY / innerHeight`) alongside `soundSynth` chimes and `haptic` pulses when completing prayers or daily habits.
5. **`/impeccable clarify`:**
   - Surface a smart, context-aware "Next Best Action" suggestion based on circadian time and uncompleted habits.
6. **`/impeccable polish`:**
   - Verify RTL logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`), Arabic typography (`font-weight <= 700`, `line-height >= 2.2` on vocalized text), and zero DOM nesting or TypeScript errors.

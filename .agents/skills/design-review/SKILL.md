---
name: design-review
description: Evaluates visual design, typography, RTL compliance, micro-interactions, and accessibility against Midmar design tokens.
---

# Design Review Skill (PM-03)

## Purpose
Enforces the Anti-Generic Design philosophy, strict RTL typography integrity, and tactile micro-interactions.

## Review Gates
1. **RTL & Arabic Integrity:**
   - Arabic text rendering checked in both dark and light modes.
   - Tashkeel diacritics do not collide with adjacent text lines (`line-height >= 2.2`).
   - Font weights for Arabic do not exceed 700.
2. **Accessibility (WCAG 2.1 AA):**
   - Minimum 4.5:1 contrast ratio for normal text; 3:1 for large display text.
   - Interactive touch targets at least 44x44 CSS pixels.
   - Screen reader announcements (`aria-live`, `aria-label`, `role="dialog"`).
3. **Motion Physics:**
   - Smooth Framer Motion spring physics with `damping` and `stiffness` tuned to prevent bouncy jarring effects.

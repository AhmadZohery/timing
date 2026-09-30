---
trigger:
  glob: "src/**/*.{tsx,css,html}"
description: Arabic and BiDi first principles, typography constraints, and RTL guidelines.
---

# Arabic & RTL First Principles

## Core Tenet
Arabic is not a translated afterthought; it is a primary cultural and linguistic pillar of Midmar LifeOS.

## BiDi Guidelines
1. **Logical CSS Properties:**
   - Use `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-` rather than physical `left` or `right` wherever directional flow is implied.
   - For icons indicating progression or forward movement (e.g. ChevronRight in LTR), ensure they point Left in RTL (`dir="rtl" .rotate-180` or flip logic).
2. **Arabic Typography Constraints:**
   - Maximum `font-weight: 700` for bold Arabic text; heavier weights cause stroke collision and unreadable glyphs.
   - Letter-spacing MUST remain `normal` (`tracking-normal`); never apply positive or negative tracking to connected Arabic script.
   - Line-height MUST be at least 1.8 for standard Arabic body text and at least 2.2 for Quranic/poetic text with harakat/tashkeel.
3. **Keyboard Shortcut Neutrality:**
   - Always bind shortcuts using `e.code` (e.g. `KeyP`, `KeyB`, `Digit1`) rather than `e.key` so Arabic keyboard layouts trigger identically without forcing layout switching.

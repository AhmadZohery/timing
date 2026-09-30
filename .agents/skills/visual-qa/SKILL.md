---
name: visual-qa
description: Verifies UI rendering across mobile, tablet, and desktop breakpoints, checking for layout shifts and touch gesture stability.
---

# Visual QA Skill

## Purpose
Validates layout fidelity, responsive breakpoints, drawer modals, and touch swiping across target viewports.

## Viewport Standards
- **Mobile (Primary):** 375x812 (iPhone), 390x844 (iPhone 14/15/16), 412x915 (Pixel/Samsung).
- **Tablet:** 768x1024 (iPad Mini), 820x1180 (iPad Air).
- **Desktop:** 1280x800, 1440x900, 1920x1080.

## Gesture & Swipe Verification
- Station carousel swipe: Ensure left/right swipe navigates smoothly between stations on mobile.
- Ensure sub-scrollable content (cards, tables, lists) within stations does not trigger unintended carousel station jumps.
- Verify bottom drawer sheets dismiss smoothly on drag down.

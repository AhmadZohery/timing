---
name: regression
description: Executes regression checks to ensure recent changes have not broken existing stations, audio playback, or IndexedDB storage.
---

# Regression Testing Skill

## Purpose
Systematically verifies that feature enhancements or bug fixes do not break existing functionality or cause silent state corruption.

## Critical Regression Test Paths
1. **Audio Synthesis & Background Audio:**
   - Sound synthesizer generates binaural beats, white noise, and rain soundscapes without audio context stutter or memory leaks.
2. **Spiritual Calculator:**
   - Prayer times accurately calculated given latitude, longitude, and calculation method.
3. **Spaced Repetition Scheduler:**
   - Intervals, ease factor updates, and next review timestamps conform strictly to SM-2/Anki logic.
4. **Data Export & Backup:**
   - JSON export and Dexie import cycle reproduces 100% of records without primary key collisions.

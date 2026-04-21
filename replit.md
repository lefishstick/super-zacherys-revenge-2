# Super Zachery's Revenge 2

A React + Vite 2D side-scrolling action game.

## Stack
- React 18 + Vite 5
- TypeScript
- Tailwind CSS, shadcn/ui
- Canvas-based game loop in `src/game/useGameLoop.ts`

## Run
- Dev server (Replit workflow): `npx vite --host 0.0.0.0 --port 5000`

## Game Structure
- 22 levels across 11 chapters
- 4 playable heroes:
  - **Zachery** (chapters 1-7) — sword combat, melee weapons
  - **Super Levi** (chapters 8) — devour & shockwave
  - **Sgt. CJ** (chapters 9-10) — gun + grenades/flashbang/airstrike
  - **Jubelende Jesse** (joins chapter 11 level 21) — bouncing basketball (J) + piercing football (E)
- Chapter 11 is the final chapter; all heroes reunite. Press Q to swap active hero; the others fight as AI companions.
- Final boss is **The Mother of All Rot** (level 22): 3 phases — The Awakening, The Bloom, Mechanized Wrath. Plant tendrils + mech body.
- Level 18 boss (Rotten Tank) defeat advances to level 19 with the `ending` cutscene as a bridge into chapter 11.
- Victory cutscene = `true_ending` (no "TO BE CONTINUED").

## Key Files
- `src/game/useGameLoop.ts` — main game loop, rendering, hero/companion/boss logic
- `src/game/types.ts` — Player, Boss, Companion, Projectile interfaces
- `src/game/levels.ts` — 22-level definitions
- `src/game/cutscenes.ts` — all cutscene scripts + LEVEL_CUTSCENE_BEFORE map
- `src/components/GameCanvas.tsx` — wires canvas, audio, cutscenes, hero swap events
- `src/components/CutsceneScreen.tsx` — speaker labels & colors
- Public assets: `public/images/jesse.png`, `public/audio/jesse-theme.mp3`, `public/audio/great-worm-boss.mp3`

## Hero Swap Events
- `switch_to_levi`, `switch_to_cj`, `switch_to_jesse`, `switch_to_zachery` — `window` CustomEvents trigger music & UI state.

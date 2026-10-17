# Agents

しばクエスト is a Vite + TypeScript canvas battle. No runtime libraries.

- Every tuning number lives in `src/config.ts`. Fight length, charge cap, HP, and juice timings are read from there.
- Rules live in `src/combat.ts` and are covered by `npm test`. Do not special-case the simulator.
- Charge doubles the next attack (`x2 x4 x8 x16`) and stops at x16. Guard on a telegraphed strike deals 0. The first-run guided attack is forced to 9999.
- The pace policy (kill if this swing finishes, else guard a lethal `!`, else release at x16, else charge) is what the length test plays. Solo minion and boss must land between 60 and 120 seconds at `turnSeconds`, and tutorial plus both fights must stay under 3 minutes.
- First run is silent: no instructions. The command window's ▶ sits on ためる, ためる, then こうげき. The command labels are the buttons.
- The prototype fights one minion, then one boss, then offers one ally. `config.campaign` reserves 3 minions, 4 allies, and a disabled quad-charge combo. Do not build those yet.
- Art is original pixel data in `src/sprites.ts`. Do not add third-party art, ripped sprites, or paid APIs.
- Japanese UI uses bundled PixelMplus12 (`src/fonts/`, M+ FONT LICENSE in `src/fonts/LICENSE.txt`). Do not load a font from a CDN.
- The battle draws on a 192×240 framebuffer and scales onto the phone with integer nearest-neighbor (2× on a 390px-wide portrait). Sprite sizes and juice magnitudes assume that field.
- Audio is Web Audio synthesis. Unlock it on `touchend`.
- Base path is `/shiba-quest/`. `npm run typecheck`, `npm test`, and `npm run build` must pass.
- Pages deploys from GitHub Actions on `main`.

# Spark Escape ⚡

An educational, single-page circuit-building game for **CBSE Class 7 — Electricity and Circuits**.
Help *Sparky* restore power to a dark house, room by room, by building working circuits.
Every level follows a **learn → play → reinforce** loop, and Professor Volt (an owl) explains
*why* a wrong circuit fails — powered by a genuine circuit simulator, not answer-matching.

Built for the **Giochi di Scienza 2026** school science festival (5-minute demo friendly).

## Levels

**Basics**

1. **The Electric Cell** (Kitchen) — cell terminals & current direction (+ → –)
2. **The Electric Bulb** (Living Room) — closed vs open circuits (with a broken-wire trap)
3. **The LED** (Bedroom) — LED polarity + energy efficiency
4. **The Switch** (Study) — control a circuit, with a close-the-switch timing game
5. **Conductors & Insulators** (Garage) — metals conduct, rubber/plastic block
6. **BOSS — The Circuit Diagram** (Main Hall) — build a real circuit from NCERT symbols

**Advanced & Expert** (powered by a real circuit solver)

7. **Voltage & Brightness** (Attic) — stack cells for more voltage; too many burn out the bulb
8. **The Fuse** (Fuse Box) — a fuse blows to protect the circuit from overload
9. **Short Circuit!** (Basement) — find and break the shortcut that bypasses the bulb
10. **Series vs Parallel** (Twin Room) — light two bulbs in parallel; a bare wire shorts the rails
11. **BOSS — The Control Room** (capstone) — cells + fuse + switch + parallel load + LED, all balanced

> Levels 7–11 run on `lib/network.ts`, a genuine DC circuit solver (Modified Nodal
> Analysis with diode iteration and fuse blow-out). Brightness, series/parallel behaviour,
> short circuits, burnout and fuses protecting the circuit all emerge from the physics.

## Tech

- Next.js 14 (App Router) + React + Tailwind CSS
- 100% client-side — no backend, no database, no env vars
- Pointer-event drag & drop (works with **mouse and touch**)
- All art is inline SVG/CSS; all sound is synthesized with the Web Audio API (no asset files)
- `lib/simulator.ts` is a real directed-graph check of current flow, so near-misses fail for
  the correct reason and Professor Volt's explanation always matches the actual mistake

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel

**Option A — CLI:** run `vercel` in this folder and follow the prompts (zero config).

**Option B — GitHub import:** push this repo to GitHub, then on
[vercel.com](https://vercel.com) → *Add New Project* → import the repo → **Deploy**.
No settings or environment variables are needed.

---

Created by Aniket, Class 7 — Giochi di Scienza 2026. Built with AI.

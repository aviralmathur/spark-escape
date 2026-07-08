// A small but genuine DC circuit solver (Modified Nodal Analysis) with
// LED (diode) iteration and fuse blow-out. Behaviour like brightness, series
// vs parallel, short circuits, burnout and fuses protecting the circuit all
// emerge from the physics — nothing is scripted per level.

import { ComponentType, Placed } from "./types";

// ---- physical constants (arbitrary but self-consistent units) --------------
export const CELL_EMF = 1.5; // volts per cell
export const CELL_R = 0.5; // internal resistance of the battery (Ω)
const R_WIRE = 0.02; // wire / closed switch / conductor
const R_BULB = 6;
const R_LED = 6;
const R_LED_OFF = 1e9; // reverse-biased LED ~ open
const R_RESISTOR = 22;
const R_FUSE = 0.02;

// current thresholds (amps)
export const BULB_ON = 0.08; // starts to glow
export const BULB_BRIGHT = 0.3; // counts as "bright"
export const BULB_BURN = 1.15; // filament burns out
export const FUSE_BLOW = 1.0; // fuse melts above this
export const SHORT_I = 1.4; // total draw this high == a short somewhere

// A slot handed to the solver: an edge from node `a` to node `b`.
export interface NetSlot {
  id: string;
  a: string;
  b: string;
  placed: Placed | null;
  fillable: boolean; // an empty fillable slot is an intentional gap
}

export interface NetResult {
  hasCell: boolean;
  solved: boolean;
  sourceCurrent: number; // total current pulled from the batteries (pre-blow)
  short: boolean;
  current: Record<string, number>; // |current| through each slot
  brightness: Record<string, number>; // 0..1 for bulbs / leds
  burntBulbs: string[];
  blownFuses: string[];
  reverseLeds: string[];
  openSwitches: string[];
  insulators: string[];
  broken: string[];
  emptySlots: string[];
  litSlots: string[];
}

const CONDUCT_MATERIALS: ComponentType[] = ["coin", "key", "foil"];
const INSULATE_MATERIALS: ComponentType[] = ["eraser", "scale", "rubberband"];

function brightnessFromCurrent(i: number): number {
  const b = (Math.abs(i) - BULB_ON) / (0.55 - BULB_ON);
  return Math.max(0, Math.min(1, b));
}

// Solve A x = z by Gaussian elimination with partial pivoting.
function solveLinear(A: number[][], z: number[]): number[] | null {
  const n = z.length;
  const M = A.map((row, i) => [...row, z[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-12) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      if (f !== 0) for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = M.map((row, i) => row[n] / row[i]);
  return x.map((v) => (isFinite(v) ? v : 0));
}

interface Resistor {
  a: string;
  b: string;
  g: number;
  slotId?: string;
}
interface Source {
  p: string; // + terminal node
  n: string; // - terminal node
  E: number;
}

// One MNA solve. Returns node voltages + per-source currents, or null.
function mnaSolve(
  resistors: Resistor[],
  sources: Source[],
  nodes: string[],
  ground: string
): { V: Map<string, number>; srcI: number[] } | null {
  const nonGround = nodes.filter((x) => x !== ground);
  const idx = new Map<string, number>();
  nonGround.forEach((id, i) => idx.set(id, i));
  const n = nonGround.length;
  const m = sources.length;
  const size = n + m;
  if (size === 0) return { V: new Map([[ground, 0]]), srcI: [] };
  const A: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const z = new Array(size).fill(0);

  for (const r of resistors) {
    const ia = idx.get(r.a);
    const ib = idx.get(r.b);
    if (ia != null) A[ia][ia] += r.g;
    if (ib != null) A[ib][ib] += r.g;
    if (ia != null && ib != null) {
      A[ia][ib] -= r.g;
      A[ib][ia] -= r.g;
    }
  }
  sources.forEach((s, k) => {
    const ip = idx.get(s.p);
    const inn = idx.get(s.n);
    if (ip != null) {
      A[ip][n + k] += 1;
      A[n + k][ip] += 1;
    }
    if (inn != null) {
      A[inn][n + k] -= 1;
      A[n + k][inn] -= 1;
    }
    z[n + k] = s.E;
  });

  const x = solveLinear(A, z);
  if (!x) return null;
  const V = new Map<string, number>();
  V.set(ground, 0);
  nonGround.forEach((id, i) => V.set(id, x[i]));
  const srcI = sources.map((_, k) => x[n + k]);
  return { V, srcI };
}

/** Main entry point — simulate a network of slots. */
export function simulateNetwork(slots: NetSlot[]): NetResult {
  const result: NetResult = {
    hasCell: false,
    solved: false,
    sourceCurrent: 0,
    short: false,
    current: {},
    brightness: {},
    burntBulbs: [],
    blownFuses: [],
    reverseLeds: [],
    openSwitches: [],
    insulators: [],
    broken: [],
    emptySlots: [],
    litSlots: [],
  };

  const cells = slots.filter((s) => s.placed?.type === "cell");
  if (cells.length === 0) return result;
  result.hasCell = true;

  // Structural notes (for authoring level checks / messages).
  for (const s of slots) {
    const p = s.placed;
    if (!p && s.fillable) result.emptySlots.push(s.id);
    if (!p) continue;
    if (p.type === "switch" && !p.closed) result.openSwitches.push(s.id);
    if (p.type === "brokenwire") result.broken.push(s.id);
    if (INSULATE_MATERIALS.includes(p.type)) result.insulators.push(s.id);
  }

  // Collect nodes. Each cell gets an internal node for its Thévenin model.
  const nodeSet = new Set<string>();
  for (const s of slots) {
    nodeSet.add(s.a);
    nodeSet.add(s.b);
  }
  const cellInternal = new Map<string, string>();
  cells.forEach((c) => {
    const ci = `__cellint_${c.id}`;
    cellInternal.set(c.id, ci);
    nodeSet.add(ci);
  });
  const nodes = [...nodeSet];

  // Ground = the – terminal of the first cell.
  const firstCell = cells[0];
  const firstMinus = firstCell.placed!.flipped ? firstCell.a : firstCell.b;
  const ground = firstMinus;

  // Iterate: LEDs may flip open (reverse) and fuses may blow. Re-solve until
  // the set of "open" components stops changing.
  const ledOpen = new Set<string>();
  const fuseBlown = new Set<string>();
  let last: { V: Map<string, number>; srcI: number[] } | null = null;
  let rawSourceCurrent = 0;

  for (let iter = 0; iter < 8; iter++) {
    const resistors: Resistor[] = [];
    const sources: Source[] = [];

    for (const s of slots) {
      const p = s.placed;
      if (!p) continue;
      const gWire = 1 / R_WIRE;
      switch (p.type) {
        case "cell": {
          const count = p.count ?? 1;
          const plus = p.flipped ? s.b : s.a;
          const minus = p.flipped ? s.a : s.b;
          const ci = cellInternal.get(s.id)!;
          // Thévenin: ideal EMF between ci(+) and minus, series R to plus.
          sources.push({ p: ci, n: minus, E: CELL_EMF * count });
          resistors.push({ a: ci, b: plus, g: 1 / CELL_R });
          break;
        }
        case "wire":
          resistors.push({ a: s.a, b: s.b, g: gWire, slotId: s.id });
          break;
        case "bulb":
          resistors.push({ a: s.a, b: s.b, g: 1 / R_BULB, slotId: s.id });
          break;
        case "resistor":
          resistors.push({ a: s.a, b: s.b, g: 1 / R_RESISTOR, slotId: s.id });
          break;
        case "led":
          resistors.push({
            a: s.a,
            b: s.b,
            g: ledOpen.has(s.id) ? 1 / R_LED_OFF : 1 / R_LED,
            slotId: s.id,
          });
          break;
        case "switch":
          if (p.closed) resistors.push({ a: s.a, b: s.b, g: gWire, slotId: s.id });
          break;
        case "fuse":
          if (!fuseBlown.has(s.id))
            resistors.push({ a: s.a, b: s.b, g: 1 / R_FUSE, slotId: s.id });
          break;
        default:
          if (CONDUCT_MATERIALS.includes(p.type))
            resistors.push({ a: s.a, b: s.b, g: gWire, slotId: s.id });
          // insulators & broken wires add no edge
      }
    }

    const sol = mnaSolve(resistors, sources, nodes, ground);
    last = sol;
    if (!sol) break;

    if (iter === 0)
      rawSourceCurrent = sol.srcI.reduce((a, b) => a + Math.abs(b), 0);

    // Check LED orientation: current must flow anode(a) -> cathode(b) forward.
    let changed = false;
    for (const s of slots) {
      if (s.placed?.type !== "led" || ledOpen.has(s.id)) continue;
      const anode = s.placed.flipped ? s.b : s.a;
      const cathode = s.placed.flipped ? s.a : s.b;
      const i = ((sol.V.get(anode) ?? 0) - (sol.V.get(cathode) ?? 0)) / R_LED;
      if (i < -1e-4) {
        ledOpen.add(s.id);
        changed = true;
      }
    }
    // Check fuses: blow any carrying too much.
    for (const s of slots) {
      if (s.placed?.type !== "fuse" || fuseBlown.has(s.id)) continue;
      const i = Math.abs((sol.V.get(s.a) ?? 0) - (sol.V.get(s.b) ?? 0)) / R_FUSE;
      if (i > FUSE_BLOW) {
        fuseBlown.add(s.id);
        changed = true;
      }
    }
    if (!changed) break;
  }

  if (!last) return result;
  result.solved = true;
  result.sourceCurrent = rawSourceCurrent;
  result.short = rawSourceCurrent > SHORT_I;
  result.reverseLeds = [...ledOpen];
  result.blownFuses = [...fuseBlown];

  // Per-slot currents / brightness.
  for (const s of slots) {
    const p = s.placed;
    if (!p) continue;
    let R = 0;
    if (p.type === "bulb") R = R_BULB;
    else if (p.type === "led") R = ledOpen.has(s.id) ? R_LED_OFF : R_LED;
    else if (p.type === "resistor") R = R_RESISTOR;
    else if (p.type === "wire" || p.type === "switch") R = R_WIRE;
    else if (p.type === "fuse") R = fuseBlown.has(s.id) ? R_LED_OFF : R_FUSE;
    else if (CONDUCT_MATERIALS.includes(p.type)) R = R_WIRE;
    else continue;
    const i = Math.abs((last.V.get(s.a) ?? 0) - (last.V.get(s.b) ?? 0)) / R;
    result.current[s.id] = i;
    if (p.type === "bulb" || p.type === "led") {
      result.brightness[s.id] = brightnessFromCurrent(i);
      if (i > BULB_ON) result.litSlots.push(s.id);
      if (p.type === "bulb" && i > BULB_BURN) result.burntBulbs.push(s.id);
    }
  }
  // A burnt bulb produces no light.
  for (const id of result.burntBulbs) {
    result.brightness[id] = 0;
    result.litSlots = result.litSlots.filter((x) => x !== id);
  }

  return result;
}

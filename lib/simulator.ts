import {
  CONDUCTORS,
  INSULATORS,
  LABELS,
  Placed,
  SimResult,
  Slot,
  ComponentType,
} from "./types";

// What the level wants lit up.
export type Required = "bulb" | "led" | "either";

export interface SimOptions {
  required: Required;
  // Level 1 only: the cell holder is polarity-keyed, so inserting the cell
  // backwards breaks the contact. (Physically true for a diode/LED circuit;
  // for a bulb we model the marked holder of a school kit.)
  cellOrientationMatters?: boolean;
}

// Relaxation flags let us diagnose *why* a circuit failed by asking
// "would it work if we pretended this one thing were fine?".
interface Relax {
  led?: boolean; // treat LEDs as bidirectional
  switch?: boolean; // treat open switches as closed
  insulator?: boolean; // treat insulators as conductors
  broken?: boolean; // treat broken wires as good wires
  empty?: boolean; // treat empty slots as plain wire
}

interface Edge {
  from: string;
  to: string;
  slotId: string;
}

function isConductorMaterial(t: ComponentType) {
  return CONDUCTORS.includes(t);
}
function isInsulatorMaterial(t: ComponentType) {
  return INSULATORS.includes(t);
}

// Build the directed edge list for the *external* circuit (everything except
// the cell) under a given relaxation.
function buildEdges(slots: Slot[], cellSlotId: string, relax: Relax): Edge[] {
  const edges: Edge[] = [];
  const bi = (s: Slot) => {
    edges.push({ from: s.nodeA, to: s.nodeB, slotId: s.id });
    edges.push({ from: s.nodeB, to: s.nodeA, slotId: s.id });
  };

  for (const s of slots) {
    if (s.id === cellSlotId) continue;
    const p = s.placed;

    if (!p) {
      if (relax.empty) bi(s);
      continue;
    }

    switch (p.type) {
      case "wire":
      case "bulb":
        bi(s);
        break;
      case "led": {
        if (relax.led) {
          bi(s);
        } else {
          // Forward conduction is anode -> cathode. Not flipped: A->B.
          if (p.flipped) edges.push({ from: s.nodeB, to: s.nodeA, slotId: s.id });
          else edges.push({ from: s.nodeA, to: s.nodeB, slotId: s.id });
        }
        break;
      }
      case "switch":
        if (p.closed || relax.switch) bi(s);
        break;
      case "brokenwire":
        if (relax.broken) bi(s);
        break;
      default:
        if (isConductorMaterial(p.type)) bi(s);
        else if (isInsulatorMaterial(p.type)) {
          if (relax.insulator) bi(s);
        }
    }
  }
  return edges;
}

// Directed BFS from + terminal to - terminal. Returns the ordered list of
// slot ids on a working path, or null if none exists.
function findPath(
  edges: Edge[],
  start: string,
  goal: string
): string[] | null {
  const adj = new Map<string, Edge[]>();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push(e);
  }
  const prev = new Map<string, Edge>();
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift()!;
    if (node === goal) {
      const path: string[] = [];
      let cur = goal;
      while (prev.has(cur)) {
        const e = prev.get(cur)!;
        path.unshift(e.slotId);
        cur = e.from;
      }
      return path;
    }
    for (const e of adj.get(node) ?? []) {
      if (!seen.has(e.to)) {
        seen.add(e.to);
        prev.set(e.to, e);
        queue.push(e.to);
      }
    }
  }
  return null;
}

function pathWorks(
  slots: Slot[],
  cell: { slotId: string; plus: string; minus: string },
  relax: Relax
): string[] | null {
  const edges = buildEdges(slots, cell.slotId, relax);
  return findPath(edges, cell.plus, cell.minus);
}

/**
 * The real simulator: a genuine directed-graph check of whether conventional
 * current (+ -> -) can complete a loop through the required output component.
 * On failure it diagnoses the single most likely cause so Professor Volt's
 * explanation matches the actual mistake.
 */
export function simulate(slots: Slot[], opts: SimOptions): SimResult {
  const cellSlot = slots.find((s) => s.placed?.type === "cell");
  if (!cellSlot) {
    return {
      works: false,
      code: "no-cell",
      reason:
        "There's no cell in the circuit — every circuit needs an energy source to push the current!",
    };
  }

  // Convention: an un-flipped cell has its + terminal at nodeA, - at nodeB.
  const flipped = !!cellSlot.placed!.flipped;
  const plus = flipped ? cellSlot.nodeB : cellSlot.nodeA;
  const minus = flipped ? cellSlot.nodeA : cellSlot.nodeB;
  const cell = { slotId: cellSlot.id, plus, minus };

  // Level 1: the marked holder only makes contact when the cell faces the
  // right way.
  if (opts.cellOrientationMatters && flipped) {
    return {
      works: false,
      code: "cell-reversed",
      reason:
        "The cell is the wrong way round. Its + (long) terminal must face the marked + contact so current can flow + → –.",
      culprit: cellSlot.id,
    };
  }

  // Base attempt — no relaxation.
  const base = pathWorks(slots, cell, {});
  if (base) {
    // A loop exists. Does it actually pass through the required output?
    const onPath = new Set(base);
    const hasBulb = slots.some(
      (s) => onPath.has(s.id) && s.placed?.type === "bulb"
    );
    const hasLed = slots.some(
      (s) => onPath.has(s.id) && s.placed?.type === "led"
    );
    const need =
      opts.required === "bulb"
        ? hasBulb
        : opts.required === "led"
        ? hasLed
        : hasBulb || hasLed;
    if (!need) {
      return {
        works: false,
        code: "no-bulb",
        reason:
          opts.required === "led"
            ? "The loop is closed, but there's no LED on it to light up!"
            : "The loop is closed, but there's no bulb on it to light up!",
      };
    }
    return { works: true, code: "ok", reason: "Bright and beautiful — the circuit is complete!" };
  }

  // No loop. Diagnose by relaxing one rule at a time.

  // 1) An empty slot means the loop is literally broken.
  const emptySlot = slots.find((s) => !s.placed && !s.fixed);
  const emptyFixedSafe = slots.find((s) => !s.placed);
  if (emptyFixedSafe && pathWorks(slots, cell, { empty: true })) {
    return {
      works: false,
      code: "open",
      reason:
        "Your circuit is open — there's a gap in the loop. Current can only flow around a complete, closed path.",
      culprit: (emptySlot ?? emptyFixedSafe).id,
    };
  }

  // 2) A reversed LED blocks the current.
  if (pathWorks(slots, cell, { led: true })) {
    const ledSlot = slots.find((s) => s.placed?.type === "led");
    return {
      works: false,
      code: "led-reversed",
      reason:
        "Your LED is facing the wrong way. An LED lets current flow in only ONE direction — flip it so its long leg (+) points the way current travels.",
      culprit: ledSlot?.id,
    };
  }

  // 3) An open switch breaks the loop.
  if (pathWorks(slots, cell, { switch: true })) {
    const swSlot = slots.find((s) => s.placed?.type === "switch");
    return {
      works: false,
      code: "switch-open",
      reason:
        "The switch is OPEN, so there's a gap. Close the switch to complete the circuit and let current flow.",
      culprit: swSlot?.id,
    };
  }

  // 4) An insulator is blocking a gap.
  if (pathWorks(slots, cell, { insulator: true })) {
    const insSlot = slots.find(
      (s) => s.placed && isInsulatorMaterial(s.placed.type)
    );
    const name = insSlot ? LABELS[insSlot.placed!.type] : "That material";
    return {
      works: false,
      code: "insulator",
      reason: `${name} is an insulator — it blocks current. You need a metal (a conductor) to bridge the gap.`,
      culprit: insSlot?.id,
    };
  }

  // 5) A broken wire.
  if (pathWorks(slots, cell, { broken: true })) {
    const bw = slots.find((s) => s.placed?.type === "brokenwire");
    return {
      works: false,
      code: "broken",
      reason:
        "One of your wires is broken, so the loop is cut. Swap it for a good wire to close the circuit.",
      culprit: bw?.id,
    };
  }

  // Fallback: something is still open.
  return {
    works: false,
    code: "open",
    reason:
      "Your circuit is open — current needs a complete, unbroken loop from + all the way back to –.",
    culprit: emptyFixedSafe?.id,
  };
}

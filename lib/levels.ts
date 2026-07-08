import { ComponentType, Placed } from "./types";
import { Required } from "./simulator";
import { NetResult } from "./network";

export interface LevelSlotSpec {
  role: "cell" | "bulb" | "led" | "switch" | "gap" | "wire";
  accepts?: ComponentType[];
  // Pre-placed component. locked = cannot be dragged out (but an LED can still
  // be flipped, a switch can still be toggled).
  initial?: Placed;
  locked?: boolean;
  // Placeholder label shown on an empty slot.
  hint?: string;
  // --- network levels only: this slot is an edge from node `from` to `to`,
  // drawn at screen point (x, y) on the NetworkBoard canvas.
  from?: string;
  to?: string;
  x?: number;
  y?: number;
}

// Verdict returned by a network level's custom win-check.
export interface CheckSlot {
  id: string;
  placed: Placed | null;
  spec: LevelSlotSpec;
}
export type NetCheck = (
  net: NetResult,
  slots: CheckSlot[]
) => { works: boolean; reason: string; culprit?: string };

export interface Level {
  id: number;
  room: string;
  emoji: string;
  title: string;
  goal: string;
  required: Required;
  difficulty: "Basics" | "Advanced" | "Expert";
  cellOrientationMatters?: boolean;
  learn: string[];
  card: string;
  proHint: string;
  tray: ComponentType[];
  slots: LevelSlotSpec[];
  // Special extra mechanics.
  timing?: boolean; // Level 4: close-the-switch timing game
  ledChoice?: boolean; // Level 3: LED vs bulb energy question
  diagram?: boolean; // Level 6: boss diagram-matching
  // --- network levels (real circuit solver) ---
  network?: boolean;
  nodes?: Record<string, { x: number; y: number }>;
  maxCells?: number; // cap for the tappable battery stack
  goalText?: string; // shown as the on-board objective
  check?: NetCheck; // custom win/lose logic using the solver result
}

// Helper: find a slot id by role for use inside network checks.
function byRole(slots: CheckSlot[], role: string) {
  return slots.find((s) => s.spec.role === role);
}

export const LEVELS: Level[] = [
  {
    id: 1,
    room: "Kitchen",
    emoji: "🍳",
    difficulty: "Basics",
    title: "The Electric Cell",
    goal: "Drop the cell into the holder the right way to light the bulb.",
    required: "bulb",
    cellOrientationMatters: true,
    learn: [
      "Every circuit needs an energy source. A cell has two ends: a + terminal (the long, bumpy end) and a – terminal (the flat end).",
      "The cell pushes electric current out of its + terminal, through the circuit, and back into its – terminal.",
      "Put the cell in so its + faces the marked + contact. Facing it the wrong way breaks the contact!",
    ],
    card: "A cell has + and – terminals and gives the energy that pushes current around the circuit (+ → –).",
    proHint:
      "Look at the little + mark on the holder. The cell's long bumpy end must line up with it. Use the ⟲ Flip button if it's backwards.",
    tray: ["cell"],
    slots: [
      { role: "cell", accepts: ["cell"], hint: "Cell" },
      { role: "wire", initial: { type: "wire" }, locked: true },
      { role: "bulb", initial: { type: "bulb" }, locked: true },
      { role: "wire", initial: { type: "wire" }, locked: true },
    ],
  },
  {
    id: 2,
    room: "Living Room",
    emoji: "🛋️",
    difficulty: "Basics",
    title: "The Electric Bulb",
    goal: "Fill both gaps with good wires so the loop is complete and the bulb glows.",
    required: "bulb",
    learn: [
      "Current can only flow around a complete, closed loop — that's a closed circuit.",
      "If there's any gap or break, it's an open circuit and NO current flows, so the bulb stays dark.",
      "Careful: one of the wires in your tray is broken. A broken wire is just another gap!",
    ],
    card: "Current flows only in a closed (complete) circuit. Any break makes an open circuit and the bulb goes dark.",
    proHint:
      "You need TWO good wires to close the loop. The broken wire has a snapped line through it — don't use it!",
    tray: ["wire", "wire", "brokenwire"],
    slots: [
      { role: "cell", initial: { type: "cell" }, locked: true },
      { role: "gap", accepts: ["wire", "brokenwire"], hint: "Wire" },
      { role: "bulb", initial: { type: "bulb" }, locked: true },
      { role: "gap", accepts: ["wire", "brokenwire"], hint: "Wire" },
    ],
  },
  {
    id: 3,
    room: "Bedroom",
    emoji: "🛏️",
    difficulty: "Basics",
    title: "The LED",
    goal: "The LED is fitted backwards. Flip it the right way so current can flow.",
    required: "led",
    learn: [
      "An LED is a special light. It lets current flow in only ONE direction — this is called polarity.",
      "Its longer leg is the + side (anode) and must point toward where the current comes from (the cell's +).",
      "If an LED is put in backwards, it blocks the current completely — no glow.",
    ],
    card: "An LED only allows current one way (long leg = +). It also uses much less energy than a bulb.",
    proHint:
      "Tap the LED to flip it. The long leg (+) has to face the current coming from the cell's + terminal.",
    tray: [],
    slots: [
      { role: "cell", initial: { type: "cell" }, locked: true },
      { role: "wire", initial: { type: "wire" }, locked: true },
      { role: "led", initial: { type: "led", flipped: false }, locked: true },
      { role: "wire", initial: { type: "wire" }, locked: true },
    ],
    ledChoice: true,
  },
  {
    id: 4,
    room: "Study Room",
    emoji: "📚",
    difficulty: "Basics",
    title: "The Switch",
    goal: "Add a switch to the circuit, then close it at the right moment to light the bulb.",
    required: "bulb",
    learn: [
      "A switch is a controllable gap in a circuit. Closing it joins the wire so current flows; opening it makes a gap so current stops.",
      "That's how a switch gives you control — one tap turns a light ON or OFF.",
      "First drop the switch into the gap, then close it at just the right moment!",
    ],
    card: "A switch opens or closes a circuit on purpose, giving you control to turn things ON and OFF.",
    proHint:
      "Drag the switch into the empty gap first. Then watch the moving pointer and tap CLOSE when it's in the green zone.",
    tray: ["switch"],
    slots: [
      { role: "cell", initial: { type: "cell" }, locked: true },
      { role: "wire", initial: { type: "wire" }, locked: true },
      { role: "bulb", initial: { type: "bulb" }, locked: true },
      { role: "switch", accepts: ["switch"], hint: "Switch" },
    ],
    timing: true,
  },
  {
    id: 5,
    room: "Garage",
    emoji: "🔧",
    difficulty: "Basics",
    title: "Conductors & Insulators",
    goal: "Bridge BOTH gaps with materials that let current through.",
    required: "bulb",
    learn: [
      "Some materials let current pass through — these are conductors (most metals: coin, key, foil).",
      "Others block current — these are insulators (rubber, plastic, wood: eraser, scale, rubber band).",
      "That's why wires are copper (a conductor) inside a plastic (insulator) coat that keeps you safe!",
    ],
    card: "Metals conduct current; rubber/plastic/wood block it. Wires are copper inside, plastic outside.",
    proHint:
      "Metals conduct! A coin, a key or foil will close a gap. An eraser, plastic scale or rubber band will block it.",
    tray: ["coin", "key", "foil", "eraser", "scale", "rubberband"],
    slots: [
      { role: "cell", initial: { type: "cell" }, locked: true },
      { role: "gap", hint: "Material" },
      { role: "bulb", initial: { type: "bulb" }, locked: true },
      { role: "gap", hint: "Material" },
    ],
  },
  {
    id: 6,
    room: "Main Hall",
    emoji: "🏛️",
    difficulty: "Basics",
    title: "BOSS — The Circuit Diagram",
    goal: "Read the circuit diagram and build the REAL circuit to match it. Then close the switch!",
    required: "bulb",
    learn: [
      "Scientists draw circuits with standard symbols instead of pictures.",
      "Cell = a long line (+) and a short thick line (–). Bulb = a circle with a cross. Switch = a break with a little lever. Wires = straight lines.",
      "Build the real circuit to match the diagram: place the cell, the switch and the bulb, wire them into a loop, and close the switch.",
    ],
    card: "Standard symbols: cell = long/short lines, bulb = circle-with-cross, switch = gap-with-lever, wire = line.",
    proHint:
      "Match every symbol to a real part: cell, switch and bulb into the three empty slots, add the wire, then CLOSE the switch.",
    tray: ["cell", "switch", "bulb", "wire"],
    slots: [
      { role: "cell", accepts: ["cell"], hint: "Cell" },
      { role: "switch", accepts: ["switch"], hint: "Switch" },
      { role: "bulb", accepts: ["bulb"], hint: "Bulb" },
      { role: "gap", accepts: ["wire"], hint: "Wire" },
    ],
    diagram: true,
  },

  // ======================= ADVANCED (real circuit solver) =================
  {
    id: 7,
    room: "Attic",
    emoji: "🔦",
    difficulty: "Advanced",
    title: "Voltage & Brightness",
    goal: "Make the bulb shine bright — but don't overdo it!",
    required: "bulb",
    network: true,
    maxCells: 6,
    goalText: "Tap the battery to stack cells. Get the bulb BRIGHT without burning it out.",
    learn: [
      "More cells stacked together = more voltage = a bigger push on the current, so the bulb glows brighter.",
      "But too much voltage sends too much current through the thin filament — and it burns out! 💥",
      "Tap the battery to add cells. Find the sweet spot: bright, but not too much.",
    ],
    card: "More cells → more voltage → brighter light. Too much current burns out the filament.",
    proHint:
      "One cell is too dim. Keep tapping the battery to add cells until it's really bright — but around 6 cells it will burn out, so stop before that!",
    tray: [],
    nodes: {
      A: { x: 220, y: 360 },
      B: { x: 500, y: 360 },
      C: { x: 500, y: 110 },
      D: { x: 220, y: 110 },
    },
    slots: [
      { role: "cell", from: "A", to: "B", x: 360, y: 360, initial: { type: "cell", count: 1 }, locked: true },
      { role: "wire", from: "B", to: "C", x: 500, y: 235, initial: { type: "wire" }, locked: true },
      { role: "bulb", from: "C", to: "D", x: 360, y: 110, initial: { type: "bulb" }, locked: true },
      { role: "wire", from: "D", to: "A", x: 220, y: 235, initial: { type: "wire" }, locked: true },
    ],
    check: (net, slots) => {
      const bulb = byRole(slots, "bulb")!;
      if (net.burntBulbs.includes(bulb.id))
        return { works: false, reason: "💥 Too much power! You stacked so many cells the bulb burned out. Tap the battery to use fewer cells.", culprit: bulb.id };
      const br = net.brightness[bulb.id] ?? 0;
      if (br >= 0.9) return { works: true, reason: "A brilliant glow — perfect voltage!" };
      return { works: false, reason: "Still too dim. The bulb needs more voltage — tap the battery to add more cells." };
    },
  },
  {
    id: 8,
    room: "Fuse Box",
    emoji: "🧯",
    difficulty: "Advanced",
    title: "The Fuse",
    goal: "Fit the fuse, then power the bulb safely.",
    required: "bulb",
    network: true,
    maxCells: 8,
    goalText: "Place the fuse, then tap the battery to light the bulb — without blowing the fuse.",
    learn: [
      "A fuse is a safety part: a thin wire that melts and breaks the circuit if too much current flows.",
      "That protects everything else — the fuse 'blows' so your bulb (or house wiring) doesn't get damaged.",
      "Fit the fuse into the gap, then add just enough cells for a bright bulb.",
    ],
    card: "A fuse melts and breaks the circuit when current gets dangerously high, protecting the rest.",
    proHint:
      "Drag the fuse into the empty gap first. Then tap the battery for a few cells. Add too many and the fuse will blow to protect the bulb!",
    tray: ["fuse"],
    nodes: {
      A: { x: 200, y: 360 },
      B: { x: 500, y: 360 },
      F: { x: 500, y: 235 },
      C: { x: 500, y: 110 },
      D: { x: 200, y: 110 },
    },
    slots: [
      { role: "cell", from: "A", to: "B", x: 350, y: 360, initial: { type: "cell", count: 1 }, locked: true },
      { role: "gap", from: "B", to: "F", x: 500, y: 300, accepts: ["fuse"], hint: "Fuse" },
      { role: "wire", from: "F", to: "C", x: 500, y: 172, initial: { type: "wire" }, locked: true },
      { role: "bulb", from: "C", to: "D", x: 350, y: 110, initial: { type: "bulb" }, locked: true },
      { role: "wire", from: "D", to: "A", x: 200, y: 235, initial: { type: "wire" }, locked: true },
    ],
    check: (net, slots) => {
      const bulb = byRole(slots, "bulb")!;
      const fuseSlot = slots.find((s) => s.spec.accepts?.includes("fuse"));
      if (fuseSlot && !fuseSlot.placed)
        return { works: false, reason: "Drop the fuse into the empty gap first — it guards the whole circuit.", culprit: fuseSlot.id };
      if (net.blownFuses.length)
        return { works: false, reason: "💥 The fuse blew — and that's it doing its job! Too much current. Tap the battery to use fewer cells so the fuse survives.", culprit: net.blownFuses[0] };
      const br = net.brightness[bulb.id] ?? 0;
      if (br >= 0.8) return { works: true, reason: "Bright AND safe — the fuse is protecting you!" };
      return { works: false, reason: "The bulb is a bit dim. Add a cell or two (tap the battery) — but not so many the fuse blows!" };
    },
  },
  {
    id: 9,
    room: "Basement",
    emoji: "🕳️",
    difficulty: "Advanced",
    title: "Short Circuit!",
    goal: "The bulb is dark. Find out why — and fix it!",
    required: "bulb",
    network: true,
    goalText: "Current is skipping the bulb through a shortcut. Break the shortcut to light the bulb.",
    learn: [
      "Current is lazy — it takes the easiest (lowest-resistance) path it can find.",
      "If a bare wire lets it skip the bulb, almost all the current rushes through that shortcut. This is a SHORT CIRCUIT — the bulb stays dark and the wire gets dangerously hot!",
      "Find the sneaky shortcut and break it, so current is forced through the bulb.",
    ],
    card: "A short circuit is a low-resistance shortcut that bypasses the load — dangerous, and the device won't work.",
    proHint:
      "See the extra path below the bulb with a switch on it? That closed switch is the shortcut. Tap it to OPEN it, and current must go through the bulb.",
    tray: [],
    nodes: {
      A: { x: 200, y: 370 },
      B: { x: 520, y: 370 },
      C: { x: 520, y: 120 },
      D: { x: 200, y: 120 },
      M: { x: 360, y: 250 },
    },
    slots: [
      { role: "cell", from: "A", to: "B", x: 360, y: 370, initial: { type: "cell", count: 2 }, locked: true },
      { role: "wire", from: "B", to: "C", x: 520, y: 245, initial: { type: "wire" }, locked: true },
      { role: "bulb", from: "C", to: "D", x: 360, y: 120, initial: { type: "bulb" }, locked: true },
      { role: "wire", from: "D", to: "A", x: 200, y: 245, initial: { type: "wire" }, locked: true },
      { role: "wire", from: "C", to: "M", x: 450, y: 190, initial: { type: "wire" }, locked: true },
      { role: "switch", from: "M", to: "D", x: 270, y: 190, initial: { type: "switch", closed: true }, locked: true },
    ],
    check: (net, slots) => {
      const bulb = byRole(slots, "bulb")!;
      if (net.short) {
        const sw = byRole(slots, "switch");
        return { works: false, reason: "⚠ Short circuit! Current is racing through the shortcut and skipping the bulb. Tap the switch on the shortcut path to OPEN it.", culprit: sw?.id };
      }
      const br = net.brightness[bulb.id] ?? 0;
      if (br >= 0.4) return { works: true, reason: "Shortcut broken — now every bit of current flows through the bulb!" };
      return { works: false, reason: "The bulb is dark. Make sure current is forced through it." };
    },
  },
  {
    id: 10,
    room: "Twin Room",
    emoji: "🛌",
    difficulty: "Expert",
    title: "Series vs Parallel",
    goal: "Light BOTH bulbs brightly at the same time.",
    required: "bulb",
    network: true,
    goalText: "Wire the two bulbs so BOTH are bright. Hint: a plain wire across the rails is a short!",
    learn: [
      "In a PARALLEL circuit, each device sits on its own branch between the same two wires (rails), so each one gets the full battery voltage.",
      "That's why the bulbs in your house are in parallel — each is bright, and switching one off doesn't affect the others.",
      "Put a bulb in each rung so they run in parallel. (A bare wire across the rails would just short them out!)",
    ],
    card: "In parallel, each device gets the full voltage and works independently — how house wiring is done.",
    proHint:
      "Drop one bulb into each of the two rungs. Two bulbs in parallel each get full voltage, so both glow bright. Don't put a plain wire across — that's a short!",
    tray: ["bulb", "bulb", "wire"],
    nodes: {
      A: { x: 160, y: 380 },
      B: { x: 560, y: 380 },
      LM: { x: 160, y: 245 },
      LT: { x: 160, y: 110 },
      RM: { x: 560, y: 245 },
      RT: { x: 560, y: 110 },
    },
    slots: [
      { role: "cell", from: "A", to: "B", x: 360, y: 380, initial: { type: "cell", count: 2 }, locked: true },
      { role: "wire", from: "A", to: "LM", x: 160, y: 312, initial: { type: "wire" }, locked: true },
      { role: "wire", from: "LM", to: "LT", x: 160, y: 178, initial: { type: "wire" }, locked: true },
      { role: "wire", from: "B", to: "RM", x: 560, y: 312, initial: { type: "wire" }, locked: true },
      { role: "wire", from: "RM", to: "RT", x: 560, y: 178, initial: { type: "wire" }, locked: true },
      { role: "bulb", from: "LT", to: "RT", x: 360, y: 110, accepts: ["bulb", "wire"], hint: "Bulb" },
      { role: "bulb", from: "LM", to: "RM", x: 360, y: 245, accepts: ["bulb", "wire"], hint: "Bulb" },
    ],
    check: (net, slots) => {
      if (net.short)
        return { works: false, reason: "⚠ Short circuit! A bare wire straight across the rails lets current rush past. Put a BULB in each rung, not a wire." };
      const bulbs = slots.filter((s) => s.spec.role === "bulb");
      const placed = bulbs.filter((s) => s.placed?.type === "bulb");
      if (placed.length < 2)
        return { works: false, reason: "Both rooms need their own bulb. Put one bulb in each rung so they run in parallel." };
      const allBright = placed.every((s) => (net.brightness[s.id] ?? 0) >= 0.4);
      if (allBright) return { works: true, reason: "Both bulbs shine bright — that's a parallel circuit! Each gets the full voltage." };
      return { works: false, reason: "The bulbs are dim. In parallel each should be bright — check your wiring." };
    },
  },
  {
    id: 11,
    room: "Control Room",
    emoji: "🎛️",
    difficulty: "Expert",
    title: "BOSS — The Control Room",
    goal: "Bring the whole control room online: switch, fuse, lights and power indicator.",
    required: "bulb",
    network: true,
    maxCells: 5,
    goalText: "Fit the switch & fuse, orient the LED, set the right cells, then close the switch.",
    learn: [
      "This is the real thing: a battery, a safety fuse, a main switch, the room light and a green LED power indicator — the light and the LED sit in parallel.",
      "Everything must work together — enough voltage for a bright light and a glowing indicator, without blowing the fuse, and with the LED facing the right way.",
      "Fit the missing parts, get the cells right, flip the LED if needed, then close the switch. Good luck, engineer!",
    ],
    card: "Real circuits combine a source, safety (fuse), control (switch), parallel loads and an indicator — all balanced together.",
    proHint:
      "Drop the switch and fuse into their gaps. Tap the battery until the light AND indicator glow (about 2 cells) — more will blow the fuse. Tap the LED to flip it if it's dark. Finally, tap the switch to CLOSE it.",
    tray: ["switch", "fuse"],
    nodes: {
      A: { x: 140, y: 380 },
      B: { x: 320, y: 380 },
      C: { x: 500, y: 380 },
      D: { x: 620, y: 380 },
      LT: { x: 140, y: 120 },
      RT: { x: 620, y: 120 },
    },
    slots: [
      { role: "cell", from: "A", to: "B", x: 230, y: 380, initial: { type: "cell", count: 1 }, locked: true },
      { role: "switch", from: "B", to: "C", x: 410, y: 380, accepts: ["switch"], hint: "Switch" },
      { role: "gap", from: "C", to: "D", x: 560, y: 380, accepts: ["fuse"], hint: "Fuse" },
      { role: "wire", from: "A", to: "LT", x: 140, y: 250, initial: { type: "wire" }, locked: true },
      { role: "wire", from: "D", to: "RT", x: 620, y: 250, initial: { type: "wire" }, locked: true },
      { role: "bulb", from: "LT", to: "RT", x: 380, y: 110, initial: { type: "bulb" }, locked: true },
      { role: "led", from: "LT", to: "RT", x: 380, y: 210, initial: { type: "led", flipped: true }, locked: true },
    ],
    check: (net, slots) => {
      const sw = byRole(slots, "switch")!;
      const fuseSlot = slots.find((s) => s.spec.accepts?.includes("fuse"));
      const led = byRole(slots, "led")!;
      const bulbs = slots.filter((s) => s.spec.role === "bulb");
      if (fuseSlot && !fuseSlot.placed)
        return { works: false, reason: "The safety fuse is missing — drag it into its gap.", culprit: fuseSlot.id };
      if (!sw.placed)
        return { works: false, reason: "Add the main switch into its gap.", culprit: sw.id };
      if (net.blownFuses.length)
        return { works: false, reason: "💥 The fuse blew — too much current! Tap the battery to use fewer cells.", culprit: net.blownFuses[0] };
      if (net.short)
        return { works: false, reason: "⚠ Short circuit somewhere — check your wiring." };
      if (sw.placed && !sw.placed.closed)
        return { works: false, reason: "Everything's wired up — now TAP the switch to CLOSE it and power the room!", culprit: sw.id };
      if (net.reverseLeds.includes(led.id))
        return { works: false, reason: "The green power light (LED) is backwards — tap it to flip it the right way.", culprit: led.id };
      const bulbsBright = bulbs.every((s) => (net.brightness[s.id] ?? 0) >= 0.4);
      const ledLit = (net.brightness[led.id] ?? 0) > 0.02;
      if (bulbsBright && ledLit)
        return { works: true, reason: "Control Room ONLINE! Room light bright, indicator glowing, fuse safe. You're a master engineer! ⚡" };
      if (!bulbsBright)
        return { works: false, reason: "The room light is too dim. Give it more power — tap the battery for another cell (but watch the fuse!)." };
      return { works: false, reason: "Almost! The green indicator LED isn't lit — check its direction." };
    },
  },
];

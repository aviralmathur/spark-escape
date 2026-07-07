import { ComponentType, Placed } from "./types";
import { Required } from "./simulator";

export interface LevelSlotSpec {
  role: "cell" | "bulb" | "led" | "switch" | "gap" | "wire";
  accepts?: ComponentType[];
  // Pre-placed component. locked = cannot be dragged out (but an LED can still
  // be flipped, a switch can still be toggled).
  initial?: Placed;
  locked?: boolean;
  // Placeholder label shown on an empty slot.
  hint?: string;
}

export interface Level {
  id: number;
  room: string;
  emoji: string;
  title: string;
  goal: string;
  required: Required;
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
}

export const LEVELS: Level[] = [
  {
    id: 1,
    room: "Kitchen",
    emoji: "🍳",
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
];

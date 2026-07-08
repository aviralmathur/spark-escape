// ---- Component model -------------------------------------------------------

export type ComponentType =
  | "cell"
  | "wire"
  | "brokenwire"
  | "bulb"
  | "led"
  | "switch"
  | "fuse"
  | "resistor"
  // conductors
  | "coin"
  | "key"
  | "foil"
  // insulators
  | "eraser"
  | "scale"
  | "rubberband";

export const CONDUCTORS: ComponentType[] = ["coin", "key", "foil"];
export const INSULATORS: ComponentType[] = ["eraser", "scale", "rubberband"];

export const LABELS: Record<ComponentType, string> = {
  cell: "Cell",
  wire: "Wire",
  brokenwire: "Broken wire",
  bulb: "Bulb",
  led: "LED",
  switch: "Switch",
  fuse: "Fuse",
  resistor: "Resistor",
  coin: "Coin",
  key: "Key",
  foil: "Aluminium foil",
  eraser: "Eraser",
  scale: "Plastic scale",
  rubberband: "Rubber band",
};

// A concrete component sitting in a slot (or being dragged).
export interface Placed {
  type: ComponentType;
  // For directional parts (cell, led): false = matches the slot's A->B forward
  // direction, true = reversed.
  flipped?: boolean;
  // For a switch: is it currently closed (conducting)?
  closed?: boolean;
  // For a cell/battery: how many cells are stacked in series (1..n).
  count?: number;
}

// A slot is one edge of the circuit graph, connecting node A to node B.
// The slot's "forward" direction is nodeA -> nodeB.
export interface Slot {
  id: string;
  nodeA: string;
  nodeB: string;
  // Which component types may be dropped here (undefined = any).
  accepts?: ComponentType[];
  // A fixed, non-removable pre-placed component (e.g. Level 3 reversed LED).
  fixed?: boolean;
  placed: Placed | null;
  // Layout hint used by CircuitBoard (screen coordinates on the SVG board).
  x: number;
  y: number;
  // The wire path segment for animated current flow (SVG path "d").
  wireBefore?: string; // path leading into this slot's nodeA
}

export interface SimResult {
  works: boolean;
  reason: string;
  // A machine code so the UI can react (e.g. which slot to highlight).
  code:
    | "ok"
    | "no-cell"
    | "open"
    | "cell-reversed"
    | "led-reversed"
    | "switch-open"
    | "insulator"
    | "no-bulb"
    | "broken";
  // Slot id most responsible for the failure (for highlighting).
  culprit?: string;
}

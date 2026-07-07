// The circuit board is a 4-slot rectangular loop. These positions are shared
// by the visual board and by the simulator's node wiring so they never drift.

export const BOARD_W = 700;
export const BOARD_H = 420;

interface SlotPos {
  x: number;
  y: number;
  nodeA: string;
  nodeB: string;
}

// Slots are ordered around the loop; slot i connects nodeA -> nodeB and the
// loop closes (slot 3's nodeB == slot 0's nodeA).
export const SLOT_POS: SlotPos[] = [
  { x: 350, y: 330, nodeA: "BL", nodeB: "BR" }, // 0 bottom
  { x: 560, y: 210, nodeA: "BR", nodeB: "TR" }, // 1 right
  { x: 350, y: 90, nodeA: "TR", nodeB: "TL" }, // 2 top
  { x: 140, y: 210, nodeA: "TL", nodeB: "BL" }, // 3 left
];

// The rectangle the wires trace (for drawing + current-flow animation).
export const LOOP_PATH = "M140,90 H560 V330 H140 Z";

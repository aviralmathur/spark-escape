"use client";

import { BOARD_W, BOARD_H, LOOP_PATH, SLOT_POS } from "@/lib/layout";
import { Placed } from "@/lib/types";
import { LevelSlotSpec } from "@/lib/levels";
import ComponentIcon from "./ComponentIcon";

export interface RuntimeSlot {
  id: string;
  index: number;
  spec: LevelSlotSpec;
  placed: Placed | null;
  locked: boolean;
}

interface Props {
  slots: RuntimeSlot[];
  working: boolean;
  culprit?: string;
  onSlotPointerDown: (slotId: string, e: React.PointerEvent) => void;
  onSlotTap: (slotId: string) => void;
}

const DOTS = [0, 1, 2, 3, 4, 5, 6, 7];

export default function CircuitBoard({
  slots,
  working,
  culprit,
  onSlotPointerDown,
  onSlotTap,
}: Props) {
  return (
    <div
      className="relative mx-auto w-full"
      style={{ maxWidth: 620, aspectRatio: `${BOARD_W} / ${BOARD_H}` }}
    >
      <svg
        viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
        className="absolute inset-0 h-full w-full"
      >
        {/* the wire loop */}
        <path
          d={LOOP_PATH}
          fill="none"
          stroke="#334155"
          strokeWidth="14"
          strokeLinejoin="round"
        />
        <path
          d={LOOP_PATH}
          fill="none"
          stroke={working ? "#f59e0b" : "#475569"}
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* animated current: glowing dots racing around the loop */}
        {working &&
          DOTS.map((i) => (
            <circle key={i} r="6" fill="#ffe680">
              <animateMotion
                dur="2.4s"
                repeatCount="indefinite"
                path={LOOP_PATH}
                begin={`${-(i * 2.4) / DOTS.length}s`}
              />
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          ))}
      </svg>

      {/* slots as HTML overlays (easy hit-testing for drag & drop) */}
      {slots.map((s) => {
        const pos = SLOT_POS[s.index];
        const left = `${(pos.x / BOARD_W) * 100}%`;
        const top = `${(pos.y / BOARD_H) * 100}%`;
        const isCulprit = culprit === s.id;
        const empty = !s.placed;
        const lit =
          working &&
          (s.placed?.type === "bulb" || s.placed?.type === "led");
        return (
          <div
            key={s.id}
            data-slot-id={s.id}
            data-accepts={(s.spec.accepts ?? []).join(",")}
            onPointerDown={(e) => onSlotPointerDown(s.id, e)}
            onClick={() => onSlotTap(s.id)}
            className={[
              "absolute flex items-center justify-center rounded-2xl transition",
              "min-h-[64px] min-w-[64px] px-2 py-2",
              empty
                ? "border-2 border-dashed"
                : "bg-white/5 border-2 border-transparent",
              empty && !isCulprit ? "border-slate-500/70" : "",
              isCulprit ? "border-red-400 ring-4 ring-red-400/40" : "",
              s.locked ? "" : "cursor-pointer",
            ].join(" ")}
            style={{
              left,
              top,
              transform: "translate(-50%, -50%)",
              touchAction: "none",
            }}
          >
            {s.placed ? (
              <div className="pointer-events-none flex flex-col items-center">
                <ComponentIcon
                  type={s.placed.type}
                  size={52}
                  flipped={s.placed.flipped}
                  closed={s.placed.closed}
                  lit={lit}
                />
              </div>
            ) : (
              <span className="pointer-events-none select-none text-xs font-semibold text-slate-300">
                {s.spec.hint ?? "drop"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

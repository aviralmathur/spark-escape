"use client";

import { Placed } from "@/lib/types";
import { LevelSlotSpec } from "@/lib/levels";
import ComponentIcon from "./ComponentIcon";

export const NB_W = 720;
export const NB_H = 460;

export interface NetRuntimeSlot {
  id: string;
  spec: LevelSlotSpec;
  from: string;
  to: string;
  x: number;
  y: number;
  placed: Placed | null;
  locked: boolean;
}

interface Props {
  nodes: Record<string, { x: number; y: number }>;
  slots: NetRuntimeSlot[];
  brightness: Record<string, number>;
  current: Record<string, number>;
  blownFuses?: string[];
  warning?: "short" | "blown" | "burnt" | null;
  culprit?: string;
  onSlotPointerDown: (slotId: string, e: React.PointerEvent) => void;
  onSlotTap: (slotId: string) => void;
}

const FLOW = 0.04; // current above this shows moving dots

export default function NetworkBoard({
  nodes,
  slots,
  brightness,
  current,
  blownFuses = [],
  warning,
  culprit,
  onSlotPointerDown,
  onSlotTap,
}: Props) {
  return (
    <div
      className="relative mx-auto w-full"
      style={{ maxWidth: 660, aspectRatio: `${NB_W} / ${NB_H}` }}
    >
      <svg viewBox={`0 0 ${NB_W} ${NB_H}`} className="absolute inset-0 h-full w-full">
        {/* wire segments through each slot */}
        {slots.map((s) => {
          const a = nodes[s.from];
          const b = nodes[s.to];
          if (!a || !b) return null;
          const d = `M ${a.x} ${a.y} L ${s.x} ${s.y} L ${b.x} ${b.y}`;
          const i = current[s.id] ?? 0;
          const flowing = i > FLOW;
          return (
            <g key={"w" + s.id}>
              <path d={d} fill="none" stroke="#334155" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
              <path
                d={d}
                fill="none"
                stroke={flowing ? (warning === "short" ? "#ef4444" : "#f59e0b") : "#475569"}
                strokeWidth="5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {flowing &&
                [0, 1, 2].map((k) => (
                  <circle key={k} r="5" fill={warning === "short" ? "#fecaca" : "#ffe680"}>
                    <animateMotion
                      dur={`${Math.max(0.6, 1.6 - Math.min(i, 1.5))}s`}
                      repeatCount="indefinite"
                      path={d}
                      begin={`${-k * 0.4}s`}
                    />
                  </circle>
                ))}
            </g>
          );
        })}
        {/* node junctions */}
        {Object.entries(nodes).map(([id, p]) => (
          <circle key={id} cx={p.x} cy={p.y} r="6" fill="#64748b" />
        ))}
      </svg>

      {/* slot overlays */}
      {slots.map((s) => {
        const left = `${(s.x / NB_W) * 100}%`;
        const top = `${(s.y / NB_H) * 100}%`;
        const empty = !s.placed;
        const isCulprit = culprit === s.id;
        const p = s.placed;
        const br = p ? brightness[s.id] : undefined;
        return (
          <div
            key={s.id}
            data-slot-id={s.id}
            data-accepts={(s.spec.accepts ?? []).join(",")}
            onPointerDown={(e) => onSlotPointerDown(s.id, e)}
            onClick={() => onSlotTap(s.id)}
            className={[
              "absolute flex items-center justify-center rounded-2xl transition",
              "min-h-[58px] min-w-[58px] px-1 py-1",
              empty ? "border-2 border-dashed" : "bg-white/5 border-2 border-transparent",
              empty && !isCulprit ? "border-slate-500/70" : "",
              isCulprit ? "border-red-400 ring-4 ring-red-400/40" : "",
              s.locked ? "" : "cursor-pointer",
            ].join(" ")}
            style={{ left, top, transform: "translate(-50%, -50%)", touchAction: "none" }}
          >
            {p ? (
              <div className="pointer-events-none flex flex-col items-center">
                <ComponentIcon
                  type={p.type}
                  size={46}
                  flipped={p.flipped}
                  closed={p.closed}
                  count={p.count}
                  blown={p.type === "fuse" && blownFuses.includes(s.id)}
                  bright={p.type === "bulb" || p.type === "led" ? br : undefined}
                />
              </div>
            ) : (
              <span className="pointer-events-none select-none text-[11px] font-semibold text-slate-300">
                {s.spec.hint ?? "drop"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

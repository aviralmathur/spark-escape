"use client";

import { ComponentType, LABELS } from "@/lib/types";
import ComponentIcon from "./ComponentIcon";

export interface TrayItem {
  id: string;
  type: ComponentType;
  used: boolean;
}

interface Props {
  items: TrayItem[];
  onItemPointerDown: (item: TrayItem, e: React.PointerEvent) => void;
}

export default function ComponentTray({ items, onItemPointerDown }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
        Parts tray — drag onto the board
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            disabled={item.used}
            onPointerDown={(e) => {
              if (!item.used) onItemPointerDown(item, e);
            }}
            className={[
              "flex min-h-[64px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-2 transition",
              item.used
                ? "cursor-default border-transparent bg-white/5 opacity-30"
                : "cursor-grab border-white/10 bg-white/10 hover:border-spark/60 active:scale-95",
            ].join(" ")}
            style={{ touchAction: "none" }}
          >
            <ComponentIcon type={item.type} size={44} />
            <span className="text-[10px] font-semibold text-slate-200">
              {LABELS[item.type]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

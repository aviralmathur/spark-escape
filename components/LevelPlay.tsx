"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Level, CheckSlot } from "@/lib/levels";
import { SLOT_POS } from "@/lib/layout";
import { Placed, Slot as SimSlot, SimResult } from "@/lib/types";
import { simulate } from "@/lib/simulator";
import { simulateNetwork, NetResult, NetSlot } from "@/lib/network";
import { playClick, playError, playSuccess } from "@/lib/audio";
import CircuitBoard, { RuntimeSlot } from "./CircuitBoard";
import NetworkBoard, { NetRuntimeSlot } from "./NetworkBoard";
import ComponentTray, { TrayItem } from "./ComponentTray";
import ComponentIcon from "./ComponentIcon";
import ProfessorVolt from "./ProfessorVolt";
import Confetti from "./Confetti";

interface Props {
  level: Level;
  isLast: boolean;
  onComplete: (levelId: number, stars: number) => void;
  onNext: () => void;
  onExitToMap: () => void;
  onOpenNotebook: () => void;
}

type Phase = "learn" | "play" | "choice" | "won";

interface RSlot extends RuntimeSlot {
  trayId?: string;
  from?: string;
  to?: string;
  x?: number;
  y?: number;
}

interface DragState {
  type: Placed["type"];
  trayId: string;
  x: number;
  y: number;
}

function buildSlots(level: Level): RSlot[] {
  return level.slots.map((spec, i) => ({
    id: `s${i}`,
    index: i,
    spec,
    placed: spec.initial ? { ...spec.initial } : null,
    locked: !!spec.locked,
    from: spec.from,
    to: spec.to,
    x: spec.x,
    y: spec.y,
  }));
}
function buildTray(level: Level): TrayItem[] {
  return level.tray.map((t, i) => ({ id: `t${i}`, type: t, used: false }));
}

export default function LevelPlay({
  level,
  isLast,
  onComplete,
  onNext,
  onExitToMap,
  onOpenNotebook,
}: Props) {
  const [phase, setPhase] = useState<Phase>("learn");
  const [slots, setSlots] = useState<RSlot[]>(() => buildSlots(level));
  const [tray, setTray] = useState<TrayItem[]>(() => buildTray(level));
  const [result, setResult] = useState<SimResult | null>(null);
  const [prof, setProf] = useState<{ text: string; mood: "happy" | "think" | "oops" } | null>(null);
  const [wrong, setWrong] = useState(0);
  const [stars, setStars] = useState(3);
  const [choiceMsg, setChoiceMsg] = useState<string | null>(null);

  // drag state
  const dragRef = useRef<DragState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const setDragBoth = (d: DragState | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  // timing minigame (level 4)
  const [marker, setMarker] = useState(0);
  const markerDir = useRef(1);

  // Reset everything when the level changes.
  useEffect(() => {
    setPhase("learn");
    setSlots(buildSlots(level));
    setTray(buildTray(level));
    setResult(null);
    setProf(null);
    setWrong(0);
    setStars(3);
    setChoiceMsg(null);
  }, [level]);

  const resetLevel = () => {
    setSlots(buildSlots(level));
    setTray(buildTray(level));
    setResult(null);
    setProf(null);
    setChoiceMsg(null);
    playClick();
  };

  // ---- simulator glue ------------------------------------------------------
  const toSimSlots = useCallback(
    (rs: RSlot[]): SimSlot[] =>
      rs.map((s) => {
        const pos = SLOT_POS[s.index];
        return {
          id: s.id,
          nodeA: pos.nodeA,
          nodeB: pos.nodeB,
          accepts: s.spec.accepts,
          fixed: s.locked,
          placed: s.placed,
          x: pos.x,
          y: pos.y,
        };
      }),
    []
  );

  // ---- network (real solver) glue -----------------------------------------
  const toNetSlots = useCallback(
    (rs: RSlot[]): NetSlot[] =>
      rs.map((s) => ({
        id: s.id,
        a: s.from ?? "?",
        b: s.to ?? "?",
        placed: s.placed,
        fillable: !!s.spec.accepts && !s.locked,
      })),
    []
  );

  // Live circuit solve for network levels — recomputes on every change so the
  // board shows brightness / shorts / blown fuses in real time.
  const net = useMemo<NetResult | null>(
    () => (level.network ? simulateNetwork(toNetSlots(slots)) : null),
    [level.network, slots, toNetSlots]
  );

  const working =
    phase === "won" ||
    (level.network ? false : result?.works ?? false);

  const finalizeWin = useCallback(
    (finalStars: number) => {
      setStars(finalStars);
      setPhase("won");
      playSuccess();
      onComplete(level.id, finalStars);
    },
    [level.id, onComplete]
  );

  const powerOn = useCallback(() => {
    const res = simulate(toSimSlots(slots), {
      required: level.required,
      cellOrientationMatters: level.cellOrientationMatters,
    });
    setResult(res);
    if (res.works) {
      const s = Math.max(1, 3 - wrong);
      if (level.ledChoice) {
        // Solved the flip puzzle — now the energy question.
        playSuccess();
        setStars(s);
        setProf({
          text: "The LED lights up! One more question before this concept is complete…",
          mood: "happy",
        });
        setPhase("choice");
      } else {
        finalizeWin(s);
      }
    } else {
      playError();
      setWrong((w) => w + 1);
      setProf({ text: res.reason, mood: "oops" });
    }
  }, [slots, level, wrong, toSimSlots, finalizeWin]);

  // Power-on for network levels: evaluate the level's custom win-check.
  const powerOnNetwork = useCallback(() => {
    if (!net || !level.check) return;
    const checkSlots: CheckSlot[] = slots.map((s) => ({
      id: s.id,
      placed: s.placed,
      spec: s.spec,
    }));
    const verdict = level.check(net, checkSlots);
    if (verdict.works) {
      finalizeWin(Math.max(1, 3 - wrong));
    } else {
      playError();
      setWrong((w) => w + 1);
      setResult({ works: false, code: "open", reason: verdict.reason, culprit: verdict.culprit });
      setProf({ text: verdict.reason, mood: "oops" });
    }
  }, [net, level, slots, wrong, finalizeWin]);

  // ---- drag & drop ---------------------------------------------------------
  const startDrag = (item: TrayItem, e: React.PointerEvent) => {
    e.preventDefault();
    playClick();
    setDragBoth({ type: item.type, trayId: item.id, x: e.clientX, y: e.clientY });
  };

  const handleDrop = useCallback(
    (x: number, y: number) => {
      const d = dragRef.current;
      if (!d) return;
      const el = document.elementFromPoint(x, y);
      const slotEl = el?.closest("[data-slot-id]") as HTMLElement | null;
      if (!slotEl) return;
      const slotId = slotEl.dataset.slotId!;
      const accepts = (slotEl.dataset.accepts || "").split(",").filter(Boolean);
      if (accepts.length && !accepts.includes(d.type)) {
        playError();
        setProf({ text: "That part doesn't belong in this spot — try another slot.", mood: "think" });
        return;
      }
      setSlots((prev) => {
        const slot = prev.find((s) => s.id === slotId);
        if (!slot || slot.locked) return prev;
        const freedTrayId = slot.trayId;
        setTray((t) =>
          t.map((ti) => {
            if (ti.id === d.trayId) return { ...ti, used: true };
            if (freedTrayId && ti.id === freedTrayId) return { ...ti, used: false };
            return ti;
          })
        );
        return prev.map((s) =>
          s.id === slotId
            ? { ...s, placed: { type: d.type, flipped: false, closed: false }, trayId: d.trayId }
            : s
        );
      });
      setResult(null);
      setProf(null);
      playClick();
    },
    []
  );

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (cur) setDragBoth({ ...cur, x: e.clientX, y: e.clientY });
    };
    const up = (e: PointerEvent) => {
      handleDrop(e.clientX, e.clientY);
      setDragBoth(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // Re-attach only when a new drag begins (trayId changes) or drag ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag ? drag.trayId : null]);

  // tap a placed component: flip LED, toggle boss switch, or remove a part
  const onSlotTap = (slotId: string) => {
    if (drag) return;
    setSlots((prev) => {
      const slot = prev.find((s) => s.id === slotId);
      if (!slot || !slot.placed) return prev;
      const p = slot.placed;
      // network levels: tapping the battery cycles the number of cells
      if (level.network && p.type === "cell") {
        const max = level.maxCells ?? 6;
        const next = (p.count ?? 1) >= max ? 1 : (p.count ?? 1) + 1;
        playClick();
        setResult(null);
        setProf(null);
        return prev.map((s) =>
          s.id === slotId ? { ...s, placed: { ...p, count: next } } : s
        );
      }
      if (p.type === "led") {
        playClick();
        setResult(null);
        setProf(null);
        return prev.map((s) =>
          s.id === slotId ? { ...s, placed: { ...p, flipped: !p.flipped } } : s
        );
      }
      if (p.type === "switch" && !level.timing) {
        playClick();
        setResult(null);
        return prev.map((s) =>
          s.id === slotId ? { ...s, placed: { ...p, closed: !p.closed } } : s
        );
      }
      if (!slot.locked) {
        // remove and return to tray
        playClick();
        const freed = slot.trayId;
        if (freed) setTray((t) => t.map((ti) => (ti.id === freed ? { ...ti, used: false } : ti)));
        setResult(null);
        return prev.map((s) =>
          s.id === slotId ? { ...s, placed: null, trayId: undefined } : s
        );
      }
      return prev;
    });
  };

  // ---- timing minigame (level 4) ------------------------------------------
  const switchSlot = slots.find((s) => s.spec.role === "switch");
  const switchPlaced = switchSlot?.placed?.type === "switch";
  const switchClosed = !!switchSlot?.placed?.closed;
  const timingActive =
    !!level.timing && switchPlaced && !switchClosed && phase === "play";

  useEffect(() => {
    if (!timingActive) return;
    let raf = 0;
    const tick = () => {
      setMarker((m) => {
        let n = m + markerDir.current * 0.014;
        if (n >= 1) {
          n = 1;
          markerDir.current = -1;
        } else if (n <= 0) {
          n = 0;
          markerDir.current = 1;
        }
        return n;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timingActive]);

  const tryCloseSwitch = () => {
    // green zone is the middle 35%–65% (forgiving for young players)
    if (marker >= 0.35 && marker <= 0.65) {
      playClick();
      setSlots((prev) =>
        prev.map((s) =>
          s.id === switchSlot!.id && s.placed
            ? { ...s, placed: { ...s.placed, closed: true } }
            : s
        )
      );
      // simulate right away
      setTimeout(() => {
        setSlots((cur) => {
          const res = simulate(toSimSlots(cur), {
            required: level.required,
            cellOrientationMatters: level.cellOrientationMatters,
          });
          setResult(res);
          if (res.works) finalizeWin(Math.max(1, 3 - wrong));
          return cur;
        });
      }, 0);
    } else {
      playError();
      setWrong((w) => w + 1);
      setProf({ text: "Just missed the green zone — wait for the pointer and tap again!", mood: "oops" });
    }
  };

  // ---- LED energy choice (level 3) ----------------------------------------
  const chooseEnergy = (pick: "led" | "bulb") => {
    if (pick === "led") {
      playSuccess();
      finalizeWin(stars);
    } else {
      playError();
      setWrong((w) => w + 1);
      setStars((s) => Math.max(1, s - 1));
      setChoiceMsg(
        "Not quite — a bulb gets hot and wastes energy as heat. The LED uses much LESS energy for the same light. Try again!"
      );
    }
  };

  // =========================================================================
  return (
    <div className="mx-auto w-full max-w-3xl p-3 sm:p-4">
      {/* drag ghost */}
      {drag && (
        <div
          className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-1/2 opacity-90"
          style={{ left: drag.x, top: drag.y }}
        >
          <ComponentGhost type={drag.type} />
        </div>
      )}

      {/* header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Level {level.id} · {level.emoji} {level.room}
          </div>
          <h2 className="text-xl font-extrabold text-spark">{level.title}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenNotebook}
            className="min-h-[44px] rounded-xl bg-white/10 px-3 font-bold hover:bg-white/20"
            title="Science Notebook"
          >
            📒
          </button>
          <button
            onClick={onExitToMap}
            className="min-h-[44px] rounded-xl bg-white/10 px-3 font-bold hover:bg-white/20"
          >
            🏠 Map
          </button>
        </div>
      </div>

      {/* LEARN phase */}
      {phase === "learn" && (
        <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="flex items-start gap-3">
            <ProfessorVolt size={92} mood="think" />
            <div className="flex-1">
              <div className="rounded-2xl rounded-tl-none bg-white/10 p-4">
                <div className="mb-1 font-extrabold text-spark">Professor Volt says:</div>
                <ul className="space-y-2 text-sm text-slate-100">
                  {level.learn.map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <LearnIllustration levelId={level.id} />
          <button
            onClick={() => {
              playClick();
              setPhase("play");
            }}
            className="mt-4 min-h-[52px] w-full rounded-2xl bg-spark px-6 text-lg font-black text-slate-900 shadow-lg transition hover:brightness-105 active:scale-[0.98]"
          >
            Got it! Let&apos;s play ⚡
          </button>
        </div>
      )}

      {/* PLAY / CHOICE / WON phases share the board */}
      {phase !== "learn" && (
        <>
          <p className="mb-2 rounded-xl bg-white/5 px-3 py-2 text-center text-sm font-semibold text-slate-200">
            🎯 {level.network ? level.goalText ?? level.goal : level.goal}
          </p>

          {level.diagram && <BossDiagram />}

          {/* live danger banner for network levels */}
          {level.network && net && phase === "play" && (net.short || net.blownFuses.length > 0 || net.burntBulbs.length > 0) && (
            <div className="mx-auto mb-2 max-w-xl rounded-xl bg-red-500/20 px-3 py-2 text-center text-sm font-bold text-red-100 ring-1 ring-red-400/40">
              {net.short && "⚠ SHORT CIRCUIT — huge current, no light!"}
              {!net.short && net.blownFuses.length > 0 && "💥 The fuse has blown (it protected the circuit)."}
              {!net.short && net.blownFuses.length === 0 && net.burntBulbs.length > 0 && "💥 A bulb burned out — too much current!"}
            </div>
          )}

          {level.network && net ? (
            <NetworkBoard
              nodes={level.nodes ?? {}}
              slots={slots as unknown as NetRuntimeSlot[]}
              brightness={net.brightness}
              current={net.current}
              blownFuses={net.blownFuses}
              warning={net.short ? "short" : net.blownFuses.length ? "blown" : net.burntBulbs.length ? "burnt" : null}
              culprit={result && !result.works ? result.culprit : undefined}
              onSlotPointerDown={() => {}}
              onSlotTap={onSlotTap}
            />
          ) : (
            <CircuitBoard
              slots={slots}
              working={working}
              culprit={result && !result.works ? result.culprit : undefined}
              onSlotPointerDown={() => {}}
              onSlotTap={onSlotTap}
            />
          )}

          {/* professor feedback */}
          {prof && phase !== "won" && (
            <div className="mx-auto mb-2 flex max-w-xl items-start gap-2">
              <ProfessorVolt size={64} mood={prof.mood} />
              <div
                className={[
                  "flex-1 rounded-2xl rounded-tl-none p-3 text-sm font-medium",
                  prof.mood === "oops"
                    ? "bg-red-500/15 text-red-100 ring-1 ring-red-400/30"
                    : "bg-white/10 text-slate-100",
                ].join(" ")}
              >
                {prof.text}
              </div>
            </div>
          )}

          {/* timing minigame */}
          {timingActive && (
            <div className="mx-auto mb-3 max-w-xl rounded-2xl bg-white/5 p-3">
              <div className="mb-2 text-center text-sm font-bold text-slate-200">
                Tap CLOSE when the pointer is in the green zone!
              </div>
              <div className="relative mx-auto h-6 w-full overflow-hidden rounded-full bg-slate-700">
                <div className="absolute left-[35%] top-0 h-full w-[30%] bg-green-500/70" />
                <div
                  className="absolute top-0 h-full w-1.5 -translate-x-1/2 bg-white"
                  style={{ left: `${marker * 100}%` }}
                />
              </div>
              <button
                onClick={tryCloseSwitch}
                className="mt-3 min-h-[52px] w-full rounded-2xl bg-green-500 px-6 text-lg font-black text-slate-900 shadow-lg active:scale-95"
              >
                CLOSE THE SWITCH!
              </button>
            </div>
          )}

          <ComponentTray items={tray} onItemPointerDown={startDrag} />

          {/* controls */}
          {phase === "play" && !timingActive && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={level.network ? powerOnNetwork : powerOn}
                className="min-h-[56px] flex-1 rounded-2xl bg-gradient-to-b from-spark to-sparkhot px-6 text-xl font-black text-slate-900 shadow-lg transition hover:brightness-105 active:scale-[0.98]"
              >
                {level.network ? "✓ CHECK CIRCUIT" : "⚡ POWER ON"}
              </button>
              <button
                onClick={() => {
                  playClick();
                  setProf({ text: level.proHint, mood: "think" });
                }}
                className="min-h-[56px] rounded-2xl bg-purple-500/80 px-4 font-bold text-white hover:bg-purple-500"
              >
                🦉 Ask Professor Volt
              </button>
              <button
                onClick={resetLevel}
                className="min-h-[56px] rounded-2xl bg-white/10 px-4 font-bold hover:bg-white/20"
              >
                ↺ Reset
              </button>
            </div>
          )}

          {/* LED energy choice */}
          {phase === "choice" && (
            <div className="mt-3 rounded-2xl bg-white/5 p-4 text-center">
              <div className="mb-3 font-bold text-slate-100">
                Which lights the room using LESS energy?
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => chooseEnergy("bulb")}
                  className="min-h-[64px] rounded-2xl bg-white/10 px-6 font-bold hover:bg-white/20"
                >
                  💡 Bulb
                </button>
                <button
                  onClick={() => chooseEnergy("led")}
                  className="min-h-[64px] rounded-2xl bg-white/10 px-6 font-bold hover:bg-white/20"
                >
                  🟢 LED
                </button>
              </div>
              {choiceMsg && (
                <p className="mt-3 text-sm font-medium text-red-200">{choiceMsg}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* WON — concept card */}
      {phase === "won" && (
        <>
          <Confetti />
          <div className="mt-4 rounded-3xl border-2 border-green-400/50 bg-green-400/10 p-5 text-center">
            <div className="text-3xl">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</div>
            <div className="mt-1 text-lg font-black text-green-300">
              ✔ Concept Learnt!
            </div>
            <p className="mt-1 text-slate-100">{level.card}</p>
            <p className="mt-1 text-sm text-slate-300">
              The {level.room} is lit! 💡
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {!isLast ? (
                <button
                  onClick={() => {
                    playClick();
                    onNext();
                  }}
                  className="min-h-[52px] rounded-2xl bg-spark px-6 font-black text-slate-900 active:scale-95"
                >
                  Next Room →
                </button>
              ) : (
                <button
                  onClick={() => {
                    playClick();
                    onNext();
                  }}
                  className="min-h-[52px] rounded-2xl bg-spark px-6 font-black text-slate-900 active:scale-95"
                >
                  🏆 See Victory!
                </button>
              )}
              <button
                onClick={onOpenNotebook}
                className="min-h-[52px] rounded-2xl bg-white/10 px-5 font-bold hover:bg-white/20"
              >
                📒 Notebook
              </button>
              <button
                onClick={resetLevel}
                className="min-h-[52px] rounded-2xl bg-white/10 px-5 font-bold hover:bg-white/20"
              >
                ↺ Replay
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ComponentGhost({ type }: { type: Placed["type"] }) {
  return (
    <div className="rounded-xl bg-white/20 p-2 shadow-2xl ring-2 ring-spark">
      <ComponentIcon type={type} size={48} />
    </div>
  );
}

// A small animated illustration shown in the LEARN phase, per concept.
function LearnIllustration({ levelId }: { levelId: number }) {
  return (
    <div className="mt-4 flex items-center justify-center rounded-2xl bg-slate-900/50 p-4">
      <svg viewBox="0 0 320 90" className="h-20 w-full max-w-md">
        {/* a mini circuit that always animates as a teaching visual */}
        <path d="M40,70 H280 M40,70 V25 H280 V70" fill="none" stroke="#475569" strokeWidth="5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} r="4" fill="#ffe680">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path="M40,70 H280 V25 H40 Z"
              begin={`${-(i * 3) / 5}s`}
            />
          </circle>
        ))}
        {/* cell */}
        <rect x="150" y="62" width="30" height="16" rx="2" fill="#3b82f6" />
        <text x="154" y="74" fontSize="10" fill="#fff" fontWeight="800">+ –</text>
        {/* bulb */}
        <circle cx="160" cy="25" r="12" fill="#ffe680" className="glow-bulb" />
        <text x="150" y="16" fontSize="9" fill="#cbd5e1">
          {levelId === 3 ? "LED / bulb" : "bulb"}
        </text>
      </svg>
    </div>
  );
}

// The boss level's target circuit diagram, drawn with standard NCERT symbols.
function BossDiagram() {
  return (
    <div className="mx-auto mb-3 max-w-md rounded-2xl bg-slate-900/60 p-3">
      <div className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
        Build THIS circuit ↓
      </div>
      <svg viewBox="0 0 300 150" className="mx-auto h-28 w-full">
        {/* loop */}
        <path d="M50,110 H250 M50,110 V40 H250 V110" fill="none" stroke="#94a3b8" strokeWidth="3" />
        {/* cell symbol (long + / short -) at bottom */}
        <line x1="140" y1="98" x2="140" y2="122" stroke="#e2e8f0" strokeWidth="3" />
        <line x1="150" y1="104" x2="150" y2="116" stroke="#e2e8f0" strokeWidth="6" />
        <text x="128" y="140" fontSize="11" fill="#cbd5e1">cell</text>
        {/* switch symbol on the right (break with lever, open) */}
        <circle cx="250" cy="75" r="3" fill="#e2e8f0" />
        <line x1="250" y1="75" x2="238" y2="62" stroke="#e2e8f0" strokeWidth="3" />
        <circle cx="250" cy="60" r="3" fill="#e2e8f0" />
        <text x="256" y="72" fontSize="11" fill="#cbd5e1">switch</text>
        {/* bulb symbol (circle with cross) on top */}
        <circle cx="150" cy="40" r="12" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <line x1="141" y1="31" x2="159" y2="49" stroke="#e2e8f0" strokeWidth="2.5" />
        <line x1="159" y1="31" x2="141" y2="49" stroke="#e2e8f0" strokeWidth="2.5" />
        <text x="135" y="20" fontSize="11" fill="#cbd5e1">bulb</text>
      </svg>
    </div>
  );
}

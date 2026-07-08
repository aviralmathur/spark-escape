"use client";

import { useEffect, useState } from "react";
import { LEVELS, SANDBOX } from "@/lib/levels";
import { playClick, playVictory, setMuted } from "@/lib/audio";
import LevelPlay from "./LevelPlay";
import LevelMap from "./LevelMap";
import ScienceNotebook from "./ScienceNotebook";
import ProfessorVolt from "./ProfessorVolt";
import Confetti from "./Confetti";

type Screen = "title" | "map" | "play" | "victory" | "sandbox";

const PLAYER = "Aniket Deep Mathur";

export default function GameEngine() {
  const [screen, setScreen] = useState<Screen>("title");
  const [levelIndex, setLevelIndex] = useState(0);
  const [learned, setLearned] = useState<Record<number, boolean>>({});
  const [stars, setStars] = useState<Record<number, number>>({});
  const [notebook, setNotebook] = useState(false);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  const level = LEVELS[levelIndex];

  const handleComplete = (id: number, s: number) => {
    setLearned((l) => ({ ...l, [id]: true }));
    setStars((st) => ({ ...st, [id]: Math.max(st[id] ?? 0, s) }));
  };

  const goNext = () => {
    if (levelIndex >= LEVELS.length - 1) {
      playVictory();
      setScreen("victory");
    } else {
      setLevelIndex((i) => i + 1);
    }
  };

  const pickLevel = (id: number) => {
    playClick();
    setLevelIndex(LEVELS.findIndex((l) => l.id === id));
    setScreen("play");
  };

  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);
  const allDone =
    LEVELS.every((l) => learned[l.id]) && Object.keys(learned).length >= LEVELS.length;

  return (
    <main className="min-h-[100dvh] w-full">
      {/* portrait guard (small screens only) */}
      <div className="fixed inset-0 z-[100] hidden flex-col items-center justify-center gap-3 bg-night p-8 text-center [@media(orientation:portrait)_and_(max-width:899px)]:flex">
        <div className="text-6xl">🔄</div>
        <p className="text-xl font-black text-spark">Please rotate your device</p>
        <p className="max-w-xs text-slate-300">
          Spark Escape plays best in landscape. Turn your tablet or phone
          sideways to build circuits!
        </p>
      </div>

      {/* mute toggle */}
      <button
        onClick={() => {
          setMutedState((m) => !m);
          if (muted) playClick();
        }}
        className="fixed right-3 top-3 z-[80] min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-lg backdrop-blur hover:bg-white/20"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {screen === "title" && (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center">
          <div className="animate-bob">
            <ProfessorVolt size={120} mood="happy" />
          </div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-spark drop-shadow-[0_0_20px_rgba(255,210,63,0.5)] sm:text-6xl">
            SPARK ESCAPE ⚡
          </h1>
          <p className="mt-2 max-w-md text-lg font-semibold text-slate-200">
            Help Sparky bring the lights back!
          </p>
          <p className="mt-1 max-w-md text-sm text-slate-400">
            A power cut hit the house. Build working circuits to light every
            room — and learn real science along the way.
          </p>

          <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
            <button
              onClick={() => {
                playClick();
                setLevelIndex(0);
                setScreen("play");
              }}
              className="min-h-[56px] rounded-2xl bg-gradient-to-b from-spark to-sparkhot text-xl font-black text-slate-900 shadow-lg transition hover:brightness-105 active:scale-95"
            >
              ▶ New Game
            </button>
            <button
              onClick={() => {
                playClick();
                setScreen("map");
              }}
              className="min-h-[52px] rounded-2xl bg-white/10 text-lg font-bold hover:bg-white/20"
            >
              🏠 Level Map
            </button>
            <button
              onClick={() => {
                playClick();
                setNotebook(true);
              }}
              className="min-h-[52px] rounded-2xl bg-white/10 text-lg font-bold hover:bg-white/20"
            >
              📒 Science Notebook
            </button>
            <button
              onClick={() => {
                playClick();
                setScreen("sandbox");
              }}
              className="min-h-[52px] rounded-2xl bg-purple-500/80 text-lg font-bold text-white hover:bg-purple-500"
            >
              🔬 Free Play (Sandbox)
            </button>
          </div>

          <p className="mt-8 text-xs text-slate-500">
            Developed by Aniket Deep Mathur, Class 7 — Giochi di Scienza 2026.
            Built with AI.
          </p>
        </div>
      )}

      {screen === "map" && (
        <div className="flex min-h-[100dvh] flex-col justify-center">
          <LevelMap
            learned={learned}
            stars={stars}
            onPick={pickLevel}
            onBack={() => {
              playClick();
              setScreen("title");
            }}
          />
        </div>
      )}

      {screen === "play" && (
        <LevelPlay
          key={level.id}
          level={level}
          isLast={levelIndex === LEVELS.length - 1}
          onComplete={handleComplete}
          onNext={goNext}
          onExitToMap={() => {
            playClick();
            setScreen("map");
          }}
          onOpenNotebook={() => setNotebook(true)}
        />
      )}

      {screen === "sandbox" && (
        <LevelPlay
          key="sandbox"
          level={SANDBOX}
          isLast={false}
          onComplete={() => {}}
          onNext={() => {}}
          onExitToMap={() => {
            playClick();
            setScreen("title");
          }}
          onOpenNotebook={() => setNotebook(true)}
        />
      )}

      {screen === "victory" && (
        <div className="relative flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center">
          <Confetti count={140} />
          {/* lit house facade */}
          <div className="mb-4 rounded-3xl border-4 border-spark bg-amber-500/20 p-6 shadow-[0_0_80px_rgba(255,210,63,0.6)]">
            <div className="text-6xl">🏠✨</div>
          </div>
          <h1 className="text-4xl font-black text-spark drop-shadow-[0_0_20px_rgba(255,210,63,0.6)] sm:text-5xl">
            THE LIGHTS ARE BACK! ⚡
          </h1>
          <p className="mt-2 max-w-md text-lg font-semibold text-slate-100">
            Sparky lit the whole house! You earned{" "}
            <span className="text-spark">{totalStars} ★</span> and mastered{" "}
            {Object.values(learned).filter(Boolean).length} circuit concepts.
          </p>
          {!allDone && (
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Finish every room to unlock your Certificate of Circuit Mastery in
              the notebook!
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                playClick();
                setNotebook(true);
              }}
              className="min-h-[56px] rounded-2xl bg-spark px-6 text-lg font-black text-slate-900 active:scale-95"
            >
              📒 Open Science Notebook
            </button>
            <button
              onClick={() => {
                playClick();
                setScreen("map");
              }}
              className="min-h-[56px] rounded-2xl bg-white/10 px-6 text-lg font-bold hover:bg-white/20"
            >
              🏠 Level Map
            </button>
            <button
              onClick={() => {
                playClick();
                setScreen("title");
              }}
              className="min-h-[56px] rounded-2xl bg-white/10 px-6 text-lg font-bold hover:bg-white/20"
            >
              🏁 Title
            </button>
          </div>
        </div>
      )}

      {notebook && (
        <ScienceNotebook
          learned={learned}
          stars={stars}
          onClose={() => {
            playClick();
            setNotebook(false);
          }}
          playerName={PLAYER}
        />
      )}
    </main>
  );
}

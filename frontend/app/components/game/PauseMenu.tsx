"use client";

import { useRouter } from "next/navigation";
import { useGame } from "./GameContext";

export default function PauseMenu() {
  const router = useRouter();
  const { isLocked, gameStarted, requestPointerLock } = useGame();

  if (isLocked || !gameStarted) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ background: "#0a1510ee" }}
    >
      <div
        style={{
          width: 320,
          padding: 40,
          background: "#0d1f1add",
          border: "1px solid #1e4a3a",
          borderRadius: 2,
          boxShadow: "0 0 24px #000000aa",
        }}
      >
        <div
          style={{
            height: 3,
            background: "#4eff91",
            margin: "-40px -40px 24px",
            width: "calc(100% + 80px)",
          }}
        />

        <h1
          className="font-heading leading-none"
          style={{ fontSize: 52, color: "#4eff91", letterSpacing: 2 }}
        >
          // PAUSED
        </h1>

        <div
          style={{ height: 1, background: "#1e4a3a", margin: "20px 0" }}
        />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={requestPointerLock}
            className="btn-press font-heading tracking-widest transition-transform hover:scale-[1.01] hover:brightness-110"
            style={{
              width: "100%",
              height: 48,
              background: "#4eff91",
              color: "#0a1510",
              fontSize: 20,
              letterSpacing: 3,
              border: "none",
              borderRadius: 2,
            }}
          >
            RESUME
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn-press font-heading tracking-widest transition-colors hover:bg-[#4eff9111]"
            style={{
              width: "100%",
              height: 48,
              background: "transparent",
              border: "1px solid #4eff91",
              color: "#4eff91",
              fontSize: 20,
              letterSpacing: 3,
              borderRadius: 2,
            }}
          >
            BACK TO LOBBY
          </button>
        </div>

        <p
          className="mt-8 text-center font-mono"
          style={{ fontSize: 10, color: "#1e4a3a" }}
        >
          ESC · RESUME
        </p>
      </div>
    </div>
  );
}

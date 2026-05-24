"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "./GameContext";

export default function TargetDestroyedOverlay() {
  const router = useRouter();
  const { defendBoxDestroyed } = useGame();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (!defendBoxDestroyed) {
      setShowButton(false);
      return;
    }
    const t = setTimeout(() => setShowButton(true), 3000);
    return () => clearTimeout(t);
  }, [defendBoxDestroyed]);

  if (!defendBoxDestroyed) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center"
      style={{ background: "#000000cc" }}
    >
      <h1
        className="font-heading text-center leading-none tracking-widest"
        style={{ fontSize: 80, color: "#e8ff00" }}
      >
        💥 TARGET DESTROYED — ATTACK WINS!
      </h1>
      <p className="font-mono mt-4 text-xl text-text">Round complete</p>
      {showButton && (
        <button
          type="button"
          onClick={() => router.push("/")}
          className="btn-press font-heading mt-10 text-[22px] tracking-widest"
          style={{
            width: 240,
            height: 52,
            background: "var(--accent)",
            color: "#000",
          }}
        >
          BACK TO LOBBY
        </button>
      )}
    </div>
  );
}

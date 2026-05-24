"use client";

import { useGame } from "./GameContext";

export default function ReloadWarning() {
  const { reloadWarning } = useGame();

  if (!reloadWarning) return null;

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-[998] -translate-x-1/2"
      style={{ top: "calc(50% + 48px)" }}
    >
      <p
        className="font-heading text-xl tracking-widest"
        style={{ color: "var(--accent2)" }}
      >
        {reloadWarning}
      </p>
    </div>
  );
}

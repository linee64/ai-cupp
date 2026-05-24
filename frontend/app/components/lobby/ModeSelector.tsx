"use client";

import { useState } from "react";

type Mode = "classic" | "ranked" | "custom";

const MODES = [
  {
    id: "classic" as Mode,
    name: "CLASSIC",
    description: "2 rounds. Teams swap roles. Fastest box destruction wins.",
    badge: "ONLY MODE",
    locked: false,
  },
  {
    id: "ranked" as Mode,
    name: "RANKED",
    description: "Competitive ladder matches with skill-based matchmaking.",
    badge: "COMING SOON",
    locked: true,
  },
  {
    id: "custom" as Mode,
    name: "CUSTOM",
    description: "Create private matches with custom rules and settings.",
    badge: "COMING SOON",
    locked: true,
  },
];

export default function ModeSelector() {
  const [selected] = useState<Mode>("classic");
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleClick = (mode: (typeof MODES)[number]) => {
    if (mode.locked) {
      setTooltip(mode.id);
      setTimeout(() => setTooltip(null), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl tracking-widest text-text">
        SELECT MODE
      </h2>

      <div className="flex flex-col gap-3">
        {MODES.map((mode) => {
          const isSelected = selected === mode.id && !mode.locked;

          return (
            <div
              key={mode.id}
              className="relative"
              onClick={() => handleClick(mode)}
            >
              <div
                className={[
                  "rounded border p-4 transition-all duration-200 btn-press",
                  mode.locked
                    ? "cursor-not-allowed border-border bg-surface/50 opacity-50"
                    : "cursor-default",
                  isSelected
                    ? "border-accent bg-surface glow-accent"
                    : !mode.locked
                      ? "border-border bg-surface"
                      : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-heading text-xl tracking-wide text-text">
                    {mode.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {mode.badge}
                  </span>
                </div>
                <p className="mt-2 font-mono text-xs leading-relaxed text-muted">
                  {mode.description}
                </p>
              </div>

              {tooltip === mode.id && (
                <div className="tooltip font-mono text-muted">
                  Not available yet
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

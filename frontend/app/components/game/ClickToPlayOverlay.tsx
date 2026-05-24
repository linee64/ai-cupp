"use client";

import { useCallback } from "react";
import { resumeAudio } from "../../lib/audio";
import { useGame } from "./GameContext";

const kbdStyle: React.CSSProperties = {
  border: "1px solid #4eff9144",
  borderRadius: 2,
  padding: "2px 5px",
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 10,
  color: "#4eff9188",
  marginRight: 4,
};

export default function ClickToPlayOverlay() {
  const { gameStarted, isLocked, requestPointerLock } = useGame();

  const handleClick = useCallback(() => {
    resumeAudio();
    requestPointerLock();
  }, [requestPointerLock]);

  if (gameStarted || isLocked) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center"
      style={{ background: "#0a1510ee" }}
      onClick={handleClick}
    >
      <p
        className="font-mono uppercase"
        style={{ fontSize: 11, color: "#4eff9166", letterSpacing: 2 }}
      >
        // PAINTSTRIKE
      </p>

      <h1
        className="click-enter-pulse font-heading mt-4 tracking-widest"
        style={{ fontSize: 64, color: "#4eff91" }}
      >
        CLICK TO ENTER
      </h1>

      <p
        className="mt-4 font-mono"
        style={{ fontSize: 13, color: "#c8e6c088" }}
      >
        WASD · SPACE · LMB · R
      </p>

      <div
        className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono"
        style={{ fontSize: 10, color: "#4eff9188" }}
      >
        <span>
          <kbd style={kbdStyle}>W</kbd>
          <kbd style={kbdStyle}>A</kbd>
          <kbd style={kbdStyle}>S</kbd>
          <kbd style={kbdStyle}>D</kbd>
          MOVE
        </span>
        <span>
          <kbd style={kbdStyle}>SPACE</kbd>
          JUMP
        </span>
        <span>
          <kbd style={kbdStyle}>1</kbd>
          <kbd style={kbdStyle}>2</kbd>
          WEAPONS
        </span>
        <span>
          <kbd style={kbdStyle}>R</kbd>
          RELOAD
        </span>
      </div>
    </div>
  );
}

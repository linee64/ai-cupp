"use client";

import { useGame, type CrosshairState } from "./GameContext";

const STATE_COLORS: Record<CrosshairState, string> = {
  idle: "#4eff91",
  shoot: "#ffffff",
  enemyHit: "#ff4400",
  boxHit: "#ffdd00",
};

export default function Crosshair() {
  const { isLocked, crosshairState } = useGame();

  if (!isLocked) return null;

  const color = STATE_COLORS[crosshairState];
  const shadow = "0 0 1px #000";

  const lineStyle: React.CSSProperties = {
    position: "absolute",
    background: color,
    boxShadow: shadow,
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 999,
        pointerEvents: "none",
        width: 0,
        height: 0,
      }}
      aria-hidden
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 2,
          height: 2,
          marginTop: -1,
          marginLeft: -1,
          borderRadius: "50%",
          background: color,
          boxShadow: shadow,
        }}
      />
      <span
        style={{
          ...lineStyle,
          width: 1,
          height: 7,
          left: "50%",
          marginLeft: -0.5,
          bottom: 5,
          transform: "translateX(-50%)",
        }}
      />
      <span
        style={{
          ...lineStyle,
          width: 1,
          height: 7,
          left: "50%",
          marginLeft: -0.5,
          top: 5,
          transform: "translateX(-50%)",
        }}
      />
      <span
        style={{
          ...lineStyle,
          width: 7,
          height: 1,
          top: "50%",
          marginTop: -0.5,
          right: 5,
          transform: "translateY(-50%)",
        }}
      />
      <span
        style={{
          ...lineStyle,
          width: 7,
          height: 1,
          top: "50%",
          marginTop: -0.5,
          left: 5,
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}

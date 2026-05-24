"use client";

import { useGame } from "./GameContext";

export default function OutOfAmmoOverlay() {
  const {
    markerAmmo,
    balloonAmmo,
    activeWeapon,
    isReloadingMarker,
    isReloadingBalloon,
    isLocked,
  } = useGame();

  const activeAmmo = activeWeapon === 1 ? markerAmmo : balloonAmmo;
  const isReloading =
    activeWeapon === 1 ? isReloadingMarker : isReloadingBalloon;

  if (activeAmmo !== 0 || isReloading || !isLocked) return null;

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-20 flex -translate-x-1/2 items-stretch"
      style={{ top: "58%" }}
    >
      <div style={{ width: 3, background: "#ff4400" }} />
      <div
        style={{
          background: "#0d1f1aee",
          border: "1px solid #ff440066",
          borderLeft: "none",
          padding: "12px 20px",
          borderRadius: "0 2px 2px 0",
          boxShadow: "0 0 12px #00000088",
        }}
      >
        <p
          className="font-heading leading-none"
          style={{ fontSize: 22, color: "#ff4400" }}
        >
          ⚠ OUT OF AMMO
        </p>
        <p
          className="font-mono mt-1"
          style={{ fontSize: 11, color: "#c8e6c0" }}
        >
          RETURN TO BASE → PRESS R
        </p>
      </div>
    </div>
  );
}

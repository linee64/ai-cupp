"use client";

import {
  BALLOON_MAX_AMMO,
  BALLOON_RELOAD_DURATION_MS,
  BOX_MAX_HP,
  MARKER_MAX_AMMO,
  RELOAD_DURATION_MS,
  useGame,
} from "./GameContext";
import Minimap from "./Minimap";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const panel: React.CSSProperties = {
  background: "#0d1f1add",
  border: "1px solid #1e4a3a",
  borderRadius: 2,
  boxShadow: "0 0 12px #00000088",
};

function targetBarGradient(ratio: number): string {
  if (ratio > 0.5) return "#4eff91";
  if (ratio > 0.25) return "#ffdd00";
  return "#ff4400";
}

function fpsColor(fps: number): string {
  if (fps > 60) return "#4eff91";
  if (fps >= 30) return "#ffdd00";
  return "#ff4400";
}

type WeaponSlotProps = {
  active: boolean;
  label: string;
  icon: string;
  current: number;
  max: number;
  barWidth: number;
  barHeight: number;
  fillColor: string;
  onSelect: () => void;
};

function WeaponSlot({
  active,
  label,
  icon,
  current,
  max,
  barWidth,
  barHeight,
  fillColor,
  onSelect,
}: WeaponSlotProps) {
  return (
    <button
      type="button"
      className="pointer-events-auto flex w-full items-center gap-3 border-0 text-left"
      style={{
        padding: "8px 10px",
        marginBottom: 4,
        background: active ? "#1a3528" : "transparent",
        borderLeft: active ? "3px solid #4eff91" : "3px solid transparent",
        cursor: "pointer",
      }}
      onClick={onSelect}
    >
      <span style={{ fontSize: 16, opacity: active ? 1 : 0.5 }}>{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span
            className="font-heading tracking-wider"
            style={{
              fontSize: active ? 14 : 12,
              color: active ? "#c8e6c0" : "#4eff9166",
            }}
          >
            {label}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              color: active ? "#c8e6c0" : "#4eff9166",
            }}
          >
            {current} / {max}
          </span>
        </div>
        <div className="mt-1 flex gap-0.5">
          {Array.from({ length: max }, (_, i) => (
            <div
              key={i}
              style={{
                width: barWidth,
                height: barHeight,
                background: i < current ? fillColor : "#1e4a3a",
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}

export default function HUD() {
  const {
    secondsLeft,
    defendBoxHP,
    playerHP,
    markerAmmo,
    balloonAmmo,
    isReloadingMarker,
    isReloadingBalloon,
    reloadProgressMarker,
    reloadProgressBalloon,
    activeWeapon,
    setActiveWeapon,
    fps,
  } = useGame();

  const isReloading =
    activeWeapon === 1 ? isReloadingMarker : isReloadingBalloon;
  const reloadProgress =
    activeWeapon === 1 ? reloadProgressMarker : reloadProgressBalloon;
  const reloadDuration =
    activeWeapon === 1 ? RELOAD_DURATION_MS : BALLOON_RELOAD_DURATION_MS;
  const reloadRemaining = ((1 - reloadProgress) * reloadDuration) / 1000;
  const targetRatio = defendBoxHP / BOX_MAX_HP;
  const lowTime = secondsLeft < 30;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Timer */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center">
        <div
          style={{
            ...panel,
            borderColor: lowTime ? "#ff440044" : "#1e4a3a",
            padding: "10px 32px",
          }}
        >
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 9,
              letterSpacing: 3,
              color: "#4eff9188",
              marginBottom: 4,
            }}
          >
            ROUND TIME
          </p>
          <span
            className="font-mono font-bold"
            style={{
              fontSize: 48,
              color: lowTime ? "#ff4400" : "#ffffff",
              letterSpacing: 2,
            }}
          >
            {formatTime(secondsLeft)}
          </span>
        </div>
      </div>

      <div className="absolute left-4 top-4">
        <Minimap />
      </div>

      <div className="absolute right-4 top-4">
        <div style={{ ...panel, padding: "8px 14px", minWidth: 72 }}>
          <p
            className="font-mono uppercase"
            style={{ fontSize: 8, color: "#4eff9188", letterSpacing: 1 }}
          >
            FPS
          </p>
          <p
            className="font-mono font-bold"
            style={{ fontSize: 16, color: fpsColor(fps) }}
          >
            {fps}
          </p>
        </div>
      </div>

      {isReloading && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
          <div style={{ ...panel, width: 280, padding: "12px 16px" }}>
            <p
              className="font-heading tracking-widest"
              style={{ fontSize: 16, color: "#4eff91" }}
            >
              <span className="reload-pulse-dot">◉</span> RELOADING{" "}
              {activeWeapon === 1 ? "MARKER" : "BALLOON"}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="flex-1 overflow-hidden"
                style={{ height: 4, background: "#1e4a3a", borderRadius: 1 }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${reloadProgress * 100}%`,
                    background: "#4eff91",
                    borderRadius: 1,
                  }}
                />
              </div>
              <span
                className="font-mono"
                style={{ fontSize: 11, color: "#c8e6c0", minWidth: 36 }}
              >
                {reloadRemaining.toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ammo panel */}
      <div className="absolute bottom-4 left-4">
        <div style={{ ...panel, padding: "8px 8px 10px", minWidth: 220 }}>
          <WeaponSlot
            active={activeWeapon === 1}
            label="MARKER"
            icon="🔫"
            current={markerAmmo}
            max={MARKER_MAX_AMMO}
            barWidth={6}
            barHeight={14}
            fillColor="#4eff91"
            onSelect={() => setActiveWeapon(1)}
          />
          <WeaponSlot
            active={activeWeapon === 2}
            label="BALLOON"
            icon="💧"
            current={balloonAmmo}
            max={BALLOON_MAX_AMMO}
            barWidth={10}
            barHeight={14}
            fillColor="#00c2ff"
            onSelect={() => setActiveWeapon(2)}
          />
          <p
            className="mt-2 px-2 font-heading tracking-widest"
            style={{ fontSize: 11, color: "#ff8844" }}
          >
            ⚔ ATTACK
          </p>
        </div>
      </div>

      {/* Objectives */}
      <div className="absolute bottom-4 right-4">
        <div style={{ ...panel, padding: "12px 16px", width: 260 }}>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, color: "#4eff9188" }}
            >
              ■ TARGET BOX
            </span>
            <span className="font-mono" style={{ fontSize: 14, color: "#c8e6c0" }}>
              {defendBoxHP} / {BOX_MAX_HP}
            </span>
          </div>
          <div
            className="mb-4 overflow-hidden"
            style={{ height: 6, background: "#1e4a3a", borderRadius: 1 }}
          >
            <div
              style={{
                height: "100%",
                width: `${targetRatio * 100}%`,
                background: targetBarGradient(targetRatio),
                borderRadius: 1,
                transition: "width 0.3s",
              }}
            />
          </div>

          <div
            style={{ height: 1, background: "#1e4a3a", margin: "12px 0" }}
          />

          <div className="flex items-center justify-between">
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, color: "#4eff9188" }}
            >
              PLAYER HP
            </span>
            <span className="font-mono" style={{ fontSize: 14, color: "#c8e6c0" }}>
              {playerHP} / 100
            </span>
          </div>
          <div
            className="mt-2 overflow-hidden"
            style={{ height: 6, background: "#1e4a3a", borderRadius: 1 }}
          >
            <div
              style={{
                height: "100%",
                width: `${playerHP}%`,
                background: "#4eff91",
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

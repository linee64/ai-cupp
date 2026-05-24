"use client";

import { useEffect, useRef } from "react";
import { MOCK_ENEMY_POSITIONS } from "./gameConstants";
import { MINIMAP_COVERS } from "./arenaVisuals";
import { useGame } from "./GameContext";

const ARENA = 20;
const SIZE = 140;
const PAD = 16;

function toMap(x: number, z: number, cx: number, cy: number, scale: number) {
  return {
    x: cx + x * scale,
    y: cy - z * scale,
  };
}

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playerViewRef, mockEnemies, defendBoxDestroyed } = useGame();
  const pulseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      pulseRef.current += 0.04;
      const pulse = 0.7 + Math.sin(pulseRef.current) * 0.3;

      const scale = (SIZE - PAD * 2) / (ARENA * 2);
      const cx = SIZE / 2;
      const cy = SIZE / 2;

      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.fillStyle = "#0a1510dd";
      ctx.beginPath();
      ctx.arc(cx, cy, SIZE / 2 - 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#1e4a3a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#4eff9122";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, SIZE / 2 - PAD, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#3a4a48";
      ctx.strokeStyle = "#1e4a3a";
      ctx.lineWidth = 1;
      const inner = (SIZE - PAD * 2) * 0.92;
      ctx.fillRect(cx - inner / 2, cy - inner / 2, inner, inner);
      ctx.strokeRect(cx - inner / 2, cy - inner / 2, inner, inner);

      ctx.fillStyle = "#5a6a66";
      for (const c of MINIMAP_COVERS) {
        const p = toMap(c.x, c.z, cx, cy, scale);
        ctx.fillRect(
          p.x - (c.w * scale) / 2,
          p.y - (c.h * scale) / 2,
          c.w * scale,
          c.h * scale,
        );
      }

      if (!defendBoxDestroyed) {
        const target = toMap(0, -14, cx, cy, scale);
        ctx.fillStyle = `rgba(255, 221, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 6 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const enemy of MOCK_ENEMY_POSITIONS) {
        const state = mockEnemies[enemy.id];
        if (state.dead) continue;
        const p = toMap(enemy.position[0], enemy.position[2], cx, cy, scale);
        ctx.fillStyle = "#ff4444";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const pv = playerViewRef.current;
      const pp = toMap(pv.x, pv.z, cx, cy, scale);
      ctx.save();
      ctx.translate(pp.x, pp.y);
      ctx.rotate(-pv.yaw);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4, 5);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const compassR = SIZE / 2 - PAD + 2;
      ctx.fillStyle = "#4eff9166";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("N", cx, cy - compassR);
      ctx.fillText("S", cx, cy + compassR + 8);
      ctx.fillText("E", cx + compassR, cy + 3);
      ctx.fillText("W", cx - compassR, cy + 3);

      ctx.fillStyle = "#4eff91";
      ctx.font = "11px Bebas Neue, sans-serif";
      ctx.fillText("N", cx, PAD + 2);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mockEnemies, playerViewRef, defendBoxDestroyed]);

  return (
    <div
      className="pointer-events-none overflow-hidden"
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: "50%",
        border: "2px solid #1e4a3a",
        background: "#0a1510dd",
        boxShadow: "0 0 12px #00000088",
      }}
    >
      <canvas ref={canvasRef} width={SIZE} height={SIZE} />
    </div>
  );
}

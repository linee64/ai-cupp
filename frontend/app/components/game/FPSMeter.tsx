"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGame } from "./GameContext";

export default function FPSMeter() {
  const { setFps } = useGame();
  const accum = useRef(0);
  const frames = useRef(0);

  useFrame((_, delta) => {
    accum.current += delta;
    frames.current += 1;
    if (accum.current >= 0.5) {
      setFps(Math.round(frames.current / accum.current));
      accum.current = 0;
      frames.current = 0;
    }
  });

  return null;
}

"use client";

import { Canvas } from "@react-three/fiber";
import Map from "./Map";
import { useGame } from "./GameContext";

export default function GameCanvas() {
  const { canvasRef, pos } = useGame();

  return (
    <Canvas
      ref={canvasRef}
      shadows
      camera={{ position: [pos.x, 1, pos.z], fov: 75, near: 0.1, far: 100 }}
      className="h-full w-full"
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        canvasRef.current = gl.domElement;
      }}
    >
      <Map />
    </Canvas>
  );
}

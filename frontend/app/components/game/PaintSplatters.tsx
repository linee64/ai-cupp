"use client";

import * as THREE from "three";
import { useGame } from "./GameContext";

export default function PaintSplatters() {
  const { splatters } = useGame();

  return (
    <group>
      {splatters.map((s) => (
        <mesh
          key={s.id}
          position={s.position}
          quaternion={s.quaternion}
          renderOrder={2}
        >
          <circleGeometry args={[s.radius, 16]} />
          <meshBasicMaterial
            color={s.color}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

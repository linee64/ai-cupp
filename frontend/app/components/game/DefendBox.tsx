"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGame } from "./GameContext";
import { createBombBoxLabelTexture } from "./textures";

const BOX_BASE = "#6a7a7f";
const SANDBAG_COLORS = ["#a08878", "#907868"] as const;
const SANDBAG_COUNT = 8;
const SANDBAG_RADIUS = 2.2;

export default function DefendBox() {
  const { defendBoxHP, defendBoxDestroyed } = useGame();
  const boxRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const shakeRef = useRef<THREE.Group>(null);

  const stateRef = useRef({ defendBoxHP, defendBoxDestroyed });
  stateRef.current = { defendBoxHP, defendBoxDestroyed };
  const labelTexture = useMemo(() => createBombBoxLabelTexture(), []);

  const sandbagSegments = useMemo(() => {
    return Array.from({ length: SANDBAG_COUNT }, (_, i) => {
      const angle = (i / SANDBAG_COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * SANDBAG_RADIUS;
      const z = Math.sin(angle) * SANDBAG_RADIUS;
      return {
        position: [x, 0.25, z] as [number, number, number],
        rotationY: angle + Math.PI / 2,
        color: SANDBAG_COLORS[i % 2],
      };
    });
  }, []);

  useEffect(() => {
    if (!boxRef.current) return;
    const mat = boxRef.current.material as THREE.MeshStandardMaterial;
    if (defendBoxHP < 100) {
      mat.color.set("#4a5256");
      mat.emissive.set("#331100");
      mat.emissiveIntensity = 0.25;
    } else if (defendBoxHP < 200) {
      mat.color.set("#5a5250");
      mat.emissive.set("#221100");
      mat.emissiveIntensity = 0.15;
    } else if (defendBoxHP < 350) {
      mat.color.set("#5a6268");
      mat.emissive.set("#000000");
      mat.emissiveIntensity = 0;
    } else {
      mat.color.set(BOX_BASE);
      mat.emissive.set("#000000");
      mat.emissiveIntensity = 0;
    }
  }, [defendBoxHP]);

  useFrame(({ clock }) => {
    const pulse = 0.5 + (Math.sin(clock.elapsedTime * 1.2) + 1) * 0.35;
    if (ringMatRef.current) {
      ringMatRef.current.emissiveIntensity = pulse;
    }

    const s = stateRef.current;
    if (!shakeRef.current || s.defendBoxDestroyed) return;
    if (s.defendBoxHP < 100) {
      shakeRef.current.position.set(
        (Math.random() - 0.5) * 0.06,
        0,
        (Math.random() - 0.5) * 0.06,
      );
    } else {
      shakeRef.current.position.set(0, 0, 0);
    }
  });

  if (defendBoxDestroyed) return null;

  return (
    <group position={[0, 0, -14]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <torusGeometry args={[2.5, 0.15, 8, 32]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color="#e8ff00"
          emissive="#e8ff00"
          emissiveIntensity={0.8}
          flatShading
        />
      </mesh>

      {sandbagSegments.map((seg, i) => (
        <mesh
          key={i}
          position={seg.position}
          rotation={[0, seg.rotationY, 0]}
          castShadow
          receiveShadow
          userData={{ type: "cover" }}
        >
          <boxGeometry args={[1.0, 0.5, 0.4]} />
          <meshStandardMaterial
            color={seg.color}
            roughness={0.85}
            metalness={0}
          />
        </mesh>
      ))}

      <group ref={shakeRef}>
        <mesh
          ref={boxRef}
          position={[0, 1.35, 0]}
          castShadow
          userData={{ type: "defendBox" }}
        >
          <boxGeometry args={[2.2, 2.2, 2.2]} />
          <meshStandardMaterial
            color={BOX_BASE}
            roughness={0.85}
            metalness={0}
          />
        </mesh>

        <mesh position={[0, 1.35, 1.11]} userData={{ type: "defendBox" }}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshStandardMaterial
            map={labelTexture}
            transparent
            opacity={0.95}
            emissive="#000000"
            emissiveIntensity={0}
          />
        </mesh>
      </group>
    </group>
  );
}

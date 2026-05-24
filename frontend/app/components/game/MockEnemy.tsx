"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { type MockEnemyId, useGame } from "./GameContext";

const ENEMY_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff922b"] as const;
const ENEMY_NAMES = [
  "DEFENDER A",
  "DEFENDER B",
  "DEFENDER C",
  "DEFENDER D",
  "DEFENDER E",
] as const;

function lightenColor(hex: string, amount = 0.15): string {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r + amount);
  c.g = Math.min(1, c.g + amount);
  c.b = Math.min(1, c.b + amount);
  return `#${c.getHexString()}`;
}

function darkenColor(hex: string, amount = 0.12): string {
  const c = new THREE.Color(hex);
  c.r = Math.max(0, c.r - amount);
  c.g = Math.max(0, c.g - amount);
  c.b = Math.max(0, c.b - amount);
  return `#${c.getHexString()}`;
}

type MockEnemyProps = {
  id: MockEnemyId;
  index: number;
  position: readonly [number, number, number];
  rotationY?: number;
};

export default function MockEnemy({
  id,
  index,
  position,
  rotationY = 0,
}: MockEnemyProps) {
  const { mockEnemies } = useGame();
  const state = mockEnemies[id];
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  const bodyColor = ENEMY_COLORS[index] ?? ENEMY_COLORS[0];
  const headColor = lightenColor(bodyColor);
  const legColor = darkenColor(bodyColor);

  const hitFlashRef = useRef(0);
  const squashRef = useRef(0);
  const deathTimerRef = useRef(0);
  const prevHealthRef = useRef(state.health);
  const wasDeadRef = useRef(state.dead);

  useEffect(() => {
    if (state.health < prevHealthRef.current && !state.dead) {
      hitFlashRef.current = 0.4;
      squashRef.current = 0.15;
    }
    if (state.dead && !wasDeadRef.current) {
      deathTimerRef.current = 0;
    }
    prevHealthRef.current = state.health;
    wasDeadRef.current = state.dead;
  }, [state.health, state.dead]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const body = bodyRef.current;
    const bodyMat = bodyMatRef.current;
    if (!group || !body) return;

    if (state.dead) {
      deathTimerRef.current += delta;
      group.rotation.y += 0.3;

      if (deathTimerRef.current < 0.5) {
        const t = deathTimerRef.current / 0.5;
        body.scale.set(1, 1 - t, 1);
      } else {
        body.scale.set(1, 0.05, 1);
      }
      return;
    }

    const time = performance.now() * 0.001;
    const bob = Math.sin(time * 2 + index * 0.5) * 0.04;
    group.position.y = position[1] + bob;

    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = 0.4 - bob * 2;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = -0.4 + bob * 2;
    }

    const legSquish = 0.8 + (Math.sin(time * 2 + index * 0.5) + 1) * 0.025;
    if (leftLegRef.current) leftLegRef.current.scale.y = legSquish;
    if (rightLegRef.current) rightLegRef.current.scale.y = legSquish;

    if (squashRef.current > 0) {
      squashRef.current -= delta;
      const t = 1 - squashRef.current / 0.15;
      const squashX = t < 0.5 ? 1 + t * 0.6 : 1.3 - (t - 0.5) * 0.6;
      body.scale.set(squashX, 1 / squashX, 1);
    } else {
      body.scale.set(1, 1, 1);
    }

    if (bodyMat) {
      if (hitFlashRef.current > 0) {
        hitFlashRef.current -= delta;
        bodyMat.emissive.set("#ff0000");
        bodyMat.emissiveIntensity = 0.8 * (hitFlashRef.current / 0.4);
      } else {
        bodyMat.emissive.set("#000000");
        bodyMat.emissiveIntensity = 0;
      }
    }
  });

  const jellyMat = useMemo(
    () => ({
      roughness: 0.3,
      metalness: 0.1,
    }),
    [],
  );

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh
        ref={bodyRef}
        castShadow
        userData={{ type: "mock", id, dead: state.dead }}
        scale={[1, 1.15, 1]}
      >
        <sphereGeometry args={[0.45, 12, 10]} />
        <meshStandardMaterial
          ref={bodyMatRef}
          color={bodyColor}
          {...jellyMat}
        />
      </mesh>

      <mesh position={[0, 0.65, 0]} castShadow userData={{ type: "mock", id }}>
        <sphereGeometry args={[0.32, 12, 10]} />
        <meshStandardMaterial color={headColor} {...jellyMat} />
      </mesh>

      <mesh position={[-0.13, 0.72, 0.28]} userData={{ type: "mock", id }}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" {...jellyMat} />
      </mesh>
      <mesh position={[-0.13, 0.72, 0.33]} userData={{ type: "mock", id }}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#111111" {...jellyMat} />
      </mesh>
      <mesh position={[0.13, 0.72, 0.28]} userData={{ type: "mock", id }}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" {...jellyMat} />
      </mesh>
      <mesh position={[0.13, 0.72, 0.33]} userData={{ type: "mock", id }}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#111111" {...jellyMat} />
      </mesh>

      <mesh
        ref={leftArmRef}
        position={[-0.5, 0.1, 0]}
        rotation={[0, 0, 0.4]}
        scale={[0.6, 1, 1]}
        userData={{ type: "mock", id }}
      >
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={bodyColor} {...jellyMat} />
      </mesh>
      <mesh
        ref={rightArmRef}
        position={[0.5, 0.1, 0]}
        rotation={[0, 0, -0.4]}
        scale={[0.6, 1, 1]}
        userData={{ type: "mock", id }}
      >
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={bodyColor} {...jellyMat} />
      </mesh>

      <mesh
        ref={leftLegRef}
        position={[-0.2, -0.45, 0]}
        scale={[1, 0.8, 1]}
        userData={{ type: "mock", id }}
      >
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={legColor} {...jellyMat} />
      </mesh>
      <mesh
        ref={rightLegRef}
        position={[0.2, -0.45, 0]}
        scale={[1, 0.8, 1]}
        userData={{ type: "mock", id }}
      >
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={legColor} {...jellyMat} />
      </mesh>

      {state.paintMarks.map((mark) => (
        <mesh
          key={mark.id}
          position={mark.localPosition}
          userData={{ type: "mock", id }}
        >
          <circleGeometry args={[mark.radius, 12]} />
          <meshBasicMaterial
            color="#ff3d00"
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {!state.dead && (
        <Html position={[0, 1.55, 0]} center distanceFactor={12}>
          <div
            style={{
              pointerEvents: "none",
              userSelect: "none",
              textAlign: "center",
              fontFamily: "var(--font-jetbrains), monospace",
              minWidth: 72,
            }}
          >
            <div
              style={{
                fontSize: 7,
                color: "#b0c0c8",
                letterSpacing: "0.1em",
                marginBottom: 3,
              }}
            >
              {ENEMY_NAMES[index]}
            </div>
            <div
              style={{
                width: 44,
                height: 4,
                background: "#cc2222",
                margin: "0 auto",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${state.health}%`,
                  height: "100%",
                  background: "#44cc44",
                  transition: "width 0.2s",
                }}
              />
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

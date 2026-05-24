"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { RemotePlayerState } from "../../lib/usePresence";

const ATTACK_COLOR = "#ff3d00";
const DEFEND_COLOR = "#00c2ff";

export default function RemotePlayer({ player }: { player: RemotePlayerState }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(player.x, 1.0, player.z));
  const targetYaw = useRef(player.yaw);
  const bobRef = useRef(0);

  const bodyColor = player.team === "defend" ? DEFEND_COLOR : ATTACK_COLOR;

  // Smoothly interpolate to received position (lerp)
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    targetPos.current.set(player.x, 1.0, player.z);
    group.position.lerp(targetPos.current, Math.min(1, delta * 18));

    // Lerp yaw
    const dy = ((player.yaw - targetYaw.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    targetYaw.current += dy * Math.min(1, delta * 18);
    group.rotation.y = -targetYaw.current;

    // Bob
    bobRef.current += delta * 2;
    group.position.y = 1.0 + Math.sin(bobRef.current) * 0.04;
  });

  return (
    <group ref={groupRef} position={[player.x, 1.0, player.z]}>
      {/* Body */}
      <mesh castShadow scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.45, 12, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.32, 12, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.13, 0.72, 0.28]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.13, 0.72, 0.33]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.13, 0.72, 0.28]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.13, 0.72, 0.33]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.5, 0.1, 0]} rotation={[0, 0, 0.4]} scale={[0.6, 1, 1]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0.5, 0.1, 0]} rotation={[0, 0, -0.4]} scale={[0.6, 1, 1]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.2, -0.45, 0]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} />
      </mesh>
      <mesh position={[0.2, -0.45, 0]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} />
      </mesh>

      {/* Nameplate */}
      <Html position={[0, 1.55, 0]} center distanceFactor={12}>
        <div
          style={{
            pointerEvents: "none",
            userSelect: "none",
            textAlign: "center",
            fontFamily: "var(--font-jetbrains), monospace",
            minWidth: 80,
          }}
        >
          <div
            style={{
              fontSize: 8,
              color: player.team === "defend" ? "#00c2ff" : "#ff3d00",
              letterSpacing: "0.12em",
              fontWeight: "bold",
              textShadow: "0 1px 3px #000",
              marginBottom: 2,
            }}
          >
            {player.playerName}
          </div>
          <div
            style={{
              fontSize: 6,
              color: "#aabbbb",
              letterSpacing: "0.1em",
            }}
          >
            {player.team === "defend" ? "🛡 DEFEND" : "⚔ ATTACK"}
          </div>
        </div>
      </Html>
    </group>
  );
}

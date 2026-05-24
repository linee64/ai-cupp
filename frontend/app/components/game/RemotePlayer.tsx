"use client";

import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { RemotePlayerState } from "../../lib/usePresence";
import { playMarkerShot, playBalloonThrow } from "../../lib/audio";

const ATTACK_COLOR = "#ff3d00";
const DEFEND_COLOR = "#00c2ff";

export default function RemotePlayer({ player }: { player: RemotePlayerState }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(player.x, player.y ?? 1.0, player.z));
  const targetYaw = useRef(player.yaw);
  const bobRef = useRef(0);

  const playerRef = useRef(player);
  playerRef.current = player;

  const prevShootTick = useRef(player.shootTick || 0);
  const prevThrowTick = useRef(player.throwTick || 0);
  const [muzzleFlash, setMuzzleFlash] = useState(false);

  const bodyColor = player.team === "defend" ? DEFEND_COLOR : ATTACK_COLOR;

  // Track shooting/throwing tick updates to play sounds and muzzle flashes
  useEffect(() => {
    if (player.shootTick !== undefined && player.shootTick > prevShootTick.current) {
      prevShootTick.current = player.shootTick;
      playMarkerShot();
      setMuzzleFlash(true);
      const timer = setTimeout(() => setMuzzleFlash(false), 80);
      return () => clearTimeout(timer);
    }
  }, [player.shootTick]);

  useEffect(() => {
    if (player.throwTick !== undefined && player.throwTick > prevThrowTick.current) {
      prevThrowTick.current = player.throwTick;
      playBalloonThrow();
    }
  }, [player.throwTick]);

  // Smoothly interpolate to received position (lerp)
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const p = playerRef.current;

    // Bob
    bobRef.current += delta * 2;
    const bobOffset = Math.sin(bobRef.current) * 0.04;

    targetPos.current.set(p.x, (p.y ?? 1.0) + bobOffset, p.z);
    group.position.lerp(targetPos.current, Math.min(1, delta * 18));

    // Lerp yaw
    const dy = ((p.yaw - targetYaw.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    targetYaw.current += dy * Math.min(1, delta * 18);
    group.rotation.y = -targetYaw.current;
  });

  return (
    <group ref={groupRef} position={[player.x, player.y ?? 1.0, player.z]}>
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

      {/* Held Weapon */}
      {player.activeWeapon === 2 ? (
        // Balloon
        <group position={[0.45, 0.05, 0.35]}>
          <mesh castShadow>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshPhysicalMaterial
              color="#00aaff"
              transparent
              opacity={0.85}
              roughness={0.1}
              transmission={0.3}
              emissive="#004488"
              emissiveIntensity={0.2}
            />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#0077cc" />
          </mesh>
        </group>
      ) : (
        // Paint Marker Gun
        <group position={[0.45, 0.05, 0.25]} rotation={[0, 0, 0]}>
          {/* Main Gun Body */}
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.1, 0.35]} />
            <meshStandardMaterial color="#222222" roughness={0.7} />
          </mesh>
          {/* Gun Barrel */}
          <mesh position={[0, 0.02, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          {/* Paint Hopper */}
          <mesh position={[0, 0.09, 0.02]} scale={[1, 0.6, 1]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color="#e8ff00" />
          </mesh>

          {/* Muzzle Flash Effect */}
          {muzzleFlash && (
            <mesh position={[0, 0.02, -0.34]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial
                color="#ffff00"
                emissive="#ffff00"
                emissiveIntensity={8}
              />
            </mesh>
          )}
        </group>
      )}

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

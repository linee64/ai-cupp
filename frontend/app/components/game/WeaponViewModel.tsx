"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGame } from "./GameContext";

function MarkerModel() {
  const groupRef = useRef<THREE.Group>(null);
  const hopperRef = useRef<THREE.Mesh>(null);
  const muzzleFlashRef = useRef<THREE.Mesh>(null);
  const basePos = useRef(new THREE.Vector3(0.32, -0.28, 0));
  const baseRot = useRef(new THREE.Euler(0.08, -0.25, 0));
  const recoilZ = useRef(0);
  const recoilX = useRef(0);
  const recoilVelZ = useRef(0);
  const reloadHopperSpin = useRef(0);
  const prevShootTick = useRef(0);

  const {
    weaponShootTick,
    activeWeapon,
    isReloadingMarker,
    isReloadingBalloon,
    reloadProgressMarker,
    reloadProgressBalloon,
    muzzleFlash,
  } = useGame();

  const isReloading =
    activeWeapon === 1 ? isReloadingMarker : isReloadingBalloon;
  const reloadProgress =
    activeWeapon === 1 ? reloadProgressMarker : reloadProgressBalloon;

  useEffect(() => {
    if (weaponShootTick !== prevShootTick.current) {
      prevShootTick.current = weaponShootTick;
      recoilZ.current = 0.07;
      recoilX.current = 0.08;
      recoilVelZ.current = -0.5;
    }
  }, [weaponShootTick]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const hopper = hopperRef.current;
    const flash = muzzleFlashRef.current;
    if (!group) return;

    const t = performance.now() * 0.001;
    const idleY = Math.sin(t * 1.8) * 0.006;

    recoilZ.current += recoilVelZ.current * delta;
    recoilVelZ.current *= 0.85;
    if (recoilZ.current < 0) recoilZ.current = 0;
    recoilX.current = THREE.MathUtils.lerp(recoilX.current, 0, delta * 12);

    let reloadX = 0;
    if (isReloading) {
      reloadHopperSpin.current += delta * Math.PI * 2;
      if (hopper) hopper.rotation.y = reloadHopperSpin.current;

      const p = reloadProgress;
      if (p < 0.0375) {
        reloadX = THREE.MathUtils.lerp(0, -0.5, p / 0.0375);
      } else if (p > 0.9625) {
        reloadX = THREE.MathUtils.lerp(-0.5, 0, (p - 0.9625) / 0.0375);
      } else {
        reloadX = -0.5;
      }
    } else if (hopper) {
      hopper.rotation.y = THREE.MathUtils.lerp(hopper.rotation.y, 0, delta * 4);
    }

    group.position.set(
      basePos.current.x,
      basePos.current.y + idleY,
      basePos.current.z + recoilZ.current,
    );
    group.rotation.set(
      baseRot.current.x + recoilX.current + reloadX,
      baseRot.current.y,
      baseRot.current.z,
    );

    if (flash) {
      flash.visible = muzzleFlash;
      if (muzzleFlash) {
        const mat = flash.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 8;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.09, 0.11, 0.45]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.025, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.28, 12]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <mesh position={[0, -0.17, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.22, 12]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      <mesh position={[0, -0.28, 0.08]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <mesh
        ref={hopperRef}
        position={[0, 0.11, 0.04]}
        scale={[1, 0.65, 1]}
      >
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color="#e8ff00" />
      </mesh>

      <mesh position={[0, -0.09, 0.13]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.055, 0.13, 0.075]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <mesh ref={muzzleFlashRef} position={[0, 0.025, -0.46]} visible={false}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={8}
        />
      </mesh>
    </group>
  );
}

function BalloonModel() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const throwProgress = useRef(0);
  const prevThrowTick = useRef(0);
  const basePos = useRef(new THREE.Vector3(0.25, -0.22, 0));
  const baseRot = useRef(new THREE.Euler(0.05, -0.15, 0));

  const { weaponThrowTick } = useGame();

  useEffect(() => {
    if (weaponThrowTick !== prevThrowTick.current) {
      prevThrowTick.current = weaponThrowTick;
      throwProgress.current = 0;
    }
  }, [weaponThrowTick]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const body = bodyRef.current;
    if (!group || !body) return;

    const t = performance.now() * 0.001;
    const idleY = Math.sin(t * 1.2) * 0.012;
    const wobbleZ = Math.sin(t * 0.8) * 0.03;

    if (throwProgress.current < 0.2) {
      throwProgress.current = Math.min(0.2, throwProgress.current + delta);
    }
    const tp = throwProgress.current;
    const throwT = tp < 0.2 ? tp / 0.2 : 1;
    const throwActive = tp > 0 && tp < 0.2;
    const throwZ = throwActive ? -0.15 * Math.sin(throwT * Math.PI) : 0;
    const throwY = throwActive ? 0.08 * Math.sin(throwT * Math.PI) : 0;

    if (throwActive && throwT < 0.5) {
      body.scale.set(0.9 * 1.3, 1.1 * 0.7, 0.9);
    } else {
      body.scale.set(0.9, 1.1, 0.9);
    }

    group.position.set(
      basePos.current.x,
      basePos.current.y + idleY + throwY,
      basePos.current.z + throwZ,
    );
    group.rotation.set(
      baseRot.current.x,
      baseRot.current.y,
      baseRot.current.z + wobbleZ,
    );
  });

  return (
    <group ref={groupRef}>
      <mesh ref={bodyRef} scale={[0.9, 1.1, 0.9]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshPhysicalMaterial
          color="#00aaff"
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0}
          transmission={0.3}
          emissive="#004488"
          emissiveIntensity={0.2}
        />
      </mesh>

      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#0077cc" />
      </mesh>

      <mesh position={[0, 0.17, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
        <meshStandardMaterial color="#0077cc" />
      </mesh>

      <mesh position={[-0.06, 0.1, 0.05]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

function WeaponScene() {
  const { activeWeapon } = useGame();

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[-1, 2, 1]} intensity={1.4} />
      <pointLight position={[0.4, 0.4, 0.5]} color="#ffbb44" intensity={0.9} />
      {activeWeapon === 1 ? <MarkerModel /> : <BalloonModel />}
    </>
  );
}

export default function WeaponViewModel() {
  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 z-50"
      style={{ width: 280, height: 200 }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 55, position: [0, 0, 1.8], near: 0.1, far: 10 }}
        style={{ background: "transparent" }}
      >
        <WeaponScene />
      </Canvas>
    </div>
  );
}

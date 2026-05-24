"use client";

import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import {
  playBalloonThrow,
  playHitSound,
  playMarkerShot,
} from "../../lib/audio";
import { COLLIDERS, resolveCollisions } from "./colliders";
import { BALLOON_BLUE, MOCK_ENEMY_POSITIONS } from "./gameConstants";
import { type MockEnemyId, useGame } from "./GameContext";

const BASE_MOVE_SPEED = 0.065;
const GROUND_Y = 1.0;
const JUMP_VELOCITY = 0.18;
const GRAVITY = 0.008;
const BALLOON_MAX = 3;
const BALLOON_HIT_RADIUS = 0.35;
const ENEMY_HIT_RADIUS = 0.55;

type BalloonProjectile = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  spawnPos: THREE.Vector3;
};

type DyingBalloon = {
  id: number;
  pos: THREE.Vector3;
  age: number;
};

function pointInBox(
  px: number,
  py: number,
  pz: number,
  cx: number,
  cy: number,
  cz: number,
  hx: number,
  hy: number,
  hz: number,
): boolean {
  return (
    Math.abs(px - cx) <= hx &&
    Math.abs(py - cy) <= hy &&
    Math.abs(pz - cz) <= hz
  );
}

export default function FPSPlayer() {
  const { camera, scene } = useThree();
  const keysPressed = useRef(new Set<string>());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const muzzleRef = useRef<THREE.Mesh>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const playerPosVec = useRef(new THREE.Vector3());
  const velocity = useRef({ y: 0 });
  const isGrounded = useRef(true);
  const playerY = useRef(GROUND_Y);
  const balloonProjectiles = useRef<BalloonProjectile[]>([]);
  const dyingBalloons = useRef<DyingBalloon[]>([]);
  const balloonIdRef = useRef(0);
  const balloonMeshRefs = useRef<(THREE.Mesh | null)[]>([
    null,
    null,
    null,
  ]);
  const dyingMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const shakeTimeLeft = useRef(0);
  const shakeTotalDuration = useRef(0);
  const shakeIntensity = useRef(0);
  const shakeRight = useRef(new THREE.Vector3());
  const shakeUp = useRef(new THREE.Vector3());

  const {
    pos,
    setPos,
    isLocked,
    canShoot,
    registerMarkerShot,
    registerBalloonShot,
    damageMock,
    damageDefendBox,
    addSplatter,
    startReload,
    muzzleFlash,
    flashCrosshair,
    activeWeapon,
    setActiveWeapon,
    mockEnemies,
    triggerWeaponThrow,
    defendBoxDestroyed,
    playerViewRef,
    speedMultiplier,
    roomCode,
    playerName,
    team,
    weaponShootTick,
    weaponThrowTick,
    setRemotePlayers,
  } = useGame();



  useEffect(() => {
    camera.position.set(pos.x, playerY.current, pos.z);
  }, [camera, pos.x, pos.z]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      if (e.code === "Space" && isGrounded.current) {
        velocity.current.y = JUMP_VELOCITY;
        isGrounded.current = false;
      }
      if (e.code === "KeyR") startReload();
      if (e.code === "Digit1") setActiveWeapon(1);
      if (e.code === "Digit2") setActiveWeapon(2);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setActiveWeapon, startReload]);

  const triggerShake = useCallback((intensity: number, duration: number) => {
    shakeIntensity.current = intensity;
    shakeTimeLeft.current = duration;
    shakeTotalDuration.current = duration;
  }, []);

  const applyMarkerShake = useCallback(() => {
    triggerShake(0.012, 0.1);
  }, [triggerShake]);

  const applyBalloonShake = useCallback(() => {
    triggerShake(0.018, 0.14);
  }, [triggerShake]);

  const shootMarker = useCallback(() => {
    if (!canShoot()) return;
    registerMarkerShot();
    playMarkerShot();
    applyMarkerShake();

    playerPosVec.current.set(pos.x, playerY.current, pos.z);

    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hits = raycaster.current.intersectObjects(scene.children, true);

    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      let userData: Record<string, unknown> | undefined;

      while (obj) {
        if (obj.userData?.type) {
          userData = obj.userData as Record<string, unknown>;
          break;
        }
        obj = obj.parent;
      }

      if (!userData) continue;

      const normal =
        hit.face?.normal
          .clone()
          .transformDirection(hit.object.matrixWorld)
          .normalize() ?? new THREE.Vector3(0, 1, 0);

      if (userData.type === "mock" && !userData.dead) {
        damageMock(
          userData.id as MockEnemyId,
          hit.point.clone(),
          playerPosVec.current,
        );
        playHitSound();
        flashCrosshair("enemyHit", 200);
        return;
      }

      const splatterPos = hit.point
        .clone()
        .add(normal.clone().multiplyScalar(0.02));
      addSplatter(splatterPos, normal);

      if (userData.type === "defendBox" && !defendBoxDestroyed) {
        damageDefendBox(10);
        playHitSound();
        flashCrosshair("boxHit", 150);
      }
      break;
    }
  }, [
    addSplatter,
    applyMarkerShake,
    camera,
    canShoot,
    damageDefendBox,
    damageMock,
    defendBoxDestroyed,
    flashCrosshair,
    pos.x,
    pos.z,
    registerMarkerShot,
    scene.children,
  ]);

  const throwBalloon = useCallback(() => {
    if (!canShoot() || balloonProjectiles.current.length >= BALLOON_MAX) return;
    registerBalloonShot();
    triggerWeaponThrow();
    playBalloonThrow();
    applyBalloonShake();
    flashCrosshair("shoot", 80);

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const spawn = camera.position.clone().add(dir.clone().multiplyScalar(0.5));

    balloonProjectiles.current.push({
      id: balloonIdRef.current++,
      pos: spawn.clone(),
      vel: dir.multiplyScalar(0.4),
      spawnPos: spawn.clone(),
    });
  }, [
    applyBalloonShake,
    camera,
    canShoot,
    flashCrosshair,
    registerBalloonShot,
    triggerWeaponThrow,
  ]);

  const resolveBalloonHit = useCallback(
    (proj: BalloonProjectile): boolean => {
      const p = proj.pos;

      for (const enemy of MOCK_ENEMY_POSITIONS) {
        const state = mockEnemies[enemy.id];
        if (state.dead) continue;
        const ex = enemy.position[0];
        const ey = 0.65;
        const ez = enemy.position[2];
        const dist = Math.hypot(p.x - ex, p.y - ey, p.z - ez);
        if (dist < ENEMY_HIT_RADIUS) {
          playerPosVec.current.set(pos.x, playerY.current, pos.z);
          damageMock(enemy.id, p.clone(), playerPosVec.current, 35);
          playHitSound();
          addSplatter(
            p.clone(),
            new THREE.Vector3(0, 1, 0),
            BALLOON_BLUE,
            0.4,
          );
          flashCrosshair("enemyHit", 200);
          return true;
        }
      }

      if (
        !defendBoxDestroyed &&
        pointInBox(p.x, p.y, p.z, 0, 1, -14, 1.15, 1.15, 1.15)
      ) {
        damageDefendBox(25);
        playHitSound();
        addSplatter(p.clone(), new THREE.Vector3(0, 1, 0), BALLOON_BLUE, 0.4);
        flashCrosshair("boxHit", 150);
        return true;
      }

      if (p.y <= 0.05) {
        addSplatter(
          new THREE.Vector3(p.x, 0.02, p.z),
          new THREE.Vector3(0, 1, 0),
          BALLOON_BLUE,
          0.3,
        );
        return true;
      }

      if (p.y < -1 || p.distanceTo(proj.spawnPos) > 20) {
        return true;
      }

      for (const box of COLLIDERS) {
        const closestX = Math.max(box.minX, Math.min(p.x, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(p.z, box.maxZ));
        const dx = p.x - closestX;
        const dz = p.z - closestZ;
        if (dx * dx + dz * dz < BALLOON_HIT_RADIUS * BALLOON_HIT_RADIUS) {
          addSplatter(
            new THREE.Vector3(p.x, Math.max(0.02, p.y), p.z),
            new THREE.Vector3(0, 1, 0),
            BALLOON_BLUE,
            0.3,
          );
          return true;
        }
      }

      return false;
    },
    [
      addSplatter,
      damageDefendBox,
      damageMock,
      defendBoxDestroyed,
      flashCrosshair,
      mockEnemies,
      pos.x,
      pos.z,
    ],
  );

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || !isLocked) return;
      if (activeWeapon === 1) shootMarker();
      else throwBalloon();
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [activeWeapon, isLocked, shootMarker, throwBalloon]);

  useFrame((_, delta) => {
    velocity.current.y -= GRAVITY;
    playerY.current += velocity.current.y;
    if (playerY.current <= GROUND_Y) {
      playerY.current = GROUND_Y;
      velocity.current.y = 0;
      isGrounded.current = true;
    }
    isGrounded.current = playerY.current <= GROUND_Y + 0.01;

    camera.getWorldDirection(forward.current);
    playerViewRef.current = {
      x: pos.x,
      y: playerY.current,
      z: pos.z,
      yaw: Math.atan2(forward.current.x, forward.current.z),
    };

    if (!isLocked) return;

    const moveSpeed = BASE_MOVE_SPEED * speedMultiplier;

    const keys = keysPressed.current;
    forward.current.y = 0;
    forward.current.normalize();
    right.current
      .crossVectors(forward.current, new THREE.Vector3(0, 1, 0))
      .normalize();

    let nx = pos.x;
    let nz = pos.z;

    if (keys.has("KeyW")) {
      nx += forward.current.x * moveSpeed;
      nz += forward.current.z * moveSpeed;
    }
    if (keys.has("KeyS")) {
      nx -= forward.current.x * moveSpeed;
      nz -= forward.current.z * moveSpeed;
    }
    if (keys.has("KeyA")) {
      nx -= right.current.x * moveSpeed;
      nz -= right.current.z * moveSpeed;
    }
    if (keys.has("KeyD")) {
      nx += right.current.x * moveSpeed;
      nz += right.current.z * moveSpeed;
    }

    const resolved = resolveCollisions(nx, nz);
    nx = resolved.x;
    nz = resolved.z;

    if (nx !== pos.x || nz !== pos.z) {
      setPos({ x: nx, z: nz });
    }

    camera.position.set(nx, playerY.current, nz);
    if (isLocked && shakeTimeLeft.current > 0) {
      shakeTimeLeft.current = Math.max(0, shakeTimeLeft.current - delta);
      const fade =
        shakeTimeLeft.current / Math.max(shakeTotalDuration.current, 0.001);
      const amount = shakeIntensity.current * fade;
      const phase = performance.now() * 0.001;
      const side = Math.sin(phase * 52) * amount;
      const lift = Math.cos(phase * 44) * amount * 0.35;

      shakeRight.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
      shakeUp.current.set(0, 1, 0).applyQuaternion(camera.quaternion);
      camera.position.addScaledVector(shakeRight.current, side);
      camera.position.addScaledVector(shakeUp.current, lift);
    }

    const nextProjectiles: BalloonProjectile[] = [];
    for (const proj of balloonProjectiles.current) {
      proj.vel.y -= 0.01;
      proj.pos.add(proj.vel);
      if (resolveBalloonHit(proj)) {
        dyingBalloons.current.push({
          id: proj.id,
          pos: proj.pos.clone(),
          age: 0,
        });
      } else {
        nextProjectiles.push(proj);
      }
    }
    balloonProjectiles.current = nextProjectiles;

    const nextDying: DyingBalloon[] = [];
    for (const d of dyingBalloons.current) {
      d.age += delta;
      if (d.age < 0.2) nextDying.push(d);
    }
    dyingBalloons.current = nextDying;

    balloonMeshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const proj = balloonProjectiles.current[i];
      if (proj) {
        mesh.visible = true;
        mesh.position.copy(proj.pos);
        mesh.scale.setScalar(1);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.85;
      } else {
        mesh.visible = false;
      }
    });

    dyingMeshRefs.current.forEach((mesh, i) => {
      const d = dyingBalloons.current[i];
      if (!mesh || !d) {
        if (mesh) mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.copy(d.pos);
      const t = d.age / 0.2;
      const scale = 1 + t * 2;
      mesh.scale.setScalar(scale);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 1 - t;
    });

    if (muzzleRef.current) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      muzzleRef.current.position
        .copy(camera.position)
        .add(dir.multiplyScalar(0.5));
      muzzleRef.current.visible = muzzleFlash && activeWeapon === 1;
    }
  });

  return (
    <>
      <PointerLockControls />
      <mesh ref={muzzleRef} visible={false}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffffaa" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={`balloon-${i}`}
          ref={(el) => {
            balloonMeshRefs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial
            color={BALLOON_BLUE}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`dying-${i}`}
          ref={(el) => {
            dyingMeshRefs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial
            color={BALLOON_BLUE}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import { randomSplatterColor, randomSplatterRadius } from "./textures";
import { resumeAudio } from "../../lib/audio";
import { supabase } from "../../lib/supabase";
import type { RemotePlayerState } from "../../lib/usePresence";

export const INITIAL_SECONDS = 150;
export const BOX_MAX_HP = 500;
export const TOTAL_AMMO = 10;
export const MARKER_MAX_AMMO = 10;
export const BALLOON_MAX_AMMO = 3;
export const MAP_BOUND = 18.5;
export const RELOAD_DURATION_MS = 8000;
export const BALLOON_RELOAD_DURATION_MS = 12000;

export type MockEnemyId =
  | "mock-0"
  | "mock-1"
  | "mock-2"
  | "mock-3"
  | "mock-4";

export type CrosshairState = "idle" | "shoot" | "enemyHit" | "boxHit";

export type EnemyPaintMark = {
  id: number;
  localPosition: [number, number, number];
  radius: number;
};

export type MockEnemyState = {
  health: number;
  hitCount: number;
  dead: boolean;
  paintMarks: EnemyPaintMark[];
};

export type Splatter = {
  id: number;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  color: string;
  radius: number;
};

export const HIT_STAGE_COLORS = [
  "#2a6ab0",
  "#5566aa",
  "#cc6633",
  "#cc2200",
  "#333333",
] as const;

export type PlayerView = {
  x: number;
  y: number;
  z: number;
  yaw: number;
};

export function isInAttackSpawnZone(pos: { x: number; z: number }): boolean {
  return Math.abs(pos.z - 16) < 4 && pos.z > 12;
}

type GameContextValue = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  pos: { x: number; z: number };
  setPos: React.Dispatch<React.SetStateAction<{ x: number; z: number }>>;
  isLocked: boolean;
  gameStarted: boolean;
  requestPointerLock: () => void;
  secondsLeft: number;
  boxHp: number;
  markerAmmo: number;
  balloonAmmo: number;
  isReloadingMarker: boolean;
  isReloadingBalloon: boolean;
  reloadProgressMarker: number;
  reloadProgressBalloon: number;
  playerHP: number;
  reloadWarning: string | null;
  startReload: () => void;
  mockEnemies: Record<MockEnemyId, MockEnemyState>;
  damageMock: (
    id: MockEnemyId,
    hitPoint: THREE.Vector3,
    playerPos: THREE.Vector3,
    damage?: number,
  ) => void;
  coins: number;
  speedMultiplier: number;
  speedBoostSecondsLeft: number;
  purchaseTapeRepair: () => boolean;
  purchaseAmmoPack: () => boolean;
  purchaseSpeedBoost: () => boolean;
  purchaseBalloonPack: () => boolean;
  splatters: Splatter[];
  addSplatter: (
    position: THREE.Vector3,
    normal: THREE.Vector3,
    color?: string,
    radius?: number,
  ) => void;
  activeWeapon: 1 | 2;
  setActiveWeapon: (weapon: 1 | 2) => void;
  defendBoxHP: number;
  defendBoxDestroyed: boolean;
  damageDefendBox: (amount: number) => void;
  weaponThrowTick: number;
  triggerWeaponThrow: () => void;
  canShoot: () => boolean;
  registerMarkerShot: () => void;
  registerBalloonShot: () => void;
  damageBox: (amount: number) => void;
  muzzleFlash: boolean;
  crosshairState: CrosshairState;
  flashCrosshair: (state: CrosshairState, durationMs: number) => void;
  weaponShootTick: number;
  playerViewRef: RefObject<PlayerView>;
  fps: number;
  setFps: React.Dispatch<React.SetStateAction<number>>;
  team: "attack" | "defend";
  playerName: string;
  roomCode: string;
  remotePlayers: RemotePlayerState[];
  setRemotePlayers: React.Dispatch<React.SetStateAction<RemotePlayerState[]>>;
};

const GameContext = createContext<GameContextValue | null>(null);

const initialMocks = (): Record<MockEnemyId, MockEnemyState> => ({
  "mock-0": { health: 100, hitCount: 0, dead: false, paintMarks: [] },
  "mock-1": { health: 100, hitCount: 0, dead: false, paintMarks: [] },
  "mock-2": { health: 100, hitCount: 0, dead: false, paintMarks: [] },
  "mock-3": { health: 100, hitCount: 0, dead: false, paintMarks: [] },
  "mock-4": { health: 100, hitCount: 0, dead: false, paintMarks: [] },
});

export function GameProvider({
  children,
  team = "attack",
  playerName = "",
  roomCode = "",
}: {
  children: ReactNode;
  team?: "attack" | "defend";
  playerName?: string | null;
  roomCode?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const syncChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayerState[]>([]);
  const initialZ = team === "defend" ? -14 : 14;
  const posRef = useRef({ x: 14, z: initialZ });
  const [pos, setPos] = useState({ x: 14, z: initialZ });
  const [isLocked, setIsLocked] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [boxHp, setBoxHp] = useState(340);
  const [markerAmmo, setMarkerAmmo] = useState(MARKER_MAX_AMMO);
  const [balloonAmmo, setBalloonAmmo] = useState(BALLOON_MAX_AMMO);
  const [isReloadingMarker, setIsReloadingMarker] = useState(false);
  const [isReloadingBalloon, setIsReloadingBalloon] = useState(false);
  const [reloadProgressMarker, setReloadProgressMarker] = useState(0);
  const [reloadProgressBalloon, setReloadProgressBalloon] = useState(0);
  const [playerHP] = useState(100);
  const [reloadWarning, setReloadWarning] = useState<string | null>(null);
  const [mockEnemies, setMockEnemies] = useState(initialMocks);
  const [splatters, setSplatters] = useState<Splatter[]>([]);
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const [crosshairState, setCrosshairState] = useState<CrosshairState>("idle");
  const [weaponShootTick, setWeaponShootTick] = useState(0);
  const [weaponThrowTick, setWeaponThrowTick] = useState(0);
  const [activeWeapon, setActiveWeapon] = useState<1 | 2>(1);
  const [defendBoxHP, setDefendBoxHP] = useState(BOX_MAX_HP);
  const [defendBoxDestroyed, setDefendBoxDestroyed] = useState(false);
  const [coins, setCoins] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [speedBoostSecondsLeft, setSpeedBoostSecondsLeft] = useState(0);
  const speedBoostTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedBoostIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const splatterIdRef = useRef(0);
  const enemyPaintIdRef = useRef(0);
  const lastShotRef = useRef(0);
  const crosshairTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadRafMarkerRef = useRef<number | null>(null);
  const reloadRafBalloonRef = useRef<number | null>(null);
  const reloadWarningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reloadStartMarkerRef = useRef(MARKER_MAX_AMMO);
  const reloadStartBalloonRef = useRef(BALLOON_MAX_AMMO);
  const activeWeaponRef = useRef<1 | 2>(1);
  const playerViewRef = useRef<PlayerView>({ x: 14, y: 1.0, z: 0, yaw: 0 });
  const weaponShootTickRef = useRef(0);
  const weaponThrowTickRef = useRef(0);
  const [fps, setFps] = useState(120);

  posRef.current = pos;
  activeWeaponRef.current = activeWeapon;

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showReloadWarning = useCallback((message: string) => {
    setReloadWarning(message);
    if (reloadWarningTimeoutRef.current) {
      clearTimeout(reloadWarningTimeoutRef.current);
    }
    reloadWarningTimeoutRef.current = setTimeout(() => {
      setReloadWarning(null);
    }, 2000);
  }, []);

  const flashCrosshair = useCallback(
    (state: CrosshairState, durationMs: number) => {
      setCrosshairState(state);
      if (crosshairTimeoutRef.current) {
        clearTimeout(crosshairTimeoutRef.current);
      }
      crosshairTimeoutRef.current = setTimeout(() => {
        setCrosshairState("idle");
      }, durationMs);
    },
    [],
  );

  const requestPointerLock = useCallback(() => {
    canvasRef.current?.requestPointerLock();
  }, []);

  useEffect(() => {
    const handleLockChange = () => {
      const locked = document.pointerLockElement === canvasRef.current;
      setIsLocked(locked);
      if (locked) {
        setGameStarted(true);
        resumeAudio();
      }
    };
    document.addEventListener("pointerlockchange", handleLockChange);
    return () =>
      document.removeEventListener("pointerlockchange", handleLockChange);
  }, []);

  // ── Supabase unified sync (Presence + Broadcast) ───────────────────────────
  useEffect(() => {
    if (!roomCode || !playerName) return;

    const playerId = `${roomCode}:${playerName}`;
    const channelName = `room:${roomCode}`;

    console.log("[RoomSync] Connecting to channel:", channelName, "as", playerId);

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: playerId },
        broadcast: { self: false },
      },
    });

    // 1. Listen to broadcast game events
    channel
      .on("broadcast", { event: "splatter" }, ({ payload }) => {
        console.log("[RoomSync Broadcast receive] splatter:", payload);
        addSplatterBase(payload.position, payload.normal, payload.color, payload.radius);
      })
      .on("broadcast", { event: "damageMock" }, ({ payload }) => {
        console.log("[RoomSync Broadcast receive] damageMock:", payload);
        damageMockBase(payload.id, payload.hitPoint, payload.playerPos, payload.damage);
      })
      .on("broadcast", { event: "damageDefendBox" }, ({ payload }) => {
        console.log("[RoomSync Broadcast receive] damageDefendBox:", payload);
        damageDefendBoxBase(payload.amount);
      })
      .on("broadcast", { event: "repairDefendBox" }, ({ payload }) => {
        console.log("[RoomSync Broadcast receive] repairDefendBox:", payload);
        repairDefendBoxBase(payload.amount);
      })
      .on("broadcast", { event: "playerMove" }, ({ payload }) => {
        setRemotePlayers((prev) => {
          const existing = prev.find((p) => p.playerId === payload.playerId);
          if (existing) {
            return prev.map((p) =>
              p.playerId === payload.playerId
                ? {
                    ...p,
                    x: payload.x,
                    y: payload.y,
                    z: payload.z,
                    yaw: payload.yaw,
                    activeWeapon: payload.activeWeapon,
                    shootTick: payload.shootTick,
                    throwTick: payload.throwTick,
                  }
                : p
            );
          } else {
            // Dynamic fallback for early broadcast packets before presence sync
            return [
              ...prev,
              {
                playerId: payload.playerId,
                playerName: payload.playerName,
                team: payload.team,
                x: payload.x,
                y: payload.y,
                z: payload.z,
                yaw: payload.yaw,
                activeWeapon: payload.activeWeapon,
                shootTick: payload.shootTick,
                throwTick: payload.throwTick,
              },
            ];
          }
        });
      });

    // 2. Listen to presence sync events
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<any>();
        console.log("[RoomSync Presence] sync state keys:", Object.keys(state), state);
        
        setRemotePlayers((prev) => {
          const newPlayers: RemotePlayerState[] = [];
          for (const key of Object.keys(state)) {
            if (key === playerId) continue;
            const presence = state[key][0];
            if (presence) {
              const existing = prev.find((p) => p.playerId === presence.playerId);
              newPlayers.push({
                playerId: presence.playerId,
                playerName: presence.playerName,
                team: presence.team,
                x: existing ? existing.x : (presence.team === "defend" ? 14 : 14),
                y: existing ? existing.y : 1.0,
                z: existing ? existing.z : (presence.team === "defend" ? -14 : 14),
                yaw: existing ? existing.yaw : 0,
                activeWeapon: existing ? existing.activeWeapon : 1,
                shootTick: existing ? existing.shootTick : 0,
                throwTick: existing ? existing.throwTick : 0,
              });
            }
          }
          console.log("[RoomSync Presence] updated remote players list:", newPlayers);
          return newPlayers;
        });
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("[RoomSync Presence] join key:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("[RoomSync Presence] leave key:", key, leftPresences);
      });

    let intervalId: ReturnType<typeof setInterval> | null = null;

    // 3. Subscribe, track presence once, and start broadcast movement loop
    channel.subscribe(async (status) => {
      console.log("[RoomSync Subscribe] status:", status);
      if (status === "SUBSCRIBED") {
        // Track presence once to register user metadata on the channel
        try {
          await channel.track({ playerId, playerName, team });
        } catch (err) {
          console.error("[RoomSync Presence track] Error tracking presence:", err);
        }

        const BROADCAST_INTERVAL = 100; // ms — 10 updates per second (smooth, fits Realtime rate limits)

        const sendMovement = () => {
          const pos = playerViewRef.current;
          if (!pos) return;
          channel.send({
            type: "broadcast",
            event: "playerMove",
            payload: {
              playerId,
              playerName,
              team,
              x: Math.round(pos.x * 100) / 100,
              y: Math.round(pos.y * 100) / 100,
              z: Math.round(pos.z * 100) / 100,
              yaw: Math.round(pos.yaw * 1000) / 1000,
              activeWeapon: activeWeaponRef.current,
              shootTick: weaponShootTickRef.current,
              throwTick: weaponThrowTickRef.current,
            },
          });
        };

        intervalId = setInterval(sendMovement, BROADCAST_INTERVAL);
      }
    });

    syncChannelRef.current = channel;

    return () => {
      console.log("[RoomSync] Cleaning up channel:", channelName);
      if (intervalId) clearInterval(intervalId);
      if (syncChannelRef.current) {
        syncChannelRef.current.untrack();
        supabase.removeChannel(syncChannelRef.current);
        syncChannelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, playerName, team]);

  const addSplatterBase = useCallback(
    (
      position: { x: number; y: number; z: number },
      normal: { x: number; y: number; z: number },
      color?: string,
      radius?: number,
    ) => {
      if (normal.y < 0.6) return;

      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(normal.x, normal.y, normal.z).normalize(),
      );
      const splatter: Splatter = {
        id: splatterIdRef.current++,
        position: [position.x, position.y, position.z],
        quaternion: [q.x, q.y, q.z, q.w],
        color: color ?? randomSplatterColor(),
        radius: radius ?? randomSplatterRadius(),
      };
      setSplatters((prev) => {
        const next = [...prev, splatter];
        if (next.length > 60) return next.slice(next.length - 60);
        return next;
      });
    },
    [],
  );

  const addSplatter = useCallback(
    (
      position: THREE.Vector3,
      normal: THREE.Vector3,
      color?: string,
      radius?: number,
    ) => {
      const col = color ?? randomSplatterColor();
      const rad = radius ?? randomSplatterRadius();
      addSplatterBase(position, normal, col, rad);

      if (syncChannelRef.current) {
        console.log("[RoomSync Broadcast send] splatter:", col);
        syncChannelRef.current.send({
          type: "broadcast",
          event: "splatter",
          payload: {
            position: { x: position.x, y: position.y, z: position.z },
            normal: { x: normal.x, y: normal.y, z: normal.z },
            color: col,
            radius: rad,
          },
        });
      }
    },
    [addSplatterBase],
  );

  const damageMockBase = useCallback(
    (
      id: MockEnemyId,
      hitPoint: { x: number; y: number; z: number },
      playerPos: { x: number; y: number; z: number },
      damage = 25,
    ) => {
      setMockEnemies((prev) => {
        const current = prev[id];
        if (current.dead) return prev;

        const health = Math.max(0, current.health - damage);
        const dead = health <= 0;
        const hitCount = Math.min(4, current.hitCount + 1);

        if (dead && !current.dead) {
          setCoins((c) => c + 25);
        }

        const dir = new THREE.Vector3(
          hitPoint.x - playerPos.x,
          hitPoint.y - playerPos.y,
          hitPoint.z - playerPos.z
        ).normalize();
        const localPosition: [number, number, number] = [
          dir.x * 0.35,
          0.2 + (Math.random() - 0.5) * 0.25,
          dir.z * 0.35 + 0.28,
        ];
        const radius = 0.06 + Math.random() * 0.06;

        const paintMarks = [
          ...current.paintMarks,
          {
            id: enemyPaintIdRef.current++,
            localPosition,
            radius,
          },
        ];

        return {
          ...prev,
          [id]: {
            health,
            hitCount,
            dead,
            paintMarks,
          },
        };
      });
    },
    [],
  );

  const damageMock = useCallback(
    (
      id: MockEnemyId,
      hitPoint: THREE.Vector3,
      playerPos: THREE.Vector3,
      damage = 25,
    ) => {
      damageMockBase(id, hitPoint, playerPos, damage);

      if (syncChannelRef.current) {
        console.log("[RoomSync Broadcast send] damageMock:", id, damage);
        syncChannelRef.current.send({
          type: "broadcast",
          event: "damageMock",
          payload: {
            id,
            hitPoint: { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z },
            playerPos: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
            damage,
          },
        });
      }
    },
    [damageMockBase],
  );

  const repairDefendBoxBase = useCallback((amount: number) => {
    setDefendBoxHP((hp) => Math.min(BOX_MAX_HP, hp + amount));
  }, []);

  const purchaseTapeRepair = useCallback(() => {
    if (coins < 50 || defendBoxDestroyed) return false;
    setCoins((c) => c - 50);
    repairDefendBoxBase(100);
    if (syncChannelRef.current) {
      console.log("[RoomSync Broadcast send] repairDefendBox: 100");
      syncChannelRef.current.send({
        type: "broadcast",
        event: "repairDefendBox",
        payload: { amount: 100 },
      });
    }
    return true;
  }, [coins, defendBoxDestroyed, repairDefendBoxBase]);

  const purchaseAmmoPack = useCallback(() => {
    if (coins < 30) return false;
    setCoins((c) => c - 30);
    setMarkerAmmo(MARKER_MAX_AMMO);
    setBalloonAmmo(BALLOON_MAX_AMMO);
    return true;
  }, [coins]);

  const purchaseBalloonPack = useCallback(() => {
    if (coins < 20) return false;
    setCoins((c) => c - 20);
    setBalloonAmmo((a) => Math.min(6, a + 3));
    return true;
  }, [coins]);

  const purchaseSpeedBoost = useCallback(() => {
    if (coins < 40 || speedBoostSecondsLeft > 0) return false;
    setCoins((c) => c - 40);
    setSpeedMultiplier(1.5);
    setSpeedBoostSecondsLeft(10);

    if (speedBoostTimeoutRef.current) {
      clearTimeout(speedBoostTimeoutRef.current);
    }
    if (speedBoostIntervalRef.current) {
      clearInterval(speedBoostIntervalRef.current);
    }

    speedBoostIntervalRef.current = setInterval(() => {
      setSpeedBoostSecondsLeft((s) => {
        if (s <= 1) {
          if (speedBoostIntervalRef.current) {
            clearInterval(speedBoostIntervalRef.current);
            speedBoostIntervalRef.current = null;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    speedBoostTimeoutRef.current = setTimeout(() => {
      setSpeedMultiplier(1);
      setSpeedBoostSecondsLeft(0);
      if (speedBoostIntervalRef.current) {
        clearInterval(speedBoostIntervalRef.current);
        speedBoostIntervalRef.current = null;
      }
      speedBoostTimeoutRef.current = null;
    }, 10000);

    return true;
  }, [coins, speedBoostSecondsLeft]);

  const damageBox = useCallback((amount: number) => {
    setBoxHp((prev) => Math.max(0, prev - amount));
  }, []);

  const damageDefendBoxBase = useCallback(
    (amount: number) => {
      setDefendBoxHP((prev) => {
        if (prev <= 0) return 0;
        const next = Math.max(0, prev - amount);
        if (next <= 0) {
          setDefendBoxDestroyed(true);
          const center = new THREE.Vector3(0, 1, -14);
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
            const dist = 1.5 + Math.random() * 1.5;
            const pos = center
              .clone()
              .add(
                new THREE.Vector3(
                  Math.cos(angle) * dist,
                  (Math.random() - 0.5) * 0.8,
                  Math.sin(angle) * dist,
                ),
              );
            const normal = pos.clone().sub(center).normalize();
            // Use addSplatterBase directly to avoid double-broadcasting explosion splatters
            addSplatterBase(
              pos,
              normal,
              randomSplatterColor(),
              0.08 + Math.random() * 0.04,
            );
          }
        }
        return next;
      });
    },
    [addSplatterBase],
  );

  const damageDefendBox = useCallback(
    (amount: number) => {
      damageDefendBoxBase(amount);
      if (syncChannelRef.current) {
        console.log("[RoomSync Broadcast send] damageDefendBox:", amount);
        syncChannelRef.current.send({
          type: "broadcast",
          event: "damageDefendBox",
          payload: { amount },
        });
      }
    },
    [damageDefendBoxBase],
  );

  const triggerWeaponThrow = useCallback(() => {
    setWeaponThrowTick((t) => {
      const next = t + 1;
      weaponThrowTickRef.current = next;
      return next;
    });
  }, []);

  const canShoot = useCallback(() => {
    const weapon = activeWeaponRef.current;
    if (weapon === 1) {
      if (isReloadingMarker || markerAmmo <= 0) return false;
    } else if (isReloadingBalloon || balloonAmmo <= 0) {
      return false;
    }
    return Date.now() - lastShotRef.current >= 200;
  }, [balloonAmmo, isReloadingBalloon, isReloadingMarker, markerAmmo]);

  const registerMarkerShot = useCallback(() => {
    lastShotRef.current = Date.now();
    setMarkerAmmo((prev) => Math.max(0, prev - 1));
    setMuzzleFlash(true);
    setWeaponShootTick((t) => {
      const next = t + 1;
      weaponShootTickRef.current = next;
      return next;
    });
    flashCrosshair("shoot", 80);
    requestAnimationFrame(() => setMuzzleFlash(false));
  }, [flashCrosshair]);

  const registerBalloonShot = useCallback(() => {
    lastShotRef.current = Date.now();
    setBalloonAmmo((prev) => Math.max(0, prev - 1));
    flashCrosshair("shoot", 80);
  }, [flashCrosshair]);

  const cancelMarkerReload = useCallback(
    (message: string) => {
      if (reloadRafMarkerRef.current !== null) {
        cancelAnimationFrame(reloadRafMarkerRef.current);
        reloadRafMarkerRef.current = null;
      }
      setIsReloadingMarker(false);
      setReloadProgressMarker(0);
      setMarkerAmmo(reloadStartMarkerRef.current);
      showReloadWarning(message);
    },
    [showReloadWarning],
  );

  const cancelBalloonReload = useCallback(
    (message: string) => {
      if (reloadRafBalloonRef.current !== null) {
        cancelAnimationFrame(reloadRafBalloonRef.current);
        reloadRafBalloonRef.current = null;
      }
      setIsReloadingBalloon(false);
      setReloadProgressBalloon(0);
      setBalloonAmmo(reloadStartBalloonRef.current);
      showReloadWarning(message);
    },
    [showReloadWarning],
  );

  const startReload = useCallback(() => {
    const weapon = activeWeaponRef.current;

    if (!isInAttackSpawnZone(posRef.current)) {
      showReloadWarning("⚠ RETURN TO BASE TO RELOAD");
      return;
    }

    if (weapon === 1) {
      if (isReloadingMarker || markerAmmo >= MARKER_MAX_AMMO) return;
      reloadStartMarkerRef.current = markerAmmo;
      setIsReloadingMarker(true);
      setReloadProgressMarker(0);
      const startTime = Date.now();

      const tick = () => {
        if (!isInAttackSpawnZone(posRef.current)) {
          cancelMarkerReload("RELOAD CANCELLED");
          return;
        }
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / RELOAD_DURATION_MS, 1);
        setReloadProgressMarker(progress);
        if (progress >= 1) {
          setMarkerAmmo(MARKER_MAX_AMMO);
          setIsReloadingMarker(false);
          setReloadProgressMarker(0);
          reloadRafMarkerRef.current = null;
          return;
        }
        reloadRafMarkerRef.current = requestAnimationFrame(tick);
      };
      reloadRafMarkerRef.current = requestAnimationFrame(tick);
    } else {
      if (isReloadingBalloon || balloonAmmo >= BALLOON_MAX_AMMO) return;
      reloadStartBalloonRef.current = balloonAmmo;
      setIsReloadingBalloon(true);
      setReloadProgressBalloon(0);
      const startTime = Date.now();

      const tick = () => {
        if (!isInAttackSpawnZone(posRef.current)) {
          cancelBalloonReload("RELOAD CANCELLED");
          return;
        }
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / BALLOON_RELOAD_DURATION_MS, 1);
        setReloadProgressBalloon(progress);
        if (progress >= 1) {
          setBalloonAmmo(BALLOON_MAX_AMMO);
          setIsReloadingBalloon(false);
          setReloadProgressBalloon(0);
          reloadRafBalloonRef.current = null;
          return;
        }
        reloadRafBalloonRef.current = requestAnimationFrame(tick);
      };
      reloadRafBalloonRef.current = requestAnimationFrame(tick);
    }
  }, [
    balloonAmmo,
    cancelBalloonReload,
    cancelMarkerReload,
    isReloadingBalloon,
    isReloadingMarker,
    markerAmmo,
    showReloadWarning,
  ]);

  useEffect(() => {
    return () => {
      if (reloadRafMarkerRef.current !== null) {
        cancelAnimationFrame(reloadRafMarkerRef.current);
      }
      if (reloadRafBalloonRef.current !== null) {
        cancelAnimationFrame(reloadRafBalloonRef.current);
      }
      if (crosshairTimeoutRef.current) {
        clearTimeout(crosshairTimeoutRef.current);
      }
      if (reloadWarningTimeoutRef.current) {
        clearTimeout(reloadWarningTimeoutRef.current);
      }
      if (speedBoostTimeoutRef.current) {
        clearTimeout(speedBoostTimeoutRef.current);
      }
      if (speedBoostIntervalRef.current) {
        clearInterval(speedBoostIntervalRef.current);
      }
    };
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      canvasRef,
      pos,
      setPos,
      isLocked,
      gameStarted,
      requestPointerLock,
      secondsLeft,
      boxHp,
      markerAmmo,
      balloonAmmo,
      isReloadingMarker,
      isReloadingBalloon,
      reloadProgressMarker,
      reloadProgressBalloon,
      playerHP,
      reloadWarning,
      startReload,
      mockEnemies,
      damageMock,
      splatters,
      addSplatter,
      canShoot,
      registerMarkerShot,
      registerBalloonShot,
      damageBox,
      muzzleFlash,
      crosshairState,
      flashCrosshair,
      weaponShootTick,
      activeWeapon,
      setActiveWeapon,
      defendBoxHP,
      defendBoxDestroyed,
      damageDefendBox,
      weaponThrowTick,
      triggerWeaponThrow,
      playerViewRef,
      fps,
      setFps,
      coins,
      speedMultiplier,
      speedBoostSecondsLeft,
      purchaseTapeRepair,
      purchaseAmmoPack,
      purchaseSpeedBoost,
      purchaseBalloonPack,
      team,
      playerName: playerName || "",
      roomCode: roomCode || "",
      remotePlayers,
      setRemotePlayers,
    }),
    [
      pos,
      isLocked,
      gameStarted,
      requestPointerLock,
      secondsLeft,
      boxHp,
      markerAmmo,
      balloonAmmo,
      isReloadingMarker,
      isReloadingBalloon,
      reloadProgressMarker,
      reloadProgressBalloon,
      playerHP,
      reloadWarning,
      startReload,
      mockEnemies,
      damageMock,
      splatters,
      addSplatter,
      canShoot,
      registerMarkerShot,
      registerBalloonShot,
      damageBox,
      muzzleFlash,
      crosshairState,
      flashCrosshair,
      weaponShootTick,
      activeWeapon,
      defendBoxHP,
      defendBoxDestroyed,
      damageDefendBox,
      weaponThrowTick,
      triggerWeaponThrow,
      fps,
      setFps,
      coins,
      speedMultiplier,
      speedBoostSecondsLeft,
      purchaseTapeRepair,
      purchaseAmmoPack,
      purchaseSpeedBoost,
      purchaseBalloonPack,
      team,
      playerName,
      roomCode,
      remotePlayers,
      setRemotePlayers,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

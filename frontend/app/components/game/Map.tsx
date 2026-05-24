"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Sky } from "@react-three/drei";
import DefendBox from "./DefendBox";
import FPSMeter from "./FPSMeter";
import MockEnemy from "./MockEnemy";
import { MOCK_ENEMY_POSITIONS } from "./gameConstants";
import PaintSplatters from "./PaintSplatters";
import FPSPlayer from "./FPSPlayer";
import {
  COVERS,
  MOUNTAINS,
  ROCKY_OUTCROPS,
  TERRAIN_BUMPS,
  WALL_STONE,
  type CoverDef,
} from "./arenaVisuals";
import { createSpawnZoneTexture, createTacticalGridFloorTexture } from "./textures";

const MOCK_ENEMIES = [
  { id: "mock-0" as const, position: MOCK_ENEMY_POSITIONS[0].position, rotationY: Math.PI, index: 0 },
  { id: "mock-1" as const, position: MOCK_ENEMY_POSITIONS[1].position, rotationY: Math.PI * 0.85, index: 1 },
  { id: "mock-2" as const, position: MOCK_ENEMY_POSITIONS[2].position, rotationY: Math.PI * 1.15, index: 2 },
  { id: "mock-3" as const, position: MOCK_ENEMY_POSITIONS[3].position, rotationY: Math.PI * 0.9, index: 3 },
  { id: "mock-4" as const, position: MOCK_ENEMY_POSITIONS[4].position, rotationY: Math.PI * 1.1, index: 4 },
];

const SANDBAG_ROW_X = [-0.75, -0.25, 0.25, 0.75] as const;
const SANDBAG_COLORS = ["#a08878", "#8a7060", "#a08878", "#8a7060"] as const;
const SANDBAG_TOP_ROT_Z = [-0.03, 0.03, -0.03, 0.03, -0.03, 0.03, -0.03, 0.03] as const;
const BARRIER_EDGE_OFFSETS: [number, number, number][] = [
  [-1.55, 0.85, 0.2],
  [1.55, 0.85, -0.2],
  [-1.5, -0.85, -0.15],
  [1.5, -0.85, 0.15],
];

const labelStyle: React.CSSProperties = {
  color: "#c8d4d4",
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: "10px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  userSelect: "none",
};

function coverMat(color: string) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.85}
      metalness={0}
      emissive="#000000"
      emissiveIntensity={0}
    />
  );
}

function SandbagBunker({ pos, styleIndex }: CoverDef & { styleIndex: number }) {
  const topRotZ = SANDBAG_TOP_ROT_Z[styleIndex % SANDBAG_TOP_ROT_Z.length];

  return (
    <group position={pos}>
      <mesh castShadow receiveShadow userData={{ type: "cover" }}>
        <boxGeometry args={[2.2, 1.2, 0.9]} />
        {coverMat("#8a7a6a")}
      </mesh>
      <mesh
        position={[0, 0.8, 0]}
        rotation={[0, 0, topRotZ]}
        castShadow
        userData={{ type: "cover" }}
      >
        <boxGeometry args={[2.0, 0.4, 0.7]} />
        {coverMat("#9a8a7a")}
      </mesh>
      {SANDBAG_ROW_X.map((x, i) => (
        <mesh
          key={i}
          position={[x, 1.15, 0]}
          rotation={[0, (i % 2 === 0 ? 1 : -1) * 0.05, (i % 2 === 0 ? -1 : 1) * 0.05]}
          castShadow
          userData={{ type: "cover" }}
        >
          <boxGeometry args={[0.45, 0.3, 0.65]} />
          {coverMat(SANDBAG_COLORS[i])}
        </mesh>
      ))}
      <mesh position={[1.0, 0.75, 0.35]} castShadow userData={{ type: "cover" }}>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
        {coverMat("#5C4033")}
      </mesh>
    </group>
  );
}

function ConcreteBarrier({ pos }: CoverDef) {
  return (
    <group position={pos}>
      <mesh castShadow receiveShadow userData={{ type: "cover" }}>
        <boxGeometry args={[3.2, 1.8, 0.45]} />
        {coverMat("#7a8a8f")}
      </mesh>
      <mesh position={[0, 0.975, 0]} castShadow userData={{ type: "cover" }}>
        <boxGeometry args={[3.0, 0.15, 0.3]} />
        {coverMat("#6a7a7f")}
      </mesh>
      <mesh position={[-1.5, 0, 0]} castShadow userData={{ type: "cover" }}>
        <boxGeometry args={[0.2, 1.6, 0.6]} />
        {coverMat("#7a8a8f")}
      </mesh>
      <mesh position={[1.5, 0, 0]} castShadow userData={{ type: "cover" }}>
        <boxGeometry args={[0.2, 1.6, 0.6]} />
        {coverMat("#7a8a8f")}
      </mesh>
      {BARRIER_EDGE_OFFSETS.map(([x, y, z], i) => (
        <mesh
          key={i}
          position={[x + 0.02, y, z + 0.02]}
          userData={{ type: "cover" }}
        >
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          {coverMat(i % 2 === 0 ? "#6a7a7f" : "#7a8a8f")}
        </mesh>
      ))}
    </group>
  );
}

function CrateStack({ pos }: CoverDef) {
  return (
    <group position={pos}>
      <mesh castShadow receiveShadow userData={{ type: "cover" }}>
        <boxGeometry args={[1.4, 0.9, 1.2]} />
        {coverMat("#8B6914")}
      </mesh>
      <mesh
        position={[0.1, 0.875, 0]}
        rotation={[0, 0.15, 0]}
        castShadow
        userData={{ type: "cover" }}
      >
        <boxGeometry args={[1.2, 0.85, 1.0]} />
        {coverMat("#9B7924")}
      </mesh>
      <mesh position={[0, 0.45, 0]} userData={{ type: "cover" }}>
        <boxGeometry args={[1.45, 0.06, 1.25]} />
        {coverMat("#555555")}
      </mesh>
    </group>
  );
}

function CoverObject({ styleIndex, ...props }: CoverDef & { styleIndex: number }) {
  if (props.style === "sandbag") return <SandbagBunker {...props} styleIndex={styleIndex} />;
  if (props.style === "barrier") return <ConcreteBarrier {...props} />;
  return <CrateStack {...props} />;
}

function WallWithDetail({
  position,
  rotation,
  width,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width: number;
}) {
  const lighter = "#9aabb0";
  const darker = "#6a7a80";
  const trimYs = [1, 2, 4];
  const pillarCount = Math.floor(width / 6);

  return (
    <group position={position} rotation={rotation ?? [0, 0, 0]}>
      <mesh castShadow receiveShadow userData={{ type: "wall" }}>
        <boxGeometry args={[width, 6, 0.5]} />
        {coverMat(WALL_STONE)}
      </mesh>
      {trimYs.map((y) => (
        <mesh key={y} position={[0, y - 3, 0.28]}>
          <boxGeometry args={[width, 0.15, 0.1]} />
          {coverMat(lighter)}
        </mesh>
      ))}
      {Array.from({ length: pillarCount + 1 }, (_, i) => {
        const x = -width / 2 + i * 6;
        return (
          <mesh key={i} position={[x, 0, 0.25]} castShadow>
            <boxGeometry args={[0.4, 6, 0.4]} />
            {coverMat(darker)}
          </mesh>
        );
      })}
    </group>
  );
}

function FieldMarkings() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <torusGeometry args={[4, 0.08, 8, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          roughness={1}
          metalness={0}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[40, 0.01, 0.15]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.25}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {[6, -6].map((z) => (
        <mesh key={z} position={[0, 0.01, z]}>
          <boxGeometry args={[40, 0.01, 0.15]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.25}
            roughness={1}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}

function PulsingSpawnZone({
  position,
  baseColor,
  labels,
}: {
  position: [number, number, number];
  baseColor: string;
  labels: string[];
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const texture = useMemo(() => createSpawnZoneTexture(baseColor), [baseColor]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity = 0.28 + (Math.sin(clock.elapsedTime * 1.5) + 1) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial
          ref={matRef}
          map={texture}
          transparent
          opacity={0.35}
          color={baseColor}
          side={THREE.DoubleSide}
          flatShading
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>
      <Html position={[0, 1.5, 0]} center distanceFactor={14}>
        <div style={{ ...labelStyle, textAlign: "center" }}>
          {labels.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
      </Html>
    </group>
  );
}

function Mountain({
  position,
  height,
  radius,
  color,
}: (typeof MOUNTAINS)[0]) {
  return (
    <mesh position={[position[0], height / 2, position[2]]} castShadow>
      <coneGeometry args={[radius, height, 5]} />
      <meshStandardMaterial
        color={color}
        flatShading
        roughness={1}
        emissive="#000000"
        emissiveIntensity={0}
      />
    </mesh>
  );
}

export default function Map() {
  const floorTexture = useMemo(() => createTacticalGridFloorTexture(), []);

  return (
    <>
      <Sky
        distance={450}
        sunPosition={[2, 1, -8]}
        inclination={0.52}
        azimuth={0.15}
        turbidity={12}
        rayleigh={3}
        mieCoefficient={0.015}
        mieDirectionalG={0.8}
      />
      <fog attach="fog" args={["#e8a87c", 35, 70]} />

      <ambientLight intensity={0.55} color="#fff5e8" />
      <hemisphereLight args={["#e8a87c", "#7ec8a0", 0.35]} />
      <directionalLight
        position={[5, 12, 5]}
        intensity={1.1}
        color="#fffae0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {MOUNTAINS.map((m, i) => (
        <Mountain key={i} {...m} />
      ))}

      {TERRAIN_BUMPS.map((b, i) => (
        <mesh
          key={`bump-${i}`}
          position={[b.position[0], b.size[1] / 2, b.position[2]]}
          rotation={[0, b.rotationY, 0]}
          receiveShadow
        >
          <boxGeometry args={b.size} />
          {coverMat(b.color)}
        </mesh>
      ))}

      {ROCKY_OUTCROPS.map((outcrop, i) => (
        <group key={`rock-${i}`} position={outcrop.position}>
          {outcrop.boxes.map((box, j) => (
            <mesh
              key={j}
              position={box.offset}
              rotation={box.rotation}
              castShadow
              receiveShadow
            >
              <boxGeometry args={box.size} />
              {coverMat(box.color)}
            </mesh>
          ))}
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ type: "floor" }}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          map={floorTexture}
          color="#7ec8a0"
          flatShading
          roughness={1}
          metalness={0}
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>

      <FieldMarkings />

      <WallWithDetail position={[0, 2.85, 20]} width={40} />
      <WallWithDetail position={[0, 2.85, -20]} width={40} />
      <WallWithDetail position={[-20, 2.85, 0]} rotation={[0, Math.PI / 2, 0]} width={40} />
      <WallWithDetail position={[20, 2.85, 0]} rotation={[0, Math.PI / 2, 0]} width={40} />

      {COVERS.map((cover, i) => (
        <CoverObject key={i} {...cover} styleIndex={i} />
      ))}

      <DefendBox />

      {MOCK_ENEMIES.map((enemy) => (
        <MockEnemy
          key={enemy.id}
          id={enemy.id}
          index={enemy.index}
          position={enemy.position}
          rotationY={enemy.rotationY}
        />
      ))}

      <PulsingSpawnZone
        position={[0, 0, 16]}
        baseColor="#00c2ff"
        labels={["ATTACK SPAWN", "RELOAD ZONE"]}
      />
      <PulsingSpawnZone
        position={[0, 0, -16]}
        baseColor="#4a8aaa"
        labels={["DEFEND SPAWN", "RELOAD ZONE"]}
      />

      <PaintSplatters />
      <FPSPlayer />
      <FPSMeter />
    </>
  );
}

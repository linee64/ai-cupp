export type ColliderBox = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const SANDBAG_RADIUS = 2.2;
const DEFEND_CENTER_Z = -14;

function sandbagColliders(): ColliderBox[] {
  const boxes: ColliderBox[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const cx = Math.cos(angle) * SANDBAG_RADIUS;
    const cz = DEFEND_CENTER_Z + Math.sin(angle) * SANDBAG_RADIUS;
    boxes.push({
      minX: cx - 0.5,
      maxX: cx + 0.5,
      minZ: cz - 0.5,
      maxZ: cz + 0.5,
    });
  }
  return boxes;
}

export const COLLIDERS: ColliderBox[] = [
  // Perimeter walls — thin boxes aligned to visible panels (depth 0.5 at ±20)
  { minX: -19.6, maxX: 19.6, minZ: 19.72, maxZ: 20.12 },
  { minX: -19.6, maxX: 19.6, minZ: -20.12, maxZ: -19.72 },
  { minX: 19.72, maxX: 20.12, minZ: -19.6, maxZ: 19.6 },
  { minX: -20.12, maxX: -19.72, minZ: -19.6, maxZ: 19.6 },

  { minX: -7.2, maxX: -4.8, minZ: 3, maxZ: 5 },
  { minX: 4.8, maxX: 7.2, minZ: 3, maxZ: 5 },
  { minX: -5.2, maxX: -2.8, minZ: -5, maxZ: -3 },
  { minX: 2.8, maxX: 5.2, minZ: -5, maxZ: -3 },
  { minX: -9.8, maxX: -6.2, minZ: -3, maxZ: -1 },
  { minX: 6.2, maxX: 9.8, minZ: -3, maxZ: -1 },
  { minX: -4.2, maxX: -1.8, minZ: 7, maxZ: 9 },
  { minX: 1.8, maxX: 4.2, minZ: 7, maxZ: 9 },

  { minX: -1.1, maxX: 1.1, minZ: -15.1, maxZ: -12.9 },

  ...sandbagColliders(),
];

const PLAYER_RADIUS = 0.4;

export function resolveCollisions(
  px: number,
  pz: number,
  r = PLAYER_RADIUS,
): { x: number; z: number } {
  const newPos = { x: px, z: pz };

  for (const box of COLLIDERS) {
    const closestX = Math.max(box.minX, Math.min(newPos.x, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(newPos.z, box.maxZ));
    const dx = newPos.x - closestX;
    const dz = newPos.z - closestZ;
    if (dx * dx + dz * dz < r * r) {
      const overlapX = r - Math.abs(dx);
      const overlapZ = r - Math.abs(dz);
      if (overlapX < overlapZ) {
        newPos.x += dx > 0 ? overlapX : -overlapX;
      } else {
        newPos.z += dz > 0 ? overlapZ : -overlapZ;
      }
    }
  }

  return newPos;
}

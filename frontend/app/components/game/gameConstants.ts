import type { MockEnemyId } from "./GameContext";

export const MOCK_ENEMY_POSITIONS: {
  id: MockEnemyId;
  position: [number, number, number];
}[] = [
  { id: "mock-0", position: [0, 0, -8] },
  { id: "mock-1", position: [-5, 0, -6] },
  { id: "mock-2", position: [5, 0, -6] },
  { id: "mock-3", position: [-3, 0, -12] },
  { id: "mock-4", position: [3, 0, -12] },
];

export const BALLOON_BLUE = "#00aaff";

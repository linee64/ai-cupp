export const CONCRETE = "#7a8a8f";
export const WALL_STONE = "#8a9aa0";
export const GROUND_MINT = "#7ec8a0";

export type CoverStyle = "sandbag" | "barrier" | "crate";

export type CoverDef = {
  pos: [number, number, number];
  style: CoverStyle;
};

/** Heights +0.5 vs prior layout; cover positions unchanged */
export const COVERS: CoverDef[] = [
  { pos: [-6, 1.25, 4], style: "sandbag" },
  { pos: [6, 1.25, 4], style: "sandbag" },
  { pos: [-4, 0.75, -4], style: "sandbag" },
  { pos: [4, 0.75, -4], style: "sandbag" },
  { pos: [-8, 1.5, -2], style: "barrier" },
  { pos: [8, 1.5, -2], style: "barrier" },
  { pos: [-3, 1.15, 8], style: "crate" },
  { pos: [3, 1.15, 8], style: "crate" },
];

export const MOUNTAINS: {
  position: [number, number, number];
  height: number;
  radius: number;
  color: string;
}[] = [
  { position: [-42, 0, -12], height: 14, radius: 9, color: "#8B5A3C" },
  { position: [-38, 0, 8], height: 11, radius: 7, color: "#A0522D" },
  { position: [-45, 0, 18], height: 16, radius: 10, color: "#6B3A2A" },
  { position: [40, 0, -15], height: 12, radius: 8, color: "#8B5A3C" },
  { position: [44, 0, 5], height: 18, radius: 11, color: "#6B3A2A" },
  { position: [36, 0, 20], height: 10, radius: 6, color: "#A0522D" },
  { position: [-28, 0, -28], height: 9, radius: 6, color: "#A0522D" },
  { position: [30, 0, -32], height: 13, radius: 8, color: "#8B5A3C" },
];

export const TERRAIN_BUMPS: {
  position: [number, number, number];
  size: [number, number, number];
  rotationY: number;
  color: string;
}[] = [
  { position: [-12, 0, 8], size: [4, 0.1, 2.5], rotationY: 0.4, color: "#5a9a72" },
  { position: [14, 0, 5], size: [5, 0.12, 3], rotationY: -0.6, color: "#528a68" },
  { position: [-16, 0, -6], size: [3.5, 0.08, 2], rotationY: 1.1, color: "#5a9a72" },
  { position: [10, 0, -10], size: [6, 0.15, 4], rotationY: 0.2, color: "#528a68" },
  { position: [-8, 0, 14], size: [3, 0.1, 3.5], rotationY: -0.3, color: "#5a9a72" },
  { position: [18, 0, -14], size: [4.5, 0.12, 2.8], rotationY: 0.8, color: "#528a68" },
  { position: [-18, 0, 2], size: [5.5, 0.14, 3.2], rotationY: -1.2, color: "#5a9a72" },
  { position: [6, 0, 16], size: [3.2, 0.09, 2.2], rotationY: 0.5, color: "#528a68" },
  { position: [-5, 0, -16], size: [4, 0.11, 3.8], rotationY: -0.7, color: "#5a9a72" },
  { position: [16, 0, 12], size: [5, 0.13, 2.5], rotationY: 1.4, color: "#528a68" },
];

export const ROCKY_OUTCROPS: {
  position: [number, number, number];
  boxes: {
    size: [number, number, number];
    offset: [number, number, number];
    rotation: [number, number, number];
    color: string;
  }[];
}[] = [
  {
    position: [-17, 0, 17],
    boxes: [
      { size: [1.8, 1.2, 1.4], offset: [0, 0.6, 0], rotation: [0.1, 0.15, 0.05], color: "#7a6a5a" },
      { size: [1.2, 0.8, 1.0], offset: [0.9, 0.4, 0.3], rotation: [0.05, -0.2, 0.12], color: "#6a5a4a" },
      { size: [0.9, 0.6, 0.8], offset: [-0.7, 0.3, 0.5], rotation: [0.08, 0.1, -0.08], color: "#7a6a5a" },
      { size: [0.7, 0.5, 0.6], offset: [0.2, 1.0, -0.2], rotation: [0.15, 0.05, 0.1], color: "#6a5a4a" },
    ],
  },
  {
    position: [17, 0, 17],
    boxes: [
      { size: [2.0, 1.0, 1.6], offset: [0, 0.5, 0], rotation: [-0.05, 0.2, 0.08], color: "#6a5a4a" },
      { size: [1.1, 0.7, 0.9], offset: [-0.8, 0.35, 0.4], rotation: [0.12, -0.15, 0.06], color: "#7a6a5a" },
      { size: [0.8, 0.55, 0.7], offset: [0.6, 0.75, -0.3], rotation: [0.06, 0.18, -0.1], color: "#6a5a4a" },
    ],
  },
  {
    position: [-17, 0, -17],
    boxes: [
      { size: [1.6, 1.1, 1.3], offset: [0, 0.55, 0], rotation: [0.08, -0.12, 0.14], color: "#7a6a5a" },
      { size: [1.0, 0.75, 0.85], offset: [0.7, 0.38, -0.4], rotation: [-0.06, 0.16, 0.05], color: "#6a5a4a" },
      { size: [0.85, 0.6, 0.75], offset: [-0.5, 0.85, 0.3], rotation: [0.1, -0.08, 0.11], color: "#7a6a5a" },
      { size: [0.65, 0.45, 0.55], offset: [0.1, 0.25, 0.6], rotation: [0.04, 0.2, -0.06], color: "#6a5a4a" },
    ],
  },
  {
    position: [17, 0, -17],
    boxes: [
      { size: [1.9, 1.15, 1.5], offset: [0, 0.58, 0], rotation: [0.06, 0.1, -0.07], color: "#6a5a4a" },
      { size: [1.3, 0.85, 1.1], offset: [-0.75, 0.42, 0.35], rotation: [0.14, -0.18, 0.09], color: "#7a6a5a" },
      { size: [0.75, 0.5, 0.65], offset: [0.5, 0.95, -0.25], rotation: [-0.08, 0.12, 0.15], color: "#6a5a4a" },
    ],
  },
];

export const MINIMAP_COVERS: { x: number; z: number; w: number; h: number }[] =
  COVERS.map((c) => {
    const w = c.style === "barrier" ? 3.2 : c.style === "crate" ? 1.4 : 2.2;
    const h = c.style === "barrier" ? 0.45 : c.style === "crate" ? 1.2 : 0.9;
    return { x: c.pos[0], z: c.pos[2], w, h };
  });

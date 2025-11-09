

export enum BevelType {
  NONE = 'none',
  CHAMFER = 'chamfer', // 斜面角
  FILLET = 'fillet', // 圓角
  CONCAVE_SQUARE = 'concave_square', // 內凹方角
  CONCAVE_CHAMFER = 'concave_chamfer', // 內凹斜角
  CONCAVE_ROUND = 'concave_round', // 內凹圓角
}

export enum NodeType {
  CORNER = 'corner',
  SMOOTH = 'smooth',
  SYMMETRIC = 'symmetric',
}

export interface TransformParams {
  weight: number;
  width: number;
  slant: number;
  strokeWidth: number;
  strokeColor: string;
  fillColor: string;
  opacity: number;
  bevelType: BevelType;
  bevelSize: number;
  chamferAngle: number;
}

export interface PenToolSettings {
  strokeWidth: number;
  strokeColor: string;
  fillColor: string | null;
  defaultNodeType: 'corner' | 'smooth' | 'symmetric';
  snapToGrid: boolean;
  snapToPath: boolean;
  showHandles: boolean;
  autoClose: boolean;
  handleLength: number;
  closeThreshold: number;
}


export interface ViewOptions {
  showGuides: boolean;
  previewMode: boolean;
  previewBg: 'dark' | 'light';
  showGrid: boolean;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

// In App.tsx, the svgData state is defined as `{ data: string; id: number } | null`.
// Let's add an optional offset property to it.
export type SvgData = {
  data: string;
  id: number;
  offset?: { x: number; y: number };
} | null;
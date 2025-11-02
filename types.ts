

export enum BevelType {
  NONE = 'none',
  CHAMFER = 'chamfer', // 斜面角
  FILLET = 'fillet', // 圓角
  CONCAVE_SQUARE = 'concave_square', // 內凹方角
  CONCAVE_CHAMFER = 'concave_chamfer', // 內凹斜角
  CONCAVE_ROUND = 'concave_round', // 內凹圓角
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
}

export interface PenToolSettings {
  strokeWidth: number;
  strokeColor: string;
  fillColor: string | null;
}


export interface ViewOptions {
  showAids: boolean;
  previewMode: boolean;
  previewBg: 'dark' | 'light';
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}
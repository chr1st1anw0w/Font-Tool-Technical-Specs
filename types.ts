
export interface TransformParams {
  weight: number;
  width: number;
  slant: number;
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

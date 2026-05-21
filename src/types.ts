export interface DiceData {
  id: string; // Unique ID for React rendering
  numberValue: number;
  faces: number;
  currentFaceIndex?: number;
  name?: string;
  customFaces: string[];
  color: string;
  held: boolean;
  targetValue?: number;
  targetFaceIndex?: number;
}

export interface DiceConfig {
  name: string;
  config: DiceData[];
}

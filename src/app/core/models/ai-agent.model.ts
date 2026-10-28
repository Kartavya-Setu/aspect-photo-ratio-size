export type CropAnchor =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface AgentActionPlan {
  ratioId: string;
  aspectRatioValue: number;
  targetDimensions?: {
    width: number;
    height: number;
  } | null;
  sizeMode: 'target-kb' | 'quality';
  targetKb?: number | null;
  format: 'image/jpeg' | 'image/webp' | 'image/png';
  summary: string;
  source: 'preset-matcher' | 'gemini-ai';
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  cropAnchor?: CropAnchor;
  outOfScopeNotice?: string | null;
}

export interface AgentExecutionStatus {
  isAnalyzing: boolean;
  isExecuting: boolean;
  error: string | null;
  lastPlan: AgentActionPlan | null;
}

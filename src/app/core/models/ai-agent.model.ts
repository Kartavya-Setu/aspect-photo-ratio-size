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
  autoCenterSubject?: boolean;
}

export interface AgentExecutionStatus {
  isAnalyzing: boolean;
  isExecuting: boolean;
  error: string | null;
  lastPlan: AgentActionPlan | null;
}

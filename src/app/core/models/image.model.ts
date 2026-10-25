export type ImageFormat = 'image/webp' | 'image/jpeg' | 'image/png' | 'image/avif';

export interface CropArea {
  x: number; // in pixels relative to original image
  y: number;
  width: number;
  height: number;
}

export interface ProcessConfig {
  format: ImageFormat;
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;
  sizeMode: 'target-kb' | 'manual-quality' | 'lossless';
  targetKb: number;
  quality: number; // 0.05 to 1.0
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
  backgroundColor: string; // for jpeg or non-transparent backgrounds
  sharpening: boolean;
  pixelated: boolean; // nearest neighbor vs bicubic
}

export interface ProcessedResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sizeKb: number;
  format: ImageFormat;
  qualityUsed: number;
  processingTimeMs: number;
  compressionRatio: number; // e.g. -75%
  fileName: string;
}

export interface OriginalImageInfo {
  file: File | null;
  dataUrl: string;
  name: string;
  width: number;
  height: number;
  sizeBytes: number;
  sizeKb: number;
  format: string;
  aspectRatioString: string;
  aspectRatioValue: number;
}

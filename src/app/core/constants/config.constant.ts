import { ProcessConfig } from '../models';

export const INITIAL_PROCESS_CONFIG: ProcessConfig = {
  format: 'image/webp',
  targetWidth: 800,
  targetHeight: 600,
  maintainAspectRatio: true,
  sizeMode: 'target-kb',
  targetKb: 200,
  quality: 0.8,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  backgroundColor: '#ffffff',
  sharpening: false,
  pixelated: false
};

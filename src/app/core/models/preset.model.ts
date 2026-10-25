import { ImageFormat } from './image.model';

export type AspectRatioOption = 
  | 'free'
  | '1:1'
  | '4:3'
  | '16:9'
  | '9:16'
  | '3:2'
  | '2:3'
  | '4:5'
  | '21:9'
  | 'custom';

export type PresetCategory = 'social' | 'document' | 'web';

export interface PlatformPreset {
  id: string;
  name: string;
  category: PresetCategory;
  aspectRatio: string;
  ratioValue: number; // width / height
  targetWidth: number;
  targetHeight: number;
  recommendedMaxKb?: number;
  recommendedFormat: ImageFormat;
  description: string;
}

export interface PresetRatioItem {
  id: AspectRatioOption;
  label: string;
  ratio: number | null;
  sub: string;
}

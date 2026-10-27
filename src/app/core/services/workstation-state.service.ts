import { Injectable, inject, signal } from '@angular/core';
import {
  AgentActionPlan,
  CropArea,
  OriginalImageInfo,
  PlatformPreset,
  ProcessConfig,
  ProcessedResult
} from '../models';
import { INITIAL_PROCESS_CONFIG } from '../constants';
import { ImageProcessingService } from './image-processing.service';

@Injectable({
  providedIn: 'root'
})
export class WorkstationStateService {
  private readonly imageProcessor = inject(ImageProcessingService);

  readonly originalImage = signal<OriginalImageInfo | null>(null);
  readonly loadedImageElement = signal<HTMLImageElement | null>(null);

  readonly selectedRatioId = signal<string>('free');
  readonly aspectRatio = signal<number | null>(null);
  readonly customRatioW = signal<number>(4);
  readonly customRatioH = signal<number>(3);

  readonly crop = signal<CropArea>({ x: 0, y: 0, width: 800, height: 600 });
  readonly config = signal<ProcessConfig>({ ...INITIAL_PROCESS_CONFIG });

  readonly processedResult = signal<ProcessedResult | null>(null);
  readonly isProcessing = signal<boolean>(false);
  readonly activeStepTab = signal<'crop' | 'size' | 'inspect'>('crop');
  readonly isSampleImage = signal<boolean>(false);
  readonly lastAgentPlan = signal<AgentActionPlan | null>(null);

  private debounceTimer: number | null = null;

  async handleImageFile(file: File, isSample = false): Promise<void> {
    try {
      this.isSampleImage.set(isSample);
      this.lastAgentPlan.set(null);
      const dataUrl = await this.imageProcessor.readFileAsDataUrl(file);
      const img = await this.imageProcessor.loadImage(dataUrl);

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      const initialCrop: CropArea = {
        x: 0,
        y: 0,
        width: naturalW,
        height: naturalH
      };

      const info: OriginalImageInfo = {
        file,
        dataUrl,
        name: file.name,
        width: naturalW,
        height: naturalH,
        sizeBytes: file.size,
        sizeKb: file.size / 1024,
        format: file.type || 'image/jpeg',
        aspectRatioString: `${naturalW}:${naturalH}`,
        aspectRatioValue: naturalW / naturalH
      };

      this.originalImage.set(info);
      this.loadedImageElement.set(img);
      this.crop.set(initialCrop);
      this.selectedRatioId.set('free');
      this.aspectRatio.set(null);

      const targetSizeKb = Math.min(300, Math.max(50, Math.round((file.size / 1024) * 0.4)));

      this.config.set({
        ...this.config(),
        targetWidth: naturalW,
        targetHeight: naturalH,
        targetKb: targetSizeKb,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false
      });

      this.triggerProcessing();
    } catch (err) {
      console.error('Failed to load image file:', err);
    }
  }

  async loadSampleImage(sample: { url: string; name: string }): Promise<void> {
    try {
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File(
        [blob],
        `${sample.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`,
        { type: 'image/jpeg' }
      );
      await this.handleImageFile(file, true);
    } catch (err) {
      console.error('Failed to load demo sample:', err);
    }
  }

  selectRatio(event: { id: string; ratio: number | null }) {
    this.selectedRatioId.set(event.id);

    if (event.id === 'free') {
      this.aspectRatio.set(null);
      return;
    }

    if (event.id === 'custom') {
      const customRatio = this.customRatioW() / this.customRatioH();
      this.aspectRatio.set(customRatio);
      this.applyAspectRatioToCrop(customRatio);
      return;
    }

    if (event.ratio) {
      this.aspectRatio.set(event.ratio);
      this.applyAspectRatioToCrop(event.ratio);
    }
  }

  setCustomRatio(event: { w: number; h: number }) {
    this.customRatioW.set(event.w);
    this.customRatioH.set(event.h);
    const customRatio = event.w / event.h;
    this.aspectRatio.set(customRatio);
    this.applyAspectRatioToCrop(customRatio);
  }

  applyAspectRatioToCrop(ratio: number) {
    const loadedEl = this.loadedImageElement();
    if (!loadedEl) return;

    const currentConfig = this.config();
    const isRotated90 = Math.abs(currentConfig.rotation % 180) === 90;
    const effW = isRotated90 ? loadedEl.naturalHeight : loadedEl.naturalWidth;
    const effH = isRotated90 ? loadedEl.naturalWidth : loadedEl.naturalHeight;

    let newW = effW;
    let newH = effH;

    if (effW / effH > ratio) {
      newW = effH * ratio;
    } else {
      newH = effW / ratio;
    }

    newW = Math.round(newW);
    newH = Math.round(newH);
    const newX = Math.round((effW - newW) / 2);
    const newY = Math.round((effH - newH) / 2);

    this.crop.set({
      x: newX,
      y: newY,
      width: newW,
      height: newH
    });

    if (currentConfig.maintainAspectRatio) {
      this.config.set({
        ...currentConfig,
        targetWidth: newW,
        targetHeight: newH
      });
    }

    this.triggerProcessing();
  }

  applyPlatformPreset(preset: PlatformPreset) {
    this.selectedRatioId.set(preset.aspectRatio);
    this.aspectRatio.set(preset.ratioValue);
    this.applyAspectRatioToCrop(preset.ratioValue);

    const currentConfig = this.config();
    this.config.set({
      ...currentConfig,
      targetWidth: preset.targetWidth,
      targetHeight: preset.targetHeight,
      format: preset.recommendedFormat,
      targetKb: preset.recommendedMaxKb || currentConfig.targetKb,
      sizeMode: preset.recommendedMaxKb ? 'target-kb' : currentConfig.sizeMode
    });

    this.triggerProcessing();
  }

  async applyAgentAction(plan: AgentActionPlan) {
    this.lastAgentPlan.set(plan);

    // 1. Set Aspect Ratio & Crop Coordinates
    if (plan.ratioId === 'free') {
      this.selectedRatioId.set('free');
      this.aspectRatio.set(null);
    } else {
      this.selectedRatioId.set(plan.ratioId);
      this.aspectRatio.set(plan.aspectRatioValue);
      this.applyAspectRatioToCrop(plan.aspectRatioValue);
    }

    // 2. Set output format, budget, and dimension constraints
    const currentConfig = this.config();
    const updatedConfig: ProcessConfig = {
      ...currentConfig,
      format: plan.format,
      maintainAspectRatio: true
    };

    if (plan.targetKb && plan.targetKb > 0) {
      updatedConfig.sizeMode = 'target-kb';
      updatedConfig.targetKb = plan.targetKb;
    }

    if (plan.targetDimensions) {
      updatedConfig.targetWidth = plan.targetDimensions.width;
      updatedConfig.targetHeight = plan.targetDimensions.height;
    }

    this.config.set(updatedConfig);
    // Switch directly to inspect tab so user sees the live result & download ready
    this.activeStepTab.set('inspect');
    this.triggerProcessing();
  }

  updateCrop(newCrop: CropArea) {
    this.crop.set(newCrop);
    const currentConfig = this.config();
    if (currentConfig.maintainAspectRatio) {
      this.config.set({
        ...currentConfig,
        targetWidth: newCrop.width,
        targetHeight: newCrop.height
      });
    }
    this.triggerProcessing();
  }

  updateConfig(patch: Partial<ProcessConfig>) {
    this.config.set({ ...this.config(), ...patch });
    this.triggerProcessing();
  }

  setActiveTab(tab: 'crop' | 'size' | 'inspect') {
    this.activeStepTab.set(tab);
  }

  triggerProcessing() {
    const loadedEl = this.loadedImageElement();
    const original = this.originalImage();
    if (!loadedEl || !original) return;

    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }

    this.isProcessing.set(true);
    this.debounceTimer = window.setTimeout(async () => {
      try {
        if (this.loadedImageElement() && this.originalImage()) {
          const result = await this.imageProcessor.processImage(
            this.loadedImageElement()!,
            this.crop(),
            this.config(),
            this.originalImage()!.name,
            this.originalImage()!.sizeBytes
          );
          this.processedResult.set(result);
        }
      } catch (err) {
        console.error('Processing error:', err);
      } finally {
        this.isProcessing.set(false);
      }
    }, 120);
  }

  download() {
    const result = this.processedResult();
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  clear() {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.originalImage.set(null);
    this.loadedImageElement.set(null);
    this.processedResult.set(null);
    this.isSampleImage.set(false);
    this.lastAgentPlan.set(null);
  }
}

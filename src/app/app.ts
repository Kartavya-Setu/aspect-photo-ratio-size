import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideLayers,
  LucideSliders,
  LucideEye,
  LucideDownload
} from '@lucide/angular';
import { NgxRetroGridComponent } from '@omnedia/ngx-retro-grid';
import { RetroHeaderComponent } from './components/retro-header/retro-header.component';
import { ImageUploaderComponent } from './components/image-uploader/image-uploader.component';
import { AspectPresetBarComponent } from './components/aspect-preset-bar/aspect-preset-bar.component';
import { InteractiveCropperComponent } from './components/interactive-cropper/interactive-cropper.component';
import { SizeTargetPanelComponent } from './components/size-target-panel/size-target-panel.component';
import { ComparisonPreviewComponent } from './components/comparison-preview/comparison-preview.component';
import { SeoGuideSectionComponent } from './components/seo-guide-section/seo-guide-section.component';
import {
  GuidedTourComponent,
  TourStepInfo
} from './components/guided-tour/guided-tour.component';
import {
  CropArea,
  OriginalImageInfo,
  PlatformPreset,
  ProcessConfig,
  ProcessedResult
} from './types';
import { loadImage, processImage } from './utils/image-processor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideLayers,
    LucideSliders,
    LucideEye,
    LucideDownload,
    NgxRetroGridComponent,
    RetroHeaderComponent,
    ImageUploaderComponent,
    AspectPresetBarComponent,
    InteractiveCropperComponent,
    SizeTargetPanelComponent,
    ComparisonPreviewComponent,
    SeoGuideSectionComponent,
    GuidedTourComponent
  ],
  template: `
    <!-- Fixed Viewport Retro Grid Background -->
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <om-retro-grid
        [gridColor]="'#f59e0b'"
        [fadeColor]="'#ebe6dc'"
        [gridRotation]="'45deg'"
        styleClass="w-full h-full"
      ></om-retro-grid>
    </div>

    <!-- Main Workstation & Knowledge Flow -->
    <div class="relative z-10 min-h-screen p-3 sm:p-6 lg:p-8 font-sans selection:bg-[#f59e0b] selection:text-black">
      <div class="max-w-7xl mx-auto space-y-4">
        <!-- Retro Workstation Header -->
        <app-retro-header
          [hasImage]="!!originalImage"
          (loadSample)="loadSamplePreset()"
          (clear)="handleClear()"
          (scrollToGuide)="scrollToGuide()"
          (startTour)="startGuidedTour()"
        ></app-retro-header>

        <!-- Interactive Automated Guided Walkthrough Banner -->
        @if (isTourActive && originalImage) {
          <app-guided-tour
            [currentStep]="tourCurrentStep"
            [totalSteps]="4"
            [currentStepInfo]="currentTourStepInfo"
            [autoPlay]="tourAutoPlay"
            [revertCountdown]="revertCountdown"
            [isSample]="isSampleImage"
            (nextStep)="advanceTourStep()"
            (prevStep)="retreatTourStep()"
            (toggleAutoPlay)="toggleTourAutoPlay()"
            (finishTour)="onTourFinish()"
            (stayAndEdit)="stopGuidedTour()"
          ></app-guided-tour>
        }

        <!-- State A: No Image Uploaded Yet -->
        @if (!originalImage) {
          <app-image-uploader
            (imageSelected)="handleImageFile($event, false)"
            (sampleSelected)="handleSampleSelected($event)"
          ></app-image-uploader>
        }

        <!-- State B: Image Loaded - Full Interactive Workstation -->
        @if (originalImage && loadedImageElement) {
          <div class="space-y-4">
            <!-- Mobile / Tablet Step Switcher -->
            <div class="lg:hidden flex items-center justify-between retro-box p-1 bg-[#1c1917] text-white font-mono text-xs">
              <button
                type="button"
                (click)="activeStepTab = 'crop'"
                [ngClass]="{
                  'bg-[#f59e0b] text-black': activeStepTab === 'crop',
                  'text-stone-400 hover:text-white': activeStepTab !== 'crop'
                }"
                class="flex-1 py-1.5 text-center font-bold flex items-center justify-center gap-1"
              >
                <svg lucideLayers class="w-3.5 h-3.5"></svg>
                1. CROP
              </button>
              <button
                type="button"
                (click)="activeStepTab = 'size'"
                [ngClass]="{
                  'bg-[#06b6d4] text-black': activeStepTab === 'size',
                  'text-stone-400 hover:text-white': activeStepTab !== 'size'
                }"
                class="flex-1 py-1.5 text-center font-bold flex items-center justify-center gap-1"
              >
                <svg lucideSliders class="w-3.5 h-3.5"></svg>
                2. SIZE &amp; FORMAT
              </button>
              <button
                type="button"
                (click)="activeStepTab = 'inspect'"
                [ngClass]="{
                  'bg-emerald-400 text-black': activeStepTab === 'inspect',
                  'text-stone-400 hover:text-white': activeStepTab !== 'inspect'
                }"
                class="flex-1 py-1.5 text-center font-bold flex items-center justify-center gap-1"
              >
                <svg lucideEye class="w-3.5 h-3.5"></svg>
                3. COMPARE
              </button>
            </div>

            <!-- Main Workstation 2-Column Responsive Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <!-- Left Column: Interactive Cropper & Presets -->
              <div
                class="lg:col-span-7 space-y-4 transition-all duration-300"
                [ngClass]="{
                  'hidden lg:block': activeStepTab !== 'crop',
                  'ring-4 ring-[#f59e0b] shadow-[0_0_30px_rgba(245,158,11,0.6)] rounded-xs': isTourActive && tourCurrentStep === 1
                }"
              >
                <!-- 1. Aspect Ratio Bar -->
                <app-aspect-preset-bar
                  [isTourStep1]="isTourActive && tourCurrentStep === 1"
                  [selectedRatioId]="selectedRatioId"
                  [rotation]="config.rotation"
                  [flipH]="config.flipHorizontal"
                  [flipV]="config.flipVertical"
                  [customRatioW]="customRatioW"
                  [customRatioH]="customRatioH"
                  (selectRatio)="handleSelectRatio($event)"
                  (applyPlatformPreset)="handleApplyPlatformPreset($event)"
                  (rotate)="handleChangeConfig({ rotation: $event })"
                  (toggleFlipH)="handleChangeConfig({ flipHorizontal: !config.flipHorizontal })"
                  (toggleFlipV)="handleChangeConfig({ flipVertical: !config.flipVertical })"
                  (customRatioChange)="handleCustomRatioChange($event)"
                ></app-aspect-preset-bar>

                <!-- 2. Interactive Cropper Viewport -->
                <div style="height: 480px">
                  <app-interactive-cropper
                    [isTourStep1]="isTourActive && tourCurrentStep === 1"
                    [imageSrc]="originalImage.dataUrl"
                    [imageNaturalWidth]="originalImage.width"
                    [imageNaturalHeight]="originalImage.height"
                    [aspectRatio]="aspectRatio"
                    [crop]="crop"
                    [rotation]="config.rotation"
                    [flipH]="config.flipHorizontal"
                    [flipV]="config.flipVertical"
                    (cropChange)="onCropChange($event)"
                  ></app-interactive-cropper>
                </div>
              </div>

              <!-- Right Column: Size Maintainer & Real-Time Inspection -->
              <div
                class="lg:col-span-5 space-y-4"
                [ngClass]="{ 'hidden lg:block': activeStepTab === 'crop' }"
              >
                <!-- 2. Dimensions & File Size Reducer -->
                <div
                  class="transition-all duration-300"
                  [ngClass]="{
                    'hidden lg:block': activeStepTab === 'inspect',
                    'ring-4 ring-[#06b6d4] shadow-[0_0_30px_rgba(6,182,212,0.6)] rounded-xs': isTourActive && tourCurrentStep === 2
                  }"
                >
                  <app-size-target-panel
                    [isTourStep2]="isTourActive && tourCurrentStep === 2"
                    [config]="config"
                    [cropWidth]="crop.width"
                    [cropHeight]="crop.height"
                    [originalSizeBytes]="originalImage.sizeBytes"
                    [isProcessing]="isProcessing"
                    (changeConfig)="handleChangeConfig($event)"
                  ></app-size-target-panel>
                </div>

                <!-- 3. Live Comparison & Telemetry -->
                <div
                  class="transition-all duration-300"
                  [ngClass]="{
                    'hidden lg:block': activeStepTab === 'size',
                    'ring-4 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.6)] rounded-xs': isTourActive && (tourCurrentStep === 3 || tourCurrentStep === 4)
                  }"
                >
                  <app-comparison-preview
                    [original]="originalImage"
                    [processed]="processedResult"
                    [targetKb]="config.sizeMode === 'target-kb' ? config.targetKb : undefined"
                    [isTourStep3]="isTourActive && tourCurrentStep === 3"
                    [isTourStep4]="isTourActive && tourCurrentStep === 4"
                    [tourSplitPos]="tourSplitPos"
                    (download)="handleDownload()"
                  ></app-comparison-preview>
                </div>
              </div>
            </div>

            <!-- Quick Sticky Bottom Bar for Mobile Download -->
            @if (processedResult) {
              <div class="lg:hidden sticky bottom-3 z-30 retro-box bg-[#1c1917] p-2.5 flex items-center justify-between text-white font-mono text-xs shadow-2xl">
                <div class="flex flex-col">
                  <span class="font-bold text-amber-400">
                    {{ processedResult.width }}×{{ processedResult.height }} PX
                  </span>
                  <span class="text-[10px] text-stone-400">
                    {{ processedResult.sizeKb.toFixed(1) }} KB ({{ processedResult.compressionRatio }}%)
                  </span>
                </div>
                <button
                  type="button"
                  (click)="handleDownload()"
                  class="retro-btn-accent px-4 py-2 text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <svg lucideDownload class="w-4 h-4"></svg>
                  DOWNLOAD
                </button>
              </div>
            }
          </div>
        }

        <!-- SEO & Knowledge Base Guide Section -->
        <app-seo-guide-section></app-seo-guide-section>
      </div>
    </div>
  `
})
export class App implements OnInit, OnDestroy {
  originalImage: OriginalImageInfo | null = null;
  loadedImageElement: HTMLImageElement | null = null;

  selectedRatioId = 'free';
  aspectRatio: number | null = null;
  customRatioW = 4;
  customRatioH = 3;

  crop: CropArea = { x: 0, y: 0, width: 800, height: 600 };

  config: ProcessConfig = {
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

  processedResult: ProcessedResult | null = null;
  isProcessing = false;
  activeStepTab: 'crop' | 'size' | 'inspect' = 'crop';
  isSampleImage = false;

  // Guided Tour State
  isTourActive = false;
  tourCurrentStep = 1;
  tourAutoPlay = true;
  tourSplitPos: number | null = null;
  revertCountdown: number | null = null;
  private tourTimer: number | null = null;
  private tourWiperInterval: number | null = null;
  private tourCountdownInterval: number | null = null;

  readonly tourSteps: TourStepInfo[] = [
    {
      step: 1,
      badge: 'STEP 1: ASPECT RATIO LOCK',
      title: '1. Frame Selection & Proportional Lock',
      description: 'The workstation locks your aspect ratio so photos never get awkwardly stretched or distorted. Follow the arrows 👇 pointing to preset ratios (16:9 Cinema, 1:1 Square, 4:5 Portrait) and drag the yellow corner handles ↖️ to custom crop or pan.',
      actionNote: 'Follow the arrows 👇: 16:9 widescreen frame locked! Drag corner handles ↖️ to crop.'
    },
    {
      step: 2,
      badge: 'STEP 2: SIZE & TARGET KB REDUCTION',
      title: '2. Scale Dimensions & Hit Exact File Size (KB)',
      description: 'Need to satisfy strict visa upload limits (under 200 KB) or web budgets? Follow the arrows 👇 to scale pixel dimensions (Step 2A), set your exact target file size in KB (Step 2B), and pick next-gen WebP or AVIF format (Step 2C).',
      actionNote: 'Follow the arrows 👇: Output constrained to 150 KB max in modern WebP format!'
    },
    {
      step: 3,
      badge: 'STEP 3: LIVE INSPECTION & COMPARISON',
      title: '3. Inspect Quality with the Live Split Wiper',
      description: 'Follow the split arrows ↔️: Drag the interactive wiper across the viewport to compare before vs after. Check the telemetry metrics 👇 for exact byte reduction, saved percentages, and resolution fidelity.',
      actionNote: 'Notice the split wiper ↔️ moving across! Real-time telemetry 👇 displays instant byte savings.'
    },
    {
      step: 4,
      badge: 'STEP 4: INSTANT EXPORT & AUTO-REVERT',
      title: '4. Download Your Maintained Image',
      description: 'Notice the highlighted DOWNLOAD button below 👇! In this demo walkthrough, we highlight where to download without downloading unprompted files to your drive.',
      actionNote: 'Notice the highlighted DOWNLOAD button 👇!'
    }
  ];

  get currentTourStepInfo(): TourStepInfo {
    const base = this.tourSteps[this.tourCurrentStep - 1] || this.tourSteps[0];
    if (this.tourCurrentStep === 4) {
      if (this.isSampleImage) {
        return {
          step: 4,
          badge: 'STEP 4: INSTANT EXPORT & AUTO-REVERT',
          title: '4. Download Output (Demo Auto-Reverts To Upload)',
          description: 'Notice the highlighted DOWNLOAD button below 👇! In this sample walkthrough, we highlight where to download without downloading unprompted files. Once finished, the workstation automatically reverts back so you can upload your own image.',
          actionNote: 'Notice the highlighted DOWNLOAD button 👇! Reverting back to your upload screen in a few seconds...'
        };
      } else {
        return {
          step: 4,
          badge: 'STEP 4: INSTANT EXPORT',
          title: '4. Download Your Processed Image',
          description: 'Your photo framing and compression settings are locked and ready! Click the highlighted DOWNLOAD button below 👇 to export your file. Everything stays right here on your screen so you can continue editing.',
          actionNote: 'Notice the highlighted DOWNLOAD button 👇! Tour will close and keep your photo ready.'
        };
      }
    }
    return base;
  }

  private debounceTimer: number | null = null;

  ngOnInit() {}

  ngOnDestroy() {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }
    this.clearTourTimers();
  }

  @HostListener('window:paste', ['$event'])
  handlePaste(e: ClipboardEvent) {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        this.handleImageFile(file, false);
      }
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async handleImageFile(file: File, isSample = false): Promise<void> {
    try {
      this.isSampleImage = isSample;
      const dataUrl = await this.readFileAsDataUrl(file);
      const img = await loadImage(dataUrl);

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

      this.originalImage = info;
      this.loadedImageElement = img;
      this.crop = initialCrop;
      this.selectedRatioId = 'free';
      this.aspectRatio = null;

      const targetSizeKb = Math.min(300, Math.max(50, Math.round((file.size / 1024) * 0.4)));

      this.config = {
        ...this.config,
        targetWidth: naturalW,
        targetHeight: naturalH,
        targetKb: targetSizeKb,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false
      };

      this.triggerProcessing();
    } catch (err) {
      console.error('Failed to load image file:', err);
    }
  }

  async handleSampleSelected(sample: { url: string; name: string }) {
    try {
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File(
        [blob],
        `${sample.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`,
        { type: 'image/jpeg' }
      );
      await this.handleImageFile(file, true);
      // Automatically activate the complete step-by-step guided walkthrough!
      this.startGuidedTour(sample.name);
    } catch (err) {
      console.error('Failed to load demo sample:', err);
    }
  }

  loadSamplePreset() {
    this.handleSampleSelected({
      url: 'samples/landscape-nature.jpg',
      name: 'mountain_landscape_4k'
    });
  }

  startGuidedTour(sampleName = '') {
    if (!this.originalImage) {
      this.loadSamplePreset();
      return;
    }
    this.isTourActive = true;
    this.tourAutoPlay = true;
    this.tourCurrentStep = 1;
    this.executeTourStep(1, sampleName);
  }

  onTourFinish() {
    if (this.isSampleImage) {
      // Demo started from a sample image -> redirect/revert to initial upload stage
      this.finishTourAndResetToUpload();
    } else {
      // User uploaded their own image -> KEEP their photo and workstation state intact!
      this.stopGuidedTour();
    }
  }

  finishTourAndResetToUpload() {
    this.stopGuidedTour();
    this.handleClear();
  }

  stopGuidedTour() {
    this.isTourActive = false;
    this.clearTourTimers();
    this.tourSplitPos = null;
  }

  advanceTourStep() {
    if (this.tourCurrentStep < 4) {
      this.tourCurrentStep++;
      this.executeTourStep(this.tourCurrentStep);
    } else {
      this.onTourFinish();
    }
  }

  retreatTourStep() {
    if (this.tourCurrentStep > 1) {
      this.tourCurrentStep--;
      this.executeTourStep(this.tourCurrentStep);
    }
  }

  toggleTourAutoPlay() {
    this.tourAutoPlay = !this.tourAutoPlay;
    if (this.tourAutoPlay) {
      if (this.tourCurrentStep < 4) {
        this.scheduleNextTourStep();
      } else {
        this.scheduleRevertCountdown();
      }
    } else {
      if (this.tourTimer) {
        window.clearTimeout(this.tourTimer);
        this.tourTimer = null;
      }
      if (this.tourCountdownInterval) {
        window.clearInterval(this.tourCountdownInterval);
        this.tourCountdownInterval = null;
      }
    }
  }

  private clearTourTimers() {
    if (this.tourTimer) {
      window.clearTimeout(this.tourTimer);
      this.tourTimer = null;
    }
    if (this.tourWiperInterval) {
      window.clearInterval(this.tourWiperInterval);
      this.tourWiperInterval = null;
    }
    if (this.tourCountdownInterval) {
      window.clearInterval(this.tourCountdownInterval);
      this.tourCountdownInterval = null;
    }
    this.revertCountdown = null;
  }

  private scheduleNextTourStep() {
    if (this.tourTimer) {
      window.clearTimeout(this.tourTimer);
    }
    if (!this.tourAutoPlay || this.tourCurrentStep >= 4) return;

    this.tourTimer = window.setTimeout(() => {
      if (this.isTourActive && this.tourAutoPlay && this.tourCurrentStep < 4) {
        this.advanceTourStep();
      }
    }, 6500);
  }

  private scheduleRevertCountdown() {
    if (this.tourCountdownInterval) {
      window.clearInterval(this.tourCountdownInterval);
    }
    this.revertCountdown = 6;
    this.tourCountdownInterval = window.setInterval(() => {
      if (!this.isTourActive || !this.tourAutoPlay) {
        this.clearTourTimers();
        return;
      }
      if (this.revertCountdown !== null && this.revertCountdown > 1) {
        this.revertCountdown--;
      } else {
        this.clearTourTimers();
        this.onTourFinish();
      }
    }, 1000);
  }

  private executeTourStep(step: number, sampleName = '') {
    this.clearTourTimers();

    if (step === 1) {
      // Step 1: Crop & Aspect Ratio
      this.activeStepTab = 'crop';
      this.tourSplitPos = null;
      const isPortrait = sampleName.toLowerCase().includes('portrait') || sampleName.toLowerCase().includes('avatar');
      const ratioId = isPortrait ? '1:1' : '16:9';
      const ratioVal = isPortrait ? 1 : 16 / 9;
      this.handleSelectRatio({ id: ratioId, ratio: ratioVal });
    } else if (step === 2) {
      // Step 2: Target Size / Scale
      this.activeStepTab = 'size';
      this.tourSplitPos = null;
      this.handleChangeConfig({
        sizeMode: 'target-kb',
        targetKb: 150,
        format: 'image/webp'
      });
    } else if (step === 3) {
      // Step 3: Comparison Preview with animated Split Wiper
      this.activeStepTab = 'inspect';
      let pos = 35;
      let forward = true;
      this.tourSplitPos = pos;
      this.tourWiperInterval = window.setInterval(() => {
        if (forward) {
          pos += 1.5;
          if (pos >= 75) forward = false;
        } else {
          pos -= 1.5;
          if (pos <= 30) forward = true;
        }
        this.tourSplitPos = Math.round(pos);
      }, 50);
    } else if (step === 4) {
      // Step 4: Download Highlight & Auto-Revert after preview
      this.activeStepTab = 'inspect';
      this.tourSplitPos = 50;
      if (this.tourAutoPlay) {
        this.scheduleRevertCountdown();
      }
    }

    if (this.tourAutoPlay && step < 4) {
      this.scheduleNextTourStep();
    }
  }

  handleSelectRatio(event: { id: string; ratio: number | null }) {
    this.selectedRatioId = event.id;

    if (event.id === 'free') {
      this.aspectRatio = null;
      return;
    }

    if (event.id === 'custom') {
      const customRatio = this.customRatioW / this.customRatioH;
      this.aspectRatio = customRatio;
      this.applyAspectRatioToCrop(customRatio);
      return;
    }

    if (event.ratio) {
      this.aspectRatio = event.ratio;
      this.applyAspectRatioToCrop(event.ratio);
    }
  }

  handleCustomRatioChange(event: { w: number; h: number }) {
    this.customRatioW = event.w;
    this.customRatioH = event.h;
    const customRatio = event.w / event.h;
    this.aspectRatio = customRatio;
    this.applyAspectRatioToCrop(customRatio);
  }

  applyAspectRatioToCrop(ratio: number) {
    if (!this.loadedImageElement) return;
    const isRotated90 = Math.abs(this.config.rotation % 180) === 90;
    const effW = isRotated90
      ? this.loadedImageElement.naturalHeight
      : this.loadedImageElement.naturalWidth;
    const effH = isRotated90
      ? this.loadedImageElement.naturalWidth
      : this.loadedImageElement.naturalHeight;

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

    this.crop = {
      x: newX,
      y: newY,
      width: newW,
      height: newH
    };

    if (this.config.maintainAspectRatio) {
      this.config = {
        ...this.config,
        targetWidth: newW,
        targetHeight: newH
      };
    }

    this.triggerProcessing();
  }

  handleApplyPlatformPreset(preset: PlatformPreset) {
    this.selectedRatioId = preset.aspectRatio;
    this.aspectRatio = preset.ratioValue;
    this.applyAspectRatioToCrop(preset.ratioValue);

    this.config = {
      ...this.config,
      targetWidth: preset.targetWidth,
      targetHeight: preset.targetHeight,
      format: preset.recommendedFormat,
      targetKb: preset.recommendedMaxKb || this.config.targetKb,
      sizeMode: preset.recommendedMaxKb ? 'target-kb' : this.config.sizeMode
    };

    this.triggerProcessing();
  }

  onCropChange(newCrop: CropArea) {
    this.crop = newCrop;
    if (this.config.maintainAspectRatio) {
      this.config = {
        ...this.config,
        targetWidth: newCrop.width,
        targetHeight: newCrop.height
      };
    }
    this.triggerProcessing();
  }

  handleChangeConfig(patch: Partial<ProcessConfig>) {
    this.config = { ...this.config, ...patch };
    this.triggerProcessing();
  }

  triggerProcessing() {
    if (!this.loadedImageElement || !this.originalImage) return;

    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }

    this.isProcessing = true;
    this.debounceTimer = window.setTimeout(async () => {
      try {
        if (this.loadedImageElement && this.originalImage) {
          const result = await processImage(
            this.loadedImageElement,
            this.crop,
            this.config,
            this.originalImage.name,
            this.originalImage.sizeBytes
          );
          this.processedResult = result;
        }
      } catch (err) {
        console.error('Processing error:', err);
      } finally {
        this.isProcessing = false;
      }
    }, 120);
  }

  handleDownload() {
    if (!this.processedResult) return;
    const a = document.createElement('a');
    a.href = this.processedResult.dataUrl;
    a.download = this.processedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  handleClear() {
    this.stopGuidedTour();
    this.originalImage = null;
    this.loadedImageElement = null;
    this.processedResult = null;
    this.isSampleImage = false;
  }

  scrollToGuide() {
    const el = document.getElementById('seo-guide');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

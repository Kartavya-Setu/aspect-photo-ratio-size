import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideLayers,
  LucideSliders,
  LucideEye,
  LucideDownload
} from '@lucide/angular';
import { AspectPresetBarComponent } from './components/aspect-preset-bar/aspect-preset-bar.component';
import { InteractiveCropperComponent } from './components/interactive-cropper/interactive-cropper.component';
import { SizeTargetPanelComponent } from './components/size-target-panel/size-target-panel.component';
import { ComparisonPreviewComponent } from './components/comparison-preview/comparison-preview.component';
import { AiCommandBarComponent } from './components/ai-command-bar/ai-command-bar.component';
import { WorkstationStateService, GuidedTourService } from '@core/services';
import { PlatformPreset, ProcessConfig, CropArea } from '@core/models';

@Component({
  selector: 'app-workstation',
  standalone: true,
  imports: [
    CommonModule,
    LucideLayers,
    LucideSliders,
    LucideEye,
    LucideDownload,
    AspectPresetBarComponent,
    InteractiveCropperComponent,
    SizeTargetPanelComponent,
    ComparisonPreviewComponent,
    AiCommandBarComponent
  ],
  template: `
    @if (state.originalImage() && state.loadedImageElement()) {
      <div class="space-y-4">
        <!-- AI Command Copilot -->
        <app-ai-command-bar></app-ai-command-bar>

        <!-- Mobile / Tablet Step Switcher -->
        <div class="lg:hidden flex items-center justify-between retro-box p-1 bg-[#1c1917] text-white font-mono text-xs">
          <button
            type="button"
            (click)="state.setActiveTab('crop')"
            [ngClass]="{
              'bg-[#f59e0b] text-black': state.activeStepTab() === 'crop',
              'text-stone-400 hover:text-white': state.activeStepTab() !== 'crop'
            }"
            class="flex-1 py-1.5 text-center font-bold flex items-center justify-center gap-1"
          >
            <svg lucideLayers class="w-3.5 h-3.5"></svg>
            1. CROP
          </button>
          <button
            type="button"
            (click)="state.setActiveTab('size')"
            [ngClass]="{
              'bg-[#06b6d4] text-black': state.activeStepTab() === 'size',
              'text-stone-400 hover:text-white': state.activeStepTab() !== 'size'
            }"
            class="flex-1 py-1.5 text-center font-bold flex items-center justify-center gap-1"
          >
            <svg lucideSliders class="w-3.5 h-3.5"></svg>
            2. SIZE &amp; FORMAT
          </button>
          <button
            type="button"
            (click)="state.setActiveTab('inspect')"
            [ngClass]="{
              'bg-emerald-400 text-black': state.activeStepTab() === 'inspect',
              'text-stone-400 hover:text-white': state.activeStepTab() !== 'inspect'
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
              'hidden lg:block': state.activeStepTab() !== 'crop',
              'ring-4 ring-[#f59e0b] shadow-[0_0_30px_rgba(245,158,11,0.6)] rounded-xs':
                tourService.isTourActive() && tourService.currentStep() === 1
            }"
          >
            <!-- 1. Aspect Ratio Bar -->
            <app-aspect-preset-bar
              [isTourStep1]="tourService.isTourActive() && tourService.currentStep() === 1"
              [selectedRatioId]="state.selectedRatioId()"
              [rotation]="state.config().rotation"
              [flipH]="state.config().flipHorizontal"
              [flipV]="state.config().flipVertical"
              [customRatioW]="state.customRatioW()"
              [customRatioH]="state.customRatioH()"
              (selectRatio)="state.selectRatio($event)"
              (applyPlatformPreset)="state.applyPlatformPreset($event)"
              (rotate)="state.updateConfig({ rotation: $event })"
              (toggleFlipH)="state.updateConfig({ flipHorizontal: !state.config().flipHorizontal })"
              (toggleFlipV)="state.updateConfig({ flipVertical: !state.config().flipVertical })"
              (customRatioChange)="state.setCustomRatio($event)"
            ></app-aspect-preset-bar>

            <!-- 2. Interactive Cropper Viewport -->
            <div style="height: 480px">
              <app-interactive-cropper
                [isTourStep1]="tourService.isTourActive() && tourService.currentStep() === 1"
                [imageSrc]="state.originalImage()!.dataUrl"
                [imageNaturalWidth]="state.originalImage()!.width"
                [imageNaturalHeight]="state.originalImage()!.height"
                [aspectRatio]="state.aspectRatio()"
                [crop]="state.crop()"
                [rotation]="state.config().rotation"
                [flipH]="state.config().flipHorizontal"
                [flipV]="state.config().flipVertical"
                (cropChange)="state.updateCrop($event)"
              ></app-interactive-cropper>
            </div>
          </div>

          <!-- Right Column: Size Maintainer & Real-Time Inspection -->
          <div
            class="lg:col-span-5 space-y-4"
            [ngClass]="{ 'hidden lg:block': state.activeStepTab() === 'crop' }"
          >
            <!-- 2. Dimensions & File Size Reducer -->
            <div
              class="transition-all duration-300"
              [ngClass]="{
                'hidden lg:block': state.activeStepTab() === 'inspect',
                'ring-4 ring-[#06b6d4] shadow-[0_0_30px_rgba(6,182,212,0.6)] rounded-xs':
                  tourService.isTourActive() && tourService.currentStep() === 2
              }"
            >
              <app-size-target-panel
                [isTourStep2]="tourService.isTourActive() && tourService.currentStep() === 2"
                [config]="state.config()"
                [cropWidth]="state.crop().width"
                [cropHeight]="state.crop().height"
                [originalSizeBytes]="state.originalImage()!.sizeBytes"
                [isProcessing]="state.isProcessing()"
                (changeConfig)="state.updateConfig($event)"
              ></app-size-target-panel>
            </div>

            <!-- 3. Live Comparison & Telemetry -->
            <div
              class="transition-all duration-300"
              [ngClass]="{
                'hidden lg:block': state.activeStepTab() === 'size',
                'ring-4 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.6)] rounded-xs':
                  tourService.isTourActive() &&
                  (tourService.currentStep() === 3 || tourService.currentStep() === 4)
              }"
            >
              <app-comparison-preview
                [original]="state.originalImage()!"
                [processed]="state.processedResult()"
                [targetKb]="state.config().sizeMode === 'target-kb' ? state.config().targetKb : undefined"
                [isTourStep3]="tourService.isTourActive() && tourService.currentStep() === 3"
                [isTourStep4]="tourService.isTourActive() && tourService.currentStep() === 4"
                [tourSplitPos]="tourService.splitPos()"
                (download)="state.download()"
              ></app-comparison-preview>
            </div>
          </div>
        </div>

        <!-- Quick Sticky Bottom Bar for Mobile Download -->
        @if (state.processedResult()) {
          <div class="lg:hidden sticky bottom-3 z-30 retro-box bg-[#1c1917] p-2.5 flex items-center justify-between text-white font-mono text-xs shadow-2xl">
            <div class="flex flex-col">
              <span class="font-bold text-amber-400">
                {{ state.processedResult()!.width }}×{{ state.processedResult()!.height }} PX
              </span>
              <span class="text-[10px] text-stone-400">
                {{ state.processedResult()!.sizeKb.toFixed(1) }} KB ({{ state.processedResult()!.compressionRatio }}%)
              </span>
            </div>
            <button
              type="button"
              (click)="state.download()"
              class="retro-btn-accent px-4 py-2 text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <svg lucideDownload class="w-4 h-4"></svg>
              DOWNLOAD
            </button>
          </div>
        }
      </div>
    }
  `
})
export class WorkstationComponent {
  readonly state = inject(WorkstationStateService);
  readonly tourService = inject(GuidedTourService);
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideLock,
  LucideLockOpen,
  LucideZap,
  LucideSliders,
  LucideCircleCheck
} from '@lucide/angular';
import { ProcessConfig, ImageFormat } from '../../types';

interface TargetSizePreset {
  label: string;
  kb: number;
}

interface FormatOption {
  format: ImageFormat;
  label: string;
  desc: string;
}

interface BgOption {
  label: string;
  color: string;
}

@Component({
  selector: 'app-size-target-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideLock,
    LucideLockOpen,
    LucideZap,
    LucideSliders,
    LucideCircleCheck
  ],
  template: `
    <div class="retro-box p-4 space-y-4">
      <div class="flex items-center justify-between pb-2 retro-border-b">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-[#06b6d4]"></span>
          <h3 class="font-mono font-bold text-sm text-stone-900 tracking-wide">
            2. DIMENSIONS &amp; FILE SIZE REDUCER
          </h3>
        </div>
        @if (isProcessing) {
          <span class="text-[11px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 retro-border animate-pulse font-bold">
            OPTIMIZING...
          </span>
        }
      </div>

      <!-- Section A: Pixel Dimensions -->
      <div class="space-y-2">
        @if (isTourStep2) {
          <div class="bg-[#06b6d4] text-[#082f49] border-2 border-black px-2 py-0.5 text-[10px] font-mono font-bold shadow-[2px_2px_0px_#000] inline-flex items-center gap-1.5 animate-bounce mb-1">
            <span>👇 STEP 2A: SCALE PIXELS OR LOCK ASPECT RATIO</span>
          </div>
        }
        <div class="flex items-center justify-between">
          <label class="font-mono text-xs font-bold text-stone-800 flex items-center gap-1.5">
            OUTPUT DIMENSIONS (PX)
          </label>
          <div class="flex items-center gap-1">
            <span class="text-[11px] font-mono text-stone-500 mr-1">Scale:</span>
            @for (multiplier of [0.25, 0.5, 0.75, 1, 1.5]; track multiplier) {
              <button
                type="button"
                (click)="applyScale(multiplier)"
                class="px-1.5 py-0.5 text-[10px] font-mono bg-white retro-border hover:bg-stone-100"
              >
                {{ multiplier * 100 }}%
              </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          <div class="sm:col-span-5 flex items-center bg-white retro-border px-2 py-1.5">
            <span class="font-mono text-xs text-stone-500 w-12 font-bold">WIDTH:</span>
            <input
              type="number"
              min="16"
              max="10000"
              [ngModel]="config.targetWidth"
              (ngModelChange)="onWidthChange($event)"
              class="w-full font-mono text-sm font-bold text-stone-900 outline-none bg-transparent"
            />
            <span class="font-mono text-xs text-stone-400">PX</span>
          </div>

          <div class="sm:col-span-2 flex justify-center">
            <button
              type="button"
              (click)="toggleMaintainAspectRatio()"
              [title]="config.maintainAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'"
              [ngClass]="{
                'bg-[#1c1917] text-[#fbbf24]': config.maintainAspectRatio,
                'bg-white text-stone-600': !config.maintainAspectRatio
              }"
              class="p-2 retro-border text-xs flex items-center gap-1 font-mono"
            >
              @if (config.maintainAspectRatio) {
                <svg lucideLock class="w-3.5 h-3.5"></svg>
                <span class="text-[10px] font-bold">LOCK</span>
              } @else {
                <svg lucideLockOpen class="w-3.5 h-3.5"></svg>
                <span class="text-[10px]">FREE</span>
              }
            </button>
          </div>

          <div class="sm:col-span-5 flex items-center bg-white retro-border px-2 py-1.5">
            <span class="font-mono text-xs text-stone-500 w-14 font-bold">HEIGHT:</span>
            <input
              type="number"
              min="16"
              max="10000"
              [ngModel]="config.targetHeight"
              (ngModelChange)="onHeightChange($event)"
              class="w-full font-mono text-sm font-bold text-stone-900 outline-none bg-transparent"
            />
            <span class="font-mono text-xs text-stone-400">PX</span>
          </div>
        </div>
      </div>

      <!-- Section B: Target File Size & Compression -->
      <div class="pt-2 retro-border-t space-y-3">
        <div class="flex items-center justify-between">
          <label class="font-mono text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <svg lucideZap class="w-3.5 h-3.5 text-amber-500"></svg>
            SIZE REDUCTION &amp; COMPRESSION
          </label>

          <div class="flex items-center gap-1 font-mono text-xs">
            <button
              type="button"
              (click)="updateConfig({ sizeMode: 'target-kb' })"
              [ngClass]="{
                'bg-[#1c1917] text-[#fbbf24]': config.sizeMode === 'target-kb',
                'bg-white text-stone-700 hover:bg-stone-100': config.sizeMode !== 'target-kb'
              }"
              class="px-2 py-1 text-[11px] retro-border font-bold"
            >
              TARGET FILE SIZE (KB)
            </button>
            <button
              type="button"
              (click)="updateConfig({ sizeMode: 'manual-quality' })"
              [ngClass]="{
                'bg-[#1c1917] text-[#fbbf24]': config.sizeMode === 'manual-quality',
                'bg-white text-stone-700 hover:bg-stone-100': config.sizeMode !== 'manual-quality'
              }"
              class="px-2 py-1 text-[11px] retro-border font-bold"
            >
              QUALITY %
            </button>
            <button
              type="button"
              (click)="updateConfig({ sizeMode: 'lossless' })"
              [ngClass]="{
                'bg-[#1c1917] text-[#fbbf24]': config.sizeMode === 'lossless',
                'bg-white text-stone-700 hover:bg-stone-100': config.sizeMode !== 'lossless'
              }"
              class="px-2 py-1 text-[11px] retro-border font-bold"
            >
              LOSSLESS
            </button>
          </div>
        </div>

        <!-- Mode: Target KB -->
        @if (config.sizeMode === 'target-kb') {
          <div class="bg-amber-50/70 p-3 retro-border space-y-2.5">
            @if (isTourStep2) {
              <div class="bg-[#f59e0b] text-black border-2 border-black px-2 py-0.5 text-[10px] font-mono font-bold shadow-[2px_2px_0px_#000] inline-flex items-center gap-1.5 animate-bounce mb-1">
                <span>👇 STEP 2B: ENTER EXACT TARGET KB (E.G. 150 KB)</span>
              </div>
            }
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-mono font-bold text-stone-800">
                MAX ALLOWED FILE SIZE:
              </span>
              <div class="flex items-center gap-1.5">
                <input
                  type="number"
                  min="5"
                  max="50000"
                  step="5"
                  [ngModel]="config.targetKb"
                  (ngModelChange)="onTargetKbChange($event)"
                  class="w-24 px-2 py-1 font-mono text-sm font-bold bg-white retro-border text-stone-900 text-right"
                />
                <span class="font-mono text-xs font-bold text-stone-700">KB</span>
                <span class="font-mono text-[11px] text-stone-500">
                  ({{ (config.targetKb / 1024).toFixed(2) }} MB)
                </span>
              </div>
            </div>

            <!-- Quick target size buttons -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                Common Targets:
              </span>
              @for (preset of targetSizePresets; track preset.kb) {
                <button
                  type="button"
                  (click)="updateConfig({ targetKb: preset.kb })"
                  [ngClass]="{
                    'bg-[#1c1917] text-white font-bold': config.targetKb === preset.kb,
                    'bg-white hover:bg-stone-100 text-stone-800': config.targetKb !== preset.kb
                  }"
                  class="px-2 py-0.5 text-[11px] font-mono retro-border"
                >
                  {{ preset.label }}
                </button>
              }
            </div>

            <p class="text-[11px] font-mono text-stone-600 leading-tight">
              Auto-optimizes canvas compression and binary quality search to ensure final file does not exceed {{ config.targetKb }} KB.
            </p>
          </div>
        }

        <!-- Mode: Manual Quality Slider -->
        @if (config.sizeMode === 'manual-quality') {
          <div class="bg-white p-3 retro-border space-y-2">
            <div class="flex justify-between items-center text-xs font-mono font-bold">
              <span>COMPRESSION QUALITY:</span>
              <span class="text-amber-600">{{ Math.round(config.quality * 100) }}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.01"
              [ngModel]="config.quality"
              (ngModelChange)="updateConfig({ quality: $event })"
              class="w-full accent-amber-500 cursor-pointer"
            />
            <div class="flex justify-between text-[10px] font-mono text-stone-500">
              <span>Lowest Size (5%)</span>
              <span>Balanced (80%)</span>
              <span>Near-Lossless (100%)</span>
            </div>
          </div>
        }

        <!-- Mode: Lossless -->
        @if (config.sizeMode === 'lossless') {
          <div class="bg-emerald-50 p-2.5 retro-border text-xs font-mono text-emerald-900 flex items-center gap-2">
            <svg lucideCircleCheck class="w-4 h-4 text-emerald-600 shrink-0"></svg>
            <span>Lossless 100% precision reproduction without compression artifacts.</span>
          </div>
        }
      </div>

      <!-- Section C: Target Format & Background -->
      <div class="pt-2 retro-border-t space-y-2">
        @if (isTourStep2) {
          <div class="bg-emerald-400 text-stone-900 border-2 border-black px-2 py-0.5 text-[10px] font-mono font-bold shadow-[2px_2px_0px_#000] inline-flex items-center gap-1.5 animate-bounce mb-1">
            <span>👇 STEP 2C: PICK OUTPUT FORMAT (WEBP, JPEG, PNG, AVIF)</span>
          </div>
        }
        <label class="font-mono text-xs font-bold text-stone-800 flex items-center gap-1.5">
          <svg lucideSliders class="w-3.5 h-3.5 text-stone-700"></svg>
          TARGET FILE FORMAT &amp; CONVERSION
        </label>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          @for (item of formats; track item.format) {
            <button
              type="button"
              (click)="updateConfig({ format: item.format })"
              [ngClass]="{
                'bg-[#1c1917] text-white shadow-[2px_2px_0px_#f59e0b]': config.format === item.format,
                'bg-white hover:bg-stone-50 text-stone-900': config.format !== item.format
              }"
              class="p-2 text-left retro-border transition-colors"
            >
              <div class="font-mono text-xs font-bold">{{ item.label }}</div>
              <div class="text-[10px] font-mono text-stone-400 mt-0.5 line-clamp-1">
                {{ item.desc }}
              </div>
            </button>
          }
        </div>

        <!-- Background color choice -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 bg-stone-100 p-2 retro-border">
          <span class="font-mono text-xs text-stone-700 font-bold">
            BACKGROUND FILL (IF TRANSPARENT):
          </span>
          <div class="flex items-center gap-2">
            @for (bg of bgOptions; track bg.color) {
              <button
                type="button"
                (click)="updateConfig({ backgroundColor: bg.color })"
                [ngClass]="{
                  'bg-[#1c1917] text-white font-bold': config.backgroundColor === bg.color,
                  'bg-white text-stone-800': config.backgroundColor !== bg.color
                }"
                class="px-2 py-0.5 text-[11px] font-mono retro-border flex items-center gap-1"
              >
                <span
                  class="w-2.5 h-2.5 border border-stone-800 inline-block"
                  [style.backgroundColor]="bg.color"
                ></span>
                {{ bg.label }}
              </button>
            }
            <input
              type="color"
              [ngModel]="config.backgroundColor.startsWith('#') ? config.backgroundColor : '#ffffff'"
              (ngModelChange)="updateConfig({ backgroundColor: $event })"
              title="Custom Hex Background Color"
              class="w-7 h-6 p-0 border border-black cursor-pointer bg-transparent"
            />
          </div>
        </div>

        <!-- Extra tuning: Resampling mode & Sharpening -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs text-stone-700">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              [ngModel]="config.pixelated"
              (ngModelChange)="updateConfig({ pixelated: $event })"
              class="accent-[#1c1917] cursor-pointer"
            />
            <span>Retro Pixelated (Nearest-Neighbor)</span>
          </label>

          <label class="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              [ngModel]="config.sharpening"
              (ngModelChange)="updateConfig({ sharpening: $event })"
              class="accent-[#1c1917] cursor-pointer"
            />
            <span>Edge Clarification (Sharpen)</span>
          </label>
        </div>
      </div>
    </div>
  `
})
export class SizeTargetPanelComponent {
  @Input() isTourStep2 = false;
  @Input() config!: ProcessConfig;
  @Input() cropWidth = 800;
  @Input() cropHeight = 600;
  @Input() originalSizeBytes = 0;
  @Input() isProcessing = false;

  @Output() changeConfig = new EventEmitter<Partial<ProcessConfig>>();

  readonly Math = Math;

  readonly targetSizePresets: TargetSizePreset[] = [
    { label: '50 KB', kb: 50 },
    { label: '100 KB', kb: 100 },
    { label: '200 KB', kb: 200 },
    { label: '500 KB', kb: 500 },
    { label: '1 MB', kb: 1024 },
    { label: '2 MB', kb: 2048 }
  ];

  readonly formats: FormatOption[] = [
    { format: 'image/webp', label: 'WEBP', desc: 'Modern high compression (lossy/lossless)' },
    { format: 'image/jpeg', label: 'JPEG', desc: 'Universal compatibility for photos' },
    { format: 'image/png', label: 'PNG', desc: 'Sharp graphics with transparency' },
    { format: 'image/avif', label: 'AVIF', desc: 'Next-gen maximum compression' }
  ];

  readonly bgOptions: BgOption[] = [
    { label: 'White', color: '#ffffff' },
    { label: 'Black', color: '#000000' },
    { label: 'Retro Cream', color: '#f7f4ee' }
  ];

  updateConfig(patch: Partial<ProcessConfig>) {
    this.changeConfig.emit(patch);
  }

  applyScale(multiplier: number) {
    const newW = Math.max(16, Math.round(this.cropWidth * multiplier));
    const newH = Math.max(16, Math.round(this.cropHeight * multiplier));
    this.changeConfig.emit({
      targetWidth: newW,
      targetHeight: newH
    });
  }

  onWidthChange(value: number) {
    const val = Math.max(16, Number(value) || 16);
    if (this.config.maintainAspectRatio && this.cropWidth > 0) {
      const ratio = this.cropHeight / this.cropWidth;
      this.changeConfig.emit({
        targetWidth: val,
        targetHeight: Math.max(16, Math.round(val * ratio))
      });
    } else {
      this.changeConfig.emit({ targetWidth: val });
    }
  }

  onHeightChange(value: number) {
    const val = Math.max(16, Number(value) || 16);
    if (this.config.maintainAspectRatio && this.cropHeight > 0) {
      const ratio = this.cropWidth / this.cropHeight;
      this.changeConfig.emit({
        targetHeight: val,
        targetWidth: Math.max(16, Math.round(val * ratio))
      });
    } else {
      this.changeConfig.emit({ targetHeight: val });
    }
  }

  toggleMaintainAspectRatio() {
    this.changeConfig.emit({ maintainAspectRatio: !this.config.maintainAspectRatio });
  }

  onTargetKbChange(value: number) {
    const val = Math.max(5, Number(value) || 50);
    this.changeConfig.emit({ targetKb: val });
  }
}

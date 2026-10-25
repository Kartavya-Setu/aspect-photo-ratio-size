import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideSparkles,
  LucideRotateCw,
  LucideRotateCcw
} from '@lucide/angular';
import { ASPECT_RATIO_PRESETS, PLATFORM_PRESETS } from '@core/constants';
import { PlatformPreset } from '@core/models';

@Component({
  selector: 'app-aspect-preset-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideSparkles,
    LucideRotateCw,
    LucideRotateCcw
  ],
  template: `
    <div class="retro-box p-3 space-y-3">
      <!-- Header with Mode Switching -->
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2 retro-border-b">
        <div class="flex items-center gap-1">
          <button
            type="button"
            (click)="activeTab = 'ratios'"
            [ngClass]="{
              'bg-[#1c1917] text-[#fbbf24]': activeTab === 'ratios',
              'bg-[#f7f4ee] text-stone-700 hover:bg-stone-200': activeTab !== 'ratios'
            }"
            class="px-3 py-1 text-xs font-mono font-bold retro-border"
          >
            1. ASPECT RATIO
          </button>
          <button
            type="button"
            (click)="activeTab = 'presets'"
            [ngClass]="{
              'bg-[#1c1917] text-[#06b6d4]': activeTab === 'presets',
              'bg-[#f7f4ee] text-stone-700 hover:bg-stone-200': activeTab !== 'presets'
            }"
            class="px-3 py-1 text-xs font-mono font-bold retro-border flex items-center gap-1"
          >
            <svg lucideSparkles class="w-3 h-3"></svg>
            PLATFORM PRESETS
          </button>
        </div>

        <!-- Rotate and Flip Controls -->
        <div class="flex items-center gap-1">
          @if (isTourStep1) {
            <span class="bg-[#06b6d4] text-[#082f49] border-2 border-black px-1.5 py-0.5 text-[9px] font-mono font-bold shadow-[1px_1px_0px_#000] animate-pulse hidden sm:inline-flex items-center gap-1">
              👉 ROTATE / FLIP
            </span>
          }
          <button
            type="button"
            (click)="onRotateCcw()"
            title="Rotate 90° CCW"
            class="p-1.5 retro-btn text-xs font-mono flex items-center gap-1"
          >
            <svg lucideRotateCcw class="w-3.5 h-3.5"></svg>
            <span class="hidden sm:inline">-90°</span>
          </button>
          <button
            type="button"
            (click)="onRotateCw()"
            title="Rotate 90° CW"
            class="p-1.5 retro-btn text-xs font-mono flex items-center gap-1"
          >
            <svg lucideRotateCw class="w-3.5 h-3.5"></svg>
            <span class="hidden sm:inline">+90°</span>
          </button>
          <button
            type="button"
            (click)="toggleFlipH.emit()"
            title="Flip Horizontal"
            [ngClass]="{ 'bg-amber-300': flipH }"
            class="p-1.5 retro-btn text-xs font-mono"
          >
            <!-- Flip Horizontal SVG -->
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 7 5 5-5 5V7z" />
              <path d="m21 7-5 5 5 5V7z" />
              <path d="M12 20v2" />
              <path d="M12 14v2" />
              <path d="M12 8v2" />
              <path d="M12 2v2" />
            </svg>
          </button>
          <button
            type="button"
            (click)="toggleFlipV.emit()"
            title="Flip Vertical"
            [ngClass]="{ 'bg-amber-300': flipV }"
            class="p-1.5 retro-btn text-xs font-mono"
          >
            <!-- Flip Vertical SVG -->
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m7 3 5 5 5-5H7z" />
              <path d="m7 21 5-5 5 5H7z" />
              <path d="M20 12h2" />
              <path d="M14 12h2" />
              <path d="M8 12h2" />
              <path d="M2 12h2" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Tab 1: Aspect Ratio Selectors -->
      @if (activeTab === 'ratios') {
        <div class="space-y-2">
          @if (isTourStep1) {
            <div class="bg-[#f59e0b] text-black border-2 border-black px-2 py-0.5 text-[10px] font-mono font-bold shadow-[2px_2px_0px_#000] inline-flex items-center gap-1.5 animate-bounce mb-1">
              <span>👇 STEP 1A: CLICK ANY PRESET RATIO (16:9, 1:1, 4:5, ETC.)</span>
            </div>
          }
          <div class="flex flex-wrap gap-1.5">
            @for (preset of ratioPresets; track preset.id) {
              <button
                type="button"
                (click)="onSelectRatioPreset(preset.id, preset.ratio)"
                [ngClass]="{
                  'bg-[#1c1917] text-white shadow-[2px_2px_0px_#f59e0b]': selectedRatioId === preset.id,
                  'bg-white hover:bg-stone-100 text-stone-800': selectedRatioId !== preset.id
                }"
                class="px-2.5 py-1.5 text-xs font-mono font-medium retro-border transition-colors"
              >
                {{ preset.label }}
              </button>
            }
          </div>

          <!-- Custom Ratio Input -->
          @if (selectedRatioId === 'custom') {
            <div class="flex items-center gap-2 pt-1 font-mono text-xs bg-amber-50 p-2 retro-border">
              <span class="font-bold text-stone-800">CUSTOM RATIO:</span>
              <input
                type="number"
                min="1"
                max="100"
                [ngModel]="customRatioW"
                (ngModelChange)="onWidthRatioChange($event)"
                class="w-16 px-2 py-1 bg-white retro-border text-center font-bold"
              />
              <span class="font-bold">:</span>
              <input
                type="number"
                min="1"
                max="100"
                [ngModel]="customRatioH"
                (ngModelChange)="onHeightRatioChange($event)"
                class="w-16 px-2 py-1 bg-white retro-border text-center font-bold"
              />
              <span class="text-stone-500 text-[11px]">
                = {{ (customRatioW / customRatioH).toFixed(2) }}:1
              </span>
            </div>
          }
        </div>
      }

      <!-- Tab 2: Platform Presets -->
      @if (activeTab === 'presets') {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          @for (preset of platformPresets; track preset.id) {
            <button
              type="button"
              (click)="applyPlatformPreset.emit(preset)"
              class="text-left p-2 bg-white retro-border hover:bg-amber-50 group transition-all"
            >
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-stone-900 group-hover:text-amber-800">
                  {{ preset.name }}
                </span>
                <span class="text-[10px] font-mono text-stone-500 bg-stone-100 px-1 border border-stone-300">
                  {{ preset.aspectRatio }}
                </span>
              </div>
              <div class="text-[11px] font-mono text-stone-600 mt-1">
                {{ preset.targetWidth }} × {{ preset.targetHeight }} px
              </div>
              @if (preset.recommendedMaxKb) {
                <div class="text-[10px] font-mono text-emerald-700 mt-0.5">
                  ≤ {{ preset.recommendedMaxKb >= 1024 ? (preset.recommendedMaxKb / 1024) + ' MB' : preset.recommendedMaxKb + ' KB' }}
                </div>
              }
            </button>
          }
        </div>
      }
    </div>
  `
})
export class AspectPresetBarComponent {
  @Input() isTourStep1 = false;
  @Input() selectedRatioId = 'free';
  @Input() rotation = 0;
  @Input() flipH = false;
  @Input() flipV = false;
  @Input() customRatioW = 4;
  @Input() customRatioH = 3;

  @Output() selectRatio = new EventEmitter<{ id: string; ratio: number | null }>();
  @Output() applyPlatformPreset = new EventEmitter<PlatformPreset>();
  @Output() rotate = new EventEmitter<number>();
  @Output() toggleFlipH = new EventEmitter<void>();
  @Output() toggleFlipV = new EventEmitter<void>();
  @Output() customRatioChange = new EventEmitter<{ w: number; h: number }>();

  activeTab: 'ratios' | 'presets' = 'ratios';

  readonly ratioPresets = ASPECT_RATIO_PRESETS;
  readonly platformPresets = PLATFORM_PRESETS;

  onSelectRatioPreset(id: string, ratio: number | null) {
    this.selectRatio.emit({ id, ratio });
  }

  onRotateCcw() {
    this.rotate.emit((this.rotation - 90 + 360) % 360);
  }

  onRotateCw() {
    this.rotate.emit((this.rotation + 90) % 360);
  }

  onWidthRatioChange(val: number) {
    const w = Math.max(1, Number(val) || 1);
    this.customRatioChange.emit({ w, h: this.customRatioH });
  }

  onHeightRatioChange(val: number) {
    const h = Math.max(1, Number(val) || 1);
    this.customRatioChange.emit({ w: this.customRatioW, h });
  }
}

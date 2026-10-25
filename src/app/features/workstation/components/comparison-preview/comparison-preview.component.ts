import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideSquareSplitVertical,
  LucideColumns2,
  LucideCircleCheck,
  LucideArrowDown,
  LucideDownload
} from '@lucide/angular';
import { OriginalImageInfo, ProcessedResult } from '@core/models';
import { formatBytes } from '@core/services';

@Component({
  selector: 'app-comparison-preview',
  standalone: true,
  imports: [
    CommonModule,
    LucideSquareSplitVertical,
    LucideColumns2,
    LucideCircleCheck,
    LucideArrowDown,
    LucideDownload
  ],
  template: `
    <div class="retro-box p-4 space-y-3">
      <!-- HUD Header -->
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2 retro-border-b">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-emerald-500"></span>
          <h3 class="font-mono font-bold text-sm text-stone-900 tracking-wide">
            3. REAL-TIME INSPECTION &amp; COMPARISON
          </h3>
        </div>

        <div class="flex items-center gap-1 font-mono text-xs">
          <button
            type="button"
            (click)="viewMode = 'split'"
            [ngClass]="{
              'bg-[#1c1917] text-[#fbbf24]': viewMode === 'split',
              'bg-white text-stone-700 hover:bg-stone-100': viewMode !== 'split'
            }"
            class="px-2.5 py-1 retro-border flex items-center gap-1 font-bold"
          >
            <svg lucideSquareSplitVertical class="w-3.5 h-3.5"></svg>
            SPLIT WIPER
          </button>
          <button
            type="button"
            (click)="viewMode = 'side-by-side'"
            [ngClass]="{
              'bg-[#1c1917] text-[#fbbf24]': viewMode === 'side-by-side',
              'bg-white text-stone-700 hover:bg-stone-100': viewMode !== 'side-by-side'
            }"
            class="px-2.5 py-1 retro-border flex items-center gap-1 font-bold"
          >
            <svg lucideColumns2 class="w-3.5 h-3.5"></svg>
            SIDE-BY-SIDE
          </button>
        </div>
      </div>

      <!-- Comparison Viewport -->
      @if (processed) {
        <div
          #splitViewport
          class="relative bg-[#12151a] retro-border overflow-hidden select-none flex items-center justify-center p-2"
          style="height: 340px"
        >
          @if (viewMode === 'split') {
            <!-- Split Wiper Mode -->
            <div class="relative w-full h-full flex items-center justify-center overflow-hidden">
              <!-- After Image (Full width background) -->
              <img
                [src]="processed.dataUrl"
                alt="Processed output"
                class="max-h-full max-w-full object-contain pointer-events-none"
              />

              <!-- Before Image (Clipped to split percentage) -->
              <div
                class="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                [style.clipPath]="'inset(0 ' + (100 - splitPos) + '% 0 0)'"
              >
                <img
                  [src]="original.dataUrl"
                  alt="Original input"
                  class="max-h-full max-w-full object-contain"
                />
              </div>

              <!-- Draggable Divider Line -->
              <div
                class="absolute top-0 bottom-0 w-1 bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)] cursor-ew-resize flex items-center justify-center transition-all duration-75"
                [style.left.%]="effectiveSplitPos"
                (mousedown)="onSplitMouseDown($event)"
              >
                <div class="w-6 h-6 bg-[#1c1917] border-2 border-[#f59e0b] flex items-center justify-center text-[#f59e0b] text-[10px] font-mono font-bold shadow-md">
                  ⇄
                </div>
                @if (isTourStep3) {
                  <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#f59e0b] text-black border-2 border-black px-2 py-0.5 text-[9px] font-mono font-bold shadow-[2px_2px_0px_#000] whitespace-nowrap animate-bounce pointer-events-none z-30">
                    <span>↔️ STEP 3A: DRAG WIPER TO INSPECT</span>
                  </div>
                }
              </div>

              <!-- Badges on left and right -->
              <span class="absolute top-2 left-2 px-2 py-0.5 bg-black/80 border border-stone-600 text-[10px] font-mono text-stone-300 pointer-events-none">
                ORIGINAL (BEFORE)
              </span>
              <span class="absolute top-2 right-2 px-2 py-0.5 bg-[#1c1917]/90 border border-amber-500 text-[10px] font-mono text-amber-300 pointer-events-none font-bold">
                PROCESSED (AFTER)
              </span>
            </div>
          } @else {
            <!-- Side-by-Side Mode -->
            <div class="grid grid-cols-2 gap-2 w-full h-full">
              <div class="relative bg-black/40 border border-stone-700 flex flex-col items-center justify-center p-2 overflow-hidden">
                <span class="absolute top-1 left-1 px-1.5 py-0.5 bg-black/80 text-[10px] font-mono text-stone-300 border border-stone-700">
                  ORIGINAL
                </span>
                <img
                  [src]="original.dataUrl"
                  alt="Original"
                  class="max-h-full max-w-full object-contain"
                />
              </div>
              <div class="relative bg-black/40 border border-amber-600/70 flex flex-col items-center justify-center p-2 overflow-hidden">
                <span class="absolute top-1 left-1 px-1.5 py-0.5 bg-black/80 text-[10px] font-mono text-amber-400 border border-amber-600">
                  MAINTAINED
                </span>
                <img
                  [src]="processed.dataUrl"
                  alt="Processed"
                  class="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          }
        </div>
      }

      <!-- Technical Telemetry Grid -->
      @if (processed) {
        @if (isTourStep3) {
          <div class="bg-emerald-400 text-stone-900 border-2 border-black px-2 py-0.5 text-[10px] font-mono font-bold shadow-[2px_2px_0px_#000] inline-flex items-center gap-1.5 animate-bounce mb-1">
            <span>👇 STEP 3B: CHECK LIVE BYTE SAVINGS &amp; FIDELITY</span>
          </div>
        }
        <div class="bg-[#1c1917] text-stone-200 p-3 retro-border font-mono text-xs space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-stone-700">
            <div class="flex items-center gap-2">
              <span class="text-stone-400">TELEMETRY:</span>
              <span class="text-white font-bold">{{ processed.fileName }}</span>
            </div>
            @if (targetKb) {
              <div class="flex items-center gap-1.5">
                @if (isTargetMet) {
                  <span class="text-emerald-400 flex items-center gap-1 font-bold">
                    <svg lucideCircleCheck class="w-3.5 h-3.5"></svg>
                    TARGET MET ({{ processed.sizeKb.toFixed(1) }} KB ≤ {{ targetKb }} KB)
                  </span>
                } @else {
                  <span class="text-amber-400 font-bold">
                    APPROX TARGET ({{ processed.sizeKb.toFixed(1) }} KB)
                  </span>
                }
              </div>
            }
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <!-- Metric 1: Size -->
            <div class="bg-[#242932] p-2 border border-stone-700">
              <span class="text-stone-400 block text-[10px]">FILE SIZE:</span>
              <div class="font-bold text-white text-xs mt-0.5">
                {{ formatBytes(processed.sizeBytes) }}
              </div>
              <div class="text-stone-400 text-[10px]">
                Was {{ formatBytes(original.sizeBytes) }}
              </div>
            </div>

            <!-- Metric 2: Savings -->
            <div class="bg-[#242932] p-2 border border-stone-700">
              <span class="text-stone-400 block text-[10px]">SIZE REDUCTION:</span>
              <div class="font-bold text-emerald-400 text-xs mt-0.5 flex items-center gap-0.5">
                @if (processed.compressionRatio < 0) {
                  <svg lucideArrowDown class="w-3 h-3"></svg>
                  {{ Math.abs(processed.compressionRatio) }}%
                } @else {
                  +{{ processed.compressionRatio }}%
                }
              </div>
              <div class="text-stone-400 text-[10px]">
                Saved {{ formatBytes(Math.max(0, original.sizeBytes - processed.sizeBytes)) }}
              </div>
            </div>

            <!-- Metric 3: Dimensions -->
            <div class="bg-[#242932] p-2 border border-stone-700">
              <span class="text-stone-400 block text-[10px]">RESOLUTION:</span>
              <div class="font-bold text-amber-400 text-xs mt-0.5">
                {{ processed.width }} × {{ processed.height }} PX
              </div>
              <div class="text-stone-400 text-[10px]">
                {{ (processed.width / processed.height).toFixed(2) }}:1 Ratio
              </div>
            </div>

            <!-- Metric 4: Quality & Speed -->
            <div class="bg-[#242932] p-2 border border-stone-700">
              <span class="text-stone-400 block text-[10px]">FORMAT &amp; SPEED:</span>
              <div class="font-bold text-cyan-400 text-xs mt-0.5 uppercase">
                {{ processed.format.replace('image/', '') }} · Q:{{ processed.qualityUsed }}%
              </div>
              <div class="text-stone-400 text-[10px]">
                Processed in {{ processed.processingTimeMs }} ms
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Primary Action Buttons -->
      @if (processed) {
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 relative">
          <div class="text-xs font-mono text-stone-600">
            Ready for instant deployment or social upload.
          </div>

          <div class="flex items-center gap-2 relative">
            @if (isTourStep4) {
              <div class="absolute -top-10 right-0 bg-[#06b6d4] text-[#082f49] border-2 border-black px-2 py-1 text-[11px] font-mono font-bold shadow-[2px_2px_0px_#000] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-30">
                <span>👇 STEP 4: CLICK HERE TO DOWNLOAD (DEMO GUIDE)</span>
              </div>
            }
            <button
              type="button"
              (click)="download.emit()"
              [ngClass]="{
                'ring-4 ring-[#06b6d4] scale-105 shadow-[0_0_20px_#06b6d4]': isTourStep4
              }"
              class="retro-btn-accent px-5 py-2 text-xs font-mono font-bold flex items-center gap-2 shadow-[3px_3px_0px_#1c1917] transition-all"
            >
              <svg lucideDownload class="w-4 h-4"></svg>
              <span>DOWNLOAD {{ processed.fileName.split('.').pop()?.toUpperCase() }}</span>
              <span class="text-black/70 font-normal">({{ formatBytes(processed.sizeBytes) }})</span>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ComparisonPreviewComponent implements OnDestroy {
  @Input() original!: OriginalImageInfo;
  @Input() processed: ProcessedResult | null = null;
  @Input() targetKb?: number;
  @Input() isTourStep3 = false;
  @Input() isTourStep4 = false;
  @Input() tourSplitPos: number | null = null;

  @Output() download = new EventEmitter<void>();

  @ViewChild('splitViewport') splitViewport!: ElementRef<HTMLDivElement>;

  readonly formatBytes = formatBytes;
  readonly Math = Math;

  viewMode: 'split' | 'side-by-side' = 'split';
  splitPos = 50;

  get effectiveSplitPos(): number {
    return this.tourSplitPos !== null ? this.tourSplitPos : this.splitPos;
  }

  private isDraggingSplit = false;
  private mouseMoveListener = (e: MouseEvent) => this.onMouseMove(e);
  private mouseUpListener = () => this.onMouseUp();

  get isTargetMet(): boolean {
    if (!this.processed || !this.targetKb) return true;
    return this.processed.sizeKb <= this.targetKb * 1.05;
  }

  onSplitMouseDown(e: MouseEvent) {
    e.preventDefault();
    this.isDraggingSplit = true;
    window.addEventListener('mousemove', this.mouseMoveListener);
    window.addEventListener('mouseup', this.mouseUpListener);
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDraggingSplit || !this.splitViewport?.nativeElement) return;
    const rect = this.splitViewport.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    this.splitPos = pct;
  }

  private onMouseUp() {
    this.isDraggingSplit = false;
    window.removeEventListener('mousemove', this.mouseMoveListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
  }

  ngOnDestroy() {
    window.removeEventListener('mousemove', this.mouseMoveListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
  }
}

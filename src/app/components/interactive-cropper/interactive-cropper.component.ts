import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideGrid3x3,
  LucideCrosshair,
  LucideMaximize2,
  LucideRotateCcw,
  LucideZoomIn,
  LucideZoomOut,
  LucideMove
} from '@lucide/angular';
import { CropArea } from '../../types';

type HandleType = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w' | 'move';

@Component({
  selector: 'app-interactive-cropper',
  standalone: true,
  imports: [
    CommonModule,
    LucideGrid3x3,
    LucideCrosshair,
    LucideMaximize2,
    LucideRotateCcw,
    LucideZoomIn,
    LucideZoomOut,
    LucideMove
  ],
  template: `
    <div class="relative flex flex-col h-full bg-[#181b20] retro-border overflow-hidden select-none">
      <!-- Top Workstation HUD -->
      <div class="flex items-center justify-between px-3 py-2 bg-[#21262d] retro-border-b text-xs font-mono text-[#d1d5db]">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-[#f59e0b] animate-pulse"></span>
          <span class="font-semibold text-white tracking-wide">VIEWPORT: CROP MATRIX</span>
          <span class="text-stone-400">·</span>
          <span class="text-amber-400">
            {{ crop.width }} × {{ crop.height }} PX
          </span>
          @if (aspectRatio) {
            <span class="text-cyan-400 hidden sm:inline">
              [{{ (crop.width / crop.height).toFixed(2) }}:1]
            </span>
          }
        </div>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            (click)="showGrid = !showGrid"
            title="Toggle Rule-of-Thirds Grid"
            [ngClass]="{
              'bg-[#f59e0b] text-black font-bold': showGrid,
              'bg-[#2b323c] text-stone-300': !showGrid
            }"
            class="p-1.5 retro-border text-xs"
          >
            <svg lucideGrid3x3 class="w-3.5 h-3.5"></svg>
          </button>
          <button
            type="button"
            (click)="showCrosshairs = !showCrosshairs"
            title="Toggle Center Crosshairs"
            [ngClass]="{
              'bg-[#06b6d4] text-black font-bold': showCrosshairs,
              'bg-[#2b323c] text-stone-300': !showCrosshairs
            }"
            class="p-1.5 retro-border text-xs"
          >
            <svg lucideCrosshair class="w-3.5 h-3.5"></svg>
          </button>
          <button
            type="button"
            (click)="handleCenterCrop()"
            title="Center Crop Frame"
            class="p-1.5 retro-border bg-[#2b323c] text-stone-300 hover:text-white"
          >
            <svg lucideMaximize2 class="w-3.5 h-3.5"></svg>
          </button>
          <button
            type="button"
            (click)="handleFitAll()"
            title="Reset Crop to Maximum Fit"
            class="p-1.5 retro-border bg-[#2b323c] text-stone-300 hover:text-white"
          >
            <svg lucideRotateCcw class="w-3.5 h-3.5"></svg>
          </button>

          <div class="h-4 w-[1px] bg-stone-700 mx-1"></div>

          <button
            type="button"
            (click)="zoomOut()"
            title="Zoom Out"
            class="p-1.5 retro-border bg-[#2b323c] text-stone-300 hover:text-white"
          >
            <svg lucideZoomOut class="w-3.5 h-3.5"></svg>
          </button>
          <span class="px-1 text-[11px] text-stone-300 min-w-[38px] text-center">
            {{ Math.round(zoomLevel * 100) }}%
          </span>
          <button
            type="button"
            (click)="zoomIn()"
            title="Zoom In"
            class="p-1.5 retro-border bg-[#2b323c] text-stone-300 hover:text-white"
          >
            <svg lucideZoomIn class="w-3.5 h-3.5"></svg>
          </button>
        </div>
      </div>

      <!-- Interactive Canvas Area -->
      <div
        #containerRef
        class="relative flex-1 flex items-center justify-center p-4 overflow-hidden bg-tech-grid"
        style="min-height: 380px"
      >
        <!-- Displayed image frame inside container -->
        <div
          class="relative shadow-2xl transition-transform duration-75"
          [style.width.px]="displayedWidth"
          [style.height.px]="displayedHeight"
        >
          <!-- Base Image -->
          <img
            [src]="imageSrc"
            alt="Source for aspect ratio and size processing"
            class="w-full h-full object-fill pointer-events-none"
            [style.transform]="'rotate(' + rotation + 'deg) scale(' + (flipH ? -1 : 1) + ', ' + (flipV ? -1 : 1) + ')'"
          />

          <!-- Dimmed Overlay outside active crop box -->
          <div class="absolute inset-0 pointer-events-none">
            <!-- Top mask -->
            <div
              class="absolute left-0 right-0 top-0 bg-black/65 backdrop-blur-[0.5px]"
              [style.height.px]="topMaskHeight"
            ></div>
            <!-- Bottom mask -->
            <div
              class="absolute left-0 right-0 bottom-0 bg-black/65 backdrop-blur-[0.5px]"
              [style.height.px]="bottomMaskHeight"
            ></div>
            <!-- Left mask -->
            <div
              class="absolute left-0 bg-black/65 backdrop-blur-[0.5px]"
              [style.top.px]="topMaskHeight"
              [style.height.px]="displayCropHeight"
              [style.width.px]="leftMaskWidth"
            ></div>
            <!-- Right mask -->
            <div
              class="absolute right-0 bg-black/65 backdrop-blur-[0.5px]"
              [style.top.px]="topMaskHeight"
              [style.height.px]="displayCropHeight"
              [style.width.px]="rightMaskWidth"
            ></div>
          </div>

          <!-- Draggable & Resizable Active Crop Frame -->
          <div
            class="absolute border-2 border-[#f59e0b] shadow-[0_0_0_1px_rgba(0,0,0,0.8)] cursor-move select-none"
            [style.left.px]="cropLeftRel"
            [style.top.px]="cropTopRel"
            [style.width.px]="displayCropWidth"
            [style.height.px]="displayCropHeight"
            (mousedown)="handleMouseDown($event, 'move')"
          >
            <!-- Rule of Thirds Grid Lines -->
            @if (showGrid) {
              <div class="absolute inset-0 pointer-events-none">
                <div class="absolute left-1/3 top-0 bottom-0 w-[1px] bg-amber-400/35 border-dashed border-l border-amber-300/40"></div>
                <div class="absolute left-2/3 top-0 bottom-0 w-[1px] bg-amber-400/35 border-dashed border-l border-amber-300/40"></div>
                <div class="absolute top-1/3 left-0 right-0 h-[1px] bg-amber-400/35 border-dashed border-t border-amber-300/40"></div>
                <div class="absolute top-2/3 left-0 right-0 h-[1px] bg-amber-400/35 border-dashed border-t border-amber-300/40"></div>
              </div>
            }

            <!-- Center Crosshair -->
            @if (showCrosshairs) {
              <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div class="w-4 h-[1px] bg-cyan-400 shadow-sm"></div>
                <div class="h-4 w-[1px] bg-cyan-400 absolute shadow-sm"></div>
              </div>
            }

            <!-- Live Size Badge attached to crop box -->
            <div class="absolute -top-7 left-0 bg-[#1c1917] border border-[#f59e0b] text-[#fbbf24] px-1.5 py-0.5 text-[10px] font-mono whitespace-nowrap shadow-md flex items-center gap-1.5 pointer-events-none">
              <span class="font-bold">{{ crop.width }} × {{ crop.height }} PX</span>
              <span class="text-stone-400">|</span>
              <span class="text-cyan-300">
                {{ aspectRatio ? (crop.width / crop.height).toFixed(2) + ':1' : 'FREE' }}
              </span>
            </div>

            @if (isTourStep1) {
              <div class="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-[#f59e0b] text-black border-2 border-black px-2.5 py-1 text-[11px] font-mono font-black shadow-[3px_3px_0px_#000] flex items-center gap-1.5 whitespace-nowrap animate-bounce pointer-events-none z-30">
                <span>↖️ STEP 1B: DRAG YELLOW CORNERS TO CUSTOM CROP OR PAN</span>
              </div>
            }

            <!-- Corner Resize Handles - Angular Retro Squares -->
            <div
              class="absolute -top-2 -left-2 w-4 h-4 bg-[#f59e0b] border-2 border-black cursor-nwse-resize hover:scale-125 transition-transform"
              (mousedown)="handleMouseDown($event, 'nw')"
            >
              @if (isTourStep1) {
                <span class="absolute -top-6 -left-2 bg-[#f59e0b] text-black text-[9px] font-mono font-black px-1 border border-black shadow pointer-events-none whitespace-nowrap animate-pulse">
                  ↖ CROP
                </span>
              }
            </div>
            <div
              class="absolute -top-2 -right-2 w-4 h-4 bg-[#f59e0b] border-2 border-black cursor-nesw-resize hover:scale-125 transition-transform"
              (mousedown)="handleMouseDown($event, 'ne')"
            >
              @if (isTourStep1) {
                <span class="absolute -top-6 -right-2 bg-[#f59e0b] text-black text-[9px] font-mono font-black px-1 border border-black shadow pointer-events-none whitespace-nowrap animate-pulse">
                  ↗ CROP
                </span>
              }
            </div>
            <div
              class="absolute -bottom-2 -right-2 w-4 h-4 bg-[#f59e0b] border-2 border-black cursor-nwse-resize hover:scale-125 transition-transform"
              (mousedown)="handleMouseDown($event, 'se')"
            >
              @if (isTourStep1) {
                <span class="absolute -bottom-6 -right-2 bg-[#f59e0b] text-black text-[9px] font-mono font-black px-1 border border-black shadow pointer-events-none whitespace-nowrap animate-pulse">
                  ↘ CROP
                </span>
              }
            </div>
            <div
              class="absolute -bottom-2 -left-2 w-4 h-4 bg-[#f59e0b] border-2 border-black cursor-nesw-resize hover:scale-125 transition-transform"
              (mousedown)="handleMouseDown($event, 'sw')"
            >
              @if (isTourStep1) {
                <span class="absolute -bottom-6 -left-2 bg-[#f59e0b] text-black text-[9px] font-mono font-black px-1 border border-black shadow pointer-events-none whitespace-nowrap animate-pulse">
                  ↙ CROP
                </span>
              }
            </div>

            <!-- Edge Resize Handles (when freeform) -->
            @if (!aspectRatio) {
              <div
                class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-3 bg-white border border-black cursor-ns-resize"
                (mousedown)="handleMouseDown($event, 'n')"
              ></div>
              <div
                class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-3 bg-white border border-black cursor-ns-resize"
                (mousedown)="handleMouseDown($event, 's')"
              ></div>
              <div
                class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-5 bg-white border border-black cursor-ew-resize"
                (mousedown)="handleMouseDown($event, 'w')"
              ></div>
              <div
                class="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-5 bg-white border border-black cursor-ew-resize"
                (mousedown)="handleMouseDown($event, 'e')"
              ></div>
            }

            <!-- Move indicator in center -->
            <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-amber-500/10 pointer-events-none">
              <span class="p-1 bg-black/80 text-amber-400 border border-amber-400 text-[10px] font-mono flex items-center gap-1">
                <svg lucideMove class="w-3 h-3"></svg> DRAG FRAME
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Sub-HUD Navigation & Coordinates -->
      <div class="flex flex-wrap items-center justify-between px-3 py-2 bg-[#1c1917] retro-border-t text-[11px] font-mono text-stone-400">
        <div class="flex items-center gap-2">
          <span>ORIGINAL: <strong class="text-white">{{ imageNaturalWidth }}×{{ imageNaturalHeight }}</strong></span>
          <span>·</span>
          <span>CROP OFFSET: <strong class="text-white">X:{{ crop.x }} Y:{{ crop.y }}</strong></span>
        </div>
        <div class="flex items-center gap-2 text-stone-400">
          <span class="hidden md:inline">Tip: Use Arrow keys to nudge 1px (Shift + Arrow for 10px)</span>
        </div>
      </div>
    </div>
  `
})
export class InteractiveCropperComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isTourStep1 = false;
  @Input() imageSrc = '';
  @Input() imageNaturalWidth = 800;
  @Input() imageNaturalHeight = 600;
  @Input() aspectRatio: number | null = null;
  @Input() crop: CropArea = { x: 0, y: 0, width: 800, height: 600 };
  @Input() rotation = 0;
  @Input() flipH = false;
  @Input() flipV = false;

  @Output() cropChange = new EventEmitter<CropArea>();

  @ViewChild('containerRef') containerRef!: ElementRef<HTMLDivElement>;

  readonly Math = Math;

  containerWidth = 600;
  containerHeight = 400;
  zoomLevel = 1;
  showGrid = true;
  showCrosshairs = true;

  displayedWidth = 600;
  displayedHeight = 400;
  scale = 1;

  // Active drag tracking
  private isDragging = false;
  private dragHandle: HandleType | null = null;
  private startMouseX = 0;
  private startMouseY = 0;
  private startCrop: CropArea = { x: 0, y: 0, width: 0, height: 0 };

  private resizeListener = () => this.updateContainerSize();
  private mouseMoveListener = (e: MouseEvent) => this.onMouseMove(e);
  private mouseUpListener = () => this.onMouseUp();

  ngOnInit() {
    window.addEventListener('resize', this.resizeListener);
    window.addEventListener('mousemove', this.mouseMoveListener);
    window.addEventListener('mouseup', this.mouseUpListener);
  }

  ngAfterViewInit() {
    this.updateContainerSize();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.recomputeDimensions();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
    window.removeEventListener('mousemove', this.mouseMoveListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
  }

  get isRotated90(): boolean {
    return Math.abs(this.rotation % 180) === 90;
  }

  get effectiveWidth(): number {
    return this.isRotated90 ? this.imageNaturalHeight : this.imageNaturalWidth;
  }

  get effectiveHeight(): number {
    return this.isRotated90 ? this.imageNaturalWidth : this.imageNaturalHeight;
  }

  get cropLeftRel(): number {
    return this.crop.x * this.scale;
  }

  get cropTopRel(): number {
    return this.crop.y * this.scale;
  }

  get displayCropWidth(): number {
    return this.crop.width * this.scale;
  }

  get displayCropHeight(): number {
    return this.crop.height * this.scale;
  }

  get topMaskHeight(): number {
    return Math.max(0, this.cropTopRel);
  }

  get bottomMaskHeight(): number {
    return Math.max(0, this.displayedHeight - (this.cropTopRel + this.displayCropHeight));
  }

  get leftMaskWidth(): number {
    return Math.max(0, this.cropLeftRel);
  }

  get rightMaskWidth(): number {
    return Math.max(0, this.displayedWidth - (this.cropLeftRel + this.displayCropWidth));
  }

  updateContainerSize() {
    if (this.containerRef?.nativeElement) {
      this.containerWidth = this.containerRef.nativeElement.clientWidth;
      this.containerHeight = this.containerRef.nativeElement.clientHeight;
      this.recomputeDimensions();
    }
  }

  recomputeDimensions() {
    const effW = this.effectiveWidth || 1;
    const effH = this.effectiveHeight || 1;

    const contAspect = (this.containerWidth || 600) / Math.max(1, this.containerHeight || 400);
    const imgAspect = effW / effH;

    if (contAspect > imgAspect) {
      this.displayedHeight = Math.max(1, this.containerHeight - 48) * this.zoomLevel;
      this.displayedWidth = this.displayedHeight * imgAspect;
    } else {
      this.displayedWidth = Math.max(1, this.containerWidth - 48) * this.zoomLevel;
      this.displayedHeight = this.displayedWidth / imgAspect;
    }

    this.scale = this.displayedWidth / effW;
  }

  clampCrop(c: CropArea): CropArea {
    const effW = this.effectiveWidth;
    const effH = this.effectiveHeight;

    let width = Math.max(16, Math.min(c.width, effW));
    let height = Math.max(16, Math.min(c.height, effH));

    if (this.aspectRatio) {
      if (width / height > this.aspectRatio) {
        width = height * this.aspectRatio;
      } else {
        height = width / this.aspectRatio;
      }
    }

    const x = Math.max(0, Math.min(c.x, effW - width));
    const y = Math.max(0, Math.min(c.y, effH - height));

    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  handleMouseDown(e: MouseEvent, handle: HandleType) {
    e.preventDefault();
    e.stopPropagation();

    this.isDragging = true;
    this.dragHandle = handle;
    this.startMouseX = e.clientX;
    this.startMouseY = e.clientY;
    this.startCrop = { ...this.crop };
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.dragHandle || !this.scale) return;

    const dx = (e.clientX - this.startMouseX) / this.scale;
    const dy = (e.clientY - this.startMouseY) / this.scale;
    const start = this.startCrop;
    const handle = this.dragHandle;

    let newCrop = { ...start };

    if (handle === 'move') {
      newCrop.x = start.x + dx;
      newCrop.y = start.y + dy;
    } else {
      let newX = start.x;
      let newY = start.y;
      let newW = start.width;
      let newH = start.height;

      if (handle.includes('e')) {
        newW = start.width + dx;
      }
      if (handle.includes('s')) {
        newH = start.height + dy;
      }
      if (handle.includes('w')) {
        const clampedDx = Math.min(dx, start.width - 16);
        newX = start.x + clampedDx;
        newW = start.width - clampedDx;
      }
      if (handle.includes('n')) {
        const clampedDy = Math.min(dy, start.height - 16);
        newY = start.y + clampedDy;
        newH = start.height - clampedDy;
      }

      if (this.aspectRatio) {
        if (handle === 'e' || handle === 'w') {
          newH = newW / this.aspectRatio;
          newY = start.y + (start.height - newH) / 2;
        } else if (handle === 'n' || handle === 's') {
          newW = newH * this.aspectRatio;
          newX = start.x + (start.width - newW) / 2;
        } else {
          if (newW / newH > this.aspectRatio) {
            newW = newH * this.aspectRatio;
          } else {
            newH = newW / this.aspectRatio;
          }
          if (handle.includes('w')) {
            newX = start.x + start.width - newW;
          }
          if (handle.includes('n')) {
            newY = start.y + start.height - newH;
          }
        }
      }

      newCrop = {
        x: newX,
        y: newY,
        width: newW,
        height: newH
      };
    }

    this.cropChange.emit(this.clampCrop(newCrop));
  }

  private onMouseUp() {
    this.isDragging = false;
    this.dragHandle = null;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(e: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      this.cropChange.emit(
        this.clampCrop({
          ...this.crop,
          x: this.crop.x + dx,
          y: this.crop.y + dy
        })
      );
    }
  }

  handleCenterCrop() {
    let width = this.effectiveWidth;
    let height = this.effectiveHeight;
    if (this.aspectRatio) {
      if (this.effectiveWidth / this.effectiveHeight > this.aspectRatio) {
        width = this.effectiveHeight * this.aspectRatio;
      } else {
        height = this.effectiveWidth / this.aspectRatio;
      }
    }
    const x = (this.effectiveWidth - width) / 2;
    const y = (this.effectiveHeight - height) / 2;
    this.cropChange.emit(this.clampCrop({ x, y, width, height }));
  }

  handleFitAll() {
    if (this.aspectRatio) {
      this.handleCenterCrop();
    } else {
      this.cropChange.emit({
        x: 0,
        y: 0,
        width: this.effectiveWidth,
        height: this.effectiveHeight
      });
    }
  }

  zoomIn() {
    this.zoomLevel = Math.min(2.5, this.zoomLevel + 0.25);
    this.recomputeDimensions();
  }

  zoomOut() {
    this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25);
    this.recomputeDimensions();
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideImagePlus,
  LucideRefreshCw,
  LucideCircleQuestionMark,
  LucideSparkles
} from '@lucide/angular';

@Component({
  selector: 'app-retro-header',
  standalone: true,
  imports: [
    CommonModule,
    LucideImagePlus,
    LucideRefreshCw,
    LucideCircleQuestionMark,
    LucideSparkles
  ],
  template: `
    <header class="retro-box bg-[#1c1917] text-[#f7f4ee] p-3 sm:p-4 mb-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <!-- Brand & Subtitle -->
        <div>
          <div class="flex items-center gap-3">
            <img
              src="logo.png"
              alt="AspectShift Logo"
              class="w-10 h-10 border-2 border-black object-cover shadow-[2px_2px_0px_#f59e0b] shrink-0"
            />
            <div>
              <div class="flex items-center gap-2">
                <h1 class="font-mono font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
                  <span class="text-[#fbbf24] tracking-wider drop-shadow-[0_0_10px_rgba(251,191,36,0.25)]">
                    ASPECTSHIFT
                  </span>
                  <span class="text-xs bg-[#f59e0b] text-black font-bold px-1.5 py-0.5 border border-black">
                    REV-2026
                  </span>
                </h1>
                <div class="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 pl-2 border-l border-stone-700">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>CORE ACTIVE</span>
                </div>
              </div>
              <p class="text-xs font-mono text-stone-400 mt-0.5">
                Image &amp; Size Maintainer · Live Aspect Ratio · Dimension Lock · KB/MB Target Compression
              </p>
            </div>
          </div>
        </div>

        <!-- Workstation Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="startTour.emit()"
            class="retro-btn px-2.5 py-1.5 text-xs font-mono font-bold text-stone-900 bg-amber-200 hover:bg-amber-100 flex items-center gap-1.5"
            title="Start automated step-by-step guide"
          >
            <svg lucideSparkles class="w-3.5 h-3.5 text-amber-800"></svg>
            <span>GUIDED TOUR</span>
          </button>

          <button
            type="button"
            (click)="loadSample.emit()"
            class="retro-btn px-2.5 py-1.5 text-xs font-mono font-bold text-stone-900 bg-[#f7f4ee] flex items-center gap-1.5"
            title="Load demo image to test features"
          >
            <svg lucideImagePlus class="w-3.5 h-3.5 text-amber-600"></svg>
            <span>LOAD SAMPLES</span>
          </button>

          @if (hasImage) {
            <button
              type="button"
              (click)="clear.emit()"
              class="retro-btn px-2.5 py-1.5 text-xs font-mono font-bold text-stone-900 bg-stone-200 flex items-center gap-1.5"
              title="Upload new image"
            >
              <svg lucideRefreshCw class="w-3.5 h-3.5"></svg>
              <span>NEW IMAGE</span>
            </button>
          }

          <button
            type="button"
            (click)="scrollToGuide.emit()"
            class="retro-btn px-2.5 py-1.5 text-xs font-mono font-bold text-stone-900 bg-[#06b6d4] flex items-center gap-1.5"
          >
            <svg lucideCircleQuestionMark class="w-3.5 h-3.5 text-stone-900"></svg>
            <span>SPECS &amp; SEO GUIDE</span>
          </button>
        </div>
      </div>
    </header>
  `
})
export class RetroHeaderComponent {
  @Input() hasImage = false;
  @Output() loadSample = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() scrollToGuide = new EventEmitter<void>();
  @Output() startTour = new EventEmitter<void>();
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideSparkles,
  LucideArrowRight,
  LucideArrowLeft,
  LucidePlay,
  LucidePause,
  LucideX,
  LucideCheck,
  LucideUploadCloud,
  LucideSliders,
  LucideMousePointerClick
} from '@lucide/angular';

export interface TourStepInfo {
  step: number;
  badge: string;
  title: string;
  description: string;
  actionNote: string;
}

@Component({
  selector: 'app-guided-tour',
  standalone: true,
  imports: [
    CommonModule,
    LucideSparkles,
    LucideArrowRight,
    LucideArrowLeft,
    LucidePlay,
    LucidePause,
    LucideX,
    LucideCheck,
    LucideUploadCloud,
    LucideSliders,
    LucideMousePointerClick
  ],
  template: `
    <!-- Top Floating Guided HUD Bar -->
    <div
      class="retro-box bg-[#1c1917] text-white p-3 sm:p-4 mb-4 border-2 border-[#f59e0b] shadow-[4px_4px_0px_#f59e0b] relative z-40 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <!-- Progress Bar at top edge -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-stone-800 overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-[#f59e0b] to-[#06b6d4] transition-all duration-300"
          [style.width.%]="(currentStep / totalSteps) * 100"
        ></div>
      </div>

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        <!-- Step Info & Content -->
        <div class="space-y-1.5 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f59e0b] text-black text-[10px] font-mono font-black tracking-wider uppercase border border-black shadow-[1px_1px_0px_#000]">
              <svg lucideSparkles class="w-3 h-3"></svg>
              {{ currentStepInfo.badge }}
            </span>
            <span class="text-xs font-mono text-stone-400">
              STEP {{ currentStep }} OF {{ totalSteps }}
            </span>
            @if (autoPlay) {
              <span class="text-[10px] font-mono text-emerald-400 flex items-center gap-1 border border-emerald-900 bg-emerald-950/60 px-1.5 py-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                @if (revertCountdown !== null && currentStep === totalSteps) {
                  @if (isSample) {
                    REVERTING IN {{ revertCountdown }}S...
                  } @else {
                    CLOSING TOUR IN {{ revertCountdown }}S...
                  }
                } @else {
                  AUTO-ADVANCING
                }
              </span>
            }
          </div>

          <h3 class="font-mono font-black text-sm sm:text-base text-white flex items-center gap-2">
            <span class="text-[#fbbf24]">{{ currentStepInfo.title }}</span>
          </h3>

          <p class="text-xs font-mono text-stone-300 leading-relaxed max-w-3xl">
            {{ currentStepInfo.description }}
          </p>

          <div class="flex items-center gap-1.5 text-[11px] font-mono text-[#22d3ee] font-semibold pt-0.5">
            <svg lucideMousePointerClick class="w-3.5 h-3.5 shrink-0 text-[#22d3ee]"></svg>
            <span>{{ currentStepInfo.actionNote }}</span>
          </div>
        </div>

        <!-- Tour Controller Controls -->
        <div class="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t border-stone-800 lg:border-t-0">
          <!-- Play / Pause -->
          <button
            type="button"
            (click)="toggleAutoPlay.emit()"
            [title]="autoPlay ? 'Pause Auto-Advancing' : 'Resume Auto-Advancing'"
            class="retro-btn px-2.5 py-1.5 text-xs font-mono font-bold flex items-center gap-1 bg-[#2b323c] text-stone-200 border border-stone-600 hover:text-white"
          >
            @if (autoPlay) {
              <svg lucidePause class="w-3.5 h-3.5"></svg>
              <span class="hidden sm:inline">PAUSE</span>
            } @else {
              <svg lucidePlay class="w-3.5 h-3.5"></svg>
              <span class="hidden sm:inline">AUTO-PLAY</span>
            }
          </button>

          <!-- Prev Step -->
          <button
            type="button"
            (click)="prevStep.emit()"
            [disabled]="currentStep <= 1"
            class="retro-btn px-2.5 py-1.5 text-xs font-mono font-bold flex items-center gap-1 bg-white text-stone-900 disabled:opacity-30"
          >
            <svg lucideArrowLeft class="w-3.5 h-3.5"></svg>
            <span class="hidden sm:inline">PREV</span>
          </button>

          <!-- Next Step or Finish -->
          @if (currentStep < totalSteps) {
            <button
              type="button"
              (click)="nextStep.emit()"
              class="retro-btn-accent px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1"
            >
              <span>NEXT</span>
              <svg lucideArrowRight class="w-3.5 h-3.5"></svg>
            </button>
          } @else {
            <!-- Step 4 Finish Actions -->
            @if (isSample) {
              <!-- When user started tour from sample demo: option to revert to upload or keep sample -->
              <button
                type="button"
                (click)="finishTour.emit()"
                title="End demo and return to image upload"
                class="retro-btn-accent px-3 py-1.5 text-xs font-mono font-black flex items-center gap-1.5 bg-[#f59e0b] text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#d97706] animate-pulse"
              >
                <svg lucideUploadCloud class="w-4 h-4"></svg>
                <span>FINISH &amp; UPLOAD MINE</span>
              </button>
              <button
                type="button"
                (click)="stayAndEdit.emit()"
                title="Dismiss tour but keep editing this sample photo"
                class="retro-btn px-2.5 py-1.5 text-xs font-mono font-bold flex items-center gap-1 bg-[#2b323c] text-stone-300 border border-stone-600 hover:text-white"
              >
                <svg lucideSliders class="w-3.5 h-3.5"></svg>
                <span class="hidden sm:inline">KEEP SAMPLE</span>
              </button>
            } @else {
              <!-- When user uploaded their own image: finishes tour and stays on their image! -->
              <button
                type="button"
                (click)="finishTour.emit()"
                title="Complete tour and continue editing your uploaded image"
                class="retro-btn-accent px-3 py-1.5 text-xs font-mono font-black flex items-center gap-1.5 bg-emerald-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-emerald-300 animate-pulse"
              >
                <svg lucideCheck class="w-4 h-4"></svg>
                <span>FINISH TOUR &amp; KEEP MY IMAGE</span>
              </button>
            }
          }

          <!-- Close / Exit -->
          <button
            type="button"
            (click)="finishTour.emit()"
            [title]="isSample ? 'Exit Demo & Return to Upload' : 'Close Tour & Continue Editing'"
            class="p-1.5 retro-border bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700"
          >
            <svg lucideX class="w-3.5 h-3.5"></svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class GuidedTourComponent {
  @Input() currentStep = 1;
  @Input() totalSteps = 4;
  @Input() currentStepInfo!: TourStepInfo;
  @Input() autoPlay = true;
  @Input() revertCountdown: number | null = null;
  @Input() isSample = false;

  @Output() nextStep = new EventEmitter<void>();
  @Output() prevStep = new EventEmitter<void>();
  @Output() toggleAutoPlay = new EventEmitter<void>();
  @Output() finishTour = new EventEmitter<void>();
  @Output() stayAndEdit = new EventEmitter<void>();
}

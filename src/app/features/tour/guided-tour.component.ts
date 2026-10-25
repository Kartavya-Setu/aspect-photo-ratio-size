import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
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
import { TourStepInfo } from '@core/models';

@Component({
  selector: 'app-guided-tour',
  standalone: true,
  imports: [
    CommonModule,
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

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Step Identity & Details -->
        <div class="flex items-start gap-3">
          <div
            class="p-2 border-2 border-[#f59e0b] bg-[#f59e0b] text-black font-black text-xs font-mono shrink-0 shadow-[2px_2px_0px_#000]"
          >
            {{ currentStep }} / {{ totalSteps }}
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-stone-950 border border-black shadow-[1px_1px_0px_#000]"
              >
                {{ currentStepInfo.badge }}
              </span>
              <h3 class="font-mono font-bold text-sm sm:text-base text-amber-300">
                {{ currentStepInfo.title }}
              </h3>
            </div>
            <p class="text-xs text-stone-300 max-w-2xl font-mono leading-relaxed">
              {{ currentStepInfo.description }}
            </p>
            <div class="flex items-center gap-1.5 text-[11px] text-[#06b6d4] font-mono font-bold">
              <svg lucideMousePointerClick class="w-3.5 h-3.5 animate-bounce"></svg>
              <span>{{ currentStepInfo.actionNote }}</span>
            </div>
          </div>
        </div>

        <!-- Tour Controller Actions -->
        <div class="flex items-center gap-2 self-end md:self-center shrink-0">
          <!-- Step 4 Special Actions -->
          @if (currentStep === 4) {
            @if (isSample && revertCountdown !== null) {
              <div
                class="px-3 py-1.5 bg-amber-400 text-black border border-black font-mono text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#000]"
              >
                <svg lucideUploadCloud class="w-4 h-4"></svg>
                <span>REVERTING IN {{ revertCountdown }}S</span>
              </div>
            }

            <button
              type="button"
              (click)="finishTour.emit()"
              class="retro-btn-accent px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1"
            >
              <svg lucideCheck class="w-3.5 h-3.5"></svg>
              <span>{{ isSample ? 'FINISH & UPLOAD MINE' : 'FINISH TOUR' }}</span>
            </button>

            @if (isSample) {
              <button
                type="button"
                (click)="stayAndEdit.emit()"
                class="retro-btn px-2.5 py-1.5 text-xs font-mono font-bold text-white bg-stone-800 hover:bg-stone-700 flex items-center gap-1"
                title="Keep this sample and explore controls"
              >
                <svg lucideSliders class="w-3.5 h-3.5 text-amber-400"></svg>
                <span>KEEP &amp; EDIT</span>
              </button>
            }
          }

          <!-- Normal Step Navigation -->
          @if (currentStep < 4) {
            <button
              type="button"
              (click)="prevStep.emit()"
              [disabled]="currentStep === 1"
              class="retro-btn px-2.5 py-1 text-xs font-mono font-bold text-stone-900 bg-stone-300 disabled:opacity-40 flex items-center gap-1"
            >
              <svg lucideArrowLeft class="w-3 h-3"></svg>
              <span>PREV</span>
            </button>

            <button
              type="button"
              (click)="toggleAutoPlay.emit()"
              class="retro-btn px-2.5 py-1 text-xs font-mono font-bold text-stone-900 bg-cyan-300 hover:bg-cyan-200 flex items-center gap-1"
            >
              @if (autoPlay) {
                <svg lucidePause class="w-3 h-3 text-cyan-900"></svg>
                <span>PAUSE</span>
              } @else {
                <svg lucidePlay class="w-3 h-3 text-cyan-900"></svg>
                <span>RESUME</span>
              }
            </button>

            <button
              type="button"
              (click)="nextStep.emit()"
              class="retro-btn-accent px-3 py-1 text-xs font-mono font-bold flex items-center gap-1"
            >
              <span>NEXT</span>
              <svg lucideArrowRight class="w-3.5 h-3.5"></svg>
            </button>
          }

          <button
            type="button"
            (click)="finishTour.emit()"
            class="p-1 text-stone-400 hover:text-white hover:bg-stone-800 rounded transition"
            title="Exit Tour"
          >
            <svg lucideX class="w-4 h-4"></svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class GuidedTourComponent {
  @Input({ required: true }) currentStep!: number;
  @Input({ required: true }) totalSteps!: number;
  @Input({ required: true }) currentStepInfo!: TourStepInfo;
  @Input() autoPlay = true;
  @Input() revertCountdown: number | null = null;
  @Input() isSample = false;

  @Output() nextStep = new EventEmitter<void>();
  @Output() prevStep = new EventEmitter<void>();
  @Output() toggleAutoPlay = new EventEmitter<void>();
  @Output() finishTour = new EventEmitter<void>();
  @Output() stayAndEdit = new EventEmitter<void>();
}

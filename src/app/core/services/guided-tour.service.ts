import { Injectable, computed, inject, signal } from '@angular/core';
import { TourStepInfo } from '../models';
import { TOUR_STEPS } from '../constants';
import { WorkstationStateService } from './workstation-state.service';

@Injectable({
  providedIn: 'root'
})
export class GuidedTourService {
  private readonly state = inject(WorkstationStateService);

  readonly isTourActive = signal<boolean>(false);
  readonly currentStep = signal<number>(1);
  readonly autoPlay = signal<boolean>(true);
  readonly splitPos = signal<number | null>(null);
  readonly revertCountdown = signal<number | null>(null);

  private tourTimer: number | null = null;
  private tourWiperInterval: number | null = null;
  private tourCountdownInterval: number | null = null;

  readonly currentTourStepInfo = computed<TourStepInfo>(() => {
    const step = this.currentStep();
    const isSample = this.state.isSampleImage();
    const base = TOUR_STEPS[step - 1] || TOUR_STEPS[0];

    if (step === 4) {
      if (isSample) {
        return {
          step: 4,
          badge: 'STEP 4: INSTANT EXPORT & AUTO-REVERT',
          title: '4. Download Output (Demo Auto-Reverts To Upload)',
          description:
            'Notice the highlighted DOWNLOAD button below 👇! In this sample walkthrough, we highlight where to download without downloading unprompted files. Once finished, the workstation automatically reverts back so you can upload your own image.',
          actionNote:
            'Notice the highlighted DOWNLOAD button 👇! Reverting back to your upload screen in a few seconds...'
        };
      } else {
        return {
          step: 4,
          badge: 'STEP 4: INSTANT EXPORT',
          title: '4. Download Your Processed Image',
          description:
            'Your photo framing and compression settings are locked and ready! Click the highlighted DOWNLOAD button below 👇 to export your file. Everything stays right here on your screen so you can continue editing.',
          actionNote:
            'Notice the highlighted DOWNLOAD button 👇! Tour will close and keep your photo ready.'
        };
      }
    }
    return base;
  });

  startGuidedTour(sampleName = '') {
    if (!this.state.originalImage()) {
      return;
    }
    this.isTourActive.set(true);
    this.autoPlay.set(true);
    this.currentStep.set(1);
    this.executeTourStep(1, sampleName);
  }

  stopGuidedTour() {
    this.isTourActive.set(false);
    this.clearTourTimers();
    this.splitPos.set(null);
  }

  onTourFinish() {
    if (this.state.isSampleImage()) {
      this.stopGuidedTour();
      this.state.clear();
    } else {
      this.stopGuidedTour();
    }
  }

  advanceTourStep() {
    const curr = this.currentStep();
    if (curr < 4) {
      this.currentStep.set(curr + 1);
      this.executeTourStep(curr + 1);
    } else {
      this.onTourFinish();
    }
  }

  retreatTourStep() {
    const curr = this.currentStep();
    if (curr > 1) {
      this.currentStep.set(curr - 1);
      this.executeTourStep(curr - 1);
    }
  }

  toggleAutoPlay() {
    const nextVal = !this.autoPlay();
    this.autoPlay.set(nextVal);

    if (nextVal) {
      if (this.currentStep() < 4) {
        this.scheduleNextTourStep();
      } else {
        this.scheduleRevertCountdown();
      }
    } else {
      this.clearTourTimers();
    }
  }

  clearTourTimers() {
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
    this.revertCountdown.set(null);
  }

  private scheduleNextTourStep() {
    if (this.tourTimer) {
      window.clearTimeout(this.tourTimer);
    }
    if (!this.autoPlay() || this.currentStep() >= 4) return;

    this.tourTimer = window.setTimeout(() => {
      if (this.isTourActive() && this.autoPlay() && this.currentStep() < 4) {
        this.advanceTourStep();
      }
    }, 6500);
  }

  private scheduleRevertCountdown() {
    if (this.tourCountdownInterval) {
      window.clearInterval(this.tourCountdownInterval);
    }
    this.revertCountdown.set(6);
    this.tourCountdownInterval = window.setInterval(() => {
      if (!this.isTourActive() || !this.autoPlay()) {
        this.clearTourTimers();
        return;
      }
      const count = this.revertCountdown();
      if (count !== null && count > 1) {
        this.revertCountdown.set(count - 1);
      } else {
        this.clearTourTimers();
        this.onTourFinish();
      }
    }, 1000);
  }

  private executeTourStep(step: number, sampleName = '') {
    this.clearTourTimers();

    if (step === 1) {
      this.state.setActiveTab('crop');
      this.splitPos.set(null);
      const isPortrait =
        sampleName.toLowerCase().includes('portrait') ||
        sampleName.toLowerCase().includes('avatar');
      const ratioId = isPortrait ? '1:1' : '16:9';
      const ratioVal = isPortrait ? 1 : 16 / 9;
      this.state.selectRatio({ id: ratioId, ratio: ratioVal });
    } else if (step === 2) {
      this.state.setActiveTab('size');
      this.splitPos.set(null);
      this.state.updateConfig({
        sizeMode: 'target-kb',
        targetKb: 150,
        format: 'image/webp'
      });
    } else if (step === 3) {
      this.state.setActiveTab('inspect');
      let pos = 35;
      let forward = true;
      this.splitPos.set(pos);
      this.tourWiperInterval = window.setInterval(() => {
        if (forward) {
          pos += 1.5;
          if (pos >= 75) forward = false;
        } else {
          pos -= 1.5;
          if (pos <= 30) forward = true;
        }
        this.splitPos.set(Math.round(pos));
      }, 50);
    } else if (step === 4) {
      this.state.setActiveTab('inspect');
      this.splitPos.set(50);
      if (this.autoPlay()) {
        this.scheduleRevertCountdown();
      }
    }

    if (this.autoPlay() && step < 4) {
      this.scheduleNextTourStep();
    }
  }
}

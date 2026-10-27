import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideSparkles, LucideDownload, LucideCheck } from '@lucide/angular';
import { AiAgentService, WorkstationStateService } from '@core/services';

@Component({
  selector: 'app-ai-command-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideSparkles,
    LucideDownload,
    LucideCheck
  ],
  template: `
    <div class="retro-box bg-[#151311] border-2 border-[#f59e0b] p-3 sm:p-4 text-white shadow-[0_4px_20px_rgba(245,158,11,0.15)] space-y-3">
      <!-- Header row: Agent Indicator & Status -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-xs bg-[#f59e0b] text-black font-mono font-black text-xs shadow-sm">
            AI
          </span>
          <div class="flex items-center gap-2">
            <h3 class="font-mono font-bold text-xs sm:text-sm tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
              <svg lucideSparkles class="w-4 h-4"></svg>
              AI Auto-Pilot Copilot
            </h3>
            <span class="text-[10px] font-mono px-1.5 py-0.5 bg-amber-950/80 border border-amber-600/50 text-amber-400 rounded-xs">
              COMMAND-TO-SPEC AUTOMATION
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="toggleKeyModal()"
            class="px-2 py-0.5 text-[10px] font-mono border rounded-xs transition-colors cursor-pointer"
            [ngClass]="agentService.hasConfiguredApiKey() ? 'border-stone-700 bg-stone-900 text-stone-400 hover:text-amber-400' : 'border-amber-500/80 bg-amber-950/60 text-amber-300'"
            title="Configure Gemini API Key"
          >
            {{ agentService.hasConfiguredApiKey() ? '🔑 API KEY: ACTIVE' : '🔑 SET API KEY' }}
          </button>

          <div class="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full animate-pulse" [ngClass]="isBusy() ? 'bg-amber-400' : 'bg-emerald-400'"></span>
            <span>{{ getStatusMessage() }}</span>
          </div>
        </div>
      </div>

      <!-- Optional API Key Config Modal -->
      @if (showKeyModal) {
        <div class="p-3 bg-[#0d0b09] border border-amber-500/60 rounded-xs text-xs font-mono space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-amber-400 font-bold uppercase flex items-center gap-1.5">
              <span>🔑</span>
              <span>Google Gemini API Key</span>
            </span>
            <button type="button" (click)="showKeyModal = false" class="text-stone-400 hover:text-white cursor-pointer px-1">✕</button>
          </div>
          <p class="text-[11px] text-stone-400">
            Saved securely in your browser's local storage. Used for custom natural language queries.
          </p>
          <div class="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              [(ngModel)]="customKeyInput"
              placeholder="Paste Gemini API key (AQ.Ab8...)"
              class="flex-1 px-2.5 py-1.5 bg-stone-900 border border-stone-700 text-stone-100 rounded-xs text-xs outline-none focus:border-amber-400 font-mono"
            />
            <div class="flex gap-1.5">
              <button
                type="button"
                (click)="saveCustomKey()"
                class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase rounded-xs text-xs cursor-pointer"
              >
                Save
              </button>
              @if (agentService.hasConfiguredApiKey()) {
                <button
                  type="button"
                  (click)="clearCustomKey()"
                  class="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xs text-xs cursor-pointer"
                  title="Remove local key"
                >
                  Clear
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Command Input Bar -->
      <form (submit)="executePrompt()" class="flex flex-col sm:flex-row gap-2">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500 font-mono font-bold text-sm">
            &gt;
          </div>
          <input
            type="text"
            [(ngModel)]="userPrompt"
            name="prompt"
            [disabled]="isBusy()"
            placeholder='Type requirement (e.g. "I am applying for SSC exam", "YouTube thumbnail in WebP < 2MB", "Passport photo under 200KB")...'
            class="w-full pl-8 pr-3 py-2.5 bg-[#0c0a09] border border-stone-700 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none text-xs sm:text-sm font-mono text-stone-100 placeholder-stone-500 transition-colors rounded-xs"
          />
        </div>

        <button
          type="submit"
          [disabled]="isBusy() || !userPrompt.trim()"
          class="retro-btn-accent px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          @if (isBusy()) {
            <span class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            <span>TUNING...</span>
          } @else {
            <svg lucideSparkles class="w-4 h-4"></svg>
            <span>AUTO-APPLY</span>
          }
        </button>
      </form>

      <!-- Quick Template Chips (1-Click Automation) -->
      <div class="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
        <span class="text-stone-500 text-[10px] uppercase font-bold mr-1">QUICK INTENTS:</span>
        @for (chip of quickChips; track chip.label) {
          <button
            type="button"
            (click)="selectChip(chip.prompt)"
            [disabled]="isBusy()"
            class="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/70 text-stone-300 hover:text-amber-400 transition-colors rounded-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span>{{ chip.icon }}</span>
            <span>{{ chip.label }}</span>
          </button>
        }
      </div>

      <!-- Execution Success / Ready to Download Banner -->
      @if (state.lastAgentPlan(); as plan) {
        <div class="mt-2 p-3 bg-[#0d1810] border-2 border-emerald-500/80 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div class="flex items-start sm:items-center gap-2.5">
            <div class="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 font-bold mt-0.5 sm:mt-0">
              <svg lucideCheck class="w-3.5 h-3.5 stroke-[3]"></svg>
            </div>
            <div>
              <div class="text-emerald-400 font-bold tracking-wide flex items-center gap-2">
                <span>REQUIREMENT FULFILLED</span>
                <span class="text-[10px] text-emerald-300/80 uppercase font-normal">
                  [{{ plan.source === 'gemini-ai' ? 'Gemini 3.5 AI' : 'Edge Heuristics' }}]
                </span>
              </div>
              <div class="text-stone-300 text-[11px] mt-0.5">
                {{ plan.summary }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              (click)="state.download()"
              class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-xs rounded-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#000] cursor-pointer transition-transform active:translate-y-0.5"
            >
              <svg lucideDownload class="w-4 h-4"></svg>
              <span>DOWNLOAD NOW</span>
            </button>
          </div>
        </div>
      }

      <!-- Error alert if parsing fails -->
      @if (agentService.errorMessage()) {
        <div class="mt-2 p-2.5 bg-red-950/60 border border-red-500/60 text-red-300 font-mono text-xs rounded-xs flex items-center gap-2">
          <span class="text-red-400 font-bold">ERR:</span>
          <span>{{ agentService.errorMessage() }}</span>
        </div>
      }
    </div>
  `
})
export class AiCommandBarComponent {
  readonly agentService = inject(AiAgentService);
  readonly state = inject(WorkstationStateService);

  userPrompt = '';
  showKeyModal = false;
  customKeyInput = '';

  toggleKeyModal() {
    this.showKeyModal = !this.showKeyModal;
    if (this.showKeyModal) {
      this.customKeyInput = this.agentService.getCustomApiKey();
    }
  }

  saveCustomKey() {
    this.agentService.setCustomApiKey(this.customKeyInput);
    this.showKeyModal = false;
  }

  clearCustomKey() {
    this.agentService.setCustomApiKey('');
    this.customKeyInput = '';
    this.showKeyModal = false;
  }

  readonly quickChips = [
    { label: '🏛️ SSC / Govt Exam (3.5:4.5 <50KB)', prompt: 'I am applying for SSC exam', icon: '🏛️' },
    { label: '🛂 Passport Photo (1:1 <200KB)', prompt: 'Passport photo 1:1 square under 200KB', icon: '🛂' },
    { label: '🎬 YouTube Thumb (16:9 <2MB)', prompt: 'Make this a YouTube thumbnail under 2MB in WebP', icon: '🎬' },
    { label: '📱 IG Reel / Story (9:16 <500KB)', prompt: 'Instagram Story vertical 9:16 under 500KB', icon: '📱' },
    { label: '💼 LinkedIn Banner (4:1)', prompt: 'LinkedIn background cover banner 4:1 ratio', icon: '💼' }
  ];

  isBusy(): boolean {
    return this.agentService.isAnalyzing();
  }

  getStatusMessage(): string {
    if (this.agentService.isAnalyzing()) {
      return 'TUNING ASPECT RATIO & FILE BUDGET...';
    }
    return 'READY FOR INSTRUCTION';
  }

  async executePrompt() {
    if (!this.userPrompt.trim() || this.isBusy()) return;

    const original = this.state.originalImage();
    const naturalW = original?.width || 1920;
    const naturalH = original?.height || 1080;

    try {
      const plan = await this.agentService.parseUserIntent(this.userPrompt, naturalW, naturalH);
      await this.state.applyAgentAction(plan);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze requirements.';
      this.agentService.errorMessage.set(msg);
    }
  }

  selectChip(prompt: string) {
    this.userPrompt = prompt;
    this.executePrompt();
  }
}

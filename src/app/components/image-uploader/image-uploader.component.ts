import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideSparkles,
  LucideClipboard,
  LucideShieldCheck
} from '@lucide/angular';

interface SampleImage {
  name: string;
  desc: string;
  url: string;
  type: string;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [
    CommonModule,
    LucideSparkles,
    LucideClipboard,
    LucideShieldCheck
  ],
  template: `
    <div class="space-y-6">
      <!-- Main Drag-and-Drop Chassis -->
      <div
        (drop)="onDrop($event)"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (click)="fileInput.click()"
        [ngClass]="{
          'bg-amber-100 border-[#f59e0b] scale-[1.01]': isDragOver,
          'hover:bg-[#fcfbf7]': !isDragOver
        }"
        class="retro-box p-8 md:p-12 text-center cursor-pointer transition-all"
      >
        <input
          #fileInput
          type="file"
          (change)="onFileChange($event)"
          accept="image/*"
          class="hidden"
        />

        <div class="max-w-xl mx-auto flex flex-col items-center">
          <div class="relative mb-4">
            <img
              src="logo.png"
              alt="AspectShift Logo"
              class="w-20 h-20 border-2 border-black object-cover shadow-[4px_4px_0px_#f59e0b]"
            />
          </div>

          <h2 class="font-mono font-black text-xl sm:text-2xl text-stone-900 tracking-tight">
            INITIALIZE IMAGE INPUT
          </h2>
          <p class="font-mono text-sm text-stone-600 mt-2 max-w-md">
            Drag &amp; drop an image file here, or click to browse files from your computer.
          </p>

          <div class="mt-4 flex flex-wrap justify-center items-center gap-2 text-xs font-mono text-stone-500">
            <span class="bg-stone-200 text-stone-800 px-2 py-0.5 retro-border font-bold">
              PNG
            </span>
            <span class="bg-stone-200 text-stone-800 px-2 py-0.5 retro-border font-bold">
              JPG / JPEG
            </span>
            <span class="bg-stone-200 text-stone-800 px-2 py-0.5 retro-border font-bold">
              WEBP
            </span>
            <span class="bg-stone-200 text-stone-800 px-2 py-0.5 retro-border font-bold">
              AVIF
            </span>
            <span class="bg-stone-200 text-stone-800 px-2 py-0.5 retro-border font-bold">
              GIF
            </span>
            <span class="bg-stone-200 text-stone-800 px-2 py-0.5 retro-border font-bold">
              BMP
            </span>
          </div>

          <div class="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-stone-600">
            <span class="flex items-center gap-1.5">
              <svg lucideClipboard class="w-4 h-4 text-amber-600"></svg>
              Tip: Press <kbd class="px-1.5 py-0.5 bg-stone-200 border border-stone-400 font-bold">Ctrl+V</kbd> to paste from clipboard
            </span>
            <span class="flex items-center gap-1.5 text-emerald-800">
              <svg lucideShieldCheck class="w-4 h-4 text-emerald-600"></svg>
              100% Client-Side / Zero Server Upload
            </span>
          </div>
        </div>
      </div>

      <!-- Instant Demo Samples Section -->
      <div class="retro-box p-4 bg-stone-100">
        <div class="flex items-center justify-between pb-3 retro-border-b">
          <div class="flex items-center gap-2">
            <svg lucideSparkles class="w-4 h-4 text-amber-600"></svg>
            <h3 class="font-mono font-bold text-xs uppercase tracking-wider text-stone-800">
              OR TEST IMMEDIATELY WITH A SAMPLE (AUTOMATIC GUIDED TOUR):
            </h3>
          </div>
          <span class="text-[11px] font-mono text-amber-800 font-bold hidden sm:inline bg-amber-200 px-2 py-0.5 border border-amber-400">
            ✨ Auto-Guides Step 1, 2, 3 &amp; Download
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          @for (sample of sampleImages; track sample.name) {
            <button
              type="button"
              (click)="onSelectSample(sample)"
              class="retro-btn p-2 text-left flex flex-col justify-between group hover:bg-amber-50 relative"
            >
              <div class="relative aspect-video w-full bg-stone-300 overflow-hidden retro-border mb-2">
                <img
                  [src]="sample.url"
                  [alt]="sample.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span class="absolute top-1 left-1 bg-[#f59e0b] text-black text-[9px] font-mono font-bold px-1 border border-black">
                  GUIDE ➔
                </span>
                <span class="absolute bottom-1 right-1 bg-black/80 text-amber-400 text-[9px] font-mono px-1">
                  {{ sample.type }}
                </span>
              </div>
              <div>
                <div class="font-mono text-xs font-bold text-stone-900 group-hover:text-amber-800 line-clamp-1">
                  {{ sample.name }}
                </div>
                <div class="text-[11px] font-mono text-stone-500 line-clamp-2 mt-0.5">
                  {{ sample.desc }}
                </div>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- The 3-in-1 Problem Solved Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="retro-box p-4">
          <div class="font-mono text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            01 // RATIO MAINTAINER
          </div>
          <h4 class="font-mono font-bold text-sm text-stone-900 mb-1">
            Live Aspect Ratio Cropper
          </h4>
          <p class="text-xs text-stone-600 leading-relaxed">
            Eliminates awkward stretched or letterboxed images. Live frame lock for 1:1, 16:9, 4:5, 9:16, 4:3, or custom pixel dimensions.
          </p>
        </div>

        <div class="retro-box p-4">
          <div class="font-mono text-xs font-bold text-cyan-700 uppercase tracking-wider mb-1">
            02 // SIZE REDUCER
          </div>
          <h4 class="font-mono font-bold text-sm text-stone-900 mb-1">
            Exact KB/MB Target Compression
          </h4>
          <p class="text-xs text-stone-600 leading-relaxed">
            No guessing quality sliders. Enter your exact required file size (e.g. 100 KB for govt visas or 2 MB for YouTube) and our binary search engine matches it.
          </p>
        </div>

        <div class="retro-box p-4">
          <div class="font-mono text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            03 // FORMAT CONVERTER
          </div>
          <h4 class="font-mono font-bold text-sm text-stone-900 mb-1">
            Multi-Extension Transcoder
          </h4>
          <p class="text-xs text-stone-600 leading-relaxed">
            Switch between WebP, JPEG, PNG, and AVIF with custom transparency fill backgrounds in the same unified workflow.
          </p>
        </div>
      </div>
    </div>
  `
})
export class ImageUploaderComponent {
  @Output() imageSelected = new EventEmitter<File>();
  @Output() sampleSelected = new EventEmitter<{ url: string; name: string }>();

  isDragOver = false;

  readonly sampleImages: SampleImage[] = [
    {
      name: 'Landscape 4K (4000x2500)',
      desc: 'High resolution nature photo for widescreen & web banners',
      url: 'samples/landscape-nature.jpg',
      type: 'Landscape'
    },
    {
      name: 'Portrait Headshot (Passport & Avatar)',
      desc: 'Ideal for 1:1 Square, 4:5 Instagram & Visa photos',
      url: 'samples/portrait-headshot.jpg',
      type: 'Portrait'
    },
    {
      name: 'Retro Tech Console (High Contrast)',
      desc: 'Geometric retro industrial gear with rich textures',
      url: 'samples/retro-tech-console.jpg',
      type: 'Retro Gear'
    },
    {
      name: 'Urban Architecture (Detailed Grids)',
      desc: 'Sharp geometric angles to test crisp cropping',
      url: 'samples/urban-architecture.jpg',
      type: 'Urban'
    }
  ];

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.imageSelected.emit(file);
      }
    }
  }

  onFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.imageSelected.emit(target.files[0]);
    }
  }

  onSelectSample(sample: SampleImage) {
    this.sampleSelected.emit({ url: sample.url, name: sample.name });
  }
}

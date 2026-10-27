import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideBookOpen,
  LucideShield,
  LucideCheck,
  LucideCircleQuestionMark,
  LucideChevronDown,
  LucideChevronUp
} from '@lucide/angular';

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-seo-guide-section',
  standalone: true,
  imports: [
    CommonModule,
    LucideBookOpen,
    LucideShield,
    LucideCheck,
    LucideCircleQuestionMark,
    LucideChevronDown,
    LucideChevronUp
  ],
  template: `
    <section id="seo-guide" class="space-y-6 pt-6">
      <!-- Educational Article Section for SEO -->
      <article class="retro-box p-6 bg-white space-y-6">
        <div class="flex items-center gap-2 pb-3 retro-border-b">
          <svg lucideBookOpen class="w-5 h-5 text-amber-600"></svg>
          <h2 class="font-mono font-black text-lg text-stone-900 tracking-tight">
            GUIDE: ASPECT RATIO, RESOLUTION &amp; FILE SIZE OPTIMIZATION
          </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-stone-700 leading-relaxed font-sans">
          <div class="space-y-3">
            <h3 class="font-mono font-bold text-sm text-stone-900">
              The Challenge of Fragmented Image Workflows
            </h3>
            <p>
              When preparing visual assets for modern web applications, social platforms, or document uploads,
              creators typically face three separate technical constraints simultaneously:
            </p>
            <ul class="space-y-1.5 pl-4 list-disc font-mono text-[11px] text-stone-800">
              <li><strong>Aspect Ratio Constraints:</strong> Preventing awkward automated cropping or pillarboxing.</li>
              <li><strong>Physical Dimensions (Pixels):</strong> Meeting exact platform width and height standards.</li>
              <li><strong>Payload Weight Limits (KB / MB):</strong> Bypassing server upload rejection thresholds.</li>
              <li><strong>File Extension Transcoding:</strong> Converting heavy formats like TIFF/PNG to lightweight WebP/AVIF.</li>
            </ul>
            <p>
              Traditional workflows require jumping between three disconnected tools: a photo editor for cropping,
              an online compression tool, and an image converter. <strong>AspectShift</strong> consolidates this entire
              pipeline into a unified, zero-upload retro workstation.
            </p>
          </div>

          <div class="space-y-3">
            <h3 class="font-mono font-bold text-sm text-stone-900">
              Impact on Core Web Vitals &amp; SEO
            </h3>
            <p>
              Optimizing image aspect ratios directly improves <strong>Cumulative Layout Shift (CLS)</strong> by
              enabling browsers to allocate the correct container dimensions before downloading the asset.
            </p>
            <p>
              Concurrently, compressing images down to target file budgets (e.g. under 200 KB for hero banners) drastically improves <strong>Largest Contentful Paint (LCP)</strong>, lowering bounce rates and accelerating SEO ranking velocity on search engines.
            </p>
            <div class="bg-amber-50 p-3 retro-border font-mono text-[11px] text-stone-800 flex items-start gap-2">
              <svg lucideShield class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></svg>
              <span>
                <strong>Privacy Guarantee:</strong> All operations run completely inside your browser memory using HTML5 Canvas primitives. Sensitive photos, IDs, and commercial graphics never touch an external server.
              </span>
            </div>
          </div>
        </div>

        <!-- Standard Platform Specs Cheatsheet Table -->
        <div class="space-y-2 pt-4 retro-border-t">
          <h3 class="font-mono font-bold text-xs uppercase tracking-wider text-stone-900">
            2026 PLATFORM ASPECT RATIO &amp; SIZE SPECIFICATIONS CHEATSHEET
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs retro-border border-collapse bg-stone-50">
              <thead>
                <tr class="bg-[#1c1917] text-white">
                  <th class="p-2 border border-stone-700">Platform / Usage</th>
                  <th class="p-2 border border-stone-700">Aspect Ratio</th>
                  <th class="p-2 border border-stone-700">Optimal Pixels</th>
                  <th class="p-2 border border-stone-700">Max File Budget</th>
                  <th class="p-2 border border-stone-700">Recommended Format</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200">
                <tr class="hover:bg-amber-50/50">
                  <td class="p-2 font-bold">Instagram Feed Post</td>
                  <td class="p-2 text-amber-700 font-bold">1:1 Square / 4:5 Portrait</td>
                  <td class="p-2">1080 × 1080 / 1080 × 1350</td>
                  <td class="p-2">350 KB</td>
                  <td class="p-2">JPEG / WebP</td>
                </tr>
                <tr class="hover:bg-amber-50/50">
                  <td class="p-2 font-bold">TikTok / Reels / Story</td>
                  <td class="p-2 text-amber-700 font-bold">9:16 Vertical</td>
                  <td class="p-2">1080 × 1920</td>
                  <td class="p-2">500 KB</td>
                  <td class="p-2">JPEG</td>
                </tr>
                <tr class="hover:bg-amber-50/50">
                  <td class="p-2 font-bold">YouTube Thumbnail</td>
                  <td class="p-2 text-amber-700 font-bold">16:9 Landscape</td>
                  <td class="p-2">1280 × 720</td>
                  <td class="p-2 text-red-700 font-bold">Strictly &lt; 2 MB</td>
                  <td class="p-2">WebP / JPEG</td>
                </tr>
                <tr class="hover:bg-amber-50/50">
                  <td class="p-2 font-bold">Passport / Visa 2×2"</td>
                  <td class="p-2 text-amber-700 font-bold">1:1 Square</td>
                  <td class="p-2">600 × 600</td>
                  <td class="p-2 text-red-700 font-bold">Strictly &lt; 240 KB</td>
                  <td class="p-2">JPEG (White BG)</td>
                </tr>
                <tr class="hover:bg-amber-50/50">
                  <td class="p-2 font-bold">X / Twitter Header</td>
                  <td class="p-2 text-amber-700 font-bold">3:1 Panorama</td>
                  <td class="p-2">1500 × 500</td>
                  <td class="p-2">500 KB</td>
                  <td class="p-2">JPEG / PNG</td>
                </tr>
                <tr class="hover:bg-amber-50/50">
                  <td class="p-2 font-bold">Web Hero / Homepage Banner</td>
                  <td class="p-2 text-amber-700 font-bold">16:9 or 21:9</td>
                  <td class="p-2">1920 × 1080</td>
                  <td class="p-2 text-emerald-700 font-bold">Under 250 KB</td>
                  <td class="p-2">WebP / AVIF</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Format Comparison -->
        <div class="space-y-2 pt-4 retro-border-t">
          <h3 class="font-mono font-bold text-xs uppercase tracking-wider text-stone-900">
            MODERN IMAGE FORMAT SELECTION GUIDE
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div class="p-3 bg-stone-50 retro-border font-mono text-xs space-y-1">
              <span class="font-bold text-stone-900 block">WEBP</span>
              <p class="text-[11px] text-stone-600">
                25-35% smaller than JPEG with alpha transparency. Ideal default for modern websites and web applications.
              </p>
              <div class="text-[10px] text-emerald-700 pt-1 flex items-center gap-1">
                <svg lucideCheck class="w-3 h-3"></svg> Full browser support
              </div>
            </div>

            <div class="p-3 bg-stone-50 retro-border font-mono text-xs space-y-1">
              <span class="font-bold text-stone-900 block">JPEG</span>
              <p class="text-[11px] text-stone-600">
                The universal photography format. Essential for strict passport/visa portals and legacy social media.
              </p>
              <div class="text-[10px] text-stone-700 pt-1 flex items-center gap-1">
                <svg lucideCheck class="w-3 h-3"></svg> 100% universal compatibility
              </div>
            </div>

            <div class="p-3 bg-stone-50 retro-border font-mono text-xs space-y-1">
              <span class="font-bold text-stone-900 block">PNG</span>
              <p class="text-[11px] text-stone-600">
                Lossless raster format for logos, diagrams, and sharp pixel art requiring transparent backgrounds.
              </p>
              <div class="text-[10px] text-stone-700 pt-1 flex items-center gap-1">
                <svg lucideCheck class="w-3 h-3"></svg> Pixel-crisp vector-like edges
              </div>
            </div>

            <div class="p-3 bg-stone-50 retro-border font-mono text-xs space-y-1">
              <span class="font-bold text-stone-900 block">AVIF</span>
              <p class="text-[11px] text-stone-600">
                Next-generation AV1-based codec with exceptional high-fidelity compression at ultra-low bitrates.
              </p>
              <div class="text-[10px] text-cyan-700 pt-1 flex items-center gap-1">
                <svg lucideCheck class="w-3 h-3"></svg> Maximum bandwidth savings
              </div>
            </div>
          </div>
        </div>

        <!-- Interactive FAQ Accordion -->
        <div class="space-y-3 pt-4 retro-border-t">
          <div class="flex items-center gap-2">
            <svg lucideCircleQuestionMark class="w-4 h-4 text-amber-600"></svg>
            <h3 class="font-mono font-bold text-xs uppercase tracking-wider text-stone-900">
              FREQUENTLY ASKED QUESTIONS (FAQ)
            </h3>
          </div>

          <div class="space-y-2">
            @for (faq of faqs; track faq.q; let idx = $index) {
              <div class="retro-border bg-stone-50 overflow-hidden">
                <button
                  type="button"
                  (click)="toggleFaq(idx)"
                  class="w-full text-left p-3 flex items-center justify-between font-mono text-xs font-bold text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  <span>{{ faq.q }}</span>
                  @if (openFaq === idx) {
                    <svg lucideChevronUp class="w-4 h-4 text-stone-600 shrink-0"></svg>
                  } @else {
                    <svg lucideChevronDown class="w-4 h-4 text-stone-600 shrink-0"></svg>
                  }
                </button>
                @if (openFaq === idx) {
                  <div class="p-3 pt-0 text-xs text-stone-700 font-sans border-t border-stone-200 bg-white leading-relaxed">
                    {{ faq.a }}
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </article>

      <!-- Retro Console Footer -->
      <footer class="retro-box bg-[#1c1917] text-stone-300 p-4 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-3 border-2 border-black shadow-[3px_3px_0px_#1c1917]">
        <div class="flex items-center gap-2.5 flex-wrap">
          <img src="logo.png" alt="AspectShift Logo" width="24" height="24" style="width: 24px; height: 24px; aspect-ratio: 1/1;" class="w-6 h-6 border border-stone-600 inline-block object-cover" />
          <span class="text-[#fbbf24] font-black tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.25)]">
            ASPECTSHIFT
          </span>
          <span class="text-stone-600">·</span>
          <span class="text-cyan-300 font-bold tracking-wide drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">
            Image &amp; Size Maintainer
          </span>
          <span class="text-[10px] bg-[#f59e0b]/15 text-[#fbbf24] border border-[#f59e0b]/40 px-1.5 py-0.5 font-bold">
            ANGULAR CORE
          </span>
        </div>
        <div class="text-[11px] text-stone-400 flex items-center gap-2">
          <span class="text-emerald-400 font-medium">● ZERO SERVER UPLOADS</span>
          <span class="text-stone-600">·</span>
          <span>100% PRIVATE CANVAS ENGINE</span>
        </div>
      </footer>
    </section>
  `
})
export class SeoGuideSectionComponent {
  openFaq: number | null = 0;

  readonly faqs: FaqItem[] = [
    {
      q: 'How does AspectShift hit an exact target file size (e.g. under 100 KB)?',
      a: 'AspectShift runs an offscreen binary search algorithm across HTML5 canvas compression matrices. Rather than forcing you to guess quality percentages in multiple apps, the algorithm calculates file output sizes in rapid iterations to find the highest possible fidelity that stays strictly within your specified KB/MB threshold.'
    },
    {
      q: 'What is the difference between aspect ratio and pixel dimensions?',
      a: 'Aspect ratio describes the proportional relationship between width and height (such as 1:1 square or 16:9 widescreen), regardless of scale. Pixel dimensions represent the physical resolution (such as 1920×1080 px). Maintaining the exact aspect ratio prevents image distortion, stretching, and unwanted letterboxing.'
    },
    {
      q: 'Why do government portals, passport systems, and job boards have strict KB limits?',
      a: 'Legacy enterprise and government databases impose strict database payload quotas (frequently 200 KB or 240 KB for 2x2 inch passport headshots). AspectShift allows you to crop the 1:1 passport aspect ratio, scale to 600×600 px, and ensure the file size is under 200 KB in a single click.'
    },
    {
      q: 'Are my uploaded images stored on any remote cloud server?',
      a: 'No. All image resizing, cropping, compression, and extension conversion happens 100% locally in your client web browser via high-speed HTML5 Canvas and WebAssembly. Your photos and sensitive documents never leave your device.'
    },
    {
      q: 'Which image format should I choose: WebP, AVIF, JPEG, or PNG?',
      a: 'WebP is recommended for general modern web use because it is 30% smaller than JPEG with transparency support. JPEG is the universal standard for photography and legacy systems. PNG should be chosen when lossless sharp vector-like graphic edges are essential. AVIF provides the highest possible compression density for state-of-the-art browsers.'
    }
  ];

  toggleFaq(idx: number) {
    this.openFaq = this.openFaq === idx ? null : idx;
  }
}

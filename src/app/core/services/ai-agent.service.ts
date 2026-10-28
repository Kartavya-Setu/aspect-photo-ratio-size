import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AgentActionPlan, CropAnchor } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AiAgentService {
  readonly isAnalyzing = signal<boolean>(false);
  readonly lastPlan = signal<AgentActionPlan | null>(null);
  readonly errorMessage = signal<string | null>(null);

  hasConfiguredApiKey(): boolean {
    const key = this.getApiKey();
    return !!(key && key.trim().length > 0);
  }

  setCustomApiKey(key: string): void {
    if (key && key.trim().length > 0) {
      localStorage.setItem('aspectshift_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('aspectshift_gemini_api_key');
    }
  }

  getCustomApiKey(): string {
    return localStorage.getItem('aspectshift_gemini_api_key') || '';
  }

  private getApiKey(): string {
    const customKey = localStorage.getItem('aspectshift_gemini_api_key');
    return (customKey && customKey.trim().length > 0) ? customKey.trim() : (environment.geminiApiKey || '');
  }

  /**
   * Main entry point: Parses user natural language command into an executable AgentActionPlan.
   * Focuses on aspect ratio locking, dimensions, target KB compression, and export format.
   */
  async parseUserIntent(
    prompt: string,
    currentImageWidth?: number,
    currentImageHeight?: number,
    currentImageSizeBytes?: number
  ): Promise<AgentActionPlan> {
    this.isAnalyzing.set(true);
    this.errorMessage.set(null);

    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      this.isAnalyzing.set(false);
      throw new Error('Please enter an instruction or requirement.');
    }

    const naturalW = currentImageWidth || 1920;
    const naturalH = currentImageHeight || 1080;
    const naturalSizeBytes = currentImageSizeBytes || 1024 * 500;

    try {
      // 1. Check Fast Local Heuristics first (0ms latency, offline-ready)
      const heuristicResult = this.tryLocalHeuristics(cleanPrompt, naturalW, naturalH, naturalSizeBytes);
      if (heuristicResult) {
        const sanitized = this.sanitizePlan(heuristicResult, naturalW, naturalH, cleanPrompt);
        this.lastPlan.set(sanitized);
        this.isAnalyzing.set(false);
        return sanitized;
      }

      // 2. If no Gemini API key is available, use smart client-side fallback without error
      if (!this.hasConfiguredApiKey()) {
        const fallbackResult = this.createFallbackPlan(cleanPrompt, naturalW, naturalH, naturalSizeBytes);
        const sanitized = this.sanitizePlan(fallbackResult, naturalW, naturalH, cleanPrompt);
        this.lastPlan.set(sanitized);
        this.isAnalyzing.set(false);
        return sanitized;
      }

      // 3. Fall back to Gemini 3.5 Flash Lite API
      const geminiResult = await this.callGeminiApi(cleanPrompt, naturalW, naturalH, naturalSizeBytes);
      const sanitized = this.sanitizePlan(geminiResult, naturalW, naturalH, cleanPrompt);
      this.lastPlan.set(sanitized);
      this.isAnalyzing.set(false);
      return sanitized;
    } catch (err: unknown) {
      console.info('Switched to local adaptive parser:', err instanceof Error ? err.message : err);
      const fallbackResult = this.createFallbackPlan(cleanPrompt, naturalW, naturalH, naturalSizeBytes);
      const sanitized = this.sanitizePlan(fallbackResult, naturalW, naturalH, cleanPrompt);
      this.lastPlan.set(sanitized);
      this.isAnalyzing.set(false);
      return sanitized;
    }
  }

  /**
   * Fast rule-based heuristic matcher for common exam and social platform standards.
   */
  /**
   * Fast rule-based heuristic matcher for common exam and social platform standards.
   * Handles multi-platform clashes, negative dimensions, and metaphorical intent.
   */
  private tryLocalHeuristics(
    prompt: string,
    naturalW = 1920,
    naturalH = 1080,
    naturalSizeBytes = 1024 * 500
  ): AgentActionPlan | null {
    const p = prompt.toLowerCase();
    const currentKb = Math.round(naturalSizeBytes / 1024);

    // A. Orientation & Mirror Extraction
    const extractOrientation = (): { rotation?: number; flipH?: boolean; flipV?: boolean } => {
      let rotation: number | undefined = undefined;
      let flipH: boolean | undefined = undefined;
      let flipV: boolean | undefined = undefined;

      if (p.includes('rotate 90') || p.includes('turn 90') || p.includes('90 deg') || p.includes('90 degree')) {
        rotation = (p.includes('counter') || p.includes('ccw') || p.includes('left')) ? 270 : 90;
      } else if (p.includes('rotate 180') || p.includes('upside down') || p.includes('180 deg')) {
        rotation = 180;
      } else if (p.includes('rotate 270')) {
        rotation = 270;
      }

      if (p.includes('flip horizontal') || p.includes('flip h') || p.includes('mirror horizontal') || p.includes('mirror h')) {
        flipH = true;
      } else if (p.includes('flip vertical') || p.includes('flip v') || p.includes('mirror vertical') || p.includes('mirror v')) {
        flipV = true;
      } else if (p.includes('flip') || p.includes('mirror')) {
        flipH = true;
      }

      return { rotation, flipH, flipV };
    };

    // B. Spatial Crop Anchor Extraction
    const extractAnchor = (): CropAnchor => {
      if (p.includes('bottom-right') || p.includes('bottom right') || (p.includes('bottom') && p.includes('right'))) return 'bottom-right';
      if (p.includes('bottom-left') || p.includes('bottom left') || (p.includes('bottom') && p.includes('left'))) return 'bottom-left';
      if (p.includes('top-right') || p.includes('top right') || (p.includes('top') && p.includes('right'))) return 'top-right';
      if (p.includes('top-left') || p.includes('top left') || (p.includes('top') && p.includes('left'))) return 'top-left';
      if (p.includes('bottom')) return 'bottom';
      if (p.includes('top')) return 'top';
      if (p.includes('right')) return 'right';
      if (p.includes('left')) return 'left';
      return 'center';
    };

    // C. Physical Print Units & DPI Calculator (e.g. "2x2 inch at 300 DPI", "3.5x4.5 cm at 300 DPI")
    const extractPrintUnits = (): { width: number; height: number; ratioVal: number; ratioId: string; note: string } | null => {
      let dpi = 300;
      const dpiMatch = p.match(/(\d+)\s*(?:dpi|ppi)/i);
      if (dpiMatch) {
        dpi = parseInt(dpiMatch[1], 10);
      }

      // Inches: e.g. "2x2 inch", "2 x 2 inches", "3.5 by 4.5 in"
      const inchMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:x|\*|by)\s*(\d+(?:\.\d+)?)\s*(?:inch|inches|in\b)/i);
      if (inchMatch) {
        const inW = parseFloat(inchMatch[1]);
        const inH = parseFloat(inchMatch[2]);
        const pxW = Math.round(inW * dpi);
        const pxH = Math.round(inH * dpi);
        return {
          width: pxW,
          height: pxH,
          ratioVal: pxW / pxH,
          ratioId: pxW === pxH ? '1:1' : 'custom',
          note: `${inW}×${inH} in @ ${dpi} DPI (${pxW}×${pxH}px)`
        };
      }

      // Centimeters: e.g. "3.5x4.5 cm" (1 inch = 2.54 cm)
      const cmMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:x|\*|by)\s*(\d+(?:\.\d+)?)\s*(?:cm|centimeter|centimeters)/i);
      if (cmMatch) {
        const cmW = parseFloat(cmMatch[1]);
        const cmH = parseFloat(cmMatch[2]);
        const pxW = Math.round((cmW / 2.54) * dpi);
        const pxH = Math.round((cmH / 2.54) * dpi);
        return {
          width: pxW,
          height: pxH,
          ratioVal: pxW / pxH,
          ratioId: Math.abs(pxW / pxH - 3.5 / 4.5) < 0.05 ? '3.5:4.5' : (pxW === pxH ? '1:1' : 'custom'),
          note: `${cmW}×${cmH} cm @ ${dpi} DPI (${pxW}×${pxH}px)`
        };
      }

      return null;
    };

    // D. Relative / Percentage Adjustments (e.g. "reduce dimensions by 40%", "cut file size in half")
    const extractRelative = (): { targetKb?: number; dims?: { width: number; height: number }; note: string } => {
      let targetKb: number | undefined = undefined;
      let dims: { width: number; height: number } | undefined = undefined;
      const notes: string[] = [];

      if (p.includes('half the size') || p.includes('cut in half') || p.includes('half size') || p.includes('50% size')) {
        targetKb = Math.max(10, Math.round(currentKb * 0.5));
        notes.push(`Cut size in half (< ${targetKb} KB)`);
      } else {
        const pctSizeMatch = p.match(/reduce\s*(?:file)?\s*size\s*by\s*(\d+)%/i) || p.match(/(\d+)%\s*(?:file)?\s*size/i);
        if (pctSizeMatch) {
          const pct = parseInt(pctSizeMatch[1], 10);
          targetKb = Math.max(10, Math.round(currentKb * (1 - pct / 100)));
          notes.push(`Reduced file size by ${pct}% (< ${targetKb} KB)`);
        }
      }

      if (p.includes('half dimensions') || p.includes('half width') || p.includes('50% dimensions')) {
        dims = {
          width: Math.max(16, Math.round(naturalW * 0.5)),
          height: Math.max(16, Math.round(naturalH * 0.5))
        };
        notes.push(`Half scale (${dims.width}×${dims.height}px)`);
      } else {
        const pctDimMatch = p.match(/reduce\s*(?:dimensions?|resolution|scale)?\s*by\s*(\d+)%/i) ||
                            p.match(/shrink\s*(?:by)?\s*(\d+)%/i) ||
                            p.match(/scale\s*(?:to)?\s*(\d+)%/i);
        if (pctDimMatch) {
          const pct = parseInt(pctDimMatch[1], 10);
          const factor = p.includes('scale to') ? (pct / 100) : (1 - pct / 100);
          dims = {
            width: Math.max(16, Math.round(naturalW * factor)),
            height: Math.max(16, Math.round(naturalH * factor))
          };
          notes.push(`Scaled by ${Math.round(factor * 100)}% (${dims.width}×${dims.height}px)`);
        }
      }

      return { targetKb, dims, note: notes.join(', ') };
    };

    // E. Target KB detection
    const extractKb = (): number | null => {
      const mbMatch = p.match(/(?:under|max|less\s+than|<|below|size\s*(?:is|should\s*(?:be)?)?)?\s*(-?\d+(?:\.\d+)?)\s*mb/i);
      if (mbMatch) return Math.round(Math.abs(parseFloat(mbMatch[1])) * 1024);

      const kbMatch = p.match(/(?:under|max|less\s+than|<|below|size\s*(?:is|should\s*(?:be)?)?)?\s*(-?\d+)\s*(?:kb|kv|k\b)/i);
      if (kbMatch) return Math.abs(parseInt(kbMatch[1], 10));

      const rawSizeMatch = p.match(/(?:size\s*(?:is|should\s*(?:be)?|under|below|max)?|under|max|less\s+than|<|below)\s*(-?\d+)(?!\s*(?:px|pixel|pixels))/i);
      if (rawSizeMatch) return Math.abs(parseInt(rawSizeMatch[1], 10));

      return null;
    };

    // F. Dimension detection (explicit pixels)
    const extractDimensions = (): { width: number; height: number; ratioVal: number; ratioId: string } | null => {
      const pairMatch = p.match(/(-?\d+)\s*(?:x|\*|by)\s*(-?\d+)(?:\s*(?:px|pixel|pixels))?/i);
      if (pairMatch) {
        const w = Math.max(16, Math.min(8192, Math.abs(parseInt(pairMatch[1], 10)) || naturalW));
        const h = Math.max(16, Math.min(8192, Math.abs(parseInt(pairMatch[2], 10)) || naturalH));
        return { width: w, height: h, ratioVal: w / h, ratioId: w === h ? '1:1' : 'custom' };
      }

      const singleMatch = p.match(/(-?\d+)\s*(?:px|pixel|pixels)/i);
      if (singleMatch) {
        const val = Math.max(16, Math.min(8192, Math.abs(parseInt(singleMatch[1], 10)) || naturalW));
        if (p.includes('square') || p.includes('1:1')) {
          return { width: val, height: val, ratioVal: 1.0, ratioId: '1:1' };
        }
        const currentRatio = naturalW / naturalH;
        const h = Math.round(val / currentRatio);
        return { width: val, height: Math.max(16, h), ratioVal: currentRatio, ratioId: 'free' };
      }

      return null;
    };

    const extractFormat = (defaultFormat: 'image/jpeg' | 'image/webp' | 'image/png' = 'image/jpeg'): 'image/jpeg' | 'image/webp' | 'image/png' => {
      if (p.includes('webp')) return 'image/webp';
      if (p.includes('png')) return 'image/png';
      if (p.includes('jpg') || p.includes('jpeg')) return 'image/jpeg';
      return defaultFormat;
    };

    const requestedKb = extractKb();
    const requestedFormat = extractFormat('image/jpeg');
    const customDims = extractDimensions();
    const printUnits = extractPrintUnits();
    const relativeData = extractRelative();
    const orientation = extractOrientation();
    const anchor = extractAnchor();

    // 1. Direct Physical Print Unit Command (e.g. "2x2 inches at 300 DPI")
    if (printUnits) {
      const targetKb = requestedKb || relativeData.targetKb || 240;
      return {
        ratioId: printUnits.ratioId,
        aspectRatioValue: printUnits.ratioVal,
        targetDimensions: { width: printUnits.width, height: printUnits.height },
        sizeMode: 'target-kb',
        targetKb,
        format: requestedFormat,
        summary: `Physical Print Spec: ${printUnits.note}, < ${targetKb} KB`,
        source: 'preset-matcher',
        rotation: orientation.rotation,
        flipHorizontal: orientation.flipH,
        flipVertical: orientation.flipV,
        cropAnchor: anchor
      };
    }

    // 2. Relative Adjustment Command (e.g. "reduce dimensions by 40% and cut size in half")
    if (relativeData.dims || relativeData.targetKb) {
      const targetKb = relativeData.targetKb || requestedKb || Math.round(currentKb * 0.7);
      const dims = relativeData.dims || customDims;
      const ratioId = dims ? (dims.width === dims.height ? '1:1' : 'free') : 'free';
      const ratioVal = dims ? dims.width / dims.height : (naturalW / naturalH);

      return {
        ratioId,
        aspectRatioValue: ratioVal,
        targetDimensions: dims ? { width: dims.width, height: dims.height } : null,
        sizeMode: 'target-kb',
        targetKb,
        format: requestedFormat,
        summary: `Relative Adjustment: ${relativeData.note || `<${targetKb} KB`}`,
        source: 'preset-matcher',
        rotation: orientation.rotation,
        flipHorizontal: orientation.flipH,
        flipVertical: orientation.flipV,
        cropAnchor: anchor
      };
    }

    // 3. Multi-Platform Priority & Presets
    const isSSC = p.includes('ssc') || p.includes('upsc') || p.includes('govt') || p.includes('exam') || p.includes('admit') || p.includes('portal');
    const isPassport = p.includes('passport') || p.includes('visa') || p.includes('id photo') || p.includes('headshot');
    const isYouTubeThumb = p.includes('youtube') && (p.includes('thumb') || p.includes('thumbnail') || p.includes('cover') || (!p.includes('shorts') && !p.includes('reel')));
    const isReelShorts = p.includes('story') || p.includes('reel') || p.includes('tiktok') || p.includes('shorts');
    const isLinkedIn = p.includes('linkedin');

    if (isSSC) {
      const targetKb = requestedKb || 50;
      const clashNote = (isPassport || isYouTubeThumb || isReelShorts || isLinkedIn) ? ' (Prioritized SSC Exam over social platforms)' : '';
      return {
        ratioId: '3.5:4.5',
        aspectRatioValue: 3.5 / 4.5,
        targetDimensions: customDims ? { width: customDims.width, height: customDims.height } : { width: 350, height: 450 },
        sizeMode: 'target-kb',
        targetKb,
        format: 'image/jpeg',
        summary: `SSC / Govt Exam Format (3.5×4.5cm, < ${targetKb} KB JPEG)${clashNote}`,
        source: 'preset-matcher',
        rotation: orientation.rotation,
        flipHorizontal: orientation.flipH,
        flipVertical: orientation.flipV,
        cropAnchor: anchor
      };
    }

    if (isPassport) {
      const targetKb = requestedKb || 200;
      const clashNote = (isYouTubeThumb || isReelShorts || isLinkedIn) ? ' (Prioritized Passport standard over social platforms)' : '';
      return {
        ratioId: '1:1',
        aspectRatioValue: 1.0,
        targetDimensions: customDims ? { width: customDims.width, height: customDims.height } : { width: 600, height: 600 },
        sizeMode: 'target-kb',
        targetKb,
        format: extractFormat('image/jpeg'),
        summary: `Official Passport / Visa (1:1 Square, < ${targetKb} KB)${clashNote}`,
        source: 'preset-matcher',
        rotation: orientation.rotation,
        flipHorizontal: orientation.flipH,
        flipVertical: orientation.flipV,
        cropAnchor: anchor
      };
    }

    if (isReelShorts && (!isYouTubeThumb || p.includes('vertical') || p.includes('9:16'))) {
      const targetKb = requestedKb || 500;
      return {
        ratioId: '9:16',
        aspectRatioValue: 9 / 16,
        targetDimensions: customDims ? { width: customDims.width, height: customDims.height } : { width: 1080, height: 1920 },
        sizeMode: 'target-kb',
        targetKb,
        format: requestedFormat,
        summary: `Full-Screen Vertical (9:16 Reel / Story, < ${targetKb} KB)`,
        source: 'preset-matcher',
        rotation: orientation.rotation,
        flipHorizontal: orientation.flipH,
        flipVertical: orientation.flipV,
        cropAnchor: anchor
      };
    }

    if (isYouTubeThumb) {
      const targetKb = requestedKb || 2048;
      return {
        ratioId: '16:9',
        aspectRatioValue: 16 / 9,
        targetDimensions: customDims ? { width: customDims.width, height: customDims.height } : { width: 1280, height: 720 },
        sizeMode: 'target-kb',
        targetKb,
        format: extractFormat('image/webp'),
        summary: `YouTube Thumbnail (16:9 Widescreen, < ${targetKb} KB)`,
        source: 'preset-matcher',
        rotation: orientation.rotation,
        flipHorizontal: orientation.flipH,
        flipVertical: orientation.flipV,
        cropAnchor: anchor
      };
    }

    if (isLinkedIn) {
      const targetKb = requestedKb || 500;
      return {
        ratioId: 'custom',
        aspectRatioValue: 4 / 1,
        targetDimensions: customDims ? { width: customDims.width, height: customDims.height } : { width: 1584, height: 396 },
        sizeMode: 'target-kb',
        targetKb,
        format: extractFormat('image/png'),
        summary: `LinkedIn Banner (4:1 Ultrawide, < ${targetKb} KB)`,
        source: 'preset-matcher',
        rotation: orientation.rotation,
        flipHorizontal: orientation.flipH,
        flipVertical: orientation.flipV,
        cropAnchor: anchor
      };
    }

    // 4. Explicit Dimension / Target Size / Orientation Command
    if (customDims || requestedKb || orientation.rotation !== undefined || orientation.flipH !== undefined || anchor !== 'center') {
      const targetKb = requestedKb || 300;
      const ratioId = customDims ? customDims.ratioId : 'free';
      const ratioVal = customDims ? customDims.ratioVal : (naturalW / naturalH);
      const dims = customDims ? { width: customDims.width, height: customDims.height } : null;

      const summaryParts: string[] = [];
      if (dims) summaryParts.push(`${dims.width}×${dims.height} PX`);
      if (requestedKb) summaryParts.push(`< ${targetKb} KB`);
      if (orientation.rotation !== undefined) summaryParts.push(`Rotated ${orientation.rotation}°`);
      if (orientation.flipH) summaryParts.push('Flipped H');
      if (anchor !== 'center') summaryParts.push(`Anchored ${anchor}`);
      summaryParts.push(requestedFormat === 'image/webp' ? 'WebP' : requestedFormat === 'image/png' ? 'PNG' : 'JPEG');

      return {
        ratioId,
        aspectRatioValue: ratioVal,
        targetDimensions: dims,
        sizeMode: 'target-kb',
        targetKb,
        format: requestedFormat,
        summary: `Custom Specification: ${summaryParts.join(', ')}`,
        source: 'preset-matcher',
        rotation: orientation.rotation,
        flipHorizontal: orientation.flipH,
        flipVertical: orientation.flipV,
        cropAnchor: anchor
      };
    }

    // 5. Creative / Poetic / Metaphorical Intent Mapping
    if (p.includes('quantum') || p.includes('entanglement') || p.includes('zen') || p.includes('symmetry') || p.includes('balance')) {
      return {
        ratioId: '1:1',
        aspectRatioValue: 1.0,
        targetDimensions: { width: 1080, height: 1080 },
        sizeMode: 'quality',
        targetKb: requestedKb || 300,
        format: 'image/webp',
        summary: 'Creative Intent: Mapped quantum entanglement to balanced 1:1 symmetry in WebP',
        source: 'preset-matcher',
        cropAnchor: anchor
      };
    }

    if (p.includes('nostalgic') || p.includes('cinematic') || p.includes('autumn') || p.includes('rain') || p.includes('movie')) {
      return {
        ratioId: '16:9',
        aspectRatioValue: 16 / 9,
        targetDimensions: { width: 1920, height: 1080 },
        sizeMode: 'quality',
        targetKb: requestedKb || 800,
        format: 'image/webp',
        summary: 'Creative Intent: Mapped cinematic nostalgic intent to 16:9 widescreen WebP',
        source: 'preset-matcher',
        cropAnchor: anchor
      };
    }

    return null;
  }

  /**
   * Calls Gemini 3.5 Flash Lite with structured JSON output instructions.
   */
  private async callGeminiApi(prompt: string, naturalW = 1920, naturalH = 1080, naturalSizeBytes = 1024 * 500): Promise<AgentActionPlan> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('No Gemini API key available.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${environment.geminiModel}:generateContent?key=${apiKey}`;

    const systemPrompt = `You are the AI Command Copilot for AspectShift Workstation, an image aspect ratio maintainer and compression tool.
Your job is to analyze the user's natural language command and output ONLY a JSON object representing the exact aspect ratio, dimensions, target KB, and format.

Conflict Resolution & Robustness Rules:
1. Out-of-Scope Notice: If user requests features AspectShift does NOT provide (like video creation, generative inpainting/object removal, text extraction/OCR, multi-photo collages), set 'outOfScopeNotice' with a polite explanation of what AspectShift does (aspect ratios, dimensions, compression, formats) and what is not supported, while still providing the best possible image framing.
2. Physical Feasibility: If user requests a tiny file size (< 100 KB) with huge dimensions (> 1500px) or lossless PNG, choose WebP/JPEG and adjust dimensions so the file size budget is physically achievable.
3. Contradictory Ratios: If user mentions both horizontal (16:9) and vertical (9:16), or specifies dimensions (e.g. 4000x4000), explicit dimensions or the primary platform takes priority.
4. Multiple Platforms: If user mentions multiple platforms (e.g. SSC exam AND YouTube AND Passport), prioritize official document standards (SSC/Passport) first, and explain the resolution in 'summary'.
5. Creative / Metaphorical Prompts: If user uses metaphors (e.g. 'quantum entanglement', 'nostalgic autumn rain'), creatively map them to visual standards (e.g. 1:1 for quantum symmetry, 16:9 for cinematic nostalgia).
6. Robustness & Safety: Never output formats other than 'image/jpeg', 'image/webp', or 'image/png'. Never output negative or zero dimensions or file sizes.

Allowed Aspect Ratios:
- '1:1' (Square, passport, avatar, Instagram post)
- '3.5:4.5' (Official SSC, UPSC, standard exam documents)
- '16:9' (YouTube thumbnail, landscape display, widescreen TV, desktop monitor)
- '9:16' (Reels, TikTok, Instagram Story, vertical smartphone)
- '4:5' (Instagram portrait feed)
- '4:3' (Classic photo standard)
- '3:2' (DSLR standard photo)
- '21:9' (Ultrawide cinema)
- 'free' (Keep original framing)
- 'custom' (For specific unusual ratios like 4:1)

Allowed Formats:
- 'image/jpeg' (Standard photos, passports, compatibility)
- 'image/webp' (Modern web, high compression efficiency)
- 'image/png' (Logos, banners, sharp text)

Target KB:
If user mentions 'under 50kb', targetKb is 50. If 'under 200kb', targetKb is 200. If '2mb', targetKb is 2048.
If user mentions 'size should 300' or 'size 300' or '300 KV' (common typo for KB) or 'under 300', infer targetKb as 300.
If not mentioned for exam/passport, default to official standard (e.g. 50 for SSC, 200 for passport).

Dimensions:
If user specifies pixel dimensions like '200 px' or '200 pixel', set targetDimensions width to 200 (and proportional height or square). If '200x300', set targetDimensions width 200, height 300.

Output JSON schema:
{
  "ratioId": string,
  "aspectRatioValue": number,
  "targetDimensions": { "width": number, "height": number } | null,
  "targetKb": number | null,
  "format": "image/jpeg" | "image/webp" | "image/png",
  "summary": string
}}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nImage Info: naturalWidth=${naturalW}, naturalHeight=${naturalH}, sizeKb=${Math.round(naturalSizeBytes / 1024)}\nUser instruction: "${prompt}"`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJsonText) {
      throw new Error('Gemini returned an empty response.');
    }

    let cleaned = rawJsonText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    }

    const parsed = JSON.parse(cleaned);

    return {
      ratioId: parsed.ratioId || 'free',
      aspectRatioValue: typeof parsed.aspectRatioValue === 'number' ? parsed.aspectRatioValue : 1.0,
      targetDimensions: parsed.targetDimensions || null,
      sizeMode: parsed.targetKb ? 'target-kb' : 'quality',
      targetKb: parsed.targetKb || null,
      format: (['image/jpeg', 'image/webp', 'image/png'].includes(parsed.format)) ? parsed.format : 'image/jpeg',
      summary: parsed.summary || `Configured ${parsed.ratioId || ''} (${parsed.targetKb ? `< ${parsed.targetKb} KB` : 'High Quality'})`,
      source: 'gemini-ai',
      rotation: typeof parsed.rotation === 'number' ? parsed.rotation : undefined,
      flipHorizontal: typeof parsed.flipHorizontal === 'boolean' ? parsed.flipHorizontal : undefined,
      flipVertical: typeof parsed.flipVertical === 'boolean' ? parsed.flipVertical : undefined,
      cropAnchor: parsed.cropAnchor,
      outOfScopeNotice: parsed.outOfScopeNotice || null
    };
  }

  /**
   * Fallback rule-based plan if API fails or device is completely offline.
   */
  private createFallbackPlan(prompt: string, naturalW = 1920, naturalH = 1080, naturalSizeBytes = 1024 * 500): AgentActionPlan {
    const p = prompt.toLowerCase();
    let ratioId = 'free';
    let ratioVal = naturalW / naturalH;
    let format: 'image/jpeg' | 'image/webp' | 'image/png' = 'image/jpeg';
    let targetKb: number | null = null;

    if (p.includes('ssc') || p.includes('exam') || p.includes('upsc')) {
      ratioId = '3.5:4.5';
      ratioVal = 3.5 / 4.5;
      targetKb = 50;
    } else if (p.includes('16:9') || p.includes('landscape') || p.includes('wide') || p.includes('youtube')) {
      ratioId = '16:9';
      ratioVal = 16 / 9;
    } else if (p.includes('9:16') || p.includes('vertical') || p.includes('reel') || p.includes('story')) {
      ratioId = '9:16';
      ratioVal = 9 / 16;
    } else if (p.includes('1:1') || p.includes('square') || p.includes('passport')) {
      ratioId = '1:1';
      ratioVal = 1.0;
      if (p.includes('passport')) targetKb = 200;
    }

    if (p.includes('webp')) format = 'image/webp';
    if (p.includes('png')) format = 'image/png';

    // Extract KB / MB / raw size
    const mbMatch = p.match(/(?:under|max|less\s+than|<|below|size\s*(?:is|should\s*(?:be)?)?)?\s*(\d+(?:\.\d+)?)\s*mb/);
    if (mbMatch) targetKb = Math.round(parseFloat(mbMatch[1]) * 1024);
    if (!targetKb) {
      const kbMatch = p.match(/(?:under|max|less\s+than|<|below|size\s*(?:is|should\s*(?:be)?)?)?\s*(\d+)\s*(?:kb|kv|k\b)/);
      if (kbMatch) targetKb = parseInt(kbMatch[1], 10);
    }
    if (!targetKb) {
      const rawSizeMatch = p.match(/(?:size\s*(?:is|should\s*(?:be)?|under|below|max)?|under|max|less\s+than|<|below)\s*(\d+)(?!\s*(?:px|pixel|pixels))/);
      if (rawSizeMatch) targetKb = parseInt(rawSizeMatch[1], 10);
    }

    // Extract Dimensions
    let targetDimensions: { width: number; height: number } | null = null;
    const pairMatch = p.match(/(\d+)\s*(?:x|\*|by)\s*(\d+)(?:\s*(?:px|pixel|pixels))?/);
    if (pairMatch) {
      const w = parseInt(pairMatch[1], 10);
      const h = parseInt(pairMatch[2], 10);
      if (w > 0 && h > 0) {
        targetDimensions = { width: w, height: h };
        ratioVal = w / h;
        ratioId = w === h ? '1:1' : 'custom';
      }
    } else {
      const singleMatch = p.match(/(\d+)\s*(?:px|pixel|pixels)/);
      if (singleMatch) {
        const val = parseInt(singleMatch[1], 10);
        if (val > 0) {
          const h = Math.round(val / (naturalW / naturalH));
          targetDimensions = { width: val, height: Math.max(1, h) };
        }
      }
    }

    const summaryParts: string[] = [];
    if (targetDimensions) summaryParts.push(`${targetDimensions.width}×${targetDimensions.height} PX`);
    if (targetKb) summaryParts.push(`< ${targetKb} KB`);
    summaryParts.push(format === 'image/webp' ? 'WebP' : format === 'image/png' ? 'PNG' : 'JPEG');

    return {
      ratioId,
      aspectRatioValue: ratioVal,
      targetDimensions,
      sizeMode: targetKb ? 'target-kb' : 'quality',
      targetKb: targetKb || 200,
      format,
      summary: `Custom Spec: ${summaryParts.join(', ')}`,
      source: 'preset-matcher'
    };
  }

  /**
   * Universal Sanitization & Conflict Resolution Engine.
   * Clamps dimensions, handles negative/zero values, resolves physical feasibility
   * conflicts (e.g. 4000x4000 PNG under 10KB), and guarantees mathematical stability.
   */
  /**
   * Detects requests that fall outside AspectShift's core workstation scope
   * (e.g. video generation, generative inpainting/removal, OCR text extraction, collages)
   * and provides a friendly, reassuring explanation to the user.
   */
  private detectOutOfScope(prompt: string): string | null {
    const p = prompt.toLowerCase();

    // 1. Video / Animation
    if (p.includes('video') || p.includes('mp4') || p.includes('animation') || p.includes('looping') || p.includes('ken burns') || p.includes('music') || p.includes('audio')) {
      return "AspectShift specializes in static image aspect ratios and compression (JPEG, WebP, PNG). Video generation and animation rendering are outside our workstation's scope, but we've tuned your image specifications for maximum clarity!";
    }

    // 2. Generative Object Removal / Inpainting / Image Synthesis
    if (p.includes('remove person') || p.includes('remove object') || p.includes('erase') || p.includes('change background to') || p.includes('generate car') || p.includes('add sunglasses') || p.includes('photoshop') || p.includes('inpainting') || p.includes('midjourney') || p.includes('dall-e') || p.includes('stable diffusion')) {
      return "AspectShift is an aspect-ratio maintainer and byte-budget compressor. Generative object removal and AI image synthesis are not supported, but we've optimized your framing and file budget!";
    }

    // 3. OCR Text Extraction & Translation Watermark
    if (p.includes('extract text') || p.includes('translate text') || p.includes('read handwriting') || p.includes('watermark') || p.includes('add text') || p.includes('write title')) {
      return "AspectShift focuses on image framing, aspect ratios, and compression limits. Text extraction (OCR) and text watermarking are outside our scope, but we've configured your requested dimensions!";
    }

    // 4. Multi-Image Collages
    if (p.includes('collage') || p.includes('merge photos') || p.includes('stitch photos') || p.includes('combine photos') || p.includes('combine images') || p.includes('4 grid')) {
      return "AspectShift operates on single-image workflows. Multi-image collage stitching is not supported, but we've framed your current photo to the best matching ratio!";
    }

    return null;
  }

  private sanitizePlan(
    rawPlan: Partial<AgentActionPlan>,
    naturalW: number,
    naturalH: number,
    originalPrompt: string
  ): AgentActionPlan {
    const p = originalPrompt.toLowerCase();

    // 1. Sanitize Format (Adversarial / Typo Defense)
    let format: 'image/jpeg' | 'image/webp' | 'image/png' = 'image/jpeg';
    if (rawPlan.format === 'image/webp' || p.includes('webp')) format = 'image/webp';
    else if (rawPlan.format === 'image/png' || p.includes('png')) format = 'image/png';
    else if (rawPlan.format === 'image/jpeg' || p.includes('jpg') || p.includes('jpeg')) format = 'image/jpeg';

    // 2. Sanitize Target KB (handles negative numbers, zero, extreme values)
    let targetKb: number | null = null;
    if (typeof rawPlan.targetKb === 'number' && !isNaN(rawPlan.targetKb)) {
      targetKb = Math.max(10, Math.min(25600, Math.round(Math.abs(rawPlan.targetKb))));
    }

    // 3. Sanitize Target Dimensions (clamps between 16px and 8192px)
    let targetDimensions: { width: number; height: number } | null = null;
    if (rawPlan.targetDimensions) {
      let w = Math.round(Math.abs(Number(rawPlan.targetDimensions.width) || 0));
      let h = Math.round(Math.abs(Number(rawPlan.targetDimensions.height) || 0));

      if (w <= 0 && h <= 0) {
        w = naturalW;
        h = naturalH;
      } else if (w <= 0) {
        w = Math.round(h * (naturalW / naturalH));
      } else if (h <= 0) {
        h = Math.round(w / (naturalW / naturalH));
      }

      w = Math.max(16, Math.min(8192, w));
      h = Math.max(16, Math.min(8192, h));
      targetDimensions = { width: w, height: h };
    }

    // 4. Physical Feasibility Check: Tight KB with Giant Dimensions or Lossless PNG
    let feasibilityNote = '';
    if (targetKb && targetKb < 100) {
      if (format === 'image/png') {
        format = 'image/webp';
        feasibilityNote += ' (Switched PNG to WebP to fit budget)';
      }
      if (targetDimensions && (targetDimensions.width > 1200 || targetDimensions.height > 1200)) {
        const scale = Math.min(800 / targetDimensions.width, 800 / targetDimensions.height);
        targetDimensions.width = Math.max(100, Math.round(targetDimensions.width * scale));
        targetDimensions.height = Math.max(100, Math.round(targetDimensions.height * scale));
        feasibilityNote += ' (Proportionally scaled to achieve target KB)';
      }
    }

    // 5. Sanitize Aspect Ratio & Disambiguate Contradictions
    let ratioVal = (typeof rawPlan.aspectRatioValue === 'number' && rawPlan.aspectRatioValue > 0 && !isNaN(rawPlan.aspectRatioValue))
      ? rawPlan.aspectRatioValue
      : (targetDimensions ? targetDimensions.width / targetDimensions.height : naturalW / naturalH);

    let ratioId = rawPlan.ratioId || 'free';
    const validRatios = ['1:1', '3.5:4.5', '16:9', '9:16', '4:5', '4:3', '3:2', '21:9', 'free', 'custom'];
    if (!validRatios.includes(ratioId)) {
      ratioId = targetDimensions ? (targetDimensions.width === targetDimensions.height ? '1:1' : 'custom') : 'free';
    }

    // If explicit dimensions were provided, enforce that aspect ratio aligns with dimensions
    if (targetDimensions) {
      ratioVal = targetDimensions.width / targetDimensions.height;
      if (Math.abs(ratioVal - 1.0) < 0.02) ratioId = '1:1';
      else if (Math.abs(ratioVal - (16 / 9)) < 0.02) ratioId = '16:9';
      else if (Math.abs(ratioVal - (9 / 16)) < 0.02) ratioId = '9:16';
      else if (Math.abs(ratioVal - (4 / 5)) < 0.02) ratioId = '4:5';
      else if (Math.abs(ratioVal - (3.5 / 4.5)) < 0.02) ratioId = '3.5:4.5';
      else ratioId = 'custom';
    }

    let summary = rawPlan.summary || `Spec: ${ratioId}`;
    if (feasibilityNote) summary += feasibilityNote;

    // Sanitize rotation (must be multiple of 90 degrees: 0, 90, 180, 270)
    let rotation = typeof rawPlan.rotation === 'number' ? (Math.round(rawPlan.rotation / 90) * 90) % 360 : undefined;
    if (rotation !== undefined && rotation < 0) rotation += 360;

    const validAnchors = ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const cropAnchor: CropAnchor = (rawPlan.cropAnchor && validAnchors.includes(rawPlan.cropAnchor)) ? rawPlan.cropAnchor : 'center';

    const outOfScopeNotice = rawPlan.outOfScopeNotice || this.detectOutOfScope(originalPrompt);

    return {
      ratioId,
      aspectRatioValue: ratioVal,
      targetDimensions,
      sizeMode: targetKb ? 'target-kb' : 'quality',
      targetKb,
      format,
      summary,
      source: rawPlan.source || 'preset-matcher',
      rotation,
      flipHorizontal: rawPlan.flipHorizontal,
      flipVertical: rawPlan.flipVertical,
      cropAnchor,
      outOfScopeNotice
    };
  }

}

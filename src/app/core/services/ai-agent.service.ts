import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AgentActionPlan } from '../models';

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
  async parseUserIntent(prompt: string, currentImageWidth?: number, currentImageHeight?: number): Promise<AgentActionPlan> {
    this.isAnalyzing.set(true);
    this.errorMessage.set(null);

    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      this.isAnalyzing.set(false);
      throw new Error('Please enter an instruction or requirement.');
    }

    try {
      // 1. Check Fast Local Heuristics first (0ms latency, offline-ready)
      const heuristicResult = this.tryLocalHeuristics(cleanPrompt, currentImageWidth, currentImageHeight);
      if (heuristicResult) {
        this.lastPlan.set(heuristicResult);
        this.isAnalyzing.set(false);
        return heuristicResult;
      }

      // 2. If no Gemini API key is available, use smart client-side fallback without error
      if (!this.hasConfiguredApiKey()) {
        const fallbackResult = this.createFallbackPlan(cleanPrompt, currentImageWidth, currentImageHeight);
        this.lastPlan.set(fallbackResult);
        this.isAnalyzing.set(false);
        return fallbackResult;
      }

      // 3. Fall back to Gemini 3.5 Flash Lite API
      const geminiResult = await this.callGeminiApi(cleanPrompt, currentImageWidth, currentImageHeight);
      this.lastPlan.set(geminiResult);
      this.isAnalyzing.set(false);
      return geminiResult;
    } catch (err: unknown) {
      console.info('Switched to local adaptive parser:', err instanceof Error ? err.message : err);
      // Fallback extraction in case of network/quota issues
      const fallbackResult = this.createFallbackPlan(cleanPrompt, currentImageWidth, currentImageHeight);
      this.lastPlan.set(fallbackResult);
      this.isAnalyzing.set(false);
      return fallbackResult;
    }
  }

  /**
   * Fast rule-based heuristic matcher for common exam and social platform standards.
   */
  private tryLocalHeuristics(prompt: string, naturalW = 1920, naturalH = 1080): AgentActionPlan | null {
    const p = prompt.toLowerCase();

    // Target KB detection helper (handles "300 kb", "300 kv", "300k", "size should 300", "size 300", "under 300")
    const extractKb = (): number | null => {
      const mbMatch = p.match(/(?:under|max|less\s+than|<|below|size\s*(?:is|should\s*(?:be)?)?)?\s*(\d+(?:\.\d+)?)\s*mb/);
      if (mbMatch) return Math.round(parseFloat(mbMatch[1]) * 1024);

      const kbMatch = p.match(/(?:under|max|less\s+than|<|below|size\s*(?:is|should\s*(?:be)?)?)?\s*(\d+)\s*(?:kb|kv|k\b)/);
      if (kbMatch) return parseInt(kbMatch[1], 10);

      const rawSizeMatch = p.match(/(?:size\s*(?:is|should\s*(?:be)?|under|below|max)?|under|max|less\s+than|<|below)\s*(\d+)(?!\s*(?:px|pixel|pixels))/);
      if (rawSizeMatch) return parseInt(rawSizeMatch[1], 10);

      return null;
    };

    // Dimension detection helper (handles "200x300", "200 x 300 px", "200 px", "200 pixel")
    const extractDimensions = (): { width: number; height: number; ratioVal: number; ratioId: string } | null => {
      const pairMatch = p.match(/(\d+)\s*(?:x|\*|by)\s*(\d+)(?:\s*(?:px|pixel|pixels))?/);
      if (pairMatch) {
        const w = parseInt(pairMatch[1], 10);
        const h = parseInt(pairMatch[2], 10);
        if (w > 0 && h > 0) return { width: w, height: h, ratioVal: w / h, ratioId: w === h ? '1:1' : 'custom' };
      }

      const singleMatch = p.match(/(\d+)\s*(?:px|pixel|pixels)/);
      if (singleMatch) {
        const val = parseInt(singleMatch[1], 10);
        if (val > 0) {
          if (p.includes('square') || p.includes('1:1')) {
            return { width: val, height: val, ratioVal: 1.0, ratioId: '1:1' };
          }
          const currentRatio = naturalW / naturalH;
          const h = Math.round(val / currentRatio);
          return { width: val, height: Math.max(1, h), ratioVal: currentRatio, ratioId: 'free' };
        }
      }

      return null;
    };

    // Format detection helper
    const extractFormat = (defaultFormat: 'image/jpeg' | 'image/webp' | 'image/png' = 'image/jpeg'): 'image/jpeg' | 'image/webp' | 'image/png' => {
      if (p.includes('webp')) return 'image/webp';
      if (p.includes('png')) return 'image/png';
      if (p.includes('jpg') || p.includes('jpeg')) return 'image/jpeg';
      return defaultFormat;
    };

    const requestedKb = extractKb();
    const requestedFormat = extractFormat('image/jpeg');

    // 1. SSC / UPSC / Govt Exam Portals (Strict 3.5:4.5 aspect ratio, < 50 KB)
    if (p.includes('ssc') || p.includes('upsc') || p.includes('govt') || p.includes('exam') || p.includes('admit') || p.includes('portal')) {
      const targetKb = requestedKb || 50;
      return {
        ratioId: '3.5:4.5',
        aspectRatioValue: 3.5 / 4.5,
        targetDimensions: { width: 350, height: 450 },
        sizeMode: 'target-kb',
        targetKb,
        format: 'image/jpeg',
        summary: `SSC / Govt Exam Format (3.5×4.5cm Ratio, 350×450 PX, < ${targetKb} KB JPEG)`,
        source: 'preset-matcher'
      };
    }

    // 2. Passport / Visa Photos / Headshots (1:1 Square, < 200 KB)
    if (p.includes('passport') || p.includes('visa') || p.includes('id photo') || p.includes('headshot')) {
      const targetKb = requestedKb || 200;
      return {
        ratioId: '1:1',
        aspectRatioValue: 1.0,
        targetDimensions: { width: 600, height: 600 },
        sizeMode: 'target-kb',
        targetKb,
        format: extractFormat('image/jpeg'),
        summary: `Official Passport / Visa (1:1 Ratio, 600×600 PX, Max ${targetKb} KB JPEG)`,
        source: 'preset-matcher'
      };
    }

    // 3. YouTube Thumbnail (16:9 Widescreen, < 2MB WebP/JPG)
    if (p.includes('youtube') || p.includes('yt thumb')) {
      const targetKb = requestedKb || 2048;
      return {
        ratioId: '16:9',
        aspectRatioValue: 16 / 9,
        targetDimensions: { width: 1280, height: 720 },
        sizeMode: 'target-kb',
        targetKb,
        format: extractFormat('image/webp'),
        summary: `YouTube Thumbnail (16:9 Widescreen, 1280×720 PX, Max ${targetKb} KB)`,
        source: 'preset-matcher'
      };
    }

    // 4. Instagram Reels, Stories, TikTok (9:16 Vertical)
    if (p.includes('story') || p.includes('reel') || p.includes('tiktok') || p.includes('shorts')) {
      const targetKb = requestedKb || 500;
      return {
        ratioId: '9:16',
        aspectRatioValue: 9 / 16,
        targetDimensions: { width: 1080, height: 1920 },
        sizeMode: 'target-kb',
        targetKb,
        format: requestedFormat,
        summary: `Full-Screen Vertical (9:16 Ratio, 1080×1920 PX, Max ${targetKb} KB)`,
        source: 'preset-matcher'
      };
    }

    // 5. Instagram Square Post (1:1)
    if ((p.includes('instagram') || p.includes('ig')) && (p.includes('post') || p.includes('square'))) {
      const targetKb = requestedKb || 300;
      return {
        ratioId: '1:1',
        aspectRatioValue: 1.0,
        targetDimensions: { width: 1080, height: 1080 },
        sizeMode: 'target-kb',
        targetKb,
        format: requestedFormat,
        summary: `Instagram Square (1:1 Ratio, 1080×1080 PX, Max ${targetKb} KB)`,
        source: 'preset-matcher'
      };
    }

    // 6. Instagram Portrait Post (4:5)
    if (p.includes('instagram portrait') || p.includes('ig portrait') || p.includes('4:5')) {
      const targetKb = requestedKb || 400;
      return {
        ratioId: '4:5',
        aspectRatioValue: 4 / 5,
        targetDimensions: { width: 1080, height: 1350 },
        sizeMode: 'target-kb',
        targetKb,
        format: requestedFormat,
        summary: `Instagram Portrait (4:5 Ratio, 1080×1350 PX, Max ${targetKb} KB)`,
        source: 'preset-matcher'
      };
    }

    // 7. LinkedIn Banner (4:1)
    if (p.includes('linkedin banner') || p.includes('linkedin cover')) {
      const targetKb = requestedKb || 500;
      return {
        ratioId: 'custom',
        aspectRatioValue: 4 / 1,
        targetDimensions: { width: 1584, height: 396 },
        sizeMode: 'target-kb',
        targetKb,
        format: extractFormat('image/png'),
        summary: `LinkedIn Banner (4:1 Ratio, 1584×396 PX, Max ${targetKb} KB)`,
        source: 'preset-matcher'
      };
    }

    // 8. Direct Custom Dimension & File Size Rule (e.g. "I want 200 px and size should 300", "200 pixel and size 300 KV")
    const customDims = extractDimensions();
    if (customDims || requestedKb) {
      const targetKb = requestedKb || 300;
      const ratioId = customDims ? customDims.ratioId : 'free';
      const ratioVal = customDims ? customDims.ratioVal : (naturalW / naturalH);
      const dims = customDims ? { width: customDims.width, height: customDims.height } : null;

      const summaryParts: string[] = [];
      if (dims) summaryParts.push(`${dims.width}×${dims.height} PX`);
      if (requestedKb) summaryParts.push(`< ${targetKb} KB`);
      summaryParts.push(requestedFormat === 'image/webp' ? 'WebP' : requestedFormat === 'image/png' ? 'PNG' : 'JPEG');

      return {
        ratioId,
        aspectRatioValue: ratioVal,
        targetDimensions: dims,
        sizeMode: 'target-kb',
        targetKb,
        format: requestedFormat,
        summary: `Custom Spec: ${summaryParts.join(', ')}`,
        source: 'preset-matcher'
      };
    }

    return null;
  }

  /**
   * Calls Gemini 3.5 Flash Lite with structured JSON output instructions.
   */
  private async callGeminiApi(prompt: string, naturalW = 1920, naturalH = 1080): Promise<AgentActionPlan> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('No Gemini API key available.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${environment.geminiModel}:generateContent?key=${apiKey}`;

    const systemPrompt = `You are the AI Command Copilot for AspectShift Workstation, an image aspect ratio maintainer and compression tool.
Your job is to analyze the user's natural language command and output ONLY a JSON object representing the exact aspect ratio, dimensions, target KB, and format.

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
If user mentions 'under 50kb', targetKb is 50. If 'under 200kb', targetKb is 200. If '2mb', targetKb is 2048. If not mentioned for exam/passport, default to official standard (e.g. 50 for SSC, 200 for passport).

Output JSON schema:
{
  "ratioId": string,
  "aspectRatioValue": number,
  "targetDimensions": { "width": number, "height": number } | null,
  "targetKb": number | null,
  "format": "image/jpeg" | "image/webp" | "image/png",
  "summary": string
}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nImage Info: naturalWidth=${naturalW}, naturalHeight=${naturalH}\nUser instruction: "${prompt}"`
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
      source: 'gemini-ai'
    };
  }

  /**
   * Fallback rule-based plan if API fails or device is completely offline.
   */
  private createFallbackPlan(prompt: string, naturalW = 1920, naturalH = 1080): AgentActionPlan {
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
}

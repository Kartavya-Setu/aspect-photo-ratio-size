import { Injectable } from '@angular/core';
import { CropArea, ProcessConfig, ProcessedResult, ImageFormat } from '../models';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileExtension(format: ImageFormat): string {
  switch (format) {
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/avif':
      return 'avif';
    default:
      return 'webp';
  }
}

@Injectable({
  providedIn: 'root'
})
export class ImageProcessingService {
  loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
      img.src = src;
    });
  }

  readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async processImage(
    imageElement: HTMLImageElement,
    crop: CropArea,
    config: ProcessConfig,
    originalFileName: string,
    originalSizeBytes: number
  ): Promise<ProcessedResult> {
    const startTime = performance.now();

    let targetW = config.targetWidth;
    let targetH = config.targetHeight;
    let currentCanvas = this.renderCanvas(imageElement, crop, targetW, targetH, config);

    let finalBlob: Blob;
    let qualityUsed = config.quality;

    if (config.sizeMode === 'lossless') {
      qualityUsed = 1.0;
      finalBlob = await this.canvasToBlob(currentCanvas, config.format, 1.0);
    } else if (config.sizeMode === 'manual-quality') {
      qualityUsed = config.quality;
      finalBlob = await this.canvasToBlob(currentCanvas, config.format, qualityUsed);
    } else {
      const targetBytes = config.targetKb * 1024;

      if (config.format === 'image/png') {
        let scale = 1.0;
        let blob = await this.canvasToBlob(currentCanvas, 'image/png', 1.0);
        let attempts = 0;

        while (blob.size > targetBytes && attempts < 6 && scale > 0.25) {
          attempts++;
          scale *= Math.sqrt(targetBytes / blob.size) * 0.95;
          targetW = Math.max(16, Math.round(config.targetWidth * scale));
          targetH = Math.max(16, Math.round(config.targetHeight * scale));
          currentCanvas = this.renderCanvas(imageElement, crop, targetW, targetH, config);
          blob = await this.canvasToBlob(currentCanvas, 'image/png', 1.0);
        }
        finalBlob = blob;
        qualityUsed = 1.0;
      } else {
        let low = 0.04;
        let high = 0.98;
        let bestBlob: Blob | null = null;
        let bestQuality = 0.8;

        const initialBlob = await this.canvasToBlob(currentCanvas, config.format, high);
        if (initialBlob.size <= targetBytes) {
          bestBlob = initialBlob;
          bestQuality = high;
        } else {
          for (let i = 0; i < 7; i++) {
            const mid = (low + high) / 2;
            const candidateBlob = await this.canvasToBlob(currentCanvas, config.format, mid);

            if (candidateBlob.size <= targetBytes) {
              bestBlob = candidateBlob;
              bestQuality = mid;
              low = mid;
            } else {
              high = mid;
            }
          }

          if (!bestBlob) {
            let scale = 0.9;
            let scaleAttempts = 0;
            while (!bestBlob && scaleAttempts < 5 && scale > 0.2) {
              scaleAttempts++;
              targetW = Math.max(16, Math.round(config.targetWidth * scale));
              targetH = Math.max(16, Math.round(config.targetHeight * scale));
              currentCanvas = this.renderCanvas(imageElement, crop, targetW, targetH, config);
              const tryBlob = await this.canvasToBlob(currentCanvas, config.format, 0.15);
              if (tryBlob.size <= targetBytes || scaleAttempts === 4) {
                bestBlob = tryBlob;
                bestQuality = 0.15;
              } else {
                scale *= 0.75;
              }
            }
          }
        }

        finalBlob = bestBlob || initialBlob;
        qualityUsed = bestQuality;
      }
    }

    const endTime = performance.now();
    const processingTimeMs = Math.round(endTime - startTime);

    const sizeBytes = finalBlob.size;
    const sizeKb = sizeBytes / 1024;
    const compressionRatio = originalSizeBytes > 0
      ? ((sizeBytes - originalSizeBytes) / originalSizeBytes) * 100
      : 0;

    const ext = getFileExtension(config.format);
    const baseName = originalFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${baseName}_${targetW}x${targetH}_${Math.round(sizeKb)}kb.${ext}`;
    
    const dataUrl = currentCanvas.toDataURL(
      config.format === 'image/png' ? 'image/png' : config.format,
      qualityUsed
    );

    return {
      blob: finalBlob,
      dataUrl,
      width: targetW,
      height: targetH,
      sizeBytes,
      sizeKb,
      format: config.format,
      qualityUsed: Math.round(qualityUsed * 100),
      processingTimeMs,
      compressionRatio: parseFloat(compressionRatio.toFixed(1)),
      fileName
    };
  }

  private canvasToBlob(
    canvas: HTMLCanvasElement,
    format: ImageFormat,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            if (format === 'image/avif') {
              canvas.toBlob(
                (fallbackBlob) => {
                  if (fallbackBlob) resolve(fallbackBlob);
                  else reject(new Error('Canvas export failed'));
                },
                'image/webp',
                quality
              );
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          }
        },
        format,
        quality
      );
    });
  }

  private renderCanvas(
    imageElement: HTMLImageElement,
    crop: CropArea,
    targetW: number,
    targetH: number,
    config: ProcessConfig
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(targetW));
    canvas.height = Math.max(1, Math.round(targetH));
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }

    if (config.pixelated) {
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    const isAlphaFriendly = config.format === 'image/png' || config.format === 'image/webp';
    if (!isAlphaFriendly || (config.backgroundColor && config.backgroundColor !== 'transparent')) {
      ctx.fillStyle = config.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    if (config.rotation !== 0) {
      ctx.rotate((config.rotation * Math.PI) / 180);
    }

    const scaleX = config.flipHorizontal ? -1 : 1;
    const scaleY = config.flipVertical ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    const isRotated90 = Math.abs(config.rotation % 180) === 90;
    const drawW = isRotated90 ? canvas.height : canvas.width;
    const drawH = isRotated90 ? canvas.width : canvas.height;

    ctx.drawImage(
      imageElement,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );

    ctx.restore();

    if (config.sharpening) {
      this.applyUnsharpMask(ctx, canvas.width, canvas.height);
    }

    return canvas;
  }

  private applyUnsharpMask(ctx: CanvasRenderingContext2D, w: number, h: number) {
    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const weights = [
        0, -0.3, 0,
        -0.3, 2.2, -0.3,
        0, -0.3, 0
      ];
      const copy = new Uint8ClampedArray(data);

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            let wi = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const pos = ((y + ky) * w + (x + kx)) * 4 + c;
                sum += copy[pos] * weights[wi++];
              }
            }
            const idx = (y * w + x) * 4 + c;
            data[idx] = Math.min(255, Math.max(0, sum));
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('Sharpen filter skipped due to canvas security or size', e);
    }
  }
}

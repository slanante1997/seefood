import { Injectable } from '@angular/core';
import { FoodResult } from '../models/food-result.model';

/** Calls the Netlify function that proxies Gemini. The API key stays server-side. */
@Injectable({ providedIn: 'root' })
export class SeefoodService {
  private readonly endpoint = '/api/analyze';

  /** Longest edge a photo is resized to before upload. */
  private readonly maxDimension = 1024;
  /** JPEG quality used when re-encoding the downscaled image. */
  private readonly jpegQuality = 0.85;

  async analyze(file: File): Promise<FoodResult> {
    const { base64, mimeType } = await this.toUploadPayload(file);

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType })
    });

    if (!res.ok) {
      let message = `Request failed (${res.status}).`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        /* keep default message */
      }
      throw new Error(message);
    }

    return (await res.json()) as FoodResult;
  }

  /** Builds a real recipe-search URL from a query (avoids hallucinated links). */
  recipeUrl(query: string): string {
    return `https://www.google.com/search?q=${encodeURIComponent(query + ' recipe')}`;
  }

  /**
   * Downscales the image to keep phone photos (often 5-10MB) small — faster
   * uploads, fewer tokens, and well under the function's size limit. Falls back
   * to the raw file if the browser can't process it (e.g. an exotic format).
   */
  private async toUploadPayload(file: File): Promise<{ base64: string; mimeType: string }> {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const scale = Math.min(1, this.maxDimension / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable.');
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const dataUrl = canvas.toDataURL('image/jpeg', this.jpegQuality);
      return { base64: dataUrl.split(',')[1] ?? '', mimeType: 'image/jpeg' };
    } catch {
      return this.readRaw(file);
    }
  }

  /** Reads a File into a base64 string (no data: prefix) plus its mime type. */
  private async readRaw(file: File): Promise<{ base64: string; mimeType: string }> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return { base64: dataUrl.split(',')[1] ?? '', mimeType: file.type || 'image/jpeg' };
  }
}

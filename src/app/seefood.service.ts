import { Injectable } from '@angular/core';
import { FoodResult } from './seefood.model';

/** Calls the Netlify function that proxies Gemini. The API key stays server-side. */
@Injectable({ providedIn: 'root' })
export class SeefoodService {
  private readonly endpoint = '/api/analyze';

  /** Reads a File into a base64 string (no data: prefix) plus its mime type. */
  async fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    // dataUrl looks like "data:image/jpeg;base64,XXXX"
    const base64 = dataUrl.split(',')[1] ?? '';
    return { base64, mimeType: file.type || 'image/jpeg' };
  }

  async analyze(file: File): Promise<FoodResult> {
    const { base64, mimeType } = await this.fileToBase64(file);

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
}

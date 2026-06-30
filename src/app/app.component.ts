import { Component, signal, inject } from '@angular/core';
import { SeefoodService } from './seefood.service';
import { FoodResult } from './seefood.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly seefood = inject(SeefoodService);

  readonly previewUrl = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<FoodResult | null>(null);
  readonly dragging = signal(false);

  private selectedFile: File | null = null;

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
    input.value = ''; // allow re-selecting the same file
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.error.set('Please choose an image file.');
      return;
    }
    this.error.set(null);
    this.result.set(null);
    this.selectedFile = file;

    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(URL.createObjectURL(file));

    void this.analyze();
  }

  async analyze(): Promise<void> {
    if (!this.selectedFile) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.seefood.analyze(this.selectedFile);
      this.result.set(result);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
    this.result.set(null);
    this.error.set(null);
    this.selectedFile = null;
  }

  recipeUrl(query: string): string {
    return this.seefood.recipeUrl(query);
  }

  nutritionRows(result: FoodResult): { label: string; value: string }[] {
    const n = result.nutrition;
    return [
      { label: 'Protein', value: n.protein },
      { label: 'Carbs', value: n.carbs },
      { label: 'Fat', value: n.fat },
      { label: 'Fiber', value: n.fiber },
      { label: 'Sugar', value: n.sugar },
      { label: 'Sodium', value: n.sodium }
    ];
  }
}

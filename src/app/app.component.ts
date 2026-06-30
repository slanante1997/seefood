import { Component } from '@angular/core';
import { FoodAnalyzerComponent } from './features/food-analyzer/food-analyzer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FoodAnalyzerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}

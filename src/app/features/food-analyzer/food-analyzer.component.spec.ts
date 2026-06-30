import { TestBed } from '@angular/core/testing';
import { FoodAnalyzerComponent } from './food-analyzer.component';

describe('FoodAnalyzerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodAnalyzerComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FoodAnalyzerComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the dropzone before an image is selected', () => {
    const fixture = TestBed.createComponent(FoodAnalyzerComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.dropzone')).toBeTruthy();
  });

  it('should offer both camera and gallery inputs', () => {
    const fixture = TestBed.createComponent(FoodAnalyzerComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('input[capture="environment"]')).toBeTruthy();
    expect(compiled.querySelectorAll('input[type="file"]').length).toBe(2);
  });
});

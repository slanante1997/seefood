// Shape of the structured result returned by the Gemini proxy function.
export interface Nutrition {
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
}

export interface FoodResult {
  isFood: boolean;
  name: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  servingSize: string;
  calories: string;
  nutrition: Nutrition;
  ingredients: string[];
  recipeQueries: string[];
  healthNote: string;
}

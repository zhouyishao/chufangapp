export interface Ingredient {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  category: string;
  month?: number;
}

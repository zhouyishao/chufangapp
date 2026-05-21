export interface RecipeCard {
  id: string;
  name: string;
  duration: string;
  difficulty: string;
  calories: string;
  tag: string;
  image: string;
  summary: string;
}

export interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
}

export interface HomeTab {
  id: string;
  label: string;
  active: boolean;
}

export interface MenuFilter {
  id: string;
  label: string;
}

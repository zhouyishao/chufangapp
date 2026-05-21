export type MyRecipeStatus = 'draft' | 'published';

export interface MyRecipeIngredient {
  name: string;
  amount: string;
}

export interface MyRecipeStep {
  title: string;
  description: string;
}

export interface MyRecipe {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  flavor: string;
  updatedAt: string;
  status: MyRecipeStatus;
  difficulty: string;
  category: string;
  visibility: string;
  ingredients: MyRecipeIngredient[];
  steps: MyRecipeStep[];
  note: string;
}

const MY_RECIPES: MyRecipe[] = [
  {
    id: 'my-1',
    name: '青柠芦笋虾仁',
    description: '在清爽虾仁里加入青柠皮屑，适合夏天的轻晚餐。',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
    duration: '18 分钟',
    flavor: '清爽',
    updatedAt: '今天',
    status: 'published',
    difficulty: '简单',
    category: '私房菜',
    visibility: '家庭可见',
    ingredients: [
      { name: '虾仁', amount: '150g' },
      { name: '芦笋', amount: '200g' },
      { name: '青柠', amount: '半个' },
      { name: '蒜末', amount: '1 勺' }
    ],
    steps: [
      { title: '处理食材', description: '芦笋切段焯水，虾仁擦干水分，青柠取少量皮屑备用。' },
      { title: '轻煎虾仁', description: '锅中少油，中火煎虾仁至两面变色，加入蒜末炒香。' },
      { title: '合炒调味', description: '放入芦笋快速翻炒，加入盐和青柠汁，出锅前撒青柠皮屑。' }
    ],
    note: '下次可以减少青柠汁，保留香气但不要盖住虾仁甜味。'
  },
  {
    id: 'my-2',
    name: '番茄味噌牛腩',
    description: '用一点味噌增加厚度，保留番茄的酸甜收口。',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    duration: '70 分钟',
    flavor: '浓郁',
    updatedAt: '昨天',
    status: 'draft',
    difficulty: '中等',
    category: '家常菜',
    visibility: '仅自己可见',
    ingredients: [
      { name: '牛腩', amount: '500g' },
      { name: '番茄', amount: '3 个' },
      { name: '味噌', amount: '1 勺' },
      { name: '洋葱', amount: '半个' }
    ],
    steps: [
      { title: '牛腩焯水', description: '牛腩冷水入锅，焯水后冲洗干净备用。' },
      { title: '炒出番茄底味', description: '洋葱和番茄炒软，加入味噌化开。' },
      { title: '炖煮收汁', description: '加入牛腩和热水，小火炖至软烂，最后收浓汤汁。' }
    ],
    note: '还需要再试一次番茄和味噌比例，避免咸味太突出。'
  }
];

export const loadMyRecipes = () => MY_RECIPES;

export const findMyRecipeById = (id: string) => MY_RECIPES.find((recipe) => recipe.id === id) ?? MY_RECIPES[0];

import type {
  HomeTab,
  MenuFilter,
  QuickAction,
  RecipeCard
} from '../types/home';

export const featuredRecipes: RecipeCard[] = [
  {
    id: 'recipe-1',
    name: '芦笋虾仁',
    duration: '15 分钟',
    difficulty: '简单',
    calories: '约 260 kcal',
    tag: '清爽快手',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    summary: '脆口芦笋搭配轻煎虾仁，适合温和的工作日晚餐。'
  },
  {
    id: 'recipe-2',
    name: '番茄牛腩',
    duration: '60 分钟',
    difficulty: '中等',
    calories: '约 520 kcal',
    tag: '家庭主菜',
    image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1200&q=80',
    summary: '番茄酸香更柔和，适合一锅炖好后全家一起分食。'
  },
  {
    id: 'recipe-3',
    name: '菌菇豆腐汤',
    duration: '25 分钟',
    difficulty: '简单',
    calories: '约 180 kcal',
    tag: '轻负担',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
    summary: '口味干净，步骤轻松，适合作为一顿饭里的平衡项。'
  }
];

export const homeCategoryRecipes: Record<string, RecipeCard[]> = {
  recommend: featuredRecipes,
  home: [
    featuredRecipes[1],
    featuredRecipes[0],
    {
      id: 'recipe-4',
      name: '红烧肉',
      duration: '90 分钟',
      difficulty: '中等',
      calories: '约 680 kcal',
      tag: '经典家常',
      image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80',
      summary: '肥而不腻的经典下饭菜，适合周末给家人加一道硬菜。'
    }
  ],
  quick: [
    featuredRecipes[0],
    featuredRecipes[2],
    {
      id: 'recipe-5',
      name: '蒜蓉西兰花',
      duration: '10 分钟',
      difficulty: '简单',
      calories: '约 120 kcal',
      tag: '快手素菜',
      image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=1200&q=80',
      summary: '清爽、快炒、少油，适合工作日快速补一道蔬菜。'
    }
  ],
  soup: [
    featuredRecipes[2],
    {
      id: 'recipe-6',
      name: '番茄鸡蛋汤',
      duration: '12 分钟',
      difficulty: '简单',
      calories: '约 150 kcal',
      tag: '家常汤',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80',
      summary: '酸甜开胃，做法稳定，是家里最常出现的快手汤。'
    }
  ],
  breakfast: [
    {
      id: 'recipe-7',
      name: '鸡蛋灌饼',
      duration: '20 分钟',
      difficulty: '中等',
      calories: '约 380 kcal',
      tag: '早餐经典',
      image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=1200&q=80',
      summary: '外酥里嫩，搭配生菜和酱料，适合周末早餐。'
    },
    {
      id: 'recipe-8',
      name: '牛奶燕麦杯',
      duration: '8 分钟',
      difficulty: '简单',
      calories: '约 260 kcal',
      tag: '轻早餐',
      image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=1200&q=80',
      summary: '水果和燕麦提前组合，早上直接吃也不慌。'
    }
  ],
  light: [
    featuredRecipes[2],
    {
      id: 'recipe-9',
      name: '鸡胸肉蔬菜碗',
      duration: '25 分钟',
      difficulty: '简单',
      calories: '约 320 kcal',
      tag: '减脂餐',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
      summary: '蛋白质和蔬菜比例清晰，适合控制热量时使用。'
    }
  ]
};

export const quickActions: QuickAction[] = [
  {
    id: 'basket',
    title: '菜篮子',
    subtitle: '整理本周采购',
    badge: '2 项待买'
  },
  {
    id: 'browse',
    title: '最近浏览',
    subtitle: '继续上次菜单',
    badge: '3 道未完成'
  }
];

export const menuFilters: MenuFilter[] = [
  {
    id: 'everyday',
    label: '日常快手'
  },
  {
    id: 'light',
    label: '轻负担'
  },
  {
    id: 'family',
    label: '全家都能吃'
  }
];

export const homeTabs: HomeTab[] = [
  {
    id: 'home',
    label: '首页',
    active: true
  },
  {
    id: 'ingredients',
    label: '食材',
    active: false
  },
  {
    id: 'basket',
    label: '菜篮子',
    active: false
  },
  {
    id: 'mine',
    label: '我的',
    active: false
  }
];

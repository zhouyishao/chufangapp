import type { Ingredient } from '../types/ingredient';

export const ingredientCatalog: Ingredient[] = [
  {
    id: '1',
    name: '虾仁',
    description: '高蛋白低脂肪，适合快手烹饪',
    image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80',
    tags: ['海鲜', '高蛋白'],
    category: 'seafood',
    month: 5
  },
  {
    id: '2',
    name: '三文鱼',
    description: '富含Omega-3',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    tags: ['海鲜', '营养'],
    category: 'seafood',
    month: 5
  },
  {
    id: '3',
    name: '芦笋',
    description: '初夏时令蔬菜，清爽脆嫩',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    tags: ['当季', '蔬菜'],
    category: 'vegetables',
    month: 5
  },
  {
    id: '4',
    name: '西兰花',
    description: '营养丰富的十字花科蔬菜',
    image: 'https://images.unsplash.com/photo-1628773822503-930a7eaecf80?auto=format&fit=crop&w=800&q=80',
    tags: ['蔬菜', '营养'],
    category: 'vegetables'
  },
  {
    id: '5',
    name: '番茄',
    description: '酸甜可口，适合炖煮',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=80',
    tags: ['蔬菜', '常备'],
    category: 'vegetables'
  },
  {
    id: '6',
    name: '草莓',
    description: '春季时令水果，酸甜多汁',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80',
    tags: ['当季', '水果'],
    category: 'fruits',
    month: 5
  },
  {
    id: '7',
    name: '苹果',
    description: '四季常备水果',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    tags: ['水果', '常备'],
    category: 'fruits'
  },
  {
    id: '8',
    name: '牛肉',
    description: '优质蛋白来源',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80',
    tags: ['肉类', '高蛋白'],
    category: 'meat',
    month: 5
  },
  {
    id: '9',
    name: '生抽',
    description: '家常调味基础，适合炒菜和凉拌',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
    tags: ['调料', '常备'],
    category: 'seasoning'
  },
  {
    id: '10',
    name: '料酒',
    description: '去腥增香，适合肉类和海鲜预处理',
    image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=800&q=80',
    tags: ['调料', '去腥'],
    category: 'seasoning'
  },
  {
    id: '11',
    name: '食用油',
    description: '日常烹饪基础用油，建议按家庭习惯选择',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
    tags: ['调料', '常备'],
    category: 'seasoning'
  },
  {
    id: '12',
    name: '盐',
    description: '基础调味，优先选择密封干爽包装',
    image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=800&q=80',
    tags: ['调料', '基础'],
    category: 'seasoning'
  }
];

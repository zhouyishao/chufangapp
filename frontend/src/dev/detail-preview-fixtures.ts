import type {
  ApiBeverageDetail,
  GuidedFlowDTO,
  ApiIngredientDetail,
  ApiRecipeDetail,
  ApiRecipeListItem
} from '../services/public-api';

export type DetailPreviewKind = 'recipe' | 'ingredient' | 'fruit' | 'beverage' | 'seasoning';

type DetailPreviewMap = {
  recipe: ApiRecipeDetail;
  ingredient: ApiIngredientDetail;
  fruit: ApiIngredientDetail;
  beverage: ApiBeverageDetail;
  seasoning: ApiIngredientDetail;
};

const image = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=84`;

const recipe: ApiRecipeDetail = {
  id: 'preview-recipe',
  legacyId: 900001,
  code: 'preview-steamed-fish',
  title: '清蒸鲈鱼',
  subtitle: '鲜嫩清淡，适合全家',
  cover: image('photo-1519708227418-c8fd9a32b7a2'),
  description: '火候恰到好处，鱼肉鲜嫩，葱姜豉油提香。',
  cookTime: 30,
  servings: 3,
  difficulty: '简单',
  taste: '鲜香',
  scene: '家常',
  viewCount: 2864,
  favoriteCount: 628,
  commentCount: 32,
  createdAt: '2026-07-01T08:00:00.000Z',
  updatedAt: '2026-07-28T08:00:00.000Z',
  categoryId: 'preview-home-cooking',
  category: { id: 'preview-home-cooking', name: '家常菜', type: 'RECIPE' },
  cuisineId: null,
  cuisine: null,
  isPublish: true,
  isRecommend: true,
  calories: 186,
  tips: '鱼蒸好后盘中的水要倒掉，能减少腥味。\n热油最后淋在葱丝上，香气更集中。\n豉油本身有咸味，不需要额外放太多盐。',
  ingredients: [
    { id: 1, sortIndex: 1, ingredientId: '101', name: '鲈鱼', amount: '1 条（约 600g）', ingredient: { id: '101', name: '鲈鱼', transparentImage: image('photo-1519708227418-c8fd9a32b7a2', 320), categoryType: 'INGREDIENT' } },
    { id: 2, sortIndex: 2, ingredientId: '102', name: '生姜', amount: '1 小块', ingredient: { id: '102', name: '生姜', transparentImage: image('photo-1615485500704-8e990f9900f7', 320), categoryType: 'INGREDIENT' } },
    { id: 3, sortIndex: 3, ingredientId: '103', name: '小葱', amount: '2 根', ingredient: { id: '103', name: '小葱', transparentImage: image('photo-1518977676601-b53f82aba655', 320), categoryType: 'INGREDIENT' } },
    { id: 4, sortIndex: 4, ingredientId: '104', name: '红椒', amount: '少许', ingredient: { id: '104', name: '红椒', transparentImage: image('photo-1563565375-f3fdfdbefa83', 320), categoryType: 'INGREDIENT' } },
    { id: 5, sortIndex: 5, ingredientId: null, name: '蒸鱼豉油', amount: '2 勺', ingredient: null },
    { id: 6, sortIndex: 6, ingredientId: null, name: '料酒', amount: '1 勺', ingredient: null },
    { id: 7, sortIndex: 7, ingredientId: null, name: '食用油', amount: '1 勺', ingredient: null },
    { id: 8, sortIndex: 8, ingredientId: null, name: '盐', amount: '少许', ingredient: null }
  ],
  steps: [
    { id: 1, sortIndex: 1, title: '处理鲈鱼', description: '清理鱼鳞、鱼鳃和腹部黑膜，冲洗后擦干水分。', image: image('photo-1519708227418-c8fd9a32b7a2', 640) },
    { id: 2, sortIndex: 2, title: '腌制去腥', description: '放入姜片和葱段，淋少许料酒，静置 10 分钟。', image: null },
    { id: 3, sortIndex: 3, title: '上锅蒸制', description: '水开后上锅，大火蒸 8 分钟，关火焖 2 分钟。', image: image('photo-1547592166-23ac45744acd', 640) },
    { id: 4, sortIndex: 4, title: '淋油调味', description: '倒掉蒸汁，铺上葱姜红椒丝，淋豉油和热油。', image: image('photo-1519708227418-c8fd9a32b7a2', 640) },
    { id: 5, sortIndex: 5, title: '完成装盘', description: '趁热上桌，鱼肉鲜嫩时口感最好。', image: null }
  ],
  beverages: [
    {
      recommendReason: '茶香清爽，能平衡蒸鱼豉油的咸鲜。',
      sortOrder: 1,
      beverage: {
        id: 'preview-beverage',
        code: 'preview-cold-tea',
        name: '冷泡乌龙',
        coverImage: image('photo-1544145945-f90425340c7e', 420),
        beverageType: '茶饮',
        isAlcoholic: false,
        alcoholDegree: null,
        description: '清香回甘，适合佐餐。'
      }
    }
  ]
};

const ingredientBase = {
  updatedAt: '2026-07-28T08:00:00.000Z',
  detailImages: [],
  selectionMedia: null,
  priceSource: '本地商超与市场综合参考',
  priceDate: '2026-07-28'
};

const ingredient: ApiIngredientDetail = {
  ...ingredientBase,
  id: 900011,
  name: '番茄',
  cover: image('photo-1546094096-0df4bcaaa337'),
  displayImage: image('photo-1546094096-0df4bcaaa337'),
  transparentImage: null,
  seasonMonth: '5月–9月',
  season: { label: '5月—9月', startMonth: 5, endMonth: 9, isInSeason: true },
  currentPrice: 3.6,
  priceUnit: '斤',
  category: { id: 901, name: '茄果类', type: 'INGREDIENT' },
  nutrition: '适合凉拌、炒制或煮汤。成熟番茄酸甜平衡，加热后风味更浓。',
  selectionTips: '看果肩：果肩舒展，颜色自然均匀。\n看果蒂：果蒂鲜绿紧实，没有明显干枯。\n试手感：拿起来有分量，轻按略有弹性。',
  storageMethod: '未完全成熟时放在阴凉通风处；成熟后冷藏，建议 3–5 天内食用。',
  selectionGuide: [
    { title: '看果肩', description: '果肩舒展，颜色自然均匀。' },
    { title: '看果蒂', description: '果蒂鲜绿紧实，没有明显干枯。' },
    { title: '试手感', description: '拿起来有分量，轻按略有弹性。' }
  ],
  storageGuide: [{ title: '成熟后冷藏', description: '未完全成熟时放在阴凉通风处，成熟后建议 3–5 天内食用。' }],
  eatingGuide: [{ title: '熟食更温和', description: '可凉拌、炒制或煮汤，胃酸敏感时优先熟食。' }],
  taboo: '空腹时不建议一次食用过多；胃酸敏感人群可优先熟食。',
  relatedRecipes: [
    { id: 'preview-recipe', title: '番茄炒蛋', cover: image('photo-1565299507177-b0ac66763828', 420), cookTime: 15, difficulty: '简单' },
    { id: 'preview-recipe', title: '番茄牛腩汤', cover: image('photo-1547592180-85f173990554', 420), cookTime: 60, difficulty: '适中' }
  ]
};

const fruit: ApiIngredientDetail = {
  ...ingredientBase,
  id: 900012,
  name: '水蜜桃',
  cover: image('photo-1560806887-1e4cd0b6cbd6'),
  displayImage: image('photo-1560806887-1e4cd0b6cbd6'),
  transparentImage: null,
  seasonMonth: '6月–8月',
  season: { label: '6月—8月', startMonth: 6, endMonth: 8, isInSeason: true },
  currentPrice: 12.8,
  priceUnit: '斤',
  category: { id: 902, name: '核果类', type: 'INGREDIENT' },
  nutrition: '果肉细嫩多汁，可直接食用，也适合做冷泡茶、酸奶碗和轻甜点。',
  selectionTips: '看颜色：底色自然，着色均匀，没有大片青色。\n闻果香：成熟果会有自然清甜的桃香。\n试弹性：轻按果肩略有弹性，不软塌。',
  storageMethod: '偏生的常温催熟；成熟后单层冷藏，避免挤压，建议 2–3 天内食用。',
  selectionGuide: [
    { title: '看颜色', description: '底色自然，着色均匀，没有大片青色。' },
    { title: '闻果香', description: '成熟果会有自然清甜的桃香。' },
    { title: '试弹性', description: '轻按果肩略有弹性，不软塌。' }
  ],
  storageGuide: [{ title: '单层冷藏', description: '偏生的常温催熟，成熟后避免挤压，建议 2–3 天内食用。' }],
  eatingGuide: [{ title: '清洗后食用', description: '充分洗净表皮绒毛，也可用于冷泡茶、酸奶碗和轻甜点。' }],
  taboo: '对桃类过敏者避免食用；表皮绒毛可用流水充分清洗。',
  relatedRecipes: [
    { id: 'preview-recipe', title: '蜜桃冷泡茶', cover: image('photo-1513558161293-cdaf765ed2fd', 420), cookTime: 10, difficulty: '简单' },
    { id: 'preview-recipe', title: '夏日水果沙拉', cover: image('photo-1546069901-ba9599a7e63c', 420), cookTime: 12, difficulty: '简单' }
  ]
};

const beverage: ApiBeverageDetail = {
  id: 'preview-beverage',
  legacyId: 900013,
  code: 'preview-mojito',
  name: '莫吉托',
  coverImage: image('photo-1513558161293-cdaf765ed2fd'),
  transparentImage: null,
  categoryId: 903,
  beverageType: '鸡尾酒',
  isAlcoholic: true,
  alcoholDegree: 12,
  description: JSON.stringify({
    descriptionText: '青柠与薄荷带来清爽酸香，适合搭配烧烤和夏日晚餐。',
    mixMethod: '直接调制',
    garnish: '薄荷与青柠角',
    iceType: '满杯碎冰',
    mixTips: '薄荷轻拍出香即可，过度捣压会发苦。'
  }),
  category: { id: 903, name: '鸡尾酒', type: 'BEVERAGE' },
  kind: 'MIXED',
  cocktailMethod: '直接调制',
  baseSpirit: '白朗姆酒',
  glassType: '高球杯',
  garnish: '薄荷叶、青柠角',
  instructions: '先释放薄荷香气，再加入青柠、朗姆酒、碎冰与苏打水。',
  ingredientsV2: [
    { id: 1, name: '白朗姆酒', amount: '45ml', isBase: true, sortIndex: 1 },
    { id: 2, name: '青柠', amount: '1/2 个', isBase: false, sortIndex: 2 },
    { id: 3, name: '薄荷叶', amount: '8–10 片', isBase: false, sortIndex: 3 },
    { id: 4, name: '糖浆', amount: '15ml', isBase: false, sortIndex: 4 },
    { id: 5, name: '苏打水', amount: '适量', isBase: false, sortIndex: 5 }
  ],
  tools: [
    { id: 1, name: '高球杯', sortIndex: 1 },
    { id: 2, name: '吧勺', sortIndex: 2 },
    { id: 3, name: '量酒器', sortIndex: 3 }
  ],
  steps: [
    { id: 1, title: '轻拍薄荷', description: '薄荷放掌心轻拍，放入杯底释放香气。', sortIndex: 1, timerSeconds: null, tip: '不要把薄荷捣碎。' },
    { id: 2, title: '加入青柠', description: '挤入青柠汁，放入青柠角和糖浆。', sortIndex: 2, timerSeconds: null, tip: null },
    { id: 3, title: '加入基酒', description: '倒入白朗姆酒，加满碎冰。', sortIndex: 3, timerSeconds: null, tip: null },
    { id: 4, title: '搅拌完成', description: '补满苏打水，由下向上轻轻搅拌。', sortIndex: 4, timerSeconds: 20, tip: '避免搅拌过度导致气泡流失。' }
  ],
  createdAt: '2026-07-01T08:00:00.000Z',
  updatedAt: '2026-07-28T08:00:00.000Z'
};

const seasoning: ApiIngredientDetail = {
  ...ingredientBase,
  id: 900014,
  name: '蒸鱼豉油',
  cover: image('photo-1474979266404-7eaacbcd87c5'),
  displayImage: image('photo-1474979266404-7eaacbcd87c5'),
  transparentImage: null,
  seasonMonth: '全年',
  season: { label: '全年', startMonth: null, endMonth: null, isInSeason: true },
  currentPrice: 12.9,
  priceUnit: '瓶',
  category: { id: 904, name: '酱油类', type: 'INGREDIENT' },
  nutrition: '咸鲜柔和，适合清蒸鱼、白灼海鲜和清淡蔬菜，少量即可提鲜。',
  selectionTips: '看配料：酿造酱油排在前列，配料表简洁。\n看用途：优先选择明确标注蒸鱼或海鲜用途的产品。\n看日期：选择生产日期较新的常温密封产品。',
  storageMethod: '开封后密封冷藏，避免灶台高温和阳光直射。',
  selectionGuide: [
    { title: '看配料', description: '酿造酱油排在前列，配料表简洁。' },
    { title: '看用途', description: '优先选择明确标注蒸鱼或海鲜用途的产品。' },
    { title: '看日期', description: '选择生产日期较新的常温密封产品。' }
  ],
  storageGuide: [{ title: '密封冷藏', description: '开封后密封冷藏，避免灶台高温和阳光直射。' }],
  eatingGuide: [{ title: '少量提鲜', description: '适合清蒸鱼、白灼海鲜和清淡蔬菜，使用后减少额外加盐。' }],
  taboo: '含盐量较高，使用后应减少额外加盐；控钠人群注意用量。',
  relatedRecipes: [
    { id: 'preview-recipe', title: '清蒸鲈鱼', cover: image('photo-1519708227418-c8fd9a32b7a2', 420), cookTime: 30, difficulty: '简单' },
    { id: 'preview-recipe', title: '白灼鲜虾', cover: image('photo-1565680018434-b513d5e5fd47', 420), cookTime: 15, difficulty: '简单' }
  ]
};

const fixtures: DetailPreviewMap = { recipe, ingredient, fruit, beverage, seasoning };

export const detailPreviewRelatedRecipes: ApiRecipeListItem[] = [
  {
    id: 'preview-recipe',
    title: '葱油鲈鱼',
    subtitle: '鲜香清淡，葱油提味',
    cover: image('photo-1519708227418-c8fd9a32b7a2', 420),
    description: '另一种适合家庭晚餐的鲈鱼做法。',
    cookTime: 25,
    servings: 3,
    difficulty: '简单',
    taste: '鲜香',
    scene: '家常',
    viewCount: 862,
    favoriteCount: 138,
    commentCount: 8,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-28T08:00:00.000Z'
  },
  {
    id: 'preview-recipe',
    title: '冬瓜虾仁汤',
    subtitle: '鲜甜低负担',
    cover: image('photo-1547592166-23ac45744acd', 420),
    description: '适合搭配清蒸鱼的一道清爽汤品。',
    cookTime: 30,
    servings: 3,
    difficulty: '简单',
    taste: '清淡',
    scene: '晚餐',
    viewCount: 722,
    favoriteCount: 112,
    commentCount: 5,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-28T08:00:00.000Z'
  }
];

const readPreviewFlag = (options?: Record<string, string | undefined>) => {
  if (options?.preview === '1') return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.hash.split('?')[1] || '').get('preview') === '1';
};

export const getDetailPreviewFixture = <K extends DetailPreviewKind>(
  kind: K,
  id: string | number,
  options?: Record<string, string | undefined>
): DetailPreviewMap[K] | null => {
  if (!import.meta.env.DEV) return null;
  if (String(id) !== `preview-${kind}` || !readPreviewFlag(options)) return null;
  return structuredClone(fixtures[kind]);
};

export const getGuidedFlowPreviewFixture = (
  kind: 'recipe' | 'beverage',
  id: string,
  options?: Record<string, string | undefined>
): GuidedFlowDTO | null => {
  if (!import.meta.env.DEV || !readPreviewFlag(options)) return null;

  if (kind === 'recipe' && id === 'preview-recipe') {
    return {
      id: recipe.id,
      title: recipe.title,
      totalMinutes: recipe.cookTime ?? undefined,
      steps: recipe.steps.map((step, index) => ({
        id: String(step.id),
        order: index + 1,
        title: step.title?.trim() || `步骤 ${index + 1}`,
        description: step.description,
        media: step.image ? { url: step.image, mimeType: 'image/*' } : undefined,
        timerSeconds: index === 1 ? 600 : index === 2 ? 480 : undefined,
        tip: index === 2 ? '水开后再上锅，蒸制时间从重新沸腾后开始计算。' : undefined
      }))
    };
  }

  if (kind === 'beverage' && id === 'preview-beverage') {
    return {
      id: beverage.id,
      title: beverage.name,
      steps: beverage.steps.map((step, index) => ({
        id: String(step.id),
        order: index + 1,
        title: step.title,
        description: step.description,
        timerSeconds: step.timerSeconds ?? undefined,
        tip: step.tip ?? undefined
      }))
    };
  }

  return null;
};

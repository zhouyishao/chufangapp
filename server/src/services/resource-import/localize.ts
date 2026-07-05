import type { NormalizedResourcePayload, ResourceImportType } from './types';

const TERM_TRANSLATIONS: Record<string, string> = {
  'old fashioned': '古典鸡尾酒',
  'old-fashioned glass': '古典杯',
  'cocktail glass': '鸡尾酒杯',
  'highball glass': '高球杯',
  'collins glass': '柯林斯杯',
  'hurricane glass': '飓风杯',
  'shot glass': '烈酒杯',
  'martini glass': '马天尼杯',
  'champagne flute': '香槟杯',
  'copper mug': '铜杯',
  'wine glass': '葡萄酒杯',
  'cocktail': '鸡尾酒',
  'ordinary drink': '普通酒水',
  'shot': '烈酒',
  'shake': '摇和',
  'stir': '搅拌',
  'build': '直调',
  'pour': '直调',
  'blend': '搅打',
  'layer': '分层',
  'muddle': '捣压',
  'shake well': '充分摇匀',
  'garnish': '装饰',
  'serve': '上桌',
  'strain': '过滤',
  'fill': '装满',
  'top with': '顶部加入',
  'top up': '加满',
  'combine': '混合',
  'squeeze': '挤入',
  'chilled': '冰镇',
  'shaker': '摇酒壶',
  'glass': '酒杯',
  'ice': '冰块',
  'vodka': '伏特加',
  'gin': '金酒',
  'rum': '朗姆酒',
  'light rum': '淡朗姆酒',
  'white rum': '白朗姆酒',
  'dark rum': '黑朗姆酒',
  'tequila': '龙舌兰',
  'whiskey': '威士忌',
  'whisky': '威士忌',
  'bourbon': '波本威士忌',
  'brandy': '白兰地',
  'cognac': '干邑白兰地',
  'mezcal': '梅斯卡尔',
  'vermouth': '味美思',
  'sweet vermouth': '甜味美思',
  'dry vermouth': '干味美思',
  'triple sec': '橙味利口酒',
  'cointreau': '君度橙酒',
  'campari': '金巴利',
  'amaretto': '杏仁利口酒',
  'kahlua': '咖啡利口酒',
  "bailey's irish cream": '百利甜酒',
  'blue curacao': '蓝橙酒',
  'orange juice': '橙汁',
  'lime juice': '青柠汁',
  'lemon juice': '柠檬汁',
  'cranberry juice': '蔓越莓汁',
  'pineapple juice': '菠萝汁',
  'grapefruit juice': '葡萄柚汁',
  'tomato juice': '番茄汁',
  'cola': '可乐',
  'soda water': '苏打水',
  'tonic water': '汤力水',
  'ginger ale': '姜汁汽水',
  'simple syrup': '糖浆',
  'sugar syrup': '糖浆',
  'grenadine': '石榴糖浆',
  'mint': '薄荷',
  'sugar': '糖',
  'salt': '盐',
  'milk': '牛奶',
  'cream': '奶油',
  'egg white': '蛋清',
  'coffee': '咖啡',
  'lemon': '柠檬',
  'lime': '青柠',
  'orange': '橙子',
  'pineapple': '菠萝',
  'cherry': '樱桃',
  'olive': '橄榄',
  'basil': '罗勒',
  'strawberry': '草莓',
  'apple': '苹果',
  'cucumber': '黄瓜',
  'celery': '芹菜',
  'ginger': '姜',
  'honey': '蜂蜜',
  'alcoholic': '含酒精',
  'non alcoholic': '无酒精',
  'optional alcohol': '可选酒精',
  'drink': '饮品',
  'beverage': '酒水',
  'fruit': '水果',
  'ingredient': '食材',
  'seasoning': '调料',
  'recipe': '菜谱',
  'instructions': '制作步骤',
  'description': '描述',
  'recipe by': '菜谱来源',
  'margarita': '玛格丽塔',
  'mojito': '莫吉托',
  'martini': '马天尼',
  'daiquiri': '代基里',
  'cosmopolitan': '大都会',
  'pina colada': '椰林飘香',
  'long island iced tea': '长岛冰茶',
  'bloody mary': '血腥玛丽',
  'tequila sunrise': '龙舌兰日出',
  'white russian': '白俄罗斯',
  'black russian': '黑俄罗斯',
  'negroni': '内格罗尼',
  'aperol spritz': '阿佩罗气泡酒',
  'espresso martini': '浓缩马天尼',
  'manhattan': '曼哈顿',
  'whiskey sour': '威士忌酸酒',
  'mai tai': '迈泰',
  'sidecar': '边车',
  'gin and tonic': '金汤力',
  'sex on the beach': '性在海滩'
};

const PHRASE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/\bshake well\b/gi, '充分摇匀'],
  [/\btop up\b/gi, '加满'],
  [/\btop with\b/gi, '顶部加入'],
  [/\bfilled with\b/gi, '装满'],
  [/\bfill\b/gi, '装满'],
  [/\bstrain\b/gi, '过滤'],
  [/\bgarnish(?:ed)? with\b/gi, '装饰'],
  [/\bcombine\b/gi, '混合'],
  [/\bsqueeze\b/gi, '挤入'],
  [/\bserve\b/gi, '上桌'],
  [/\bchilled\b/gi, '冰镇'],
  [/\bshaker\b/gi, '摇酒壶'],
  [/\bglass\b/gi, '酒杯'],
  [/\bice\b/gi, '冰块'],
  [/\badd\b/gi, '加入'],
  [/\bpour\b/gi, '倒入'],
  [/\bstir\b/gi, '搅拌'],
  [/\bshake\b/gi, '摇和'],
  [/\bblend\b/gi, '搅打'],
  [/\blayer\b/gi, '分层'],
  [/\bmuddle\b/gi, '捣压'],
  [/\bbuild\b/gi, '直调']
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sortedExactKeys = Object.keys(TERM_TRANSLATIONS).sort((a, b) => b.length - a.length);

const isCjkText = (value: string) => /[\u4e00-\u9fff]/.test(value);

const translateSentence = (value: string) => {
  let output = value;
  for (const [pattern, replacement] of PHRASE_TRANSLATIONS) {
    output = output.replace(pattern, replacement);
  }

  for (const key of sortedExactKeys) {
    const replacement = TERM_TRANSLATIONS[key]!;
    const pattern = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'gi');
    output = output.replace(pattern, replacement);
  }

  return output;
};

const translateText = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text || isCjkText(text)) return text;

  const exact = TERM_TRANSLATIONS[text.toLowerCase()];
  if (exact) return exact;

  return translateSentence(text);
};

const translateIngredientEntry = (entry: string | { name: string; amount?: string; unit?: string; sortIndex?: number }) => {
  if (typeof entry === 'string') {
    return translateText(entry) as string;
  }
  return {
    ...entry,
    name: translateText(entry.name) as string,
    amount: translateText(entry.amount) as string | undefined,
    unit: translateText(entry.unit) as string | undefined
  };
};

const translateStepEntry = (entry: string | { sortIndex?: number; description: string; image?: string | null }) => {
  if (typeof entry === 'string') {
    return translateSentence(entry);
  }
  return {
    ...entry,
    description: translateSentence(entry.description)
  };
};

export function localizeResourcePayload(
  resourceType: ResourceImportType,
  payload: NormalizedResourcePayload
): NormalizedResourcePayload {
  const localized: NormalizedResourcePayload = {
    ...payload,
    name: translateText(payload.name) as string,
    title: translateText(payload.title) as string | undefined,
    subtitle: translateText(payload.subtitle) as string | undefined,
    description: translateSentence(payload.description ?? ''),
    cover: payload.cover,
    coverImage: payload.coverImage,
    categoryName: translateText(payload.categoryName) as string | null | undefined,
    cuisineName: translateText(payload.cuisineName) as string | null | undefined,
    cookTime: payload.cookTime,
    servings: payload.servings,
    calories: payload.calories,
    difficulty: translateText(payload.difficulty) as string | null | undefined,
    taste: translateText(payload.taste) as string | null | undefined,
    scene: translateText(payload.scene) as string | null | undefined,
    tips: translateSentence(payload.tips ?? ''),
    steps: Array.isArray(payload.steps) ? payload.steps.map(translateStepEntry) : payload.steps,
    ingredients: Array.isArray(payload.ingredients) ? payload.ingredients.map(translateIngredientEntry) : payload.ingredients,
    seasonMonth: payload.seasonMonth,
    nutrition: translateSentence(payload.nutrition ?? ''),
    selectionTips: translateSentence(payload.selectionTips ?? ''),
    storageMethod: translateSentence(payload.storageMethod ?? ''),
    taboo: translateSentence(payload.taboo ?? ''),
    currentPrice: payload.currentPrice,
    priceUnit: translateText(payload.priceUnit) as string | null | undefined,
    priceSource: translateText(payload.priceSource) as string | null | undefined,
    priceDate: payload.priceDate,
    beverageType: translateText(payload.beverageType) as string | null | undefined,
    isAlcoholic: payload.isAlcoholic,
    alcoholDegree: payload.alcoholDegree,
    drinkType: translateText(payload.drinkType) as string | null | undefined,
    cocktailMethod: translateText(payload.cocktailMethod) as string | null | undefined,
    baseSpirit: translateText(payload.baseSpirit) as string | null | undefined,
    glassType: translateText(payload.glassType) as string | null | undefined,
    alcoholicType: translateText(payload.alcoholicType) as string | null | undefined,
    measures: Array.isArray(payload.measures) ? payload.measures.map((item) => translateSentence(item)) : payload.measures,
    garnish: translateText(payload.garnish) as string | null | undefined,
    instructions: translateSentence(payload.instructions ?? ''),
    flavorTags: Array.isArray(payload.flavorTags) ? payload.flavorTags.map((item) => translateText(item) as string) : payload.flavorTags,
    sceneTags: Array.isArray(payload.sceneTags) ? payload.sceneTags.map((item) => translateText(item) as string) : payload.sceneTags,
    rawJson: payload.rawJson,
    externalId: payload.externalId,
    externalUrl: payload.externalUrl,
    sourceName: payload.sourceName
  };

  if (resourceType === 'RECIPE' && localized.steps) {
    localized.steps = localized.steps.map((step) => translateStepEntry(step as string | { sortIndex?: number; description: string; image?: string | null }));
  }

  return localized;
}

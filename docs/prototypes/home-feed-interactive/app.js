const root = document.documentElement;
const toast = document.querySelector('#toast');
const sentinel = document.querySelector('#feedSentinel');
const heroCarousel = document.querySelector('#heroCarousel');
const heroSlides = [...document.querySelectorAll('[data-hero-slide]')];
const heroDots = [...document.querySelectorAll('[data-hero-dot]')];
const heroTitle = document.querySelector('#heroTitle');
const heroMeta = document.querySelector('#heroMeta');
let lastScrollY = Math.max(0, window.scrollY);
let scrollDirection = 'idle';
let scrollFrame = 0;
let toastTimer = 0;
let recommendationBatch = 0;
let feedBatch = 0;
let feedLoading = false;
let errorShown = false;
let heroIndex = 0;
let heroTimer = 0;
let heroTouchStartX = 0;
let mineScrollPosition = 0;
let mineRecipeReloadTimer = 0;
let createStep = 1;
let createHasMedia = false;
let pendingMediaDelete = null;
let detailReturnView = 'home';

if (new URLSearchParams(window.location.search).has('debug')) root.classList.add('debug-mode');

const recommendations = [
  [
    { id: 'tomato-noodle', title: '番茄鸡蛋面', desc: '酸甜开胃，汤汁浓郁', meta: '25 分钟 · 简单', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=560&q=80' },
    { id: 'chicken-rice', title: '照烧鸡腿饭', desc: '酱香浓郁，米饭杀手', meta: '30 分钟 · 简单', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=560&q=80' },
    { id: 'shrimp-egg', title: '虾仁滑蛋', desc: '鲜嫩营养，清爽不腻', meta: '25 分钟 · 简单', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=560&q=80' }
  ],
  [
    { id: 'fish', title: '清蒸鲈鱼', desc: '鲜嫩清淡，适合全家', meta: '30 分钟 · 简单', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=560&q=80' },
    { id: 'salad', title: '夏日蔬菜沙拉', desc: '爽脆清口，简单调味', meta: '12 分钟 · 简单', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=560&q=80' },
    { id: 'pasta', title: '番茄罗勒意面', desc: '酸香明亮，不易出错', meta: '25 分钟 · 简单', image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=560&q=80' }
  ]
];

const homeHeroData = {
  recommend: [
    ['今晚吃点清爽的', '夏日家常菜 · 25 分钟', 'https://images.unsplash.com/photo-1644647849404-bba4739704e3?auto=format&fit=crop&w=900&q=82', '夏日清爽家常菜摆盘'],
    ['一锅鲜香刚刚好', '家庭聚餐 · 40 分钟', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=82', '适合家庭聚餐的鲜香炖菜'],
    ['给晚餐配一杯清凉', '夏日饮品 · 10 分钟', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=82', '青柠与薄荷调制的清凉饮品']
  ],
  recipe: [
    ['今晚做清蒸鲈鱼', '鲜嫩清淡 · 30 分钟', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=84', '清蒸鲈鱼菜谱'],
    ['一碗家常饭刚刚好', '下饭家常菜 · 简单好做', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=84', '家常米饭料理'],
    ['周末做份番茄意面', '酸甜开胃 · 25 分钟', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=84', '番茄意面菜谱']
  ],
  ingredient: [
    ['当季食材正新鲜', '应季选择 · 日常参考价', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=84', '丰富的新鲜时令食材'],
    ['毛豆正当季', '脆嫩清甜 · 清炒凉拌', 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=900&q=84', '新鲜毛豆'],
    ['番茄这样挑更新鲜', '颜色自然 · 果蒂鲜绿', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=84', '成熟番茄']
  ],
  fruit: [
    ['水蜜桃正香甜', '6月–8月 · 轻按有弹性', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=84', '当季水蜜桃'],
    ['夏日水果正当季', '清甜多汁 · 按季节挑选', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=900&q=84', '缤纷夏日水果'],
    ['葡萄看果粉更新鲜', '6月–9月 · 果香自然', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=900&q=84', '新鲜葡萄']
  ],
  drink: [
    ['给晚餐配一杯清凉', '青柠气泡水 · 清爽解腻', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=84', '青柠薄荷气泡饮'],
    ['冷泡乌龙清香回甘', '茶饮搭配 · 适合佐餐', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=84', '冷泡乌龙茶'],
    ['夏日果饮简单做', '果香清甜 · 10 分钟', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=84', '清爽夏日果饮']
  ]
};

const homeChannelData = {
  recipe: {
    filters: ['家常', '快手', '下饭', '清淡', '聚餐'],
    featured: [
      ['番茄鸡蛋面', '酸甜开胃，汤汁浓郁', '25 分钟 · 简单', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=560&q=82', 'tomato-noodle', ['家常', '快手', '下饭']],
      ['照烧鸡腿饭', '酱香浓郁，米饭杀手', '30 分钟 · 简单', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=560&q=82', 'chicken-rice', ['家常', '下饭', '聚餐']],
      ['清蒸鲈鱼', '鲜嫩清淡，适合全家', '20 分钟 · 简单', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=560&q=82', 'steamed-fish', ['家常', '清淡', '聚餐']]
    ],
    list: [
      ['青椒牛肉', '鲜香滑嫩，经典下饭', '20 分钟 · 简单', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=320&q=82', 'pepper-beef', ['家常', '快手', '下饭']],
      ['冬瓜虾仁汤', '鲜甜低负担，适合晚餐', '30 分钟 · 简单', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=320&q=82', 'winter-melon-soup', ['家常', '清淡']],
      ['麻婆豆腐', '麻辣鲜香，拌饭正好', '20 分钟 · 适中', 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&w=320&q=82', 'mapo-tofu', ['家常', '下饭', '聚餐']]
    ]
  },
  ingredient: {
    filters: ['当季', '叶菜', '根茎', '菌菇', '豆类', '肉禽', '水产'],
    items: [
      ['毛豆', '6月–8月', '约 ¥4.8/斤', 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=420&q=82', 'edamame', ['当季', '豆类']],
      ['番茄', '5月–9月', '约 ¥3.6/斤', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=420&q=82', 'tomato', ['当季']],
      ['香菇', '4月–6月', '约 ¥6.8/斤', 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=420&q=82', 'mushroom', ['当季', '菌菇']],
      ['鲜虾', '4月–7月', '约 ¥18.8/斤', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=420&q=82', 'shrimp', ['当季', '水产']],
      ['土豆', '全年', '约 ¥2.9/斤', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=420&q=82', 'potato', ['根茎']],
      ['生菜', '4月–7月', '约 ¥3.5/斤', 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=420&q=82', 'lettuce', ['当季', '叶菜']],
      ['鸡腿肉', '全年', '约 ¥14.8/斤', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=420&q=82', 'chicken', ['肉禽']]
    ]
  },
  fruit: {
    filters: ['当季', '常见', '热带', '浆果', '瓜果', '柑橘'],
    items: [
      ['水蜜桃', '6月–8月', '约 ¥12.8/斤', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=420&q=82', 'peach', ['当季', '常见']],
      ['荔枝', '5月–7月', '约 ¥16.8/斤', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=420&q=82', 'lychee', ['当季', '热带']],
      ['葡萄', '6月–9月', '约 ¥16.8/斤', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=420&q=82', 'grape', ['当季', '浆果', '常见']],
      ['蓝莓', '5月–8月', '约 ¥103/斤', 'https://images.unsplash.com/photo-1425934398893-310a009a77f9?auto=format&fit=crop&w=420&q=82', 'blueberry', ['当季', '浆果']],
      ['西瓜', '5月–8月', '约 ¥3.8/斤', 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=420&q=82', 'watermelon-fruit', ['当季', '常见', '瓜果']],
      ['橙子', '11月–4月', '约 ¥6.9/斤', 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=420&q=82', 'orange', ['常见', '柑橘']]
    ]
  },
  drink: {
    filters: ['茶饮', '咖啡', '软饮', '酒水', '饮用水'],
    items: [
      ['青柠气泡水', '清爽 · 解腻', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=420&q=82', 'lime', ['软饮', '饮用水']],
      ['冷泡乌龙', '茶香 · 回甘', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=420&q=82', 'oolong', ['茶饮']],
      ['西瓜冰饮', '果香 · 清甜', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=420&q=82', 'watermelon', ['软饮']],
      ['冰美式', '醇苦 · 清醒', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=420&q=82', 'americano', ['咖啡']],
      ['茉莉花茶', '花香 · 温润', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=420&q=82', 'jasmine', ['茶饮']],
      ['手冲咖啡', '坚果香 · 明亮', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=420&q=82', 'pour-over', ['咖啡']],
      ['梅子酒', '酸甜 · 梅香', 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=420&q=82', 'plum-wine', ['酒水']],
      ['天然矿泉水', '清冽 · 日常', 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=420&q=82', 'mineral-water', ['饮用水']]
    ]
  }
};

function channelBasketButton(name, channel) {
  return basketButton([name], `home-${channel}`);
}

function channelFilters(channel) {
  return '';
}

function recipeChannelMarkup() {
  const data = homeChannelData.recipe;
  return `${channelFilters('recipe')}
    <section class="channel-section"><div class="channel-section-heading"><h2>今天吃什么</h2><button type="button" data-route="recipe">查看更多 <span class="icon icon-chevron" aria-hidden="true"></span></button></div><div class="channel-recipe-rail">${data.featured.map(([name, , meta, image, id, tags]) => `<article class="channel-recipe-card" data-filter-card data-filter-tags="${tags.join('|')}"><button class="channel-card-hit" type="button" data-route="recipe:${id}"><img src="${image}" width="150" height="150" alt="${name}" loading="lazy"><strong>${name}</strong></button><div class="channel-card-actions"><small>${meta}</small><button class="channel-favorite" type="button" data-favorite aria-label="收藏${name}" aria-pressed="false"><span class="icon icon-bookmark" aria-hidden="true"></span></button>${channelBasketButton(name, 'recipe')}</div></article>`).join('')}</div></section>
    <section class="channel-section"><div class="channel-section-heading"><h2>按一餐来选</h2></div><div class="meal-time-grid"><button type="button" data-route="recipe:breakfast"><span class="meal-time-icon" aria-hidden="true">晨</span><strong>早餐</strong><small>元气开始</small></button><button type="button" data-route="recipe:lunch"><span class="meal-time-icon" aria-hidden="true">午</span><strong>午餐</strong><small>营养均衡</small></button><button type="button" data-route="recipe:dinner"><span class="meal-time-icon" aria-hidden="true">晚</span><strong>晚餐</strong><small>简单好做</small></button><button type="button" data-route="recipe:late-night"><span class="meal-time-icon" aria-hidden="true">夜</span><strong>夜宵</strong><small>暖心解馋</small></button></div></section>
    <section class="channel-section channel-list-section"><div class="channel-section-heading"><h2>更多家常菜</h2></div><div class="channel-recipe-list">${data.list.map(([name, desc, meta, image, id, tags]) => `<article data-filter-card data-filter-tags="${tags.join('|')}"><button class="channel-list-hit" type="button" data-route="recipe:${id}"><img src="${image}" width="104" height="78" alt="${name}" loading="lazy"><span><strong>${name}</strong><small>${desc}</small><i>${meta}</i></span></button><div class="channel-list-actions"><button class="channel-favorite" type="button" data-favorite aria-label="收藏${name}" aria-pressed="false"><span class="icon icon-bookmark" aria-hidden="true"></span></button>${channelBasketButton(name, 'recipe')}</div></article>`).join('')}</div></section>`;
}

function squareItemsMarkup(channel) {
  const typeLabel = channel === 'fruit' ? '水果' : '食材';
  return `<div class="channel-square-grid">${homeChannelData[channel].items.map(([name, month, price, image, id, tags]) => `<article class="channel-square-card" data-filter-card data-filter-tags="${tags.join('|')}"><button class="channel-square-hit" type="button" data-route="${channel}:${id}"><img src="${image}" width="164" height="164" alt="${name}" loading="lazy"><span class="channel-square-heading"><strong>${name}</strong><small>${month}</small></span></button><div class="channel-square-purchase"><span>${price}</span>${channelBasketButton(name, channel)}</div></article>`).join('')}</div><p class="channel-price-note">价格仅作日常采购参考，实际以当地为准</p><span class="sr-only">${typeLabel}内容</span>`;
}

function ingredientChannelMarkup() {
  return `${channelFilters('ingredient')}<section class="channel-section"><div class="channel-section-heading"><h2>当季食材</h2><button type="button" data-route="ingredient">查看全部 <span class="icon icon-chevron" aria-hidden="true"></span></button></div>${squareItemsMarkup('ingredient')}</section>
    <section class="channel-section"><div class="channel-section-heading"><h2>今天怎么挑</h2></div><button class="channel-guide" type="button" data-route="guide:tomato"><img src="https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=240&q=82" width="96" height="96" alt="番茄挑选示意" loading="lazy"><span><strong>番茄怎么挑</strong><small>颜色均匀 · 果蒂新鲜 · 手感饱满</small><i>查看挑选方法</i></span><span class="icon icon-chevron" aria-hidden="true"></span></button></section>
    <section class="channel-section"><div class="channel-section-heading"><h2>一材多吃</h2></div><div class="ingredient-recipes"><div class="ingredient-focus"><strong>毛豆</strong><span>清甜脆嫩</span></div><div><button type="button" data-route="recipe:edamame-egg">毛豆炒蛋</button><button type="button" data-route="recipe:edamame-chicken">毛豆鸡丁</button><button type="button" data-route="recipe:cold-edamame">凉拌毛豆</button></div></div></section>`;
}

function fruitChannelMarkup() {
  return `${channelFilters('fruit')}<section class="channel-section"><div class="channel-section-heading"><h2>本月正当季</h2><button type="button" data-route="fruit">查看全部 <span class="icon icon-chevron" aria-hidden="true"></span></button></div>${squareItemsMarkup('fruit')}</section>
    <section class="channel-section"><div class="channel-section-heading"><h2>怎么挑 · 怎么放</h2></div><div class="fruit-knowledge-rail"><button type="button" data-route="guide:peach"><img src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=260&q=82" width="132" height="96" alt="水蜜桃" loading="lazy"><strong>水蜜桃成熟了吗</strong><small>闻果香，轻按有弹性</small></button><button type="button" data-route="guide:grape"><img src="https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=260&q=82" width="132" height="96" alt="葡萄" loading="lazy"><strong>葡萄怎么保存</strong><small>不清洗，冷藏更耐放</small></button><button type="button" data-route="guide:blueberry"><img src="https://images.unsplash.com/photo-1425934398893-310a009a77f9?auto=format&fit=crop&w=260&q=82" width="132" height="96" alt="蓝莓" loading="lazy"><strong>蓝莓看果粉</strong><small>果粉完整更新鲜</small></button></div></section>
    <section class="channel-section"><div class="channel-section-heading"><h2>水果也能入菜</h2></div><div class="fruit-recipe-pair"><button type="button" data-route="recipe:fruit-salad"><img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=420&q=82" width="150" height="112" alt="夏日水果沙拉" loading="lazy"><span><strong>夏日水果沙拉</strong><small>清爽一餐</small></span></button><button type="button" data-route="drink:peach-tea"><img src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=420&q=82" width="150" height="112" alt="蜜桃冷泡茶" loading="lazy"><span><strong>蜜桃冷泡茶</strong><small>果香清甜</small></span></button></div></section>`;
}

function drinkChannelMarkup() {
  const items = homeChannelData.drink.items;
  return `${channelFilters('drink')}<section class="channel-section"><div class="channel-section-heading"><h2>清爽饮品</h2><button type="button" data-route="drink">查看更多 <span class="icon icon-chevron" aria-hidden="true"></span></button></div><div class="channel-drink-rail">${items.map(([name, flavor, image, id, tags]) => `<article data-filter-card data-filter-tags="${tags.join('|')}"><button type="button" data-route="drink:${id}"><img src="${image}" width="132" height="132" alt="${name}" loading="lazy"><strong>${name}</strong><small>${flavor}</small></button>${channelBasketButton(name, 'drink')}</article>`).join('')}</div></section>
    <section class="channel-section"><div class="channel-section-heading"><h2>搭配这一餐</h2></div><div class="drink-pair-list"><button type="button" data-route="drink:pair-lime"><img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=260&q=82" width="96" height="76" alt="凉拌鸡丝与青柠气泡水" loading="lazy"><span><strong>凉拌鸡丝 × 青柠气泡水</strong><small>酸爽清新，适合夏日晚餐</small></span><span class="icon icon-chevron" aria-hidden="true"></span></button><button type="button" data-route="drink:pair-tea"><img src="https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=260&q=82" width="96" height="76" alt="青椒牛肉与冷泡乌龙" loading="lazy"><span><strong>青椒牛肉 × 冷泡乌龙</strong><small>茶香回甘，平衡浓郁口味</small></span><span class="icon icon-chevron" aria-hidden="true"></span></button></div></section>
    <section class="channel-section"><div class="channel-section-heading"><h2>酒水基础</h2></div><div class="wine-basics"><button type="button" data-route="drink:riesling"><strong>雷司令</strong><span>白葡萄酒 · 清爽果香</span><small>适合海鲜与清淡菜</small></button><button type="button" data-route="drink:beer"><strong>小麦啤酒</strong><span>啤酒 · 麦香柔和</span><small>适合烧烤与聚餐</small></button></div></section>
    <section class="channel-section"><button class="mixology-entry" type="button" data-route="drink:mixology"><span><strong>调饮配方</strong><small>鸡尾酒与无酒精调饮 · 跟着步骤轻松制作</small></span><span class="icon icon-chevron" aria-hidden="true"></span></button></section>`;
}

function bindBasketControls(scope) {
  scope.querySelectorAll('.basket-control').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    const key = button.dataset.basketId;
    const added = basketItems.has(key);
    if (added) basketItems.delete(key); else basketItems.add(key);
    persistBasketItems();
    button.classList.toggle('is-added', !added);
    button.setAttribute('aria-pressed', String(!added));
    button.setAttribute('aria-label', `${!added ? '从菜篮移除' : '加入菜篮'}${key.split(':').at(-1)}`);
    updateBasketCount();
    showToast(!added ? `已加入菜篮 · 共${basketItems.size}样` : `已从菜篮移除 · 还剩${basketItems.size}样`);
  }));
}

function applyHomeChannelFilter(scope, label) {
  const cards = [...scope.querySelectorAll('[data-filter-card]')];
  let visibleCount = 0;
  cards.forEach((card) => {
    const visible = card.dataset.filterTags.split('|').includes(label);
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  const status = scope.querySelector('.channel-filter-status');
  const empty = scope.querySelector('.channel-filter-empty');
  if (status) status.textContent = `已显示${label}内容，共${visibleCount}项`;
  if (empty) empty.hidden = visibleCount > 0;
  scope.classList.toggle('is-filter-empty', visibleCount === 0);
}

function renderHomeChannel(channel) {
  const recommendPanel = document.querySelector('#channelPanelRecommend');
  const explorePanel = document.querySelector('#channelPanelExplore');
  const isRecommend = channel === 'recommend';
  recommendPanel.hidden = !isRecommend;
  explorePanel.hidden = isRecommend;
  if (isRecommend) return;
  const renderers = { recipe: recipeChannelMarkup, ingredient: ingredientChannelMarkup, fruit: fruitChannelMarkup, drink: drinkChannelMarkup };
  explorePanel.className = `home-channel-panel channel-explore is-${channel}`;
  explorePanel.setAttribute('aria-labelledby', `homeChannel${channel[0].toUpperCase()}${channel.slice(1)}`);
  explorePanel.innerHTML = renderers[channel]();
  bindRoutes(explorePanel);
  bindImageFallbacks(explorePanel);
  bindBasketControls(explorePanel);
  explorePanel.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); toggleFavorite(button); }));
  const filterButtons = [...explorePanel.querySelectorAll('[data-home-filter]')];
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('[data-home-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    applyHomeChannelFilter(explorePanel, button.dataset.homeFilter);
  }));
  if (filterButtons[0]) applyHomeChannelFilter(explorePanel, filterButtons[0].dataset.homeFilter);
}

const categoryCatalog = {
  recipe: {
    label: '菜谱',
    secondary: ['家常', '快手', '下饭', '汤羹', '早餐', '聚餐'],
    selected: '家常',
    layout: 'recipe',
    items: [
      ['番茄炒蛋', '15分钟 · 简单 · 微酸', 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=420&q=82', ['家常', '快手', '下饭', '早餐']],
      ['清蒸鲈鱼', '20分钟 · 简单 · 鲜香', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=420&q=82', ['家常', '聚餐']],
      ['青椒牛肉', '20分钟 · 中等 · 微辣', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=420&q=82', ['家常', '快手', '下饭']],
      ['冬瓜虾仁汤', '25分钟 · 简单 · 清淡', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=420&q=82', ['家常', '汤羹']],
      ['麻婆豆腐', '20分钟 · 中等 · 麻辣', 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&w=420&q=82', ['家常', '下饭', '聚餐']],
      ['凉拌鸡丝', '15分钟 · 简单 · 微辣', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=420&q=82', ['家常', '快手', '聚餐']]
    ]
  },
  ingredient: {
    label: '食材',
    secondary: ['当季', '叶菜', '根茎', '菌菇', '豆类', '肉禽', '水产'],
    selected: '当季',
    layout: 'grid',
    items: [
      ['毛豆', '6月–8月 · 约¥4.8/斤', 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=420&q=82', ['当季', '豆类']],
      ['丝瓜', '5月–8月 · 约¥3.2/斤', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=420&q=82', ['当季', '叶菜']],
      ['番茄', '5月–9月 · 约¥3.6/斤', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=420&q=82', ['当季', '叶菜']],
      ['茄子', '5月–9月 · 约¥2.8/斤', 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=420&q=82', ['当季', '叶菜']],
      ['香菇', '4月–6月 · 约¥6.8/斤', 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=420&q=82', ['当季', '菌菇']],
      ['鲜虾', '4月–7月 · 约¥18.8/斤', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=420&q=82', ['当季', '水产']]
    ]
  },
  fruit: {
    label: '水果',
    secondary: ['当季', '柑橘', '莓果', '瓜果', '热带', '核果'],
    selected: '当季',
    layout: 'grid',
    items: [
      ['水蜜桃', '6月–8月 · 约¥12.8/斤', 'https://images.unsplash.com/photo-1629828874514-7c7d1a0a1bd7?auto=format&fit=crop&w=420&q=82', ['当季', '核果']],
      ['荔枝', '5月–7月 · 约¥19.8/斤', 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=420&q=82', ['当季', '热带']],
      ['杨梅', '5月–6月 · 约¥18.8/斤', 'https://images.unsplash.com/photo-1599599810694-57a01a3c6d9b?auto=format&fit=crop&w=420&q=82', ['当季', '莓果']],
      ['西瓜', '5月–8月 · 约¥3.8/斤', 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=420&q=82', ['当季', '瓜果']],
      ['葡萄', '6月–9月 · 约¥16.8/斤', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=420&q=82', ['当季', '莓果']],
      ['蓝莓', '4月–6月 · 约¥103/斤', 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=420&q=82', ['当季', '莓果']]
    ]
  },
  drink: {
    label: '饮品',
    secondary: ['茶饮', '咖啡', '果饮', '气泡水', '乳饮', '酒水'],
    selected: '茶饮',
    layout: 'grid',
    items: [
      ['冷泡乌龙', '清香 · 清爽解腻', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=420&q=82', ['茶饮']],
      ['茉莉花茶', '花香 · 温润舒缓', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=420&q=82', ['茶饮']],
      ['柠檬气泡水', '酸甜 · 畅快解渴', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=420&q=82', ['气泡水', '果饮']],
      ['西瓜冰饮', '清甜 · 冰爽解暑', 'https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=420&q=82', ['果饮']],
      ['桂花酸梅汤', '酸甜 · 生津解暑', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=420&q=82', ['果饮']],
      ['鲜榨橙汁', '鲜甜 · 维C满满', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=420&q=82', ['果饮']]
    ],
    alcoholItems: [
      ['梅子酒', '果酒', '12% · 酸甜梅香', 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=360&q=82', ['酒水']],
      ['纯米清酒', '清酒', '15% · 米香清爽', 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=360&q=82', ['酒水']],
      ['伦敦干金酒', '金酒', '40% · 杜松柑橘', 'https://images.unsplash.com/photo-1582819509237-d5b75f20ff76?auto=format&fit=crop&w=360&q=82', ['酒水']],
      ['白朗姆酒', '朗姆酒', '40% · 甘蔗清甜', 'https://images.unsplash.com/photo-1609951651556-5334e2706168?auto=format&fit=crop&w=360&q=82', ['酒水']],
      ['威士忌', '威士忌', '40% · 麦芽木香', 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=360&q=82', ['酒水']],
      ['起泡葡萄酒', '葡萄酒', '11% · 清新果香', 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=360&q=82', ['酒水']]
    ]
  },
  seasoning: {
    label: '调料',
    secondary: ['基础', '香辛', '酱料', '醋类', '油脂', '干货'],
    selected: '基础',
    layout: 'grid',
    items: [
      ['海盐', '细粒 · 300g', 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=420&q=82', ['基础']],
      ['白胡椒', '整粒 · 50g', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=420&q=82', ['基础', '香辛']],
      ['生抽', '酿造 · 500ml', 'https://images.unsplash.com/photo-1582449867628-6f8f9f3c9c33?auto=format&fit=crop&w=420&q=82', ['基础', '酱料']],
      ['香醋', '酿造 · 500ml', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=420&q=82', ['基础', '醋类']],
      ['芝麻油', '压榨 · 250ml', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=420&q=82', ['基础', '油脂']],
      ['花椒', '干花椒 · 50g', 'https://images.unsplash.com/photo-1599909533730-f9d9b0f8a2b7?auto=format&fit=crop&w=420&q=82', ['香辛', '干货']]
    ]
  }
};

let categoryKey = 'recipe';
let categoryQuery = '';
let categoryState = 'idle';
let categoryStateTimer = 0;
let currentView = 'home';
let cookingStepIndex = 0;
let cookingTimerRemaining = 0;
let cookingTimerId = 0;
let cookingTimerRunning = false;
let guidedFlowData = null;
const categoryScrollPositions = new Map();
const basketSeed = ['ingredient:芦笋', 'ingredient:虾仁', 'ingredient:大蒜', 'ingredient:生姜', 'ingredient:番茄', 'ingredient:牛腩', 'ingredient:生菜', 'ingredient:黄瓜', 'ingredient:鸡腿肉', 'ingredient:土豆', 'ingredient:青椒', 'ingredient:香菇'];
const familyBasketDefaults = {
  zhou: basketSeed,
  parents: basketSeed.slice(0, 5),
  grandma: []
};
let storedFamilyBaskets = familyBasketDefaults;
try {
  const parsed = JSON.parse(window.localStorage.getItem('homeBasketItemsByFamily') || 'null');
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) storedFamilyBaskets = { ...familyBasketDefaults, ...parsed };
} catch { storedFamilyBaskets = familyBasketDefaults; }
const familyBasketItems = Object.fromEntries(Object.entries(storedFamilyBaskets).map(([id, items]) => [id, new Set(Array.isArray(items) ? items : [])]));
let basketItems = familyBasketItems.zhou;
const basketFamilies = [
  { id: 'zhou', name: '周家', meta: '4 位成员 · 12 项待采购' },
  { id: 'parents', name: '爸妈家', meta: '3 位成员 · 5 项待采购' },
  { id: 'grandma', name: '奶奶家', meta: '2 位成员 · 菜篮为空' }
];
const familyMembersByFamily = {
  zhou: [
    { id: 'self', name: '小周', note: '', role: 'creator' },
    { id: 'dad', name: '周建国', note: '爸爸', role: 'member' },
    { id: 'mom', name: '刘敏', note: '妈妈', role: 'admin' },
    { id: 'grandma', name: '王秀兰', note: '奶奶', role: 'member' }
  ],
  parents: [
    { id: 'father', name: '周建国', note: '爸爸', role: 'creator' },
    { id: 'self', name: '小周', note: '', role: 'admin' },
    { id: 'mother', name: '刘敏', note: '妈妈', role: 'member' }
  ],
  grandma: [
    { id: 'grandma', name: '王秀兰', note: '奶奶', role: 'creator' },
    { id: 'self', name: '小周', note: '', role: 'member' }
  ]
};
let activeBasketFamily = 'zhou';
let selectedManagedFamilyId = 'zhou';
let mineSubpageParentRoute = '';
let basketViewMode = 'ingredients';
const familyBasketPurchased = { zhou: new Set(['ingredient:番茄', 'ingredient:生姜']), parents: new Set(), grandma: new Set() };
const familyBasketArchived = { zhou: new Set(), parents: new Set(), grandma: new Set() };
let basketPurchased = familyBasketPurchased.zhou;
let basketArchived = familyBasketArchived.zhou;
const basketExpandedRecipes = new Set(['recipe:黄焖鸡米饭']);
const basketPreferences = {
  avoid: [{ member: '妈妈', tags: ['不吃香菜', '少辣'] }, { member: '爸爸', tags: ['不吃肥肉'] }, { member: '奶奶', tags: ['少油'] }],
  like: [{ member: '妈妈', tags: ['喜欢鱼虾'] }, { member: '小周', tags: ['喜欢酸甜口', '喜欢水果'] }, { member: '爸爸', tags: ['喜欢牛肉', '喜欢面食'] }, { member: '奶奶', tags: ['喜欢清蒸', '喜欢软食'] }],
  allergy: [{ member: '奶奶', tags: ['对花生过敏'] }]
};
const basketIngredientRows = [
  { id: 'ingredient:芦笋', name: '芦笋', image: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=260&q=82', source: '来自 2 道菜', quantity: '约 ¥18/斤' },
  { id: 'ingredient:虾仁', name: '虾仁', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=260&q=82', source: '来自 1 道菜', quantity: '约 ¥38/斤' },
  { id: 'ingredient:大蒜', name: '大蒜', image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=260&q=82', source: '来自 3 道菜', quantity: '3瓣 + 2瓣' },
  { id: 'ingredient:生姜', name: '生姜', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=260&q=82', source: '来自 2 道菜', quantity: '3片 + 4片' },
  { id: 'ingredient:番茄', name: '番茄', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=260&q=82', source: '来自 1 道菜', quantity: '约 ¥6/斤' },
  { id: 'ingredient:牛腩', name: '牛腩', image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=260&q=82', source: '来自 1 道菜', quantity: '500g' },
  { id: 'ingredient:生菜', name: '生菜', image: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=260&q=82', source: '来自 1 道菜', quantity: '1颗' },
  { id: 'ingredient:黄瓜', name: '黄瓜', image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=260&q=82', source: '来自 1 道菜', quantity: '1根' },
  { id: 'ingredient:鸡腿肉', name: '鸡腿肉', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=260&q=82', source: '来自 1 道菜', quantity: '约 ¥16/斤' },
  { id: 'ingredient:土豆', name: '土豆', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=260&q=82', source: '来自 1 道菜', quantity: '约 ¥3.2/斤' },
  { id: 'ingredient:青椒', name: '青椒', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=260&q=82', source: '来自 1 道菜', quantity: '2个' },
  { id: 'ingredient:香菇', name: '香菇', image: 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=260&q=82', source: '来自 1 道菜', quantity: '100g' }
];
const basketRecipeGroups = [
  { id: 'recipe:黄焖鸡米饭', name: '黄焖鸡米饭', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=160&q=82', ingredients: [['ingredient:鸡腿肉', '鸡腿肉', '500g'], ['ingredient:土豆', '土豆', '2个 · 约300g'], ['ingredient:青椒', '青椒', '2个'], ['ingredient:香菇', '香菇', '100g'], ['ingredient:葱', '葱', '2根']] },
  { id: 'recipe:番茄鸡蛋汤', name: '番茄鸡蛋汤', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=160&q=82', ingredients: [['ingredient:番茄', '番茄', '2个'], ['ingredient:鸡蛋', '鸡蛋', '3个'], ['ingredient:葱', '葱', '1根'], ['ingredient:香油', '香油', '少许']] },
  { id: 'recipe:可乐鸡翅', name: '可乐鸡翅', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=160&q=82', ingredients: [['ingredient:鸡翅', '鸡翅', '8个'], ['ingredient:可乐', '可乐', '1听'], ['ingredient:生姜', '生姜', '3片'], ['ingredient:生抽', '生抽', '2勺'], ['ingredient:葱', '葱', '1根']] },
  { id: 'recipe:清炒时蔬', name: '清炒时蔬', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=160&q=82', ingredients: [['ingredient:生菜', '生菜', '1颗'], ['ingredient:蒜', '蒜', '2瓣'], ['ingredient:海盐', '海盐', '少许'], ['ingredient:芝麻油', '芝麻油', '少许']] }
];
const familyRecipeGroups = { zhou: basketRecipeGroups, parents: basketRecipeGroups.slice(0, 2), grandma: [] };

function activateBasketFamily(id) {
  activeBasketFamily = id;
  basketItems = familyBasketItems[id] || (familyBasketItems[id] = new Set());
  basketPurchased = familyBasketPurchased[id] || (familyBasketPurchased[id] = new Set());
  basketArchived = familyBasketArchived[id] || (familyBasketArchived[id] = new Set());
}

function activeBasketRows() {
  const visibleKnownRows = basketIngredientRows.filter((row) => basketItems.has(row.id));
  const knownIds = new Set(visibleKnownRows.map((row) => row.id));
  const addedRows = getBasketEntries().filter((entry) => !knownIds.has(entry.basketKey)).map((entry) => ({
    id: entry.basketKey,
    name: entry.item[0],
    image: entry.image,
    source: '单独加入',
    quantity: entry.meta?.split(' · ').at(-1) || '待确认数量'
  }));
  return [...visibleKnownRows, ...addedRows].filter((row) => !basketArchived.has(row.id));
}

function activeBasketRecipes() {
  return familyRecipeGroups[activeBasketFamily] || [];
}

const feedTemplates = [
  (batch) => `<section class="section loaded-section feed-recipes" aria-labelledby="feedRecipes${batch}"><div class="section-heading"><h2 id="feedRecipes${batch}">继续发现</h2></div><div class="recipe-grid"><button class="grid-recipe" type="button" data-route="recipe:ginger-chicken-${batch}"><img src="https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=420&q=80" width="170" height="128" alt="姜葱鸡饭" loading="lazy"><strong>姜葱鸡饭</strong><span>咸鲜温润 · 30 分钟</span></button><button class="grid-recipe" type="button" data-route="recipe:vegetable-noodle-${batch}"><img src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=420&q=80" width="170" height="128" alt="时蔬拌面" loading="lazy"><strong>时蔬拌面</strong><span>爽口省时 · 18 分钟</span></button></div></section>`,
  (batch) => `<section class="section loaded-section feed-guide" aria-labelledby="feedGuide${batch}"><div class="section-heading"><h2 id="feedGuide${batch}">今天怎么挑</h2><button class="text-action" type="button" data-route="guide">查看更多 <span class="icon icon-chevron" aria-hidden="true"></span></button></div><button class="feed-guide-card knowledge-card" type="button" data-route="guide:tomato-${batch}"><img class="knowledge-image" src="https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&w=300&q=80" width="128" height="128" alt="成熟番茄" loading="lazy"><span class="knowledge-copy"><span class="knowledge-eyebrow">挑选指南</span><strong>番茄</strong><span class="knowledge-summary">看果肩，拿起来有分量</span></span></button></section>`,
  (batch) => `<section class="section loaded-section feed-ingredient" aria-labelledby="feedIngredient${batch}"><div class="section-heading"><h2 id="feedIngredient${batch}">食材灵感</h2></div><button class="ingredient-panel knowledge-card" type="button" data-route="ingredient:winter-melon-${batch}"><img class="knowledge-image" src="https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=300&q=80" width="128" height="128" alt="新鲜冬瓜" loading="lazy"><span class="knowledge-copy"><span class="knowledge-eyebrow">当季食材</span><strong>冬瓜</strong><span class="knowledge-summary">清蒸、煮汤都清爽</span></span></button></section>`,
  (batch) => `<section class="section loaded-section feed-drinks" aria-labelledby="feedDrinks${batch}"><div class="section-heading"><h2 id="feedDrinks${batch}">顺手配一杯</h2><button class="text-action" type="button" data-route="drink">更多饮品 <span class="icon icon-chevron" aria-hidden="true"></span></button></div><div class="drink-rail"><button type="button" data-route="drink:plum-${batch}"><img src="https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=260&q=80" width="104" height="104" alt="冰镇酸梅汤" loading="lazy"><strong>冰镇酸梅汤</strong></button><button type="button" data-route="drink:peach-tea-${batch}"><img src="https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=260&q=80" width="104" height="104" alt="白桃冷泡茶" loading="lazy"><strong>白桃冷泡茶</strong></button><button type="button" data-route="drink:cucumber-${batch}"><img src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=260&q=80" width="104" height="104" alt="黄瓜青柠水" loading="lazy"><strong>黄瓜青柠水</strong></button></div></section>`
];

function setActiveHeroSlide(index) {
  heroIndex = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => {
    const active = slideIndex === heroIndex;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
  });
  heroDots.forEach((dot, dotIndex) => {
    const active = dotIndex === heroIndex;
    dot.classList.toggle('is-active', active);
    if (active) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
  });
  heroTitle.textContent = heroSlides[heroIndex].dataset.title;
  heroMeta.textContent = heroSlides[heroIndex].dataset.meta;
}

function setHeroChannel(channel) {
  const slides = homeHeroData[channel] || homeHeroData.recommend;
  const channelNames = { recommend: '推荐', recipe: '菜谱', ingredient: '食材', fruit: '水果', drink: '饮品' };
  stopHeroAutoplay();
  heroCarousel.dataset.channel = channel;
  heroSlides.forEach((slide, index) => {
    const [title, meta, image, alt] = slides[index % slides.length];
    slide.src = image;
    slide.alt = alt;
    slide.dataset.title = title;
    slide.dataset.meta = meta;
  });
  document.querySelector('.hero').setAttribute('aria-label', `${channelNames[channel] || '推荐'}频道 Banner`);
  setActiveHeroSlide(0);
  startHeroAutoplay();
}

function stopHeroAutoplay() { window.clearInterval(heroTimer); heroTimer = 0; }

function startHeroAutoplay() {
  stopHeroAutoplay();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return;
  heroTimer = window.setInterval(() => setActiveHeroSlide(heroIndex + 1), 5600);
}

function showToast(message, { actionLabel = '', onAction = null } = {}) {
  window.clearTimeout(toastTimer);
  toast.replaceChildren(document.createTextNode(message));
  if (actionLabel && typeof onAction === 'function') {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'toast-action';
    action.textContent = actionLabel;
    action.addEventListener('click', () => {
      window.clearTimeout(toastTimer);
      toast.classList.remove('is-visible');
      onAction();
    }, { once: true });
    toast.append(action);
  }
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), actionLabel ? 8000 : 1800);
}

function setScrolledState(scrolled) { root.classList.toggle('is-scrolled', scrolled); }

function updateScrollState() {
  scrollFrame = 0;
  const current = Math.max(0, window.scrollY);
  const delta = current - lastScrollY;
  scrollDirection = delta > 0 ? 'down' : delta < 0 ? 'up' : 'idle';
  if (current <= 32) setScrolledState(false);
  else if (current > 96 && scrollDirection === 'down') setScrolledState(true);
  else if (scrollDirection === 'up' && Math.abs(delta) >= 24) setScrolledState(false);
  const detailView = document.querySelector('#detailView');
  if (detailView?.classList.contains('is-recipe-detail') && !detailView.hidden) {
    const contentTop = detailView.querySelector('.detail-content')?.getBoundingClientRect().top ?? Infinity;
    const lockTop = detailView.querySelector('.detail-sheet-cap')?.getBoundingClientRect().top ?? 116;
    detailView.classList.toggle('is-sheet-locked', contentTop <= lockTop);
  } else {
    detailView?.classList.remove('is-sheet-locked');
  }
  lastScrollY = current;
}

function toggleFavorite(button) {
  const selected = button.getAttribute('aria-pressed') === 'true';
  button.setAttribute('aria-pressed', String(!selected));
  showToast(selected ? '已取消收藏' : '已加入收藏');
}

const workflowMeta = {
  search: '搜索',
  'family-create': '创建家庭',
  'scan-family': '扫一扫加入',
  'join-family': '确认加入',
  'personal-preferences': '我的口味',
  'my-recipe': '菜谱管理',
  login: '登录',
  'phone-login': '手机号登录',
  register: '注册账号',
  'forgot-password': '找回密码',
  'purchase-detail': '采购详情',
  notifications: '消息与提醒',
  gathering: '家庭聚餐'
};
let workflowRoute = '';
let workflowContext = {};
let workflowStack = [];
let workflowReturnFocus = null;
const avatarUploadTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const avatarUploadMaxBytes = 5 * 1024 * 1024;

function applyAvatarFile(input, preview, resetButton) {
  const file = input.files?.[0];
  if (!file) return;
  if (!avatarUploadTypes.has(file.type)) {
    input.value = '';
    showToast('请选择 JPG、PNG 或 WebP 图片');
    return;
  }
  if (file.size > avatarUploadMaxBytes) {
    input.value = '';
    showToast('图片不能超过 5MB');
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    preview.innerHTML = `<img src="${reader.result}" width="88" height="88" alt="新头像预览">`;
    resetButton.hidden = false;
    showToast('头像预览已更新，保存后生效');
  }, { once: true });
  reader.readAsDataURL(file);
}

function resetAvatarPreview(preview, resetButton, input) {
  const defaultImage = preview.dataset.avatarDefaultImage;
  const defaultText = preview.dataset.avatarDefaultText || '家';
  preview.innerHTML = defaultImage ? `<img src="${defaultImage}" width="88" height="88" alt="原头像">` : defaultText;
  input.value = '';
  resetButton.hidden = true;
  showToast(defaultImage ? '已恢复原头像' : '已恢复文字头像');
}

function workflowIcon(name) {
  return `<img src="https://api.iconify.design/ph/${name}.svg?color=%237a8b6f" width="24" height="24" alt="" loading="lazy">`;
}

function workflowRecipeRow(id, name, note, image, type = 'recipe') {
  return `<button class="workflow-result-row" type="button" data-route="${type}:${id}"><img src="${image}" width="72" height="72" alt="${name}" loading="lazy"><span><strong>${name}</strong><small>${note}</small></span><i class="mine-chevron" aria-hidden="true"></i></button>`;
}

function searchWorkflowMarkup(query = '') {
  const safeQuery = escapeFamilyText(query);
  const hasQuery = Boolean(query);
  const hasNoResult = hasQuery && /^(没有结果|不存在|火星菜|xyz)$/i.test(query.trim());
  const searchField = `<form class="workflow-search" data-workflow-search role="search"><span class="icon icon-search" aria-hidden="true"></span><input name="query" value="${safeQuery}" autocomplete="off" aria-label="搜索内容" placeholder="搜索菜谱、食材、水果、饮品"><button type="submit">搜索</button></form>`;
  if (hasNoResult) {
    return `${searchField}<section class="workflow-search-no-result">${workflowIcon('magnifying-glass')}<h2>没有找到“${safeQuery}”</h2><p>换个名称试试，或从菜谱、食材、水果和饮品频道继续浏览。</p><button class="workflow-secondary" type="button" data-search-keyword="时令食材">看看时令食材</button></section>`;
  }
  return `${searchField}${hasQuery ? `<section class="workflow-search-summary"><strong>“${safeQuery}”的结果</strong><span>共 8 项</span></section><div class="workflow-filter-chips" role="tablist" aria-label="搜索结果类型"><button class="is-active" type="button" role="tab">全部</button><button type="button" role="tab">菜谱</button><button type="button" role="tab">食材</button><button type="button" role="tab">水果</button><button type="button" role="tab">饮品</button></div><section class="workflow-result-list">${workflowRecipeRow('tomato-beef', '番茄炖牛腩', '菜谱 · 45 分钟 · 适中', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=260&q=82')}${workflowRecipeRow('tomato', '番茄', '食材 · 当季 · 约 ¥3.6/斤', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=260&q=82', 'ingredient')}${workflowRecipeRow('peach-tea', '蜜桃冷泡茶', '饮品 · 清爽回甘', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=260&q=82', 'drink')}</section>` : `<section class="workflow-search-empty"><div>${workflowIcon('clock-counter-clockwise')}</div><h2>最近搜索</h2><div class="workflow-history"><button type="button" data-search-keyword="番茄">番茄</button><button type="button" data-search-keyword="清蒸鱼">清蒸鱼</button><button type="button" data-search-keyword="夏日饮品">夏日饮品</button></div><h2>大家都在找</h2><div class="workflow-history is-hot"><button type="button" data-search-keyword="快手晚餐">快手晚餐</button><button type="button" data-search-keyword="时令水果">时令水果</button><button type="button" data-search-keyword="家庭聚餐">家庭聚餐</button></div></section>`}`;
}

function familyCreateMarkup() {
  return `<form class="workflow-form" data-family-create-form><section class="workflow-intro"><div>${workflowIcon('house-line')}</div><h2>建一个家人的共享空间</h2><p>创建后会生成家庭二维码，家人扫一扫即可加入。</p></section><label><span>家庭名称</span><input name="familyName" value="周家" maxlength="12" required><small>建议使用家人熟悉的称呼</small></label><fieldset class="workflow-avatar-fieldset"><legend>家庭头像</legend><div class="avatar-upload-row"><div class="avatar-upload-preview" data-family-avatar-preview data-avatar-default-text="周">周</div><div class="avatar-upload-copy"><label class="avatar-upload-button">上传图片<input type="file" accept="image/jpeg,image/png,image/webp" data-family-avatar-input></label><button type="button" class="avatar-reset-button" data-family-avatar-reset hidden>恢复文字头像</button><small>JPG、PNG 或 WebP；建议正方形且不小于 512×512px；不超过 5MB。上传后自动居中裁切。</small></div></div><div class="avatar-preset-label">或使用文字头像</div><div class="workflow-avatar-options"><button class="is-selected" type="button" aria-pressed="true" data-family-avatar-text="周">周</button><button type="button" aria-pressed="false" data-family-avatar-text="家">家</button><button type="button" aria-pressed="false" data-family-avatar-text="厨">厨</button></div></fieldset><button class="workflow-primary" type="submit">创建家庭</button></form>`;
}

function scanFamilyMarkup() {
  return `<section class="scanner-panel"><div class="scanner-frame" aria-label="二维码扫描区域"><i></i><i></i><i></i><i></i><span></span></div><h2>扫描家庭二维码</h2><p>将家人的家庭码放入框内，即可查看并加入家庭。</p><button class="workflow-primary" type="button" data-scan-success>模拟识别二维码</button><button class="workflow-text-action" type="button" data-scan-album>从相册选择二维码</button><div class="workflow-permission-note">相机权限被关闭时，可前往系统设置开启，或从相册选择二维码。</div></section>`;
}

function joinFamilyMarkup() {
  return `<section class="join-family-card"><div class="workflow-family-avatar">爸</div><h2>爸妈家</h2><p>3 位成员 · 创建者：爸爸</p><div class="join-member-stack"><span>爸</span><span>妈</span><span>周</span></div><div class="workflow-notice">加入后可以共同查看菜篮、采购进度和家庭口味。你的个人信息仍由你决定是否共享。</div><button class="workflow-primary" type="button" data-confirm-join>确认加入家庭</button><button class="workflow-text-action" type="button" data-workflow-back>暂不加入</button></section>`;
}

function personalPreferencesMarkup() {
  const groups = [
    ['喜欢吃的', 'like', ['牛肉', '清蒸鱼', '菌菇', '酸甜口']],
    ['不吃或少吃', 'avoid', ['香菜', '肥肉', '太辣', '动物内脏']],
    ['过敏信息', 'allergy', ['花生', '虾蟹', '乳制品', '芒果']]
  ];
  return `<section class="workflow-preferences"><div class="workflow-compact-note">这些信息会在家庭采购和做饭时提醒。是否共享，可在“隐私与家庭共享”中调整。</div>${groups.map(([title, key, tags], groupIndex) => `<fieldset><legend>${title}</legend><div class="workflow-tag-grid">${tags.map((tag, index) => `<button type="button" data-preference-tag="${key}:${tag}" aria-pressed="${groupIndex < 2 && index < 2}">${tag}</button>`).join('')}<button class="is-add" type="button" data-add-preference="${key}">＋ 自定义</button></div></fieldset>`).join('')}<button class="workflow-primary" type="button" data-save-preferences>保存口味</button></section>`;
}

function myRecipeMarkup(id = 'tomato-beef') {
  const shared = id !== 'tomato-beef';
  const title = id === 'steamed-fish' ? '清蒸鲈鱼' : id === 'shrimp-egg' ? '虾仁滑蛋' : '番茄炖牛腩';
  const image = id === 'steamed-fish' ? 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=780&q=84' : id === 'shrimp-egg' ? 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=780&q=84' : 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=780&q=84';
  return `<article class="workflow-owned-recipe"><button class="owned-recipe-preview" type="button" data-route="recipe:${id}"><img src="${image}" width="361" height="270" alt="${title}" loading="lazy"><span>预览菜谱</span></button><h2>${title}</h2><p>最近更新：2026 年 7 月 15 日</p><section class="workflow-visibility"><div><strong>可见范围</strong><small>${shared ? '周家成员可以看到这道菜谱' : '只有自己可以看到这道菜谱'}</small></div><button type="button" role="switch" aria-checked="${shared}" data-recipe-share>${shared ? '已共享' : '仅自己'}</button></section><div class="workflow-action-list"><button type="button" data-edit-owned-recipe>${workflowIcon('pencil-simple')}<span><strong>编辑菜谱</strong><small>修改图片、食材和制作步骤</small></span><i class="mine-chevron" aria-hidden="true"></i></button><button type="button" data-duplicate-recipe>${workflowIcon('copy')}<span><strong>复制一份</strong><small>保留原菜谱并创建副本</small></span><i class="mine-chevron" aria-hidden="true"></i></button><button class="is-danger" type="button" data-delete-owned-recipe>${workflowIcon('trash')}<span><strong>删除菜谱</strong><small>删除后无法恢复</small></span></button></div></article>`;
}

function authMarkup(route) {
  const configs = {
    login: ['欢迎回来', '登录后与家人共享菜篮和口味', '继续使用手机号', 'phone-login'],
    'phone-login': ['手机号登录', '验证码将发送到你的手机', '获取验证码', 'register'],
    register: ['注册账号', '用手机号创建你的个人资料', '完成注册', 'login'],
    'forgot-password': ['找回账号', '验证手机号后重新设置登录方式', '发送验证码', 'login']
  };
  const [title, note, action, next] = configs[route];
  return `<form class="workflow-auth" data-auth-form><div class="auth-mark">家</div><h2>${title}</h2><p>${note}</p><label><span>手机号</span><input name="phone" inputmode="tel" autocomplete="tel" placeholder="请输入手机号" required></label>${route !== 'login' ? '<label><span>验证码</span><span class="auth-code-field"><input name="code" inputmode="numeric" placeholder="6 位验证码" required><button type="button" data-send-code>发送验证码</button></span></label>' : ''}<button class="workflow-primary" type="submit">${action}</button><button class="workflow-text-action" type="button" data-route="auth:${next}">${route === 'login' ? '注册新账号' : '返回登录'}</button>${route === 'login' ? '<button class="workflow-text-action is-muted" type="button" data-route="auth:forgot-password">忘记密码</button>' : ''}<label class="auth-consent"><input type="checkbox" checked>我已阅读并同意服务协议与隐私政策</label></form>`;
}

function purchaseDetailMarkup() {
  const items = [['番茄', '2 斤', '¥7.2'], ['虾仁', '500g', '¥19'], ['生姜', '1 块', '¥1.5'], ['青椒', '4 个', '¥4.8'], ['牛腩', '1 斤', '¥42']];
  return `<section class="purchase-detail"><header><span>已完成</span><h2>7 月 12 日采购</h2><p>周家 · 小周完成采购</p></header><div class="purchase-summary"><span><strong>8</strong><small>采购项</small></span><span><strong>¥86.4</strong><small>参考总价</small></span></div><section class="purchase-items">${items.map(([name, amount, price]) => `<div><span><strong>${name}</strong><small>${amount}</small></span><em>${price}</em></div>`).join('')}</section><p class="workflow-footnote">价格为当时记录，仅作日常采购参考。</p><button class="workflow-primary" type="button" data-repurchase>再次加入周家菜篮</button></section>`;
}

function notificationsMarkup() {
  const rows = [
    ['meal', '开饭了', '周家管理员提醒大家可以开饭了', '刚刚', 'gathering:family-dinner'],
    ['basket', '菜篮有新内容', '妈妈加入了番茄、鸡蛋等 3 项食材', '20 分钟前', 'purchase:detail'],
    ['family', '新成员加入', '奶奶已通过家庭码加入周家', '昨天', 'family:manage'],
    ['activity', '七月时令食材更新', '水蜜桃、毛豆和冬瓜进入当季推荐', '7 月 12 日', 'seasonal']
  ];
  return `<section class="notification-feed"><div class="notification-feed-tools"><button type="button" data-route="notification:settings">提醒设置</button><button type="button" data-read-all>全部已读</button></div>${rows.map(([icon, title, note, time, route], index) => `<button class="notification-feed-row${index < 2 ? ' is-unread' : ''}" type="button" data-route="${route}"><span class="notification-feed-icon">${workflowIcon(icon === 'meal' ? 'bell-ringing' : icon === 'basket' ? 'basket' : icon === 'family' ? 'users-three' : 'leaf')}</span><span><strong>${title}</strong><small>${note}</small><time>${time}</time></span></button>`).join('')}<button class="workflow-secondary" type="button" data-route="gathering:new">创建家庭聚餐</button></section>`;
}

function gatheringMarkup() {
  return `<form class="gathering-editor" data-gathering-form><section class="gathering-hero"><span>周家</span><h2>周末家庭聚餐</h2><p>7 月 19 日 周日 · 18:30 开饭</p></section><section class="gathering-members"><div class="workflow-section-heading"><strong>参与成员</strong><button type="button" data-edit-attendance>4 人参加</button></div><div class="join-member-stack"><span>周</span><span>爸</span><span>妈</span><span>奶</span></div></section><section class="gathering-preference-summary"><div class="workflow-section-heading"><strong>本次口味提醒</strong><button type="button" data-route="family:preferences">查看全部</button></div><div><span>忌口 4</span><span>过敏 1</span><span>喜欢 7</span></div><p>妈妈不吃香菜；奶奶对花生过敏；爸爸偏爱牛肉。</p></section><label><span>聚餐备注</span><textarea rows="3" placeholder="例如：需要提前准备儿童餐">准备 6 人份晚餐，18:30 开饭</textarea></label><button class="workflow-primary" type="submit">保存聚餐</button><button class="workflow-secondary" type="button" data-meal-ready>发送“开饭了”提醒</button></form>`;
}

function renderWorkflow(route, context = {}) {
  const view = document.querySelector('#workflowView');
  const content = view.querySelector('[data-workflow-content]');
  const title = view.querySelector('[data-workflow-title]');
  workflowRoute = route;
  workflowContext = context;
  title.textContent = workflowMeta[route] || '功能页面';
  if (route === 'search') content.innerHTML = searchWorkflowMarkup(context.query || '');
  else if (route === 'family-create') content.innerHTML = familyCreateMarkup();
  else if (route === 'scan-family') content.innerHTML = scanFamilyMarkup();
  else if (route === 'join-family') content.innerHTML = joinFamilyMarkup();
  else if (route === 'personal-preferences') content.innerHTML = personalPreferencesMarkup();
  else if (route === 'my-recipe') content.innerHTML = myRecipeMarkup(context.id);
  else if (['login', 'phone-login', 'register', 'forgot-password'].includes(route)) content.innerHTML = authMarkup(route);
  else if (route === 'purchase-detail') content.innerHTML = purchaseDetailMarkup();
  else if (route === 'notifications') content.innerHTML = notificationsMarkup();
  else if (route === 'gathering') content.innerHTML = gatheringMarkup();
  bindRoutes(content);
  bindImageFallbacks(content);
  view.scrollTop = 0;
}

function showWorkflow(route, context = {}, { replace = false } = {}) {
  const view = document.querySelector('#workflowView');
  if (view.hidden) {
    workflowReturnFocus = document.activeElement;
    workflowStack = [];
  } else if (!replace && workflowRoute) {
    workflowStack.push({ route: workflowRoute, context: workflowContext });
  }
  renderWorkflow(route, context);
  view.hidden = false;
  document.body.classList.add('is-workflow-open');
  view.querySelector('[data-workflow-back]')?.focus();
}

function hideWorkflow() {
  const view = document.querySelector('#workflowView');
  if (workflowStack.length) {
    const previous = workflowStack.pop();
    renderWorkflow(previous.route, previous.context);
    return;
  }
  view.hidden = true;
  document.body.classList.remove('is-workflow-open');
  workflowRoute = '';
  workflowReturnFocus?.focus?.();
}

function closeWorkflowCompletely() {
  if (document.querySelector('#workflowView').hidden) return;
  workflowStack = [];
  hideWorkflow();
}

function openCategoryListing(type, secondary = '') {
  const keyMap = { seasonal: 'ingredient', guide: 'fruit' };
  const nextKey = keyMap[type] || type;
  if (!categoryCatalog[nextKey]) return;
  closeWorkflowCompletely();
  closeDetailView();
  categoryKey = nextKey;
  categoryQuery = '';
  categoryState = 'idle';
  const catalog = categoryCatalog[categoryKey];
  const nextSecondary = secondary && catalog.secondary.includes(secondary) ? secondary : catalog.secondary[0];
  catalog.selected = nextSecondary;
  const input = document.querySelector('#categorySearchInput');
  if (input) input.value = '';
  document.querySelectorAll('[data-clear-category-search]').forEach((button) => { button.hidden = true; });
  activateTab('category');
  renderCategory();
  document.querySelector('#categoryContent').scrollTop = 0;
  document.querySelector(`#category-tab-${categoryKey}`)?.focus();
}

function handleRoute(route) {
  const [type, id] = route.split(':');
  if (type === 'scan') {
    showWorkflow('scan-family');
    return;
  }
  if (type === 'search') { showWorkflow('search', { query: id ? decodeURIComponent(id) : '' }); return; }
  if (type === 'auth') { showWorkflow(id || 'login'); return; }
  if (type === 'preference' && id === 'personal') { showWorkflow('personal-preferences'); return; }
  if (type === 'my-recipe' && id) { showWorkflow('my-recipe', { id }); return; }
  if (type === 'family' && id === 'create') { showWorkflow('family-create'); return; }
  if (type === 'purchase' && id === 'detail') { showWorkflow('purchase-detail'); return; }
  if (type === 'notification' && id === 'settings') {
    closeWorkflowCompletely();
    showMineSubpage('notification:all');
    return;
  }
  if (type === 'notification') { showWorkflow('notifications'); return; }
  if (type === 'gathering') { showWorkflow('gathering', { id }); return; }
  if (!id && ['seasonal', 'recipe', 'ingredient', 'fruit', 'guide', 'drink', 'seasoning'].includes(type)) {
    openCategoryListing(type);
    return;
  }
  if (type === 'recipe' && id === 'mine-all') {
    closeWorkflowCompletely();
    showMineRecipeList();
    return;
  }
  if (type === 'recipe' && id === 'create') {
    closeWorkflowCompletely();
    showRecipeCreate();
    return;
  }
  if (['recipe', 'ingredient', 'fruit', 'drink', 'seasoning'].includes(type) && id) {
    closeWorkflowCompletely();
    showDetailView(type, id);
    return;
  }
  if (mineSubpageMeta[route]) {
    closeWorkflowCompletely();
    const currentSubpage = document.querySelector('#mineSubpageView')?.dataset.route;
    showMineSubpage(route, { parentRoute: currentSubpage === 'family:members' ? 'family:members' : '' });
    return;
  }
  const names = { seasonal: '时令果蔬', recipe: '菜谱', ingredient: '食材', fruit: '水果', guide: '挑选指南', drink: '饮品', notification: '消息与提醒', profile: '个人资料', privacy: '隐私与共享', family: '家庭', purchase: '采购记录', draft: '草稿箱', favorite: '收藏', history: '最近浏览', account: '账号与安全', settings: '更多设置', about: '关于产品' };
  showToast(`${names[type] || '内容'}：${id || '全部'}`);
}

const recipeIngredients = [
  ['鲈鱼', '1 条 · 约 600g', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=260&q=82'],
  ['生姜', '1 小块', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=260&q=82'],
  ['小葱', '2 根', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=260&q=82'],
  ['红椒', '少许', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=260&q=82'],
  ['蒸鱼豉油', '2 勺', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=260&q=82'],
  ['料酒', '1 勺', 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=260&q=82'],
  ['食用油', '1 勺', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=260&q=82'],
  ['盐', '少许', 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=260&q=82'],
  ['白胡椒', '少许', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=260&q=82'],
  ['柠檬', '2 片', 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=260&q=82'],
  ['香菜', '少许', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=260&q=82'],
  ['清水', '适量', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=260&q=82']
];

function recipeIngredientPanel() {
  const cards = recipeIngredients.map(([name, amount, image], index) => {
    const photo = index < 12
      ? `<span class="detail-ingredient-photo ingredient-photo-${index + 1}" role="img" aria-label="${name}"></span>`
      : `<img src="${image}" width="80" height="80" alt="${name}" loading="lazy">`;
    return `<article class="detail-ingredient-card">${photo}<strong>${name}</strong><span>${amount}</span></article>`;
  }).join('');
  return `<section class="detail-ingredient-panel" aria-label="食材清单"><div class="detail-ingredient-grid">${cards}</div></section>`;
}

function recipeDiscoveryPanel() {
  const similarRecipes = [
    ['葱油多宝鱼', '25 分钟 · 简单', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=420&q=82'],
    ['豉汁蒸鱼', '30 分钟 · 简单', 'https://images.unsplash.com/photo-1535007813616-79dcafa70a11?auto=format&fit=crop&w=420&q=82'],
    ['柠檬烤鱼', '35 分钟 · 简单', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=420&q=82']
  ];
  const bassRecipes = [
    ['香煎鲈鱼', '20 分钟 · 简单', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=220&q=82'],
    ['鲈鱼豆腐汤', '35 分钟 · 简单', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=220&q=82'],
    ['番茄鲈鱼', '30 分钟 · 简单', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=220&q=82']
  ];
  const drinks = [
    ['青柠气泡水', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=260&q=82'],
    ['冷泡乌龙', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=260&q=82'],
    ['青梅饮', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=260&q=82']
  ];
  const heading = (title, section) => `<div class="detail-discovery-heading"><h2>${title}</h2><button type="button" data-detail-discovery-more="${section}">查看更多</button></div>`;
  return `<div class="detail-discovery" aria-label="继续发现">
    <section class="detail-discovery-section" aria-labelledby="detailSimilarTitle">${heading('<span id="detailSimilarTitle">相似菜谱</span>', '相似菜谱')}<div class="detail-similar-rail">${similarRecipes.map(([name, meta, image]) => `<button type="button" class="detail-similar-card" data-detail-discovery="${name}"><img src="${image}" width="154" height="154" alt="${name}" loading="lazy"><span><strong>${name}</strong><small>${meta}</small></span></button>`).join('')}</div></section>
    <section class="detail-discovery-section" aria-labelledby="detailBassTitle">${heading('<span id="detailBassTitle">鲈鱼还能这样做</span>', '同食材菜谱')}<div class="detail-ingredient-recipes">${bassRecipes.map(([name, meta, image]) => `<button type="button" class="detail-ingredient-recipe" data-detail-discovery="${name}"><img src="${image}" width="64" height="64" alt="${name}" loading="lazy"><span><strong>${name}</strong><small>${meta}</small></span></button>`).join('')}</div></section>
    <section class="detail-discovery-section" aria-labelledby="detailDrinkTitle">${heading('<span id="detailDrinkTitle">适合搭配的饮品</span>', '饮品搭配')}<div class="detail-drink-rail">${drinks.map(([name, image]) => `<button type="button" class="detail-drink-card" data-detail-discovery="${name}"><img src="${image}" width="104" height="104" alt="${name}" loading="lazy"><strong>${name}</strong></button>`).join('')}</div></section>
    <button type="button" class="detail-discovery-more" data-detail-discovery-more="更多菜谱">继续发现更多菜谱</button>
  </div>`;
}

function ingredientRelatedRecipesPanel(ingredientName) {
  return `<section class="ingredient-related-recipes" aria-labelledby="ingredientRelatedTitle"><h2 id="ingredientRelatedTitle">${ingredientName}可以这样做</h2><div class="ingredient-related-rail"><button type="button" class="ingredient-related-card" data-route="recipe:tomato-egg"><img src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=420&q=82" width="132" height="132" loading="lazy" alt="番茄炒蛋"><span><strong>番茄炒蛋</strong><small>15 分钟 · 简单</small></span></button><button type="button" class="ingredient-related-card" data-route="recipe:tomato-beef"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=420&q=82" width="132" height="132" loading="lazy" alt="番茄炖牛腩"><span><strong>番茄炖牛腩</strong><small>90 分钟 · 适中</small></span></button><button type="button" class="ingredient-related-card" data-route="recipe:tomato-soup"><img src="https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=420&q=82" width="132" height="132" loading="lazy" alt="番茄虾仁汤"><span><strong>番茄虾仁汤</strong><small>25 分钟 · 简单</small></span></button><button type="button" class="ingredient-related-card is-more" data-detail-ingredient-more><span><strong>更多${ingredientName}菜谱</strong><small>继续查看</small></span></button></div></section>`;
}

function fruitRelatedRecipesPanel(fruitName) {
  return `<section class="fruit-related-recipes" aria-labelledby="fruitRelatedTitle"><h2 id="fruitRelatedTitle">${fruitName}可以这样吃</h2><div class="fruit-related-rail"><button type="button" class="fruit-related-card" data-route="recipe:peach-yogurt"><img src="https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=420&q=82" width="132" height="132" loading="lazy" alt="水蜜桃酸奶碗"><span><strong>蜜桃酸奶碗</strong><small>早餐 · 8 分钟</small></span></button><button type="button" class="fruit-related-card" data-route="drink:peach-tea"><img src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=420&q=82" width="132" height="132" loading="lazy" alt="水蜜桃冷泡茶"><span><strong>蜜桃冷泡茶</strong><small>饮品 · 清爽</small></span></button><button type="button" class="fruit-related-card" data-route="drink:peach-soda"><img src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=420&q=82" width="132" height="132" loading="lazy" alt="水蜜桃气泡饮"><span><strong>蜜桃气泡饮</strong><small>饮品 · 10 分钟</small></span></button><button type="button" class="fruit-related-card is-more" data-detail-fruit-more><span><strong>更多${fruitName}吃法</strong><small>继续查看</small></span></button></div></section>`;
}

function drinkFlavorPanel(profile) {
  return `<div class="drink-flavor-profile">${profile.flavors.map(([name, value, note]) => `<article><div><strong>${name}</strong><span>${value}</span></div><p>${note}</p></article>`).join('')}</div>`;
}

function drinkPairingPanel(profile) {
  return `<div class="drink-pairing-list">${profile.pairings.map(([name, note, image, route]) => `<button type="button" data-route="${route}"><img src="${image}" width="72" height="72" loading="lazy" alt="${name}"><span><strong>${name}</strong><small>${note}</small></span></button>`).join('')}</div>`;
}

function drinkMethodPanel(profile) {
  return `<div class="drink-method-panel"><div class="drink-method-ingredients">${profile.ingredients.map(([name, amount]) => `<span><strong>${name}</strong><small>${amount}</small></span>`).join('')}</div><ol class="drink-method-steps">${profile.steps.map(([title, copy], index) => `<li><i>${String(index + 1).padStart(2, '0')}</i><span><strong>${title}</strong><small>${copy}</small></span></li>`).join('')}</ol></div>`;
}

function drinkPanels(profile) {
  return [drinkFlavorPanel(profile), drinkPairingPanel(profile), drinkMethodPanel(profile)];
}

function buildDrinkDetail(profile) {
  return {
    typeLabel: '饮品', name: profile.name, image: profile.image, subtitle: profile.subtitle,
    info: profile.info, tabs: ['风味', '搭餐', '做法'], active: 0,
    panels: drinkPanels(profile), body: '', basketTarget: 'ingredients', action: 'default'
  };
}

const drinkProfiles = {
  oolong: {
    name: '冷泡乌龙', image: 'https://images.unsplash.com/photo-1537401198317-1231361cbd5f?auto=format&fit=crop&w=900&q=84', subtitle: '兰花香清透，回甘干净',
    info: [['8 小时', '制作时长'], ['4–8°C', '适饮温度'], ['中等', '咖啡因']],
    flavors: [['香气', '兰花 · 烘焙', '闻起来清雅，不抢餐食风味'], ['口感', '清爽 · 回甘', '入口轻盈，尾韵微甜'], ['甜度', '无糖', '可按口味加入少量蜂蜜']],
    pairings: [['清蒸鲈鱼', '鲜味轻盈，茶香不压味', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=240&q=82', 'recipe:bass'], ['凉拌时蔬', '清爽解腻，适合夏日晚餐', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=240&q=82', 'recipe:salad']],
    ingredients: [['乌龙茶叶', '8g'], ['冷水', '500ml'], ['冰块', '按需']], steps: [['投茶注水', '茶叶放入冷泡壶，加入冷水。'], ['冷藏浸泡', '密封冷藏 6–8 小时。'], ['过滤饮用', '滤去茶叶，饮用前加冰。']]
  },
  lime: {
    name: '青柠气泡水', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=84', subtitle: '酸香轻快，气泡清爽',
    info: [['5 分钟', '制作时长'], ['4–8°C', '适饮温度'], ['可调', '甜度']],
    flavors: [['香气', '青柠 · 薄荷', '清新明亮'], ['口感', '轻盈 · 气泡', '适合餐前或解腻'], ['甜度', '微甜', '糖量可以自由调整']],
    pairings: [['香煎鸡排', '酸香平衡油脂感', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=240&q=82', 'recipe:chicken'], ['番茄沙拉', '清新酸甜更协调', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=240&q=82', 'recipe:salad']],
    ingredients: [['青柠', '1 个'], ['气泡水', '300ml'], ['冰块', '适量']], steps: [['处理青柠', '切片并轻压释放香气。'], ['加入冰块', '杯中加入冰块和青柠。'], ['倒入气泡水', '沿杯壁缓慢倒入，轻轻搅匀。']]
  },
  watermelon: {
    name: '西瓜冰饮', image: 'https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?auto=format&fit=crop&w=900&q=84', subtitle: '果香充足，夏日清甜',
    info: [['10 分钟', '制作时长'], ['4–8°C', '适饮温度'], ['少冰', '建议']],
    flavors: [['香气', '西瓜 · 清甜', '成熟果香自然'], ['口感', '多汁 · 轻盈', '入口清爽不厚重'], ['甜度', '自然甜', '无需额外加糖']],
    pairings: [['凉拌鸡丝', '清爽适合聚餐', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=240&q=82', 'recipe:chicken-salad'], ['番茄意面', '果甜平衡酸味', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=240&q=82', 'recipe:pasta']],
    ingredients: [['西瓜', '300g'], ['青柠汁', '5ml'], ['冰块', '少量']], steps: [['切块去籽', '西瓜切小块并去籽。'], ['搅打', '与青柠汁一起搅打。'], ['冷饮', '加入少量冰块即可。']]
  },
  americano: {
    name: '冰美式', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=84', subtitle: '烘焙香明显，干净利落',
    info: [['5 分钟', '制作时长'], ['4–8°C', '适饮温度'], ['较高', '咖啡因']],
    flavors: [['香气', '坚果 · 可可', '中深烘焙香气'], ['口感', '清苦 · 干净', '冰镇后更利落'], ['酸度', '中低', '适合日常饮用']],
    pairings: [['早餐三明治', '咸香与咖啡更平衡', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=240&q=82', 'recipe:sandwich'], ['香蕉燕麦', '自然甜味柔化苦感', 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=240&q=82', 'recipe:oatmeal']],
    ingredients: [['浓缩咖啡', '2 份'], ['冷水', '180ml'], ['冰块', '适量']], steps: [['装杯', '杯中加入冷水和冰块。'], ['萃取咖啡', '萃取双份浓缩咖啡。'], ['混合', '将咖啡倒入杯中即可。']]
  },
  jasmine: {
    name: '茉莉热茶', image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=900&q=84', subtitle: '花香柔和，温润清甜',
    info: [['6 分钟', '冲泡时长'], ['55–65°C', '适饮温度'], ['中等', '咖啡因']],
    flavors: [['香气', '茉莉 · 鲜叶', '花香自然不闷'], ['口感', '柔和 · 清甜', '热饮更显温润'], ['浓度', '清淡', '避免久泡产生涩感']],
    pairings: [['桂花糕', '花香相互衬托', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=240&q=82', 'recipe:cake'], ['清蒸点心', '温和不抢味', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=240&q=82', 'recipe:dimsum']],
    ingredients: [['茉莉花茶', '5g'], ['热水', '300ml']], steps: [['温杯', '用热水温热杯具。'], ['冲泡', '85°C 左右热水冲泡。'], ['出汤', '约 2 分钟后滤出茶汤。']]
  },
  'pour-over': {
    name: '手冲咖啡', image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=84', subtitle: '香气层次清晰，口感明亮',
    info: [['4 分钟', '冲煮时长'], ['60–70°C', '适饮温度'], ['较高', '咖啡因']],
    flavors: [['香气', '柑橘 · 焦糖', '层次清晰明亮'], ['口感', '顺滑 · 回甜', '降温后甜感更明显'], ['酸度', '中等', '适合浅中烘焙豆']],
    pairings: [['黄油吐司', '香气饱满不腻', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=240&q=82', 'recipe:toast'], ['坚果酸奶', '酸甜和烘焙香协调', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=240&q=82', 'recipe:yogurt']],
    ingredients: [['咖啡豆', '15g'], ['热水', '240ml']], steps: [['研磨铺粉', '研磨至细砂糖粗细并铺平。'], ['闷蒸', '注入 30ml 热水，等待 30 秒。'], ['分段注水', '缓慢注水至 240ml。']]
  }
};

function mixedDrinkIngredientPanel(profile) {
  return `<div class="mixed-drink-recipe"><div class="mixed-drink-ingredient-grid">${profile.ingredients.map(([category, name, amount, image]) => `<article><img src="${image}" width="74" height="74" loading="lazy" alt="${name}"><span><small>${category}</small><strong>${name}</strong><em>${amount}</em></span></article>`).join('')}</div><dl class="mixed-drink-tools"><div><dt>杯型</dt><dd>${profile.glassware}</dd></div><div><dt>冰型</dt><dd>${profile.ice}</dd></div><div><dt>技法</dt><dd>${profile.technique}</dd></div><div><dt>工具</dt><dd>${profile.tools.join(' · ')}</dd></div></dl>${profile.alcoholic ? '<aside class="mixed-drink-warning"><strong>理性饮酒</strong><span>未成年人请勿饮酒，饮酒后请勿驾车。</span></aside>' : '<p class="mixed-drink-zero-note">无酒精配方，适合家庭聚餐与日常佐餐。</p>'}</div>`;
}

function mixedDrinkStepPanel(profile) {
  return `<ol class="mixed-drink-step-list">${profile.steps.map((step, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><img src="${step.image}" width="92" height="74" loading="lazy" alt="${step.alt}"><div><strong>${step.title}</strong><p>${step.copy}</p>${step.minutes ? `<small>约 ${step.minutes} 分钟</small>` : ''}</div></li>`).join('')}</ol>`;
}

function mixedDrinkTipPanel(profile) {
  return `<div class="mixed-drink-tips"><article><small>替换建议</small><strong>${profile.substitution[0]}</strong><p>${profile.substitution[1]}</p></article><article><small>口味调整</small><strong>${profile.adjustment[0]}</strong><p>${profile.adjustment[1]}</p></article><article><small>避免失败</small><strong>${profile.failure[0]}</strong><p>${profile.failure[1]}</p></article></div>`;
}

function mixedDrinkPanels(profile) {
  return [mixedDrinkIngredientPanel(profile), mixedDrinkStepPanel(profile), mixedDrinkTipPanel(profile)];
}

function buildMixedDrinkDetail(profile) {
  return {
    typeLabel: profile.alcoholic ? '鸡尾酒' : '无酒精调饮',
    name: profile.name,
    image: profile.image,
    subtitle: profile.subtitle,
    info: profile.alcoholic
      ? [['含酒精', '类型'], [`${profile.abv}%vol`, '酒精度'], [`${profile.duration} 分钟`, '制作时间']]
      : [['无酒精', '类型'], [profile.sweetness, '甜度'], [`${profile.duration} 分钟`, '制作时间']],
    tabs: ['配方', '步骤', '小贴士'],
    active: 0,
    panels: mixedDrinkPanels(profile),
    body: '',
    alcoholic: profile.alcoholic,
    isAlcohol: profile.alcoholic,
    action: 'mixology',
    basketTarget: 'ingredients',
    guidedSteps: profile.steps
  };
}

const mixedDrinkProfiles = {
  'gin-tonic': {
    name: '金汤力', alcoholic: true, abv: 10, duration: 5, sweetness: '清爽偏干',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=84',
    subtitle: '杜松清香，青柠明亮，气泡干净',
    glassware: '高球杯', ice: '大冰块', technique: '直调', tools: ['量酒器', '吧勺'],
    ingredients: [
      ['基酒', '伦敦干金酒', '45ml', 'https://images.unsplash.com/photo-1582819509237-d5b75f20ff76?auto=format&fit=crop&w=240&q=82'],
      ['辅料', '汤力水', '120ml', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=240&q=82'],
      ['冰块', '大冰块', '装满杯', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=240&q=82'],
      ['装饰', '青柠', '1 角', 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=240&q=82']
    ],
    steps: [
      { title: '预冷装冰', minutes: 1, image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=84', alt: '高球杯中装满大冰块', copy: '高球杯装满大冰块，轻搅数圈后滤掉融水。', tip: '杯子和冰块足够冷，成品的气泡会更持久。' },
      { title: '加入金酒', minutes: 1, image: 'https://images.unsplash.com/photo-1582819509237-d5b75f20ff76?auto=format&fit=crop&w=900&q=84', alt: '用量酒器量取金酒', copy: '量取 45ml 金酒，沿冰块缓慢倒入杯中。', tip: '使用量酒器能稳定酒精度和风味比例。' },
      { title: '兑入汤力水', minutes: 2, videoDuration: '00:12', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=84', alt: '沿杯壁倒入汤力水', copy: '沿杯壁加入 120ml 冰镇汤力水，用吧勺轻提一次。', tip: '不要来回搅拌，避免气泡过快流失。' },
      { title: '青柠增香', minutes: 1, image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=900&q=84', alt: '用青柠角装饰金汤力', copy: '挤压青柠皮释放香气，再将青柠角放入杯中。', tip: '只需轻挤果皮，避免过多果汁盖住杜松香。' }
    ],
    substitution: ['没有汤力水', '可换成无糖气泡水，并加入 5ml 蜂蜜糖浆平衡苦味。'],
    adjustment: ['想更清爽', '金酒减至 35ml，汤力水增加至 140ml。'],
    failure: ['保留气泡', '汤力水要充分冰镇，最后加入并只轻搅一次。']
  },
  'citrus-fizz': {
    name: '柑橘气泡饮', alcoholic: false, duration: 6, sweetness: '微甜',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=84',
    subtitle: '柑橘酸香，薄荷清凉，适合全家分享',
    glassware: '高球杯', ice: '大冰块', technique: '直调', tools: ['量杯', '吧勺'],
    ingredients: [
      ['基酒', '无酒精柑橘基底', '60ml', 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=240&q=82'],
      ['辅料', '气泡水', '120ml', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=240&q=82'],
      ['冰块', '大冰块', '装满杯', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=240&q=82'],
      ['装饰', '薄荷与橙片', '各 1 份', 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=240&q=82']
    ],
    steps: [
      { title: '唤醒薄荷', minutes: 1, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=84', alt: '手掌轻拍新鲜薄荷', copy: '薄荷在掌心轻拍一次，让香气自然释放。', tip: '不要用力捣碎，避免产生青草苦味。' },
      { title: '加入柑橘基底', minutes: 2, image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=900&q=84', alt: '向装冰的杯中加入柑橘汁', copy: '杯中装满冰块，倒入 60ml 柑橘基底。', tip: '基底提前冷藏，成品不会被融冰稀释。' },
      { title: '补满气泡水', minutes: 2, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=84', alt: '向杯中缓慢加入气泡水', copy: '沿杯壁缓慢加入气泡水，用吧勺轻提混合。', tip: '动作越轻，气泡保留得越完整。' },
      { title: '装饰完成', minutes: 1, image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=900&q=84', alt: '用橙片和薄荷装饰气泡饮', copy: '放入橙片和薄荷，闻到清香后即可饮用。', tip: '聚餐时可提前备好基底，饮用前再加气泡水。' }
    ],
    substitution: ['没有柑橘基底', '可用橙汁 40ml、青柠汁 10ml 和蜂蜜 5ml 调和。'],
    adjustment: ['想更低糖', '蜂蜜减半，并使用无糖气泡水。'],
    failure: ['避免发苦', '柑橘皮不要长时间浸泡，薄荷只轻拍不捣碎。']
  }
};

function drinkRelatedDiscoveryPanel(drinkName, isAlcohol) {
  const drinks = [['金汤力', '杜松清香 · 含酒精', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=360&q=82', 'drink:gin-tonic'], ['柑橘气泡饮', '微甜清爽 · 无酒精', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=360&q=82', 'drink:citrus-fizz'], ['冷泡乌龙', '兰花香 · 回甘', 'https://images.unsplash.com/photo-1537401198317-1231361cbd5f?auto=format&fit=crop&w=360&q=82', 'drink:oolong']];
  const recipes = [['清蒸鲈鱼', '鲜味轻盈，适合搭配', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=220&q=82', 'recipe:bass'], ['凉拌时蔬', '清爽解腻', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=220&q=82', 'recipe:salad']];
  return `<section class="drink-discovery" aria-label="${drinkName}继续发现">${isAlcohol ? '<p class="drink-responsible-note"><strong>理性饮酒</strong><span>未成年人请勿饮酒，饮酒后请勿驾车。</span></p>' : ''}<div class="detail-discovery-heading"><h2>相似饮品</h2><button type="button" data-detail-drink-more>查看更多</button></div><div class="drink-related-rail">${drinks.map(([name, note, image, route]) => `<button type="button" class="drink-related-card" data-route="${route}"><img src="${image}" width="132" height="132" loading="lazy" alt="${name}"><span><strong>${name}</strong><small>${note}</small></span></button>`).join('')}</div><div class="detail-discovery-heading"><h2>适合搭配的菜谱</h2></div><div class="drink-recipe-pairings">${recipes.map(([name, note, image, route]) => `<button type="button" data-route="${route}"><img src="${image}" width="64" height="64" loading="lazy" alt="${name}"><span><strong>${name}</strong><small>${note}</small></span></button>`).join('')}</div></section>`;
}

const seasoningProfiles = {
  海盐: {
    name: '海盐', image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=900&q=84', subtitle: '颗粒干净，适合日常基础调味',
    info: [['天然海盐', '品类'], ['约5g/茶匙', '用量换算'], ['阴凉密封', '保存']],
    uses: [['炒菜', '1–2g', '出锅前少量加入'], ['汤羹', '2–3g', '分次尝味后补充'], ['腌制', '5g/每500g', '与香料一起抹匀']],
    amounts: [['日常炒菜', '1–2g', '每500g食材'], ['清汤', '2–3g', '每1L汤'], ['肉类腌制', '5g', '每500g肉']],
    caution: '高钠调味品，家中有控盐需求时建议先减量三分之一。',
    substitutes: [['低钠盐', '1:1', '咸度接近，钠含量相对更低'], ['生抽', '盐量减半', '同时增加酱香和颜色'], ['味噌', '1:1.5', '适合汤羹，风味更浓']],
    recipes: [['盐焗鸡翅', '咸香入味', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=320&q=82'], ['海盐烤南瓜', '香甜软糯', 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=320&q=82'], ['清炖排骨', '汤清肉鲜', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=320&q=82']]
  },
  白胡椒: {
    name: '白胡椒', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=84', subtitle: '辛香温和，适合汤羹与去腥',
    info: [['香辛料', '品类'], ['约2g/茶匙', '用量换算'], ['密封避光', '保存']],
    uses: [['汤羹', '0.5–1g', '出锅前撒入'], ['肉类去腥', '1g/每500g', '腌制时加入'], ['蘸料', '少许', '现磨后更香']],
    amounts: [['清汤', '0.5g', '每1L汤'], ['肉馅', '1g', '每500g肉'], ['炒菜', '0.3–0.5g', '每500g食材']],
    caution: '辛香较明显，儿童餐和清淡口味建议减半使用。',
    substitutes: [['黑胡椒', '1:0.7', '香气更浓、辣感更直接'], ['姜粉', '1:1', '去腥合适，但没有胡椒香'], ['花椒粉', '1:0.3', '麻香明显，仅适合部分菜式']],
    recipes: [['胡椒猪肚汤', '暖香浓郁', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=320&q=82'], ['白胡椒虾', '鲜香微辛', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=320&q=82'], ['奶油蘑菇汤', '柔和顺滑', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=320&q=82']]
  },
  生抽: {
    name: '生抽', image: 'https://images.unsplash.com/photo-1582449867628-6f8f9f3c9c33?auto=format&fit=crop&w=900&q=84', subtitle: '酱香咸鲜，日常提味',
    info: [['酿造酱油', '品类'], ['约15ml/汤匙', '用量换算'], ['开封后冷藏', '保存']],
    uses: [['凉拌', '10ml', '2–3人份，拌匀后再尝味'], ['炒菜', '10–15ml', '每500g食材，出锅前加入'], ['腌制', '15–20ml', '每500g肉，腌约15分钟']],
    amounts: [['凉拌菜', '10ml', '2–3人份'], ['炒蔬菜', '10–15ml', '每500g食材'], ['肉类腌制', '15–20ml', '每500g肉']],
    caution: '生抽本身含盐，使用后请减少额外食盐；控钠人群建议选低钠款。',
    substitutes: [['味极鲜', '1:1', '鲜味更突出，咸度接近'], ['蒸鱼豉油', '1:1', '略甜，适合蒸鱼和凉拌'], ['老抽', '1:0.3', '颜色更深，需另补少量盐']],
    recipes: [['葱油拌面', '酱香顺滑', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=320&q=82'], ['青椒牛肉', '鲜香下饭', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=320&q=82'], ['清蒸鲈鱼', '鲜味清爽', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=320&q=82']]
  },
  香醋: {
    name: '香醋', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=84', subtitle: '酸香柔和，适合凉拌与蘸食',
    info: [['酿造食醋', '品类'], ['约15ml/汤匙', '用量换算'], ['阴凉密封', '保存']],
    uses: [['凉拌', '10–15ml', '与生抽按1:1调匀'], ['蘸食', '5–10ml', '按每人一小碟'], ['糖醋汁', '20ml', '最后沿锅边加入']],
    amounts: [['凉拌菜', '10–15ml', '2–3人份'], ['蘸饺子', '5ml', '每人'], ['糖醋菜', '20ml', '每500g食材']],
    caution: '酸度会随加热减弱，想保留醋香可在出锅前再加少量。',
    substitutes: [['米醋', '1:1', '酸味更干净、颜色更浅'], ['陈醋', '1:0.8', '酸香更厚重'], ['柠檬汁', '1:1', '清新但缺少酿造香']],
    recipes: [['凉拌木耳', '酸香爽脆', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=320&q=82'], ['糖醋排骨', '酸甜浓郁', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=320&q=82'], ['酸辣汤', '开胃暖胃', 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=320&q=82']]
  },
  芝麻油: {
    name: '芝麻油', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=84', subtitle: '坚果香浓，少量即可增香',
    info: [['香味油', '品类'], ['约5ml/茶匙', '用量换算'], ['避光密封', '保存']],
    uses: [['凉拌', '3–5ml', '最后拌入保留香气'], ['汤羹', '2–3ml', '关火后滴入'], ['馅料', '5ml', '每500g馅料']],
    amounts: [['凉拌菜', '3–5ml', '2–3人份'], ['汤羹', '2–3ml', '每1L汤'], ['肉馅', '5ml', '每500g馅']],
    caution: '香气浓且不耐久炒，建议作为收尾调味，不替代日常烹调油。',
    substitutes: [['熟芝麻', '1汤匙', '有芝麻香但油润感较弱'], ['花生油', '1:1', '坚果香不同，适合热菜'], ['核桃油', '1:1', '香气柔和，适合凉拌']],
    recipes: [['麻酱拌面', '浓香顺滑', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=320&q=82'], ['凉拌鸡丝', '清爽鲜香', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=320&q=82'], ['紫菜蛋花汤', '清淡暖胃', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=320&q=82']]
  },
  花椒: {
    name: '花椒', image: 'https://images.unsplash.com/photo-1599909533730-f9d9b0f8a2b7?auto=format&fit=crop&w=900&q=84', subtitle: '麻香清亮，适合爆香和去腥',
    info: [['香辛料', '品类'], ['约3g/茶匙', '用量换算'], ['密封避光', '保存']],
    uses: [['热油爆香', '1–2g', '小火出香后捞出'], ['炖肉去腥', '2–3g', '每500g肉'], ['花椒粉', '少许', '出锅后按口味撒入']],
    amounts: [['炒菜', '1–2g', '每500g食材'], ['炖肉', '2–3g', '每500g肉'], ['蘸料', '0.5g', '2–3人份']],
    caution: '麻味容易累积，第一次使用建议从半量开始。',
    substitutes: [['青花椒', '1:0.8', '麻感更清新'], ['花椒油', '1茶匙', '适合收尾，香气更直接'], ['藤椒油', '1茶匙', '清香更明显、麻感更柔和']],
    recipes: [['麻婆豆腐', '麻辣鲜香', 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=320&q=82'], ['椒盐鲜虾', '酥香微麻', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=320&q=82'], ['花椒鸡', '麻香下饭', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=320&q=82']]
  }
};

function seasoningPanels(profile) {
  return [
    `<div class="seasoning-usage-list">${profile.uses.map(([scene, amount, note]) => `<article><div><strong>${scene}</strong><span>${note}</span></div><b>${amount}</b></article>`).join('')}</div><p class="seasoning-safety-note">${profile.caution}</p>`,
    `<div class="seasoning-amount-list">${profile.amounts.map(([scene, amount, basis]) => `<article><span><strong>${scene}</strong><small>${basis}</small></span><b>${amount}</b></article>`).join('')}</div><p class="seasoning-safety-note">用量先少后多，尝味后再补，避免一次加入过量。</p>`,
    `<div class="seasoning-substitute-list">${profile.substitutes.map(([name, ratio, note]) => `<article><span><strong>${name}</strong><small>${note}</small></span><b>${ratio}</b></article>`).join('')}</div>`
  ];
}

function buildSeasoningDetail(profile) {
  return { typeLabel: '调料', ...profile, tabs: ['怎么用', '用多少', '可替代'], active: 0, panels: seasoningPanels(profile), body: '', basketTarget: 'product', action: 'default' };
}

function seasoningRelatedRecipesPanel(data) {
  return `<section class="seasoning-related-recipes" aria-labelledby="seasoningRelatedTitle"><div class="detail-discovery-heading"><h2 id="seasoningRelatedTitle">用${data.name}做什么</h2><button type="button" data-detail-seasoning-more>查看更多</button></div><div class="seasoning-related-rail">${data.recipes.map(([name, copy, image]) => `<button type="button" class="seasoning-related-card" data-detail-discovery="${name}"><img src="${image}" width="132" height="132" loading="lazy" alt="${name}"><span><strong>${name}</strong><small>${copy}</small></span></button>`).join('')}</div></section>`;
}

const selectionGuideProfiles = {
  番茄: [
    ['看颜色', '果皮自然均匀，避开青肩和明显裂口。', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=240&q=80'],
    ['看果蒂', '果蒂鲜绿紧实，不干枯、不发黑。', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=240&q=80'],
    ['掂重量', '同样大小，选拿起来更有分量的。', 'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=240&q=80']
  ],
  水蜜桃: [
    ['看底色', '底色自然、红晕均匀，避开青硬和明显碰伤。', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=240&q=80'],
    ['闻果香', '成熟果靠近果蒂有自然甜香，没有酒味或酸味。', 'https://images.unsplash.com/photo-1595743825637-cdafc8ad4173?auto=format&fit=crop&w=240&q=80'],
    ['轻按果肩', '果肩微弹即可，不要反复按压柔软的果腹。', 'https://images.unsplash.com/photo-1629828874514-c1e5107b7a5d?auto=format&fit=crop&w=240&q=80']
  ],
  芦笋: [['看笋尖', '笋尖闭合紧实，不散开、不发黏。'], ['看颜色', '茎秆鲜绿有光泽，切口不干裂。'], ['试手感', '轻折根部有脆感，茎秆挺直不发软。']],
  虾仁: [['看颜色', '颜色自然透亮，避免异常发白或颜色过深。'], ['闻气味', '只有轻微海鲜味，没有刺鼻氨味。'], ['摸弹性', '虾仁完整有弹性，表面不黏手。']],
  大蒜: [['看蒜皮', '外皮干燥完整，没有霉斑和黑点。'], ['掂重量', '同样大小选更沉实的，水分更足。'], ['按蒜瓣', '蒜瓣饱满坚实，不空软、不发芽。']],
  生姜: [['看表皮', '表皮完整自然，没有霉点和明显皱缩。'], ['摸硬度', '姜块结实饱满，按压不发软。'], ['闻气味', '姜香自然清晰，没有酸味或异味。']],
  牛腩: [['看纹理', '肥瘦相间、筋膜分布均匀，适合久炖。'], ['看颜色', '肉色自然红润，脂肪呈乳白色。'], ['摸表面', '表面微干不黏手，按压后能回弹。']],
  生菜: [['看叶片', '叶片挺括舒展，边缘没有大片黄斑。'], ['看菜心', '菜心紧实鲜嫩，没有腐烂和水伤。'], ['看切口', '根部切口新鲜，不发黑、不渗水。']],
  黄瓜: [['看表皮', '颜色自然、有细小刺点，避免明显黄斑。'], ['摸硬度', '瓜身挺直硬实，两端不发软。'], ['掂重量', '同样大小选更有分量的，水分更足。']],
  鸡腿肉: [['看颜色', '肉色自然粉红，脂肪呈淡黄色或乳白色。'], ['摸弹性', '按压后能快速回弹，表面不黏手。'], ['闻气味', '只有自然肉味，没有酸味和异味。']],
  土豆: [['看表皮', '表皮完整干燥，没有大片青色和黑斑。'], ['看芽眼', '芽眼浅且没有发芽，避免明显萌芽。'], ['摸硬度', '薯块结实，不发软、不皱缩。']],
  青椒: [['看颜色', '颜色均匀有光泽，没有大块暗斑。'], ['看果蒂', '果蒂鲜绿，切口不干枯发黑。'], ['按果身', '果身饱满硬挺，按压有弹性。']],
  香菇: [['看菌盖', '菌盖完整厚实，边缘向内微卷。'], ['看菌褶', '菌褶颜色自然整齐，没有发黑黏连。'], ['闻香气', '有自然菌菇香，没有酸味和霉味。']]
};

function selectionGuideItems(name) {
  const image = basketIngredientRows.find((row) => row.name === name)?.image || detailData?.ingredient?.image || '';
  return (selectionGuideProfiles[name] || [['看外观', '颜色自然完整，没有明显碰伤和霉斑。'], ['摸手感', '质地新鲜有弹性，不发软、不黏手。'], ['闻气味', '气味自然清新，没有酸味或其他异味。']]).map(([title, copy, itemImage]) => ({ title, copy, image: itemImage || image }));
}

const detailData = {
  recipe: {
    typeLabel: '菜谱', name: '清蒸鲈鱼', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=84', subtitle: '家常菜 · 30 分钟 · 简单 · 2–3 人',
    info: [['简单', '难度'], ['2–3 人', '份量'], ['周家 · 1 人忌辣', '家庭提醒']], tabs: ['食材', '步骤', '小贴士'], active: 0,
    body: recipeIngredientPanel(),
    panels: [
      recipeIngredientPanel(),
      `<div class="detail-section-heading"><h2>烹饪步骤</h2><span>共 5 步</span></div><ol class="detail-step-list"><li class="has-media"><div class="detail-step-index"><span>01</span><i aria-hidden="true"></i></div><div class="detail-step-content"><button type="button" class="detail-step-visual" data-detail-step-media="查看处理鲈鱼图片"><img src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=360&q=82" width="116" height="88" loading="lazy" alt="清理并擦干鲈鱼"></button><div><strong>处理鲈鱼</strong><p>清理鱼鳞、鱼鳃和腹部黑膜，冲洗后擦干水分。</p></div></div></li><li><div class="detail-step-index"><span>02</span><i aria-hidden="true"></i></div><div class="detail-step-content"><div><strong>腌制去腥</strong><p>放入姜片和葱段，静置 10 分钟。</p></div><button type="button" class="detail-step-timer" data-detail-timer="10">◷ 10 分钟</button></div></li><li class="has-media"><div class="detail-step-index"><span>03</span><i aria-hidden="true"></i></div><div class="detail-step-content"><button type="button" class="detail-step-visual" data-detail-step-media="查看上锅蒸制图片"><img src="https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=360&q=82" width="116" height="88" loading="lazy" alt="鲈鱼放入蒸锅蒸制"></button><div><strong>上锅蒸制</strong><p>水开后上锅，大火蒸 8 分钟。</p><button type="button" class="detail-step-timer" data-detail-timer="8">◷ 8 分钟</button></div></div></li><li class="has-media"><div class="detail-step-index"><span>04</span><i aria-hidden="true"></i></div><div class="detail-step-content"><button type="button" class="detail-step-visual is-video" data-detail-step-media="播放淋油调味视频"><img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=360&q=82" width="116" height="88" loading="lazy" alt="为蒸好的鲈鱼淋豉油和热油的视频封面"><span class="detail-step-play" aria-hidden="true">▷</span><small>00:18</small></button><div><strong>淋油调味</strong><p>倒掉蒸汁，加入蒸鱼豉油，淋上热油。</p></div></div></li><li><div class="detail-step-index"><span>05</span><i aria-hidden="true"></i></div><div class="detail-step-content"><div><strong>完成装盘</strong><p>撒上葱丝，趁热食用。</p></div></div></li></ol>`,
      `<div class="detail-section-heading"><h2>小贴士</h2><span>3 条</span></div><div class="detail-tip-list"><p><strong>鱼要擦干</strong><span>减少腥味，也能让成品口感更紧实。</span></p><p><strong>水开再上锅</strong><span>快速锁住鲜味，避免鱼肉蒸老。</span></p><p><strong>忌辣提醒</strong><span>周家有 1 人忌辣，红椒可不放或分盘添加。</span></p></div>`
    ],
    action: 'recipe'
  },
  ingredient: {
    typeLabel: '食材', name: '番茄', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=84', subtitle: '酸甜多汁，家常百搭',
    info: [['5月–9月', '当季'], ['约¥3–5/斤', '本地参考'], ['7月', '最近更新']], tabs: ['怎么挑', '怎么放', '怎么吃'], active: 0,
    panels: [
      `<div class="detail-guide-cards"><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="颜色均匀的成熟番茄"><div><strong>看颜色</strong><p>果皮自然均匀，避开青肩和明显裂口。</p></div></article><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="果蒂鲜绿的番茄"><div><strong>看果蒂</strong><p>果蒂鲜绿紧实，不干枯、不发黑。</p></div></article><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="拿在手中判断重量的番茄"><div><strong>掂重量</strong><p>同样大小，选拿起来更有分量的。</p></div></article></div>`,
      `<div class="detail-guide-cards"><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="室温放置的番茄"><div><strong>室温催熟</strong><p>未熟番茄放阴凉通风处 1–2 天。</p></div></article><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="冷藏保存的成熟番茄"><div><strong>冷藏短存</strong><p>成熟后冷藏 3–5 天，食用前回温。</p></div></article><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="切开的番茄"><div><strong>切开后</strong><p>密封冷藏，并在 24 小时内吃完。</p></div></article></div>`,
      `<div class="detail-eat-note"><strong>生吃或熟吃都合适</strong><p>生吃清爽，熟吃更浓郁；胃敏感时建议加热后食用。</p></div>`
    ],
    body: '', action: 'default'
  },
  fruit: {
    typeLabel: '水果', name: '水蜜桃', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=84', subtitle: '清甜多汁，柔软有香气',
    info: [['6月–8月', '时令'], ['约¥10–15/斤', '参考价格'], ['常温催熟', '保存提示']], tabs: ['怎么挑', '成熟度', '怎么放'], active: 0,
    panels: [
      `<div class="detail-guide-cards"><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="底色自然且红晕均匀的水蜜桃"><div><strong>看底色</strong><p>底色自然、红晕均匀，避开青硬和明显碰伤。</p></div></article><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1595743825637-cdafc8ad4173?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="靠近果蒂闻水蜜桃香气"><div><strong>闻果香</strong><p>成熟果靠近果蒂有自然甜香，没有酒味或酸味。</p></div></article><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1629828874514-c1e5107b7a5d?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="轻按水蜜桃果肩判断弹性"><div><strong>轻按果肩</strong><p>果肩微弹即可，不要反复按压柔软的果腹。</p></div></article></div>`,
      `<div class="fruit-ripeness"><div class="fruit-ripeness-track" aria-hidden="true"><i></i><i class="is-current"></i><i></i></div><div class="fruit-ripeness-stages"><article><strong>偏生</strong><span>果身偏硬、香气淡</span><small>常温放 1–2 天</small></article><article class="is-current"><strong>正好</strong><span>果肩微弹、甜香明显</span><small>现在吃，香甜多汁</small></article><article><strong>熟软</strong><span>整体柔软、汁水充足</span><small>冷藏并在 1 天内吃完</small></article></div></div>`,
      `<div class="detail-guide-cards"><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="未熟水蜜桃常温保存"><div><strong>未熟</strong><p>放在阴凉通风处，避免密封和阳光直晒。</p></div></article><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1595743825637-cdafc8ad4173?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="成熟水蜜桃包纸冷藏"><div><strong>已熟</strong><p>单个包纸后冷藏，减少挤压和水分流失。</p></div></article><article class="detail-guide-card"><img src="https://images.unsplash.com/photo-1629828874514-c1e5107b7a5d?auto=format&fit=crop&w=240&q=80" width="88" height="88" loading="lazy" alt="切开的水蜜桃密封冷藏"><div><strong>切开后</strong><p>密封冷藏，并在 24 小时内吃完。</p></div></article></div>`
    ],
    body: '', action: 'default'
  },
  drink: buildDrinkDetail(drinkProfiles.oolong),
  seasoning: buildSeasoningDetail(seasoningProfiles.生抽),
  alcohol: {
    typeLabel: '酒水', name: '雷司令', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=900&q=84', subtitle: '青苹果 · 柑橘 · 花香',
    info: [['白葡萄酒', '酒款类型'], ['12%vol', '酒精度'], ['8–10°C', '适饮温度']], tabs: ['风味', '适饮', '搭餐'], active: 0,
    panels: [
      `<div class="drink-flavor-profile"><article><div><strong>香气</strong><span>青苹果 · 柑橘</span></div><p>花香轻盈，酸度明亮。</p></article><article><div><strong>口感</strong><span>清爽 · 微甜</span></div><p>冷饮更显干净平衡。</p></article></div>`,
      `<div class="drink-service-list"><p><strong>冰镇</strong><span>8–10°C 饮用</span></p><p><strong>杯型</strong><span>白葡萄酒杯</span></p><p><strong>开瓶后</strong><span>冷藏并在 2 天内饮用</span></p></div>`,
      `<div class="drink-pairing-list"><button type="button" data-route="recipe:bass"><img src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=240&q=82" width="72" height="72" loading="lazy" alt="清蒸鲈鱼"><span><strong>清蒸鲈鱼</strong><small>清淡鲜美，酸度更平衡</small></span></button><button type="button" data-route="recipe:salad"><img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=240&q=82" width="72" height="72" loading="lazy" alt="海鲜沙拉"><span><strong>海鲜沙拉</strong><small>清新爽脆，适合佐餐</small></span></button></div>`
    ], body: '', isAlcohol: true, basketTarget: 'product', action: 'default'
  }
};

function getDetailData(type, id) {
  if (type === 'recipe' && id === 'tomato-egg') return { ...detailData.recipe, name: '番茄炒蛋', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=84', subtitle: '家常菜 · 15 分钟 · 简单 · 2 人' };
  if (type === 'recipe' && id === 'tomato-beef') return { ...detailData.recipe, name: '番茄炖牛腩', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=84', subtitle: '炖菜 · 90 分钟 · 适中 · 3–4 人' };
  if (type === 'recipe' && id === 'tomato-soup') return { ...detailData.recipe, name: '番茄虾仁汤', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=84', subtitle: '汤羹 · 25 分钟 · 简单 · 2–3 人' };
  if (type === 'drink' && id === 'mixology') return buildMixedDrinkDetail(mixedDrinkProfiles['gin-tonic']);
  if (type === 'drink' && mixedDrinkProfiles[id]) return buildMixedDrinkDetail(mixedDrinkProfiles[id]);
  if (type === 'drink' && ['riesling', 'beer', 'plum-wine', '梅子酒', '纯米清酒', '伦敦干金酒'].includes(id)) {
    const alcoholProfiles = {
      riesling: { name: '雷司令', subtitle: '青苹果 · 柑橘 · 花香', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=900&q=84', info: [['白葡萄酒', '酒款类型'], ['12%vol', '酒精度'], ['8–10°C', '适饮温度']] },
      beer: { name: '小麦啤酒', subtitle: '麦芽 · 柑橘 · 柔和泡沫', image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=900&q=84', info: [['小麦啤酒', '酒款类型'], ['4.5%vol', '酒精度'], ['6–8°C', '适饮温度']] },
      'plum-wine': { name: '青梅酒', subtitle: '青梅 · 蜂蜜 · 酸甜', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=900&q=84', info: [['果酒', '酒款类型'], ['12%vol', '酒精度'], ['8–12°C', '适饮温度']] },
      梅子酒: { name: '梅子酒', subtitle: '熟梅 · 蜂蜜 · 酸甜', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=900&q=84', info: [['果酒', '酒款类型'], ['12%vol', '酒精度'], ['8–12°C', '适饮温度']] },
      纯米清酒: { name: '纯米清酒', subtitle: '米香 · 清爽 · 柔和', image: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=900&q=84', info: [['清酒', '酒款类型'], ['15%vol', '酒精度'], ['10–15°C', '适饮温度']] },
      伦敦干金酒: { name: '伦敦干金酒', subtitle: '杜松 · 柑橘 · 草本', image: 'https://images.unsplash.com/photo-1582819509237-d5b75f20ff76?auto=format&fit=crop&w=900&q=84', info: [['金酒', '酒款类型'], ['40%vol', '酒精度'], ['加冰或调饮', '适饮方式']] }
    };
    return { ...detailData.alcohol, ...alcoholProfiles[id] };
  }
  if (type === 'drink' && drinkProfiles[id]) return buildDrinkDetail(drinkProfiles[id]);
  if (type === 'seasoning' && seasoningProfiles[id]) return buildSeasoningDetail(seasoningProfiles[id]);
  return detailData[type] || detailData.ingredient;
}

async function shareDetail(data) {
  const shareData = { title: data.name, text: data.subtitle, url: window.location.href };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      showToast('已打开系统分享');
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    showToast('分享链接已复制');
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('暂时无法分享，请稍后再试');
  }
}

function bindRecipeDetailBody(view) {
  view.querySelectorAll('[data-detail-step-media]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.detailStepMedia)));
  view.querySelectorAll('[data-detail-timer]').forEach((button) => button.addEventListener('click', () => showToast(`计时器已设置为 ${button.dataset.detailTimer} 分钟`)));
}

function bindRecipeDiscovery(view) {
  view.querySelectorAll('[data-detail-discovery]').forEach((button) => button.addEventListener('click', () => showToast(`正在打开 · ${button.dataset.detailDiscovery}`)));
  view.querySelectorAll('[data-detail-discovery-more]').forEach((button) => button.addEventListener('click', () => {
    openCategoryListing(button.dataset.detailDiscoveryMore === '饮品搭配' ? 'drink' : 'recipe');
  }));
}

const cookingSteps = [
  { title: '处理鲈鱼', minutes: 5, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=84', alt: '清理并擦干鲈鱼', copy: '清理鱼鳞、鱼鳃和腹部黑膜，冲洗干净后用厨房纸擦干水分。', tip: '鱼腹内的黑膜要去干净，可以明显减少腥味。' },
  { title: '腌制去腥', minutes: 10, image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=84', alt: '为鲈鱼加入姜片和葱段腌制', copy: '鱼身两侧各划两刀，放入姜片和葱段，静置 10 分钟。', tip: '不要提前放盐，避免鱼肉失水、口感变柴。' },
  { title: '上锅蒸制', minutes: 8, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=84', alt: '鲈鱼放入蒸锅大火蒸制', copy: '蒸锅水开后放入鲈鱼，保持大火蒸 8 分钟。', tip: '一定要水开后再上锅，蒸汽充足才能快速锁住鲜味。' },
  { title: '淋油调味', minutes: 2, image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=84', alt: '为蒸好的鲈鱼淋豉油和热油', copy: '倒掉盘中蒸汁，铺上葱丝，淋蒸鱼豉油和烧热的食用油。', tip: '周家有 1 人忌辣，红椒请分盘添加。' },
  { title: '完成装盘', minutes: 0, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=84', alt: '完成装盘的清蒸鲈鱼', copy: '整理葱丝和配菜，趁热端上桌，一道清蒸鲈鱼就完成了。', tip: '出锅后尽快食用，鱼肉口感最鲜嫩。' }
];

function formatCookingTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function stopCookingTimer() {
  window.clearInterval(cookingTimerId);
  cookingTimerId = 0;
  cookingTimerRunning = false;
}

function syncCookingTimer() {
  const view = document.querySelector('#cookingView');
  const value = view.querySelector('[data-cooking-time]');
  const toggle = view.querySelector('[data-cooking-timer-toggle]');
  if (value) value.textContent = formatCookingTime(cookingTimerRemaining);
  if (toggle) {
    toggle.textContent = cookingTimerRemaining === 0 ? '已完成' : cookingTimerRunning ? '暂停计时' : '开始计时';
    toggle.setAttribute('aria-pressed', String(cookingTimerRunning));
  }
}

function toggleCookingTimer() {
  if (cookingTimerRemaining === 0) return;
  if (cookingTimerRunning) {
    stopCookingTimer();
    syncCookingTimer();
    return;
  }
  cookingTimerRunning = true;
  syncCookingTimer();
  cookingTimerId = window.setInterval(() => {
    cookingTimerRemaining = Math.max(0, cookingTimerRemaining - 1);
    if (cookingTimerRemaining === 0) {
      stopCookingTimer();
      showToast('本步骤计时完成');
    }
    syncCookingTimer();
  }, 1000);
}

function resetCookingTimer() {
  stopCookingTimer();
  const steps = guidedFlowData?.steps || cookingSteps;
  cookingTimerRemaining = steps[cookingStepIndex].minutes * 60;
  syncCookingTimer();
}

function renderCookingStep() {
  const view = document.querySelector('#cookingView');
  const flow = guidedFlowData || { name: '清蒸鲈鱼', mode: 'recipe', steps: cookingSteps };
  const { mode, steps } = flow;
  const step = steps[cookingStepIndex];
  const total = steps.length;
  const progress = ((cookingStepIndex + 1) / total) * 100;
  const isMixology = mode === 'mixology';
  const modeLabel = isMixology ? '制作' : '烹饪';
  stopCookingTimer();
  cookingTimerRemaining = step.minutes * 60;
  view.classList.toggle('is-mixology-flow', isMixology);
  view.innerHTML = `<div class="cooking-safe-area" aria-hidden="true"></div><header class="cooking-header"><button type="button" data-cooking-close aria-label="退出${modeLabel}模式"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><div><h1>${flow.name}</h1><p>第 ${cookingStepIndex + 1} 步 / 共 ${total} 步</p></div><button type="button" data-cooking-menu aria-label="更多${modeLabel}选项">•••</button></header><section class="cooking-progress" aria-label="${modeLabel}进度 ${Math.round(progress)}%"><div><span style="--cooking-progress:${progress / 100}"></span></div><p><strong>${Math.round(progress)}%</strong><span>${cookingStepIndex === total - 1 ? '最后一步' : `剩余约 ${steps.slice(cookingStepIndex + 1).reduce((sum, item) => sum + item.minutes, 0)} 分钟`}</span></p></section><article class="cooking-step-card"><div class="cooking-step-heading"><span>步骤 ${cookingStepIndex + 1}</span><div><h2>${step.title}</h2>${step.minutes ? `<small>约 ${step.minutes} 分钟</small>` : `<small>${isMixology ? '准备享用' : '准备上桌'}</small>`}</div></div><figure class="cooking-step-media"><img class="cooking-step-image" src="${step.image}" width="353" height="265" alt="${step.alt}" fetchpriority="high">${step.videoDuration ? `<button type="button" data-cooking-video aria-label="播放${step.title}示范视频"><span aria-hidden="true">▶</span><small>${step.videoDuration}</small></button>` : ''}</figure><p class="cooking-step-copy">${step.copy}</p><aside class="cooking-tip"><strong>小贴士</strong><p>${step.tip}</p></aside>${step.minutes ? `<section class="cooking-timer" aria-label="步骤计时器"><div class="cooking-timer-title"><strong>计时器</strong><span>预计时间 ${String(step.minutes).padStart(2, '0')}:00</span></div><div class="cooking-timer-controls"><button type="button" data-cooking-timer-reset aria-label="重置计时器"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8V4m0 0h4M5 4a8 8 0 1 1-1 9"/></svg><small>重置</small></button><output data-cooking-time aria-live="polite">${formatCookingTime(cookingTimerRemaining)}</output><button type="button" data-cooking-timer-toggle aria-pressed="false">开始计时</button></div></section>` : ''}</article><nav class="cooking-actions" aria-label="切换${modeLabel}步骤"><button type="button" data-cooking-prev${cookingStepIndex === 0 ? ' disabled' : ''}>上一步</button><button type="button" data-cooking-next>${cookingStepIndex === total - 1 ? (isMixology ? '完成制作' : '完成烹饪') : '下一步'}</button></nav>`;
  bindImageFallbacks(view);
  view.querySelector('[data-cooking-close]').addEventListener('click', closeCookingView);
  view.querySelector('[data-cooking-menu]').addEventListener('click', () => showToast(`可选择退出${modeLabel}或重新开始`));
  view.querySelector('[data-cooking-video]')?.addEventListener('click', () => showToast(`正在播放${step.title}示范`));
  view.querySelector('[data-cooking-prev]')?.addEventListener('click', () => { if (cookingStepIndex > 0) { cookingStepIndex -= 1; renderCookingStep(); view.scrollTop = 0; } });
  view.querySelector('[data-cooking-next]').addEventListener('click', () => {
    if (cookingStepIndex === total - 1) {
      showToast(`${flow.name}${isMixology ? '制作完成' : '已完成'}`);
      closeCookingView();
      return;
    }
    cookingStepIndex += 1;
    renderCookingStep();
    view.scrollTop = 0;
  });
  view.querySelector('[data-cooking-timer-toggle]')?.addEventListener('click', toggleCookingTimer);
  view.querySelector('[data-cooking-timer-reset]')?.addEventListener('click', resetCookingTimer);
}

function showCookingView() {
  showGuidedFlow(detailData.recipe);
}

function showGuidedFlow(data) {
  const detailView = document.querySelector('#detailView');
  const cookingView = document.querySelector('#cookingView');
  guidedFlowData = {
    name: data.name,
    mode: data.action === 'mixology' ? 'mixology' : 'recipe',
    steps: data.guidedSteps || cookingSteps
  };
  cookingStepIndex = 0;
  detailView.hidden = true;
  cookingView.hidden = false;
  currentView = 'cooking';
  renderCookingStep();
  cookingView.focus({ preventScroll: true });
}

function closeCookingView() {
  stopCookingTimer();
  const cookingView = document.querySelector('#cookingView');
  cookingView.hidden = true;
  cookingView.innerHTML = '';
  cookingView.classList.remove('is-mixology-flow');
  document.querySelector('#detailView').hidden = false;
  currentView = 'detail';
  document.querySelector('#detailView').focus({ preventScroll: true });
}

function showDetailView(type, id) {
  const view = document.querySelector('#detailView');
  const data = getDetailData(type, id);
  const itemKey = `${type}:${data.name}`;
  const isInBasket = basketItems.has(itemKey);
  const detailDiscovery = data.action === 'recipe' ? recipeDiscoveryPanel() : '';
  const detailIngredientDiscovery = type === 'ingredient' ? ingredientRelatedRecipesPanel(data.name) : '';
  const detailFruitDiscovery = type === 'fruit' ? fruitRelatedRecipesPanel(data.name) : '';
  const detailDrinkDiscovery = type === 'drink' ? drinkRelatedDiscoveryPanel(data.name, data.isAlcohol) : '';
  const detailSeasoningDiscovery = type === 'seasoning' ? seasoningRelatedRecipesPanel(data) : '';
  const detailSummary = data.action === 'recipe'
    ? `<button type="button" class="detail-family-note" data-detail-family><span class="detail-family-icon" aria-hidden="true"></span><span>${data.info[2][0]}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>`
    : `<div class="detail-info-strip">${data.info.map(([value, label]) => `<div><strong>${value}</strong><small>${label}</small></div>`).join('')}</div>`;
  const bottomActions = data.action === 'recipe'
    ? `<div class="detail-bottom-actions is-dual"><button type="button" class="detail-basket-action${isInBasket ? ' is-added' : ''}" data-detail-basket aria-pressed="${isInBasket}"><span class="detail-basket-icon" aria-hidden="true"></span><span data-detail-basket-label>${isInBasket ? '已加入' : '加入菜篮'}</span></button><button type="button" class="detail-cook-action" data-detail-cook>去烹饪</button></div>`
    : data.action === 'mixology'
      ? `<div class="detail-bottom-actions is-dual"><button type="button" class="detail-basket-action${isInBasket ? ' is-added' : ''}" data-detail-basket aria-pressed="${isInBasket}"><span class="detail-basket-icon" aria-hidden="true"></span><span data-detail-basket-label>${isInBasket ? '已加入' : '加入菜篮'}</span></button><button type="button" class="detail-cook-action" data-detail-cook>去制作</button></div>`
      : `<div class="detail-bottom-actions"><button type="button" class="detail-basket-action is-primary${isInBasket ? ' is-added' : ''}" data-detail-basket aria-pressed="${isInBasket}"><span class="detail-basket-icon" aria-hidden="true"></span><span data-detail-basket-label>${isInBasket ? '已加入' : '加入菜篮'}</span></button></div>`;
  detailReturnView = currentView;
  document.querySelectorAll('main').forEach((main) => { if (main.id !== 'detailView') main.hidden = true; });
  document.querySelector('.tab-bar')?.setAttribute('inert', '');
  document.querySelector('.tab-bar')?.setAttribute('aria-hidden', 'true');
  view.classList.toggle('is-recipe-detail', data.action === 'recipe');
  view.classList.toggle('is-mixology-detail', data.action === 'mixology');
  view.classList.toggle('is-seasoning-detail', type === 'seasoning');
  view.hidden = false;
  const detailHeroActions = `<div class="detail-hero-actions"><button type="button" data-detail-back aria-label="返回"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><div><button type="button" data-detail-favorite aria-label="收藏${data.name}" aria-pressed="false"><svg class="detail-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button><button type="button" data-detail-share aria-label="分享${data.name}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0-12-4 4m4-4 4 4M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8"/></svg></button></div></div>`;
  const detailSheetLock = data.action === 'recipe' ? `<div class="detail-sheet-safe-zone" aria-hidden="true"><img src="${data.image}" alt=""></div><div class="detail-sheet-cap" aria-hidden="true"></div>` : '';
  view.innerHTML = `<div class="detail-hero"><img src="${data.image}" width="393" height="389" alt="${data.name}" fetchpriority="high"></div>${detailHeroActions}${detailSheetLock}<section class="detail-content"><header class="detail-heading"><h1>${data.name}</h1><p class="detail-subtitle">${data.subtitle}</p>${detailSummary}</header><div class="detail-tab-module"><nav class="detail-tabs" role="tablist" aria-label="${data.name}详情内容">${data.tabs.map((tab, index) => `<button type="button" id="detail-tab-${index}" role="tab" aria-controls="detail-panel" aria-selected="${index === data.active}" tabindex="${index === data.active ? '0' : '-1'}" data-detail-tab="${index}">${tab}</button>`).join('')}</nav><section class="detail-body" id="detail-panel" role="tabpanel" aria-labelledby="detail-tab-${data.active}">${data.panels?.[data.active] || data.body}</section></div>${detailDiscovery}${detailIngredientDiscovery}${detailFruitDiscovery}${detailDrinkDiscovery}${detailSeasoningDiscovery}<div class="detail-bottom">${bottomActions}</div></section>`;
  currentView = 'detail';
  bindImageFallbacks(view);
  bindRoutes(view);
  window.requestAnimationFrame(updateScrollState);
  view.querySelector('[data-detail-back]').addEventListener('click', closeDetailView);
  view.querySelector('[data-detail-favorite]').addEventListener('click', (event) => toggleFavorite(event.currentTarget));
  view.querySelector('[data-detail-share]').addEventListener('click', () => shareDetail(data));
  view.querySelector('[data-detail-family]')?.addEventListener('click', () => showToast('周家：1 人忌辣'));
  view.querySelector('[data-detail-ingredient-more]')?.addEventListener('click', () => openCategoryListing('recipe'));
  view.querySelector('[data-detail-fruit-more]')?.addEventListener('click', () => openCategoryListing('fruit'));
  view.querySelector('[data-detail-drink-more]')?.addEventListener('click', () => openCategoryListing('drink'));
  view.querySelector('[data-detail-seasoning-more]')?.addEventListener('click', () => openCategoryListing('recipe'));
  view.querySelector('[data-detail-basket]').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const adding = !basketItems.has(itemKey);
    if (adding) basketItems.add(itemKey);
    else basketItems.delete(itemKey);
    persistBasketItems();
    updateBasketCount();
    button.classList.toggle('is-added', adding);
    button.setAttribute('aria-pressed', String(adding));
    button.querySelector('[data-detail-basket-label]').textContent = adding ? '已加入' : '加入菜篮';
    const basketNotice = data.basketTarget === 'ingredients'
      ? `${data.name}所需原料`
      : data.name;
    showToast(adding ? `已加入周家菜篮 · ${basketNotice}` : `已从周家菜篮移除 · ${basketNotice}`);
  });
  const selectDetailTab = (button) => {
    view.querySelectorAll('[data-detail-tab]').forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab === button));
      tab.tabIndex = tab === button ? 0 : -1;
    });
    const panel = data.panels?.[Number(button.dataset.detailTab)];
    if (panel) {
      const panelElement = view.querySelector('.detail-body');
      panelElement.innerHTML = panel;
      panelElement.setAttribute('aria-labelledby', button.id);
      bindImageFallbacks(panelElement);
      bindRoutes(panelElement);
      bindRecipeDetailBody(view);
    } else showToast(`已切换到${button.textContent}`);
  };
  view.querySelectorAll('[data-detail-tab]').forEach((button) => {
    button.addEventListener('click', () => selectDetailTab(button));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...view.querySelectorAll('[data-detail-tab]')];
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(tabs.indexOf(button) + direction + tabs.length) % tabs.length];
      selectDetailTab(next);
      next.focus();
    });
  });
  if (data.action === 'recipe') view.querySelector('[data-detail-cook]')?.addEventListener('click', showCookingView);
  if (data.action === 'mixology') view.querySelector('[data-detail-cook]')?.addEventListener('click', () => showGuidedFlow(data));
  bindRecipeDetailBody(view);
  bindRecipeDiscovery(view);
  view.focus({ preventScroll: true });
}

function closeDetailView() {
  const view = document.querySelector('#detailView');
  view.hidden = true;
  view.innerHTML = '';
  view.classList.remove('is-recipe-detail');
  view.classList.remove('is-mixology-detail');
  view.classList.remove('is-seasoning-detail');
  document.querySelector('.tab-bar')?.removeAttribute('inert');
  document.querySelector('.tab-bar')?.removeAttribute('aria-hidden');
  if (detailReturnView === 'category') showCategoryView();
  else if (detailReturnView === 'basket') showBasketView();
  else if (detailReturnView === 'mine') showMineView();
  else showHomeView();
}

function categoryBasketKey(item, type = categoryKey) { return `${type}:${item[0]}`; }

function persistBasketItems() {
  try {
    const serialized = Object.fromEntries(Object.entries(familyBasketItems).map(([id, items]) => [id, [...items]]));
    window.localStorage.setItem('homeBasketItemsByFamily', JSON.stringify(serialized));
  } catch { /* Prototype remains usable without storage. */ }
}

function updateBasketCount() {
  const count = basketCount();
  const badge = document.querySelector('#basketCount');
  const tab = document.querySelector('[data-tab="basket"]');
  badge.textContent = String(count);
  badge.hidden = count === 0;
  tab.setAttribute('aria-label', count ? `菜篮，${count}样内容` : '菜篮，暂无内容');
}

function basketButton(item, type = categoryKey) {
  const key = categoryBasketKey(item, type);
  const added = basketItems.has(key);
  return `<button class="basket-control${added ? ' is-added' : ''}" type="button" data-basket-id="${key}" aria-label="${added ? '从菜篮移除' : '加入菜篮'}${item[0]}" aria-pressed="${added}"><svg class="basket-glyph" viewBox="0 0 24 24" aria-hidden="true"><path class="basket-body" d="M4.5 9.75h15l-1.1 7.85a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7L4.5 9.75Z"/><path class="basket-handle" d="M7.8 10 9.95 5.8a2.25 2.25 0 0 1 4.1 0L16.2 10"/></svg></button>`;
}

function categoryPriceMarkup(detail) {
  const price = detail.match(/^约(¥[\d.]+)(\/斤)$/);
  if (!price) return `<span class="category-grid-detail">${detail}</span>`;
  return `<span class="price-prefix">约</span><strong class="price-amount">${price[1]}</strong><span class="price-unit">${price[2]}</span>`;
}

function filterCategoryItems(key = categoryKey, secondary = categoryCatalog[key].selected) {
  const catalog = categoryCatalog[key];
  const isAlcohol = key === 'drink' && secondary === '酒水';
  const items = isAlcohol ? catalog.alcoholItems : catalog.items;
  return items.filter((item) => {
    const tags = isAlcohol ? item[4] : item[3];
    return Array.isArray(tags) && tags.includes(secondary);
  });
}

function searchCategoryCatalog(query) {
  const term = query.trim().toLocaleLowerCase('zh-CN');
  if (!term) return [];
  return Object.entries(categoryCatalog).flatMap(([key, catalog]) => {
    const regular = catalog.items.map((item) => ({ key, label: catalog.label, item, alcohol: false }));
    const alcohol = (catalog.alcoholItems || []).map((item) => ({ key, label: catalog.label, item, alcohol: true }));
    return [...regular, ...alcohol];
  }).filter(({ item }) => item.slice(0, 3).join(' ').toLocaleLowerCase('zh-CN').includes(term));
}

function renderCategoryState(state, message = '') {
  const content = document.querySelector('#categoryContent');
  const summary = document.querySelector('#categoryResultSummary');
  content.className = `category-content category-state category-state-${state}`;
  summary.textContent = state === 'loading' ? '正在更新内容' : '';
  if (state === 'loading') {
    content.innerHTML = '<div class="category-skeleton" aria-label="正在加载"><i></i><i></i><i></i><i></i></div>';
    return;
  }
  if (state === 'error') {
    content.innerHTML = `<div class="category-message"><span class="category-message-icon" aria-hidden="true"></span><strong>内容暂时没有加载出来</strong><p>${message || '请检查网络后重试'}</p><button type="button" data-retry-category>重新加载</button></div>`;
    content.querySelector('[data-retry-category]')?.addEventListener('click', () => {
      categoryState = 'idle';
      renderCategory();
    });
  }
}

function setCategoryLoading(action) {
  window.clearTimeout(categoryStateTimer);
  categoryState = 'loading';
  renderCategoryState('loading');
  categoryStateTimer = window.setTimeout(() => {
    action();
    categoryState = 'idle';
    renderCategory();
    document.querySelector('#categoryContent').scrollTop = 0;
  }, 180);
}

function renderCategoryShell() {
  const primary = document.querySelector('#categoryPrimaryNav');
  primary.replaceChildren(...Object.entries(categoryCatalog).map(([key, item]) => {
    const button = document.createElement('button');
    button.className = `category-primary-item${key === categoryKey ? ' is-active' : ''}`;
    button.type = 'button';
    button.role = 'tab';
    button.id = `category-tab-${key}`;
    button.dataset.categoryKey = key;
    button.tabIndex = key === categoryKey ? 0 : -1;
    button.setAttribute('aria-controls', 'categoryContent');
    button.setAttribute('aria-selected', String(key === categoryKey));
    button.textContent = item.label;
    return button;
  }));

  const secondary = document.querySelector('#categorySecondaryNav');
  const catalog = categoryCatalog[categoryKey];
  secondary.replaceChildren(...catalog.secondary.map((label) => {
    const button = document.createElement('button');
    button.className = `category-secondary-item${label === catalog.selected ? ' is-active' : ''}`;
    button.type = 'button';
    button.dataset.secondaryLabel = label;
    if (label === catalog.selected) button.setAttribute('aria-current', 'true');
    button.textContent = label;
    return button;
  }));
}

function renderCategoryContent() {
  const content = document.querySelector('#categoryContent');
  const summary = document.querySelector('#categoryResultSummary');
  const catalog = categoryCatalog[categoryKey];
  const isAlcohol = categoryKey === 'drink' && catalog.selected === '酒水';
  const items = filterCategoryItems();
  content.setAttribute('role', 'tabpanel');
  content.setAttribute('aria-labelledby', `category-tab-${categoryKey}`);
  content.innerHTML = '';
  if (categoryState === 'loading' || categoryState === 'error') {
    renderCategoryState(categoryState);
    return;
  }
  if (categoryQuery) {
    const results = searchCategoryCatalog(categoryQuery);
    summary.textContent = `“${categoryQuery}” · ${results.length}项`;
    content.className = 'category-content category-search-results';
    if (!results.length) {
      content.innerHTML = '<div class="category-message"><span class="category-message-icon" aria-hidden="true"></span><strong>没有找到相关内容</strong><p>换个关键词，或清除搜索继续浏览分类</p><button type="button" data-clear-category-search>清除搜索</button></div>';
    } else {
      content.innerHTML = results.map(({ key, label, item, alcohol }) => {
        const image = alcohol ? item[3] : item[2];
        const meta = alcohol ? `${item[1]} · ${item[2]}` : item[1];
        return `<article class="category-search-row"><button class="category-search-hit" type="button" data-route="${key}:${item[0]}"><img src="${image}" width="72" height="72" alt="${item[0]}" loading="lazy"><span><small>${label}</small><strong>${item[0]}</strong><em>${meta}</em></span></button>${basketButton(item, key)}</article>`;
      }).join('');
    }
  } else if (!items.length) {
    summary.textContent = `${catalog.selected} · 0项`;
    content.className = 'category-content category-state category-state-empty';
    content.innerHTML = `<div class="category-message"><span class="category-message-icon" aria-hidden="true"></span><strong>这一类还没有内容</strong><p>先看看${catalog.secondary[0]}，后续会继续补充</p><button type="button" data-reset-category>查看${catalog.secondary[0]}</button></div>`;
  } else {
    summary.textContent = `${catalog.selected}${catalog.label} · ${items.length}项`;
  if (isAlcohol) {
    content.className = 'category-content category-content-list category-alcohol-list';
    content.innerHTML = items.map((item) => `<article class="category-alcohol-row"><button class="category-alcohol-hit" type="button" data-route="drink:${item[0]}"><img src="${item[3]}" width="72" height="88" alt="${item[0]}" loading="lazy"><span class="category-item-copy"><strong>${item[0]}</strong><span>${item[1]}</span><small>${item[2]}</small></span></button>${basketButton(item, 'drink')}</article>`).join('');
  } else if (catalog.layout === 'recipe') {
    content.className = 'category-content category-content-list';
    content.innerHTML = items.map((item) => `<article class="category-recipe-row"><button class="category-recipe-hit" type="button" data-route="recipe:${item[0]}"><img src="${item[2]}" width="88" height="88" alt="${item[0]}" loading="lazy"><span class="category-item-copy"><strong>${item[0]}</strong><small>${item[1]}</small></span></button>${basketButton(item)}</article>`).join('');
  } else {
    content.className = 'category-content category-content-grid';
    content.innerHTML = items.map((item) => {
      const [primaryMeta, ...secondaryMeta] = item[1].split(' · ');
      const route = `${categoryKey}:${item[0]}`;
      const detail = secondaryMeta.join(' · ') || '查看详情';
      return `<article class="category-grid-card"><button class="category-grid-hit" type="button" data-route="${route}" aria-label="查看${item[0]}详情"><img src="${item[2]}" width="148" height="148" alt="${item[0]}" loading="lazy"></button><div class="category-grid-info"><button class="category-grid-heading" type="button" data-route="${route}"><strong>${item[0]}</strong><small>${primaryMeta}</small></button><div class="category-grid-purchase"><span class="category-grid-price">${categoryPriceMarkup(detail)}</span>${basketButton(item)}</div></div></article>`;
    }).join('');
  }
  }
  bindRoutes(content);
  bindImageFallbacks(content);
  content.querySelector('[data-retry-category]')?.addEventListener('click', () => {
    categoryState = 'idle';
    renderCategory();
  });
  content.querySelector('[data-reset-category]')?.addEventListener('click', () => {
    categoryCatalog[categoryKey].selected = categoryCatalog[categoryKey].secondary[0];
    renderCategory();
  });
  content.querySelector('[data-clear-category-search]')?.addEventListener('click', clearCategorySearch);
  bindBasketControls(content);
}

function renderCategory() {
  renderCategoryShell();
  renderCategoryContent();
}

function clearCategorySearch() {
  categoryQuery = '';
  const input = document.querySelector('#categorySearchInput');
  input.value = '';
  document.querySelectorAll('[data-clear-category-search]').forEach((button) => { button.hidden = true; });
  renderCategory();
  input.focus();
}

function getBasketEntries() {
  const lookup = new Map();
  Object.entries(categoryCatalog).forEach(([key, catalog]) => {
    catalog.items.forEach((item) => lookup.set(`${key}:${item[0]}`, { key, label: catalog.label, item, image: item[2], meta: item[1] }));
    (catalog.alcoholItems || []).forEach((item) => lookup.set(`${key}:${item[0]}`, { key, label: catalog.label, item, image: item[3], meta: `${item[1]} · ${item[2]}` }));
  });
  return [...basketItems].map((key) => ({ basketKey: key, ...lookup.get(key) })).filter((entry) => entry.item);
}

function basketChecked(id) {
  return basketPurchased.has(id) && !basketArchived.has(id);
}

function basketCount() {
  return [...basketItems].filter((id) => !basketArchived.has(id)).length;
}

function basketSummaryText(family) {
  const count = basketCount();
  if (!count) return '菜篮为空';
  return `待采购 ${count} 项${family.id === 'zhou' ? ' · 参考约 ¥86' : ''}`;
}

function basketOverlayOpen(content) {
  const overlay = document.querySelector('#basketOverlay');
  overlay.innerHTML = `<div class="basket-sheet-backdrop" data-close-basket-sheet></div><section class="basket-sheet" role="dialog" aria-modal="true" tabindex="-1">${content}</section>`;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  overlay.querySelector('[data-close-basket-sheet]')?.addEventListener('click', closeBasketOverlay);
  overlay.querySelector('[data-sheet-close]')?.addEventListener('click', closeBasketOverlay);
  overlay.querySelector('.basket-sheet')?.focus();
}

function closeBasketOverlay() {
  const overlay = document.querySelector('#basketOverlay');
  overlay.classList.remove('is-open');
  window.setTimeout(() => { overlay.hidden = true; overlay.innerHTML = ''; }, 220);
}

function renderFamilyMenu() {
  const menu = document.querySelector('#basketFamilyMenu');
  menu.innerHTML = `${basketFamilies.map((family) => `<button type="button" role="menuitem" class="basket-family-option${family.id === activeBasketFamily ? ' is-current' : ''}" data-basket-family="${family.id}"><span class="family-avatar" aria-hidden="true">${family.name.slice(0, 1)}</span><span><strong>${family.name}</strong><small>${family.meta}</small></span>${family.id === activeBasketFamily ? '<i aria-hidden="true">✓</i>' : ''}</button>`).join('')}<button type="button" role="menuitem" class="basket-family-manage" data-route="family:manage">管理家庭</button>`;
  menu.querySelectorAll('[data-basket-family]').forEach((button) => button.addEventListener('click', () => {
    activateBasketFamily(button.dataset.basketFamily);
    selectedManagedFamilyId = activeBasketFamily;
    const family = basketFamilies.find((item) => item.id === activeBasketFamily);
    document.querySelector('#basketFamilyName').textContent = family.name;
    document.querySelector('#basketSummary').textContent = basketSummaryText(family);
    closeFamilyMenu();
    renderBasketView();
    showToast(`已切换至${family.name}`);
  }));
  bindRoutes(menu);
}

function toggleFamilyMenu() {
  const trigger = document.querySelector('[data-basket-family-trigger]');
  const menu = document.querySelector('#basketFamilyMenu');
  const nextOpen = menu.hidden;
  renderFamilyMenu();
  menu.hidden = !nextOpen;
  trigger.setAttribute('aria-expanded', String(nextOpen));
}

function closeFamilyMenu() {
  document.querySelector('#basketFamilyMenu').hidden = true;
  document.querySelector('[data-basket-family-trigger]').setAttribute('aria-expanded', 'false');
}

function renderMineFamilyMenu() {
  const menu = document.querySelector('#mineFamilyMenu');
  if (!menu) return;
  menu.innerHTML = `${basketFamilies.map((family) => `<button type="button" role="menuitem" class="mine-family-option${family.id === activeBasketFamily ? ' is-current' : ''}" data-mine-family="${family.id}"><span class="family-avatar${family.id === activeBasketFamily ? ' is-current' : ''}" aria-hidden="true">${family.name.slice(0, 1)}</span><span><strong>${family.name}</strong><small>${family.meta}</small></span>${family.id === activeBasketFamily ? '<i aria-hidden="true">✓</i>' : ''}</button>`).join('')}<button type="button" role="menuitem" class="mine-family-manage-option" data-route="family:manage">管理家庭</button>`;
  menu.querySelectorAll('[data-mine-family]').forEach((button) => button.addEventListener('click', () => {
    activateBasketFamily(button.dataset.mineFamily);
    selectedManagedFamilyId = activeBasketFamily;
    const family = basketFamilies.find((item) => item.id === activeBasketFamily);
    document.querySelector('#mineFamilyTitle').textContent = family.name;
    document.querySelector('.mine-family-copy p').textContent = `${familyMembersByFamily[family.id]?.length || 0} 位成员 · ${basketCount()} 项待采购`;
    closeMineFamilyMenu();
    showToast(`已切换至${family.name}`);
  }));
  bindRoutes(menu);
}

function toggleMineFamilyMenu() {
  const trigger = document.querySelector('[data-mine-family-trigger]');
  const menu = document.querySelector('#mineFamilyMenu');
  const nextOpen = menu.hidden;
  renderMineFamilyMenu();
  menu.hidden = !nextOpen;
  trigger.setAttribute('aria-expanded', String(nextOpen));
}

function closeMineFamilyMenu() {
  const menu = document.querySelector('#mineFamilyMenu');
  const trigger = document.querySelector('[data-mine-family-trigger]');
  if (menu) menu.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function basketPreferencesMarkup() {
  const labels = { avoid: '忌口', like: '喜欢', allergy: '过敏' };
  return Object.entries(basketPreferences).map(([key, groups]) => { const count = groups.reduce((total, group) => total + group.tags.length, 0); return `<button type="button" class="preference-stat preference-${key}" data-open-preferences="${key}" aria-label="查看${labels[key]}，${count}项"><strong>${labels[key]}</strong><b>${count}</b></button>`; }).join('');
}

function renderBasketIngredients() {
  const visible = activeBasketRows();
  const checked = visible.filter((row) => basketChecked(row.id)).length;
  if (!visible.length) return '<div class="basket-empty"><span class="basket-empty-glyph" aria-hidden="true"></span><strong>本次采购已完成</strong><p>再从菜谱、食材或水果中加入内容，家庭成员都会看到。</p><button type="button" data-go-category>去分类看看</button></div>';
  return `<section class="basket-panel basket-ingredients-panel" aria-labelledby="basketIngredientsTitle"><div class="basket-panel-heading"><div><h2 id="basketIngredientsTitle">本次采购</h2><p>同类食材已合并，点击名称查看挑选方法</p></div><span class="basket-total">已买 ${checked}/${visible.length}</span></div><div class="basket-ingredient-list">${visible.map((row) => `<article class="basket-ingredient-row${basketChecked(row.id) ? ' is-checked' : ''}"><button type="button" class="basket-check" data-basket-check="${row.id}" aria-label="${basketChecked(row.id) ? '取消勾选' : '勾选'}${row.name}" aria-pressed="${basketChecked(row.id)}"><span aria-hidden="true"></span></button><img src="${row.image}" width="56" height="56" alt="${row.name}" loading="lazy"><button type="button" class="basket-ingredient-info" data-basket-detail="${row.name}"><strong>${row.name}</strong><small>${row.source}</small></button><span class="basket-quantity">${row.quantity}</span></article>`).join('')}</div></section>`;
}

function renderBasketRecipes() {
  const groups = activeBasketRecipes();
  if (!groups.length) return '<div class="basket-empty"><span class="basket-empty-glyph" aria-hidden="true"></span><strong>这个家庭还没有菜谱清单</strong><p>从菜谱详情加入后，会在这里按菜谱拆分食材。</p><button type="button" data-go-category>去看看菜谱</button></div>';
  return `<section class="basket-panel basket-recipes-panel" aria-labelledby="basketRecipesTitle"><div class="basket-panel-heading"><div><h2 id="basketRecipesTitle">菜谱清单</h2><p>按菜谱查看食材准备进度</p></div></div><div class="basket-recipe-list">${groups.map((recipe) => { const total = recipe.ingredients.length; const checked = recipe.ingredients.filter(([id]) => basketChecked(id)).length; const expanded = basketExpandedRecipes.has(recipe.id); return `<article class="basket-recipe-group${expanded ? ' is-expanded' : ''}"><button type="button" class="basket-recipe-summary" data-recipe-toggle="${recipe.id}" aria-expanded="${expanded}"><img src="${recipe.image}" width="52" height="52" alt="${recipe.name}" loading="lazy"><span><strong>${recipe.name}</strong><small>${checked}/${total} 项食材已准备</small></span><i class="basket-recipe-chevron" aria-hidden="true"></i></button>${expanded ? `<div class="basket-recipe-ingredients">${recipe.ingredients.map(([id, name, quantity]) => `<div class="basket-recipe-ingredient${basketChecked(id) ? ' is-checked' : ''}"><button type="button" class="basket-check" data-basket-check="${id}" aria-label="${basketChecked(id) ? '取消勾选' : '勾选'}${name}" aria-pressed="${basketChecked(id)}"><span aria-hidden="true"></span></button><button type="button" class="basket-recipe-name" data-basket-detail="${name}">${name}</button><span>${quantity}</span></div>`).join('')}</div>` : ''}</article>`; }).join('')}</div></section>`;
}

function openPreferenceSheet(kind = 'avoid') {
  const tabs = [['avoid', '忌口'], ['like', '喜欢'], ['allergy', '过敏']];
  const current = basketPreferences[kind] || basketPreferences.avoid;
  basketOverlayOpen(`<header class="sheet-header"><div><span class="sheet-eyebrow">家庭口味</span><h2>大家怎么吃</h2></div><button type="button" data-sheet-close aria-label="关闭">×</button></header><div class="preference-sheet-tabs" role="tablist">${tabs.map(([key, label]) => `<button type="button" class="${key === kind ? 'is-active' : ''}" data-preference-tab="${key}" role="tab" aria-selected="${key === kind}">${label}</button>`).join('')}</div><div class="preference-groups">${current.map((group) => `<div class="preference-group"><strong>${group.member}</strong><div>${group.tags.map((tag) => `<span class="preference-tag">${tag}</span>`).join('')}</div></div>`).join('')}</div><p class="sheet-note">忌口和过敏会在制作或采购时提醒家庭成员。</p>`);
  document.querySelectorAll('[data-preference-tab]').forEach((button) => button.addEventListener('click', () => openPreferenceSheet(button.dataset.preferenceTab)));
}

function openIngredientSheet(name) {
  const guide = selectionGuideItems(name);
  basketOverlayOpen(`<header class="sheet-header selection-sheet-header"><div><span class="sheet-eyebrow">怎么挑</span><h2>${name}</h2></div><button type="button" data-sheet-close aria-label="关闭">×</button></header><div class="selection-guide-list">${guide.map(({ title, copy, image }) => `<article><img src="${image}" width="64" height="64" alt="${name}${title}" loading="lazy"><span><strong>${title}</strong><small>${copy}</small></span></article>`).join('')}</div><button type="button" class="sheet-primary-action selection-sheet-action" data-sheet-close>我知道了</button>`);
  bindImageFallbacks(document.querySelector('#basketOverlay'));
}

function openCompleteSheet() {
  const selected = activeBasketRows().filter((row) => basketChecked(row.id));
  basketOverlayOpen(`<header class="sheet-header"><div><span class="sheet-eyebrow">采购进度</span><h2>完成本次采购？</h2></div><button type="button" data-sheet-close aria-label="关闭">×</button></header><p class="complete-copy">将${selected.length || 0}项已勾选食材移入采购记录，未勾选内容会继续保留在菜篮。</p><div class="complete-actions"><button type="button" class="sheet-secondary-action" data-sheet-close>再看看</button><button type="button" class="sheet-primary-action" data-confirm-complete>确认完成</button></div>`);
  document.querySelector('[data-confirm-complete]')?.addEventListener('click', () => {
    selected.forEach((row) => basketArchived.add(row.id));
    closeBasketOverlay();
    renderBasketView();
    showToast('已记录本次采购');
  });
}

function renderBasketView() {
  const content = document.querySelector('#basketContent');
  const summary = document.querySelector('#basketSummary');
  const family = basketFamilies.find((item) => item.id === activeBasketFamily);
  document.querySelector('#basketFamilyName').textContent = family.name;
  const checkedCount = activeBasketRows().filter((row) => basketChecked(row.id)).length;
  summary.textContent = basketSummaryText(family);
  updateBasketCount();
  content.innerHTML = `<div class="basket-view-switch" role="tablist" aria-label="菜篮视图"><button type="button" role="tab" data-basket-view="ingredients" aria-selected="${basketViewMode === 'ingredients'}" aria-controls="basketIngredientsTitle">食材</button><button type="button" role="tab" data-basket-view="recipes" aria-selected="${basketViewMode === 'recipes'}" aria-controls="basketRecipesTitle">菜谱</button></div><section class="basket-preferences-card" aria-label="家庭口味"><strong>家庭口味</strong><div class="preference-stats">${basketPreferencesMarkup()}</div></section>${basketViewMode === 'ingredients' ? renderBasketIngredients() : renderBasketRecipes()}<button type="button" class="basket-complete-action" data-open-complete${checkedCount ? '' : ' disabled'}>${checkedCount ? `完成本次采购 · ${checkedCount}项` : '勾选已购食材'} <span aria-hidden="true">›</span></button>`;
  content.querySelectorAll('[data-basket-view]').forEach((button) => button.addEventListener('click', () => { basketViewMode = button.dataset.basketView; renderBasketView(); }));
  content.querySelectorAll('[data-basket-check]').forEach((button) => button.addEventListener('click', () => { const id = button.dataset.basketCheck; if (basketPurchased.has(id)) basketPurchased.delete(id); else basketPurchased.add(id); renderBasketView(); }));
  content.querySelectorAll('[data-basket-detail]').forEach((button) => button.addEventListener('click', () => openIngredientSheet(button.dataset.basketDetail)));
  content.querySelectorAll('[data-open-preferences]').forEach((button) => button.addEventListener('click', () => openPreferenceSheet(button.dataset.openPreferences)));
  content.querySelector('[data-open-complete]')?.addEventListener('click', openCompleteSheet);
  content.querySelector('[data-go-category]')?.addEventListener('click', () => activateTab('category'));
  content.querySelectorAll('[data-recipe-toggle]').forEach((button) => button.addEventListener('click', () => { const id = button.dataset.recipeToggle; if (basketExpandedRecipes.has(id)) basketExpandedRecipes.delete(id); else basketExpandedRecipes.add(id); renderBasketView(); }));
  bindImageFallbacks(content);
}

function activateTab(name) {
  const target = document.querySelector(`[data-tab="${name}"]`);
  document.querySelectorAll('[data-tab]').forEach((item) => {
    const active = item === target;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  });
  document.querySelector('#mineSubpageView').hidden = true;
  if (name === 'category') showCategoryView();
  else if (name === 'basket') showBasketView();
  else if (name === 'mine') showMineView();
  else if (name === 'home') showHomeView();
}

function showCategoryView() {
  document.querySelector('#homeScroll').hidden = true;
  document.querySelector('#basketView').hidden = true;
  document.querySelector('#mineView').hidden = true;
  document.querySelector('#categoryView').hidden = false;
  currentView = 'category';
  if (new URLSearchParams(window.location.search).has('categoryError')) categoryState = 'error';
  renderCategory();
  document.querySelector('#categoryContent').scrollTop = categoryScrollPositions.get(`${categoryKey}:${categoryCatalog[categoryKey].selected}`) || 0;
}

function showHomeView() {
  document.querySelector('#categoryView').hidden = true;
  document.querySelector('#basketView').hidden = true;
  document.querySelector('#mineView').hidden = true;
  document.querySelector('#homeScroll').hidden = false;
  currentView = 'home';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showBasketView() {
  if (currentView === 'category') categoryScrollPositions.set(`${categoryKey}:${categoryCatalog[categoryKey].selected}`, document.querySelector('#categoryContent').scrollTop);
  document.querySelector('#homeScroll').hidden = true;
  document.querySelector('#categoryView').hidden = true;
  document.querySelector('#mineView').hidden = true;
  document.querySelector('#basketView').hidden = false;
  currentView = 'basket';
  renderBasketView();
  document.querySelector('#basketView').scrollTop = 0;
}

function showMineView() {
  document.querySelector('#homeScroll').hidden = true;
  document.querySelector('#categoryView').hidden = true;
  document.querySelector('#basketView').hidden = true;
  document.querySelector('#mineView').hidden = false;
  currentView = 'mine';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMineRecipeState(state = 'loaded') {
  const view = document.querySelector('#mineRecipeListView');
  const validState = ['loaded', 'loading', 'empty', 'error'].includes(state) ? state : 'loaded';
  view.dataset.state = validState;
  view.querySelector('[data-mine-recipes-loaded]').hidden = validState !== 'loaded';
  view.querySelector('[data-mine-recipes-loading]').hidden = validState !== 'loading';
  view.querySelector('[data-mine-recipes-empty]').hidden = validState !== 'empty';
  view.querySelector('[data-mine-recipes-error]').hidden = validState !== 'error';
}

function showMineRecipeList({ pushHistory = true } = {}) {
  const view = document.querySelector('#mineRecipeListView');
  if (!view.hidden) return;
  mineScrollPosition = window.scrollY;
  renderMineRecipeState(new URLSearchParams(window.location.search).get('mineRecipes') || 'loaded');
  view.hidden = false;
  view.scrollTop = 0;
  document.body.classList.add('is-mine-recipes-open');
  document.querySelector('#mineView').setAttribute('inert', '');
  document.querySelector('.tab-bar').setAttribute('inert', '');
  if (pushHistory) history.pushState({ ...(history.state || {}), view: 'mine-recipes' }, '', '#mine-recipes');
  view.querySelector('[data-mine-recipes-back]')?.focus();
}

function hideMineRecipeList() {
  const view = document.querySelector('#mineRecipeListView');
  if (view.hidden) return;
  window.clearTimeout(mineRecipeReloadTimer);
  view.hidden = true;
  document.body.classList.remove('is-mine-recipes-open');
  document.querySelector('#mineView').removeAttribute('inert');
  document.querySelector('.tab-bar').removeAttribute('inert');
  window.scrollTo({ top: mineScrollPosition, behavior: 'auto' });
  document.querySelector('.mine-recipes-title')?.focus();
}

function syncRecipeCreate() {
  const view = document.querySelector('#recipeCreateView');
  if (!view) return;
  const labels = { 1: '基本信息', 2: '媒体管理', 3: '制作步骤', 4: '预览发布' };
  view.querySelectorAll('[data-create-panel]').forEach((panel) => {
    panel.hidden = Number(panel.dataset.createPanel) !== createStep;
  });
  view.querySelectorAll('[data-create-progress]').forEach((bar) => {
    const number = Number(bar.dataset.createProgress);
    bar.classList.toggle('is-active', number <= createStep);
  });
  view.querySelector('#createProgressLabel').textContent = `${createStep} / 4　${labels[createStep]}`;
  const previous = view.querySelector('[data-create-prev]');
  const next = view.querySelector('[data-create-next]');
  previous.hidden = createStep === 1;
  next.textContent = createStep === 4 ? '确认发布' : '下一步';
  if (createStep === 4) {
    previous.textContent = '返回编辑';
    const title = view.querySelector('[data-create-recipe-name]')?.value.trim();
    if (title) view.querySelector('.create-panel-preview h3').textContent = title;
  }
  bindImageFallbacks(view);
}

function showRecipeCreate() {
  const view = document.querySelector('#recipeCreateView');
  if (!view) return;
  document.body.classList.remove('is-mine-recipes-open');
  document.querySelector('#mineView').removeAttribute('inert');
  document.querySelector('.tab-bar').removeAttribute('inert');
  document.querySelector('#homeScroll').hidden = true;
  document.querySelector('#categoryView').hidden = true;
  document.querySelector('#basketView').hidden = true;
  document.querySelector('#mineView').hidden = true;
  document.querySelector('#mineRecipeListView').hidden = true;
  view.hidden = false;
  currentView = 'recipe-create';
  document.body.classList.add('is-recipe-create-open');
  createStep = 1;
  createHasMedia = false;
  view.querySelector('[data-create-recipe-name]').value = '';
  const upload = view.querySelector('.media-empty-upload');
  upload?.classList.remove('has-media');
  if (upload) {
    upload.querySelector('strong').textContent = '添加图片或视频';
    upload.querySelector('small').textContent = '让家人一眼看懂这道菜';
  }
  syncRecipeCreate();
  view.focus({ preventScroll: true });
}

function hideRecipeCreate() {
  const view = document.querySelector('#recipeCreateView');
  if (!view || view.hidden) return;
  view.hidden = true;
  document.body.classList.remove('is-recipe-create-open');
  showMineView();
}

const mineSubpageMeta = {
  'profile:edit': { title: '个人资料', action: '保存' },
  'privacy:family-share': { title: '隐私与家庭共享' },
  'privacy:family': { title: '隐私与家庭共享' },
  'family:members': { title: '家庭成员' },
  'family:preferences': { title: '家庭口味' },
  'family:code': { title: '家庭码' },
  'family:manage': { title: '家庭管理' },
  'purchase:records': { title: '采购记录' },
  'notification:all': { title: '消息与提醒' },
  'favorite:recipe': { title: '我的收藏' },
  'history:recipe': { title: '最近浏览' },
  'settings:all': { title: '更多设置' },
  'account:security': { title: '账号与安全' },
  'about:product': { title: '关于产品' }
};

const favoriteRecipeCatalog = [
  { id: 'tomato-beef', name: '番茄炖牛腩', note: '浓郁下饭 · 45 分钟', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=360&q=82' },
  { id: 'steamed-fish', name: '清蒸鲈鱼', note: '鲜嫩清淡 · 30 分钟', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=360&q=82' },
  { id: 'shrimp-egg', name: '虾仁滑蛋', note: '鲜嫩营养 · 25 分钟', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=360&q=82' }
];
const favoriteRecipeIds = new Set(favoriteRecipeCatalog.map((recipe) => recipe.id));
let favoriteRecipeTotal = 28;

function mineSubpageRecipeRow(recipe, favorite = false) {
  return `<article class="mine-subpage-recipe-row" data-favorite-row="${recipe.id}"><button class="mine-subpage-recipe-hit" type="button" data-route="recipe:${recipe.id}"><img src="${recipe.image}" width="82" height="62" alt="${recipe.name}"><span><strong>${recipe.name}</strong><small>${recipe.note}</small></span></button>${favorite ? `<button class="subpage-unfavorite" type="button" data-remove-favorite="${recipe.id}" aria-label="取消收藏${recipe.name}" aria-pressed="true"><img src="https://api.iconify.design/ph/bookmark-simple-fill.svg?color=%237a8b6f" width="22" height="22" alt="" aria-hidden="true"></button>` : '<i class="mine-chevron" aria-hidden="true"></i>'}</article>`;
}

function mineSubpageRow(icon, title, detail, route = '', extra = '') {
  const action = route ? ` data-route="${route}"` : '';
  return `<button class="mine-subpage-row" type="button"${action}><span class="mine-subpage-row-icon" aria-hidden="true">${icon}</span><span><strong>${title}</strong>${detail ? `<small>${detail}</small>` : ''}</span>${extra || '<i class="mine-chevron" aria-hidden="true"></i>'}</button>`;
}

function familyRoleLabel(role) {
  return ({ creator: '创建者', admin: '管理员', member: '成员' })[role] || '成员';
}

function activeManagedFamily() {
  return basketFamilies.find((family) => family.id === selectedManagedFamilyId) || basketFamilies[0];
}

function managedFamilyMembers() {
  return familyMembersByFamily[selectedManagedFamilyId] || [];
}

function currentManagedMember() {
  return managedFamilyMembers().find((member) => member.id === 'self') || { role: 'member' };
}

function familyMemberDisplayName(member) {
  return member?.note || member?.name || '家庭成员';
}

function escapeFamilyText(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function familyDirectoryMarkup() {
  if (!basketFamilies.length) return `<section class="family-empty-state"><span aria-hidden="true">⌂</span><strong>还没有加入家庭</strong><p>创建一个家庭，或扫一扫加入家人的家庭。</p><button type="button" data-create-family>创建家庭</button><button type="button" data-scan-family>扫一扫加入</button></section>`;
  return `<div class="family-directory-count">${basketFamilies.length} 个家庭</div><section class="family-directory">${basketFamilies.map((family) => {
    const members = familyMembersByFamily[family.id] || [];
    const self = members.find((member) => member.id === 'self');
    const avatar = family.avatar ? `<img src="${family.avatar}" width="40" height="40" alt="">` : family.name.slice(0, 1);
    return `<button type="button" class="family-directory-row${family.id === activeBasketFamily ? ' is-current' : ''}" data-open-family-members="${family.id}"><span class="family-avatar${family.id === activeBasketFamily ? ' is-current' : ''}" aria-hidden="true">${avatar}</span><span><strong>${family.name}</strong><small>${members.length} 位成员 · 我的身份：${familyRoleLabel(self?.role)}</small></span>${family.id === activeBasketFamily ? '<em>当前家庭</em>' : ''}<i class="mine-chevron" aria-hidden="true"></i></button>`;
  }).join('')}</section><section class="family-directory-actions"><button type="button" data-create-family><span class="family-action-plus" aria-hidden="true">＋</span>创建家庭</button><button type="button" data-scan-family><svg class="basket-scan-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3M6 12h12"/></svg>扫一扫加入家庭</button></section>`;
}

function familyMembersMarkup() {
  const family = activeManagedFamily();
  const members = managedFamilyMembers();
  const current = currentManagedMember();
  const canManage = current.role === 'creator' || current.role === 'admin';
  return `<section class="family-member-summary"><span><strong>${members.length} 位成员</strong><small>我的身份：${familyRoleLabel(current.role)}</small></span><button type="button" data-route="family:code">家庭码</button></section><section class="family-member-directory">${members.map((member) => {
    const displayName = familyMemberDisplayName(member);
    return `<button type="button" class="family-member-row" data-family-member="${member.id}"><span class="family-avatar${member.id === 'self' ? ' is-current' : ''}" aria-hidden="true">${displayName.slice(0, 1)}</span><span><strong>${escapeFamilyText(displayName)}${member.id === 'self' ? '（我）' : ''}</strong><small>${member.note ? `账号昵称：${escapeFamilyText(member.name)}` : '未设置备注名'}</small></span><em>${familyRoleLabel(member.role)}</em><i class="mine-chevron" aria-hidden="true"></i></button>`;
  }).join('')}</section>${canManage ? '<button class="subpage-primary-action" type="button" data-route="family:code">邀请新成员</button>' : ''}<section class="family-danger-zone">${current.role === 'creator' ? '<button type="button" data-family-action="transfer">转让创建者</button><button type="button" class="is-danger" data-family-action="dissolve">解散家庭</button>' : '<button type="button" class="is-danger" data-family-action="leave">退出家庭</button>'}</section>`;
}

function renderMineSubpage(route) {
  const content = document.querySelector('[data-mine-subpage-content]');
  const action = document.querySelector('[data-mine-subpage-action]');
  if (!content) return;
  const canRenameFamily = route === 'family:members' && currentManagedMember().role === 'creator';
  action.hidden = !mineSubpageMeta[route]?.action && !canRenameFamily;
  action.textContent = canRenameFamily ? '编辑' : '保存';
  action.setAttribute('aria-label', canRenameFamily ? '修改家庭名称' : '保存个人资料');
  let html = '';
  if (route === 'profile:edit') {
    const profile = document.querySelector('.mine-profile');
    const originalAvatar = profile.querySelector('.mine-avatar').src;
    const nickname = profile.querySelector('h1').textContent;
    const bio = profile.querySelector('p').textContent;
    html = `<section class="mine-subpage-profile-edit"><div class="profile-avatar-editor"><div class="profile-avatar-preview" data-profile-avatar-preview data-avatar-default-image="${originalAvatar}"><img src="${originalAvatar}" width="88" height="88" alt="${escapeFamilyText(nickname)}的头像"></div><div class="profile-avatar-actions"><label class="avatar-upload-button">更换头像<input type="file" accept="image/jpeg,image/png,image/webp" data-profile-avatar-input></label><button type="button" class="avatar-reset-button" data-profile-avatar-reset hidden>恢复原头像</button><small>JPG、PNG 或 WebP；建议正方形且不小于 512×512px；不超过 5MB。上传后自动居中裁切。</small></div></div><label>昵称<input value="${escapeFamilyText(nickname)}" aria-label="昵称" maxlength="12"></label><label>一句话介绍<textarea rows="2" aria-label="一句话介绍" maxlength="40">${escapeFamilyText(bio)}</textarea></label><p class="mine-subpage-note">个人资料只对自己可见，是否共享给家庭成员由你单独设置。</p></section>`;
  } else if (route === 'privacy:family-share' || route === 'privacy:family') {
    html = `<section class="subpage-intro"><span class="subpage-kicker">共享范围</span><h2>哪些信息让家人看到</h2><p>家庭成员认识彼此，口味和忌口用于采购、做饭时提醒。</p></section><button class="preference-edit-entry" type="button" data-route="preference:personal"><span><strong>编辑我的口味</strong><small>喜欢、忌口和过敏信息</small></span><i class="mine-chevron" aria-hidden="true"></i></button><section class="mine-subpage-list"><div class="share-setting"><span><strong>口味偏好</strong><small>喜欢吃什么、偏好什么口味</small></span><button class="subpage-switch is-on" type="button" role="switch" aria-checked="true" data-subpage-switch>已共享</button></div><div class="share-setting"><span><strong>忌口与过敏</strong><small>做饭和采购时提醒家庭成员</small></span><button class="subpage-switch is-on" type="button" role="switch" aria-checked="true" data-subpage-switch>已共享</button></div><div class="share-setting"><span><strong>我的菜谱</strong><small>新建菜谱默认仅自己可见</small></span><button class="subpage-switch" type="button" role="switch" aria-checked="false" data-subpage-switch>仅自己</button></div></section><p class="mine-subpage-note">你可以在每道菜谱发布前单独选择是否共享家庭。</p>`;
  } else if (route === 'family:members') {
    html = familyMembersMarkup();
  } else if (route === 'family:preferences') {
    html = `<section class="subpage-intro"><span class="subpage-kicker">周家</span><h2>家庭口味</h2><p>点击类别查看成员名字和具体标签。</p></section><div class="subpage-segmented" role="tablist"><button class="is-active" type="button" role="tab">忌口</button><button type="button" role="tab">喜欢</button><button type="button" role="tab">过敏</button></div><section class="mine-subpage-list preference-list"><div class="preference-member"><strong>妈妈</strong><div><span>不吃香菜</span><span>少辣</span></div></div><div class="preference-member"><strong>爸爸</strong><div><span>不吃肥肉</span><span>喜欢牛肉</span></div></div><div class="preference-member"><strong>奶奶</strong><div><span>少油</span><span>对花生过敏</span></div></div></section><button class="subpage-secondary-action" type="button" data-subpage-toast="添加偏好">＋ 添加成员偏好</button>`;
  } else if (route === 'family:code') {
    const family = activeManagedFamily();
    html = `<section class="family-code-panel"><span class="subpage-kicker">加入${family.name}</span><h2>让家人扫一扫加入</h2><div class="fake-qr" aria-label="${family.name}的家庭二维码"><span>${family.name}</span><b>⌗</b></div><p>二维码 10 分钟内有效，失效后可以重新生成。</p><div class="family-code-actions"><button class="subpage-primary-action" type="button" data-subpage-toast="已打开系统分享">分享二维码</button><button class="subpage-secondary-action" type="button" data-subpage-toast="二维码已保存到相册">保存图片</button></div><button class="family-code-refresh" type="button" data-subpage-toast="家庭码已刷新">刷新家庭码</button></section>`;
  } else if (route === 'family:manage') {
    html = familyDirectoryMarkup();
  } else if (route === 'purchase:records') {
    html = `<section class="subpage-intro"><span class="subpage-kicker">周家</span><h2>采购记录</h2><p>查看家庭过去采购过的食材，方便再次加入菜篮。</p></section><section class="mine-subpage-list purchase-list"><div><button class="purchase-record-hit" type="button" data-route="purchase:detail"><strong>2026 年 7 月 12 日</strong><small>番茄、虾仁、生姜等 8 项 · 已完成</small></button><button type="button" data-subpage-toast="已重新加入菜篮">再次采购</button></div><div><button class="purchase-record-hit" type="button" data-route="purchase:detail"><strong>2026 年 7 月 5 日</strong><small>鸡腿肉、土豆、青椒等 6 项 · 已完成</small></button><button type="button" data-subpage-toast="已重新加入菜篮">再次采购</button></div></section>`;
  } else if (route === 'notification:all') {
    const notificationRow = (icon, title, detail, on) => `<div class="notification-setting"><span class="mine-subpage-row-icon" aria-hidden="true">${icon}</span><span><strong>${title}</strong><small>${detail}</small></span><button class="subpage-switch${on ? ' is-on' : ''}" type="button" role="switch" aria-checked="${on}" data-subpage-switch>${on ? '开启' : '关闭'}</button></div>`;
    html = `<section class="subpage-intro"><span class="subpage-kicker">只提醒重要的事</span><h2>消息与提醒</h2><p>没有社交聊天，家庭通知只用于采购和聚餐协作。</p></section><section class="mine-subpage-list notification-list">${notificationRow('◷', '家庭提醒', '聚餐、开饭和采购提醒', true)}${notificationRow('✓', '开饭提醒', '管理员点击“开饭了”后通知家庭成员', true)}${notificationRow('!', '菜篮变更', '家庭成员加入或完成采购时提醒', false)}</section><div class="subpage-empty-note">暂无新的家庭通知</div>`;
  } else if (route === 'favorite:recipe' || route === 'history:recipe') {
    const favorite = route.startsWith('favorite');
    const recipes = favorite ? favoriteRecipeCatalog.filter((recipe) => favoriteRecipeIds.has(recipe.id)) : favoriteRecipeCatalog;
    html = `<div class="subpage-list-count" data-favorite-count>${favorite ? `${favoriteRecipeTotal} 道已收藏菜谱` : '16 道最近浏览菜谱'}</div><section class="mine-subpage-recipe-list" data-favorite-list>${recipes.map((recipe) => mineSubpageRecipeRow(recipe, favorite)).join('')}</section>`;
  } else if (route === 'settings:all') {
    html = `<section class="mine-subpage-list settings-list">${mineSubpageRow('♧', '消息与提醒', '家庭通知设置', 'notification:settings')}${mineSubpageRow('◌', '隐私与家庭共享', '管理哪些信息共享给家庭', 'privacy:family')}${mineSubpageRow('⌂', '账号与安全', '登录方式和账号安全', 'account:security')}${mineSubpageRow('ⓘ', '关于产品', '家里有菜 · 版本 0.1.0', 'about:product')}</section>`;
  } else if (route === 'account:security') {
    html = `<section class="subpage-intro"><span class="subpage-kicker">账号安全</span><h2>保护你的账号</h2><p>你的个人资料和家庭共享设置都可以随时调整。</p></section><section class="mine-subpage-list settings-list">${mineSubpageRow('◉', '手机号', '未绑定', 'auth:phone-login', '<span class="subpage-value">去绑定 ›</span>')}${mineSubpageRow('⌁', '登录设备', '当前设备 · 本机', '', '<span class="subpage-value">1 台</span>')}${mineSubpageRow('⇥', '切换账号', '退出后返回登录页面', 'auth:login')}${mineSubpageRow('▣', '注销账号', '注销后将无法恢复', '', '<span class="mine-chevron" aria-hidden="true">›</span>')}</section>`;
  } else if (route === 'about:product') {
    html = `<section class="about-product"><div class="about-mark">家</div><h2>家里有菜</h2><p>把一日三餐，变成一家人的共同计划。</p><span>版本 0.1.0 · 家庭菜谱原型</span></section>`;
  }
  content.innerHTML = html || '<div class="subpage-empty-note">暂无内容</div>';
  bindRoutes(content);
  bindImageFallbacks(content);
}

function openManagedFamily(familyId) {
  if (!familyMembersByFamily[familyId]) return;
  selectedManagedFamilyId = familyId;
  showMineSubpage('family:members', { parentRoute: 'family:manage' });
}

function rerenderManagedFamily() {
  renderMineSubpage('family:members');
  document.querySelector('[data-mine-subpage-title]').textContent = activeManagedFamily().name;
}

function openFamilyNameSheet() {
  const family = activeManagedFamily();
  if (!family || currentManagedMember().role !== 'creator') return;
  basketOverlayOpen(`<header class="sheet-header"><div><span class="sheet-eyebrow">家庭资料</span><h2>修改家庭名称</h2></div><button type="button" data-sheet-close aria-label="关闭">×</button></header><label class="family-note-field"><span>家庭名称</span><input type="text" maxlength="12" value="${escapeFamilyText(family.name)}" data-family-name-input aria-label="家庭名称"><small>家庭成员都会看到这个名称</small></label><button type="button" class="sheet-primary-action" data-save-family-name>保存名称</button>`);
  document.querySelector('[data-save-family-name]')?.addEventListener('click', () => {
    const nextName = document.querySelector('[data-family-name-input]')?.value.trim();
    if (!nextName) {
      showToast('请输入家庭名称');
      return;
    }
    family.name = nextName;
    if (family.id === activeBasketFamily) {
      document.querySelector('#mineFamilyTitle').textContent = nextName;
      document.querySelector('#basketFamilyName').textContent = nextName;
    }
    closeBasketOverlay();
    renderMineFamilyMenu();
    rerenderManagedFamily();
    showToast('家庭名称已更新');
  });
}

function confirmFamilyMemberAction(memberId, action) {
  const member = managedFamilyMembers().find((item) => item.id === memberId);
  if (!member) return;
  const isRoleAction = action === 'role';
  const title = isRoleAction ? (member.role === 'admin' ? '取消管理员权限？' : '设为管理员？') : `移除${member.name}？`;
  const detail = isRoleAction ? '管理员可以管理普通成员和家庭内容。' : '移除后，对方将无法查看这个家庭的菜篮和共享信息。';
  basketOverlayOpen(`<header class="sheet-header"><div><span class="sheet-eyebrow">成员权限</span><h2>${title}</h2></div><button type="button" data-sheet-close aria-label="关闭">×</button></header><p class="complete-copy">${detail}</p><div class="complete-actions"><button type="button" class="sheet-secondary-action" data-sheet-close>取消</button><button type="button" class="sheet-primary-action${isRoleAction ? '' : ' is-danger'}" data-confirm-member-action="${action}" data-member-id="${memberId}">确认</button></div>`);
  document.querySelector('[data-confirm-member-action]')?.addEventListener('click', () => {
    if (action === 'role') member.role = member.role === 'admin' ? 'member' : 'admin';
    if (action === 'remove') familyMembersByFamily[selectedManagedFamilyId] = managedFamilyMembers().filter((item) => item.id !== memberId);
    closeBasketOverlay();
    rerenderManagedFamily();
    showToast(action === 'role' ? '成员权限已更新' : '成员已移除');
  });
}

function openFamilyMemberSheet(memberId) {
  const member = managedFamilyMembers().find((item) => item.id === memberId);
  const current = currentManagedMember();
  if (!member) return;
  const canSetAdmin = current.role === 'creator' && member.role !== 'creator' && member.id !== 'self';
  const canRemove = current.role === 'creator' ? member.role !== 'creator' : current.role === 'admin' && member.role === 'member' && member.id !== 'self';
  const displayName = familyMemberDisplayName(member);
  basketOverlayOpen(`<header class="sheet-header"><div><span class="sheet-eyebrow">${familyRoleLabel(member.role)} · 账号昵称：${escapeFamilyText(member.name)}</span><h2>${escapeFamilyText(displayName)}${member.id === 'self' ? '（我）' : ''}</h2></div><button type="button" data-sheet-close aria-label="关闭">×</button></header><label class="family-note-field"><span>备注名</span><input type="text" maxlength="12" value="${escapeFamilyText(member.note)}" data-family-note-input aria-label="给${escapeFamilyText(member.name)}设置备注名"><small>用于家庭内识别，例如爸爸、大舅；不会修改对方账号昵称</small></label><button type="button" class="sheet-primary-action" data-save-family-note="${member.id}">保存备注名</button>${canSetAdmin || canRemove ? `<div class="family-sheet-actions">${canSetAdmin ? `<button type="button" data-member-role="${member.id}">${member.role === 'admin' ? '取消管理员' : '设为管理员'}</button>` : ''}${canRemove ? `<button type="button" class="is-danger" data-remove-family-member="${member.id}">移除成员</button>` : ''}</div>` : ''}`);
  document.querySelector('[data-save-family-note]')?.addEventListener('click', () => {
    member.note = document.querySelector('[data-family-note-input]')?.value.trim() || '';
    closeBasketOverlay();
    rerenderManagedFamily();
    showToast('成员备注名已保存');
  });
  document.querySelector('[data-member-role]')?.addEventListener('click', () => confirmFamilyMemberAction(member.id, 'role'));
  document.querySelector('[data-remove-family-member]')?.addEventListener('click', () => confirmFamilyMemberAction(member.id, 'remove'));
}

function showMineSubpage(route, { parentRoute = '' } = {}) {
  const view = document.querySelector('#mineSubpageView');
  if (!view || !mineSubpageMeta[route]) return;
  document.querySelector('#homeScroll').hidden = true;
  document.querySelector('#categoryView').hidden = true;
  document.querySelector('#basketView').hidden = true;
  document.querySelector('#mineView').hidden = true;
  document.querySelector('#mineRecipeListView').hidden = true;
  document.querySelector('#recipeCreateView').hidden = true;
  view.hidden = false;
  document.body.classList.add('is-mine-subpage-open');
  document.querySelector('.tab-bar')?.setAttribute('inert', '');
  document.querySelector('.tab-bar')?.setAttribute('aria-hidden', 'true');
  currentView = 'mine-subpage';
  view.dataset.route = route;
  mineSubpageParentRoute = parentRoute;
  document.querySelector('[data-mine-subpage-back]').setAttribute('aria-label', route === 'family:members' && parentRoute === 'family:manage' ? '返回家庭管理' : route === 'family:code' && parentRoute === 'family:members' ? `返回${activeManagedFamily().name}成员管理` : '返回我的页面');
  document.querySelector('[data-mine-subpage-title]').textContent = route === 'family:members' ? activeManagedFamily().name : mineSubpageMeta[route].title;
  renderMineSubpage(route);
  view.focus({ preventScroll: true });
}

function hideMineSubpage() {
  const view = document.querySelector('#mineSubpageView');
  if (!view || view.hidden) return;
  if (view.dataset.route === 'family:members' && mineSubpageParentRoute === 'family:manage') {
    showMineSubpage('family:manage');
    return;
  }
  if (view.dataset.route === 'family:code' && mineSubpageParentRoute === 'family:members') {
    showMineSubpage('family:members', { parentRoute: 'family:manage' });
    return;
  }
  view.hidden = true;
  document.body.classList.remove('is-mine-subpage-open');
  document.querySelector('.tab-bar')?.removeAttribute('inert');
  document.querySelector('.tab-bar')?.removeAttribute('aria-hidden');
  mineSubpageParentRoute = '';
  showMineView();
}

function openMediaSourceSheet() {
  document.querySelector('[data-media-source-sheet]')?.removeAttribute('hidden');
}

function closeMediaSourceSheet() {
  document.querySelector('[data-media-source-sheet]')?.setAttribute('hidden', '');
}

function handleMediaSource(source) {
  closeMediaSourceSheet();
  const sourceLabels = { photo: '照片', album: '相册图片', video: '视频', file: '文件' };
  showToast(`已选择${sourceLabels[source] || '媒体'}，正在处理`);
  window.setTimeout(() => {
    createHasMedia = true;
    const upload = document.querySelector('#recipeCreateView .media-empty-upload');
    upload?.classList.add('has-media');
    if (upload) {
      upload.querySelector('strong').textContent = '已添加媒体';
      upload.querySelector('small').textContent = '点击可继续添加，下一步可排序和删除';
    }
    syncRecipeCreate();
    showToast('媒体已添加，可长按排序或删除');
  }, 360);
}

function openMediaDeleteDialog(target) {
  pendingMediaDelete = target;
  document.querySelector('[data-media-delete-dialog]')?.removeAttribute('hidden');
}

function closeMediaDeleteDialog() {
  pendingMediaDelete = null;
  document.querySelector('[data-media-delete-dialog]')?.setAttribute('hidden', '');
}

function confirmMediaDelete() {
  if (!pendingMediaDelete) return;
  const media = pendingMediaDelete.closest('.media-tile, .media-cover-card, .step-media-item');
  media?.remove();
  closeMediaDeleteDialog();
  showToast('媒体已删除');
}

function validateRecipeCreateStep() {
  const view = document.querySelector('#recipeCreateView');
  if (createStep === 1) {
    const title = view.querySelector('[data-create-recipe-name]')?.value.trim();
    if (!title) { showToast('请先填写菜谱名称'); view.querySelector('[data-create-recipe-name]')?.focus(); return false; }
    if (!createHasMedia) { showToast('请至少添加一张图片或一个视频'); return false; }
  }
  if (createStep === 3 && ![...view.querySelectorAll('.step-editor-card textarea')].some((input) => input.value.trim())) {
    showToast('请至少填写一个制作步骤');
    return false;
  }
  return true;
}

function publishRecipeCreate() {
  const view = document.querySelector('#recipeCreateView');
  const title = view.querySelector('[data-create-recipe-name]')?.value.trim() || '未命名菜谱';
  const list = document.querySelector('[data-mine-recipes-loaded]');
  const route = `my-recipe:${encodeURIComponent(title)}`;
  if (list && !list.querySelector(`[data-route="${route}"]`)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.route = route;
    button.innerHTML = '<img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=260&q=82" width="76" height="76" alt="" loading="lazy"><span><strong></strong><small>仅自己</small></span><i class="mine-chevron" aria-hidden="true"></i>';
    button.querySelector('strong').textContent = title;
    button.querySelector('img').alt = title;
    list.prepend(button);
    bindRoutes(list);
    bindImageFallbacks(button);
  }
  hideRecipeCreate();
  showMineRecipeList();
  showToast('菜谱已发布，可在我的菜谱中查看');
}

function advanceRecipeCreate() {
  if (!validateRecipeCreateStep()) return;
  if (createStep === 4) {
    publishRecipeCreate();
    return;
  }
  createStep += 1;
  syncRecipeCreate();
}

function retreatRecipeCreate() {
  if (createStep === 1) {
    hideRecipeCreate();
    return;
  }
  createStep -= 1;
  syncRecipeCreate();
}

function closeMineRecipeList() {
  if (history.state?.view === 'mine-recipes') history.back();
  else {
    if (window.location.hash === '#mine-recipes') history.replaceState(history.state, '', `${window.location.pathname}${window.location.search}`);
    hideMineRecipeList();
  }
}

function retryMineRecipes() {
  renderMineRecipeState('loading');
  mineRecipeReloadTimer = window.setTimeout(() => {
    renderMineRecipeState('loaded');
    showToast('菜谱已重新加载');
  }, 520);
}

function bindRoutes(scope = document) {
  scope.querySelectorAll('[data-route]').forEach((target) => {
    if (target.dataset.bound) return;
    target.dataset.bound = 'true';
    target.addEventListener('click', () => handleRoute(target.dataset.route));
  });
}

const fallbackImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 148"><rect width="148" height="148" fill="#ecefe9"/><text x="74" y="78" text-anchor="middle" fill="#7a8177" font-family="-apple-system,BlinkMacSystemFont,PingFang SC,sans-serif" font-size="13">图片待配置</text></svg>')}`;
function bindImageFallbacks(scope = document) {
  scope.querySelectorAll('img').forEach((image) => {
    if (image.dataset.fallbackBound) return;
    image.dataset.fallbackBound = 'true';
    image.addEventListener('error', () => {
      image.classList.add('image-fallback');
      image.src = fallbackImage;
    }, { once: true });
  });
}

function renderRecommendations(index) {
  const rail = document.querySelector('#recommendationRail');
  rail.replaceChildren(...recommendations[index % recommendations.length].map((item) => {
    const article = document.createElement('article');
    article.className = 'recipe-card';
    article.innerHTML = `<button class="recipe-hit" type="button" data-route="recipe:${item.id}"><img src="${item.image}" width="132" height="132" alt="${item.title}" loading="lazy"><h3>${item.title}</h3></button><div class="meta-row"><span>${item.meta}</span><button class="favorite" data-favorite type="button" aria-label="收藏${item.title}" aria-pressed="false"><span class="icon icon-bookmark" aria-hidden="true"></span></button></div>`;
    return article;
  }));
  bindRoutes(rail);
  bindImageFallbacks(rail);
  rail.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); toggleFavorite(button); }));
}

function rotateRecommendations(button) {
  if (button.disabled) return;
  button.disabled = true;
  button.classList.add('is-loading');
  window.setTimeout(() => {
    recommendationBatch += 1;
    renderRecommendations(recommendationBatch);
    button.disabled = false;
    button.classList.remove('is-loading');
    showToast('推荐内容已更新');
  }, 420);
}

function appendFeedBatch() {
  if (feedLoading) return;
  feedLoading = true;
  sentinel.dataset.state = 'loading';
  sentinel.textContent = '正在准备更多内容';
  window.setTimeout(() => {
    const simulateError = new URLSearchParams(window.location.search).has('simulateError');
    if (simulateError && !errorShown) {
      errorShown = true;
      feedLoading = false;
      sentinel.dataset.state = 'error';
      sentinel.innerHTML = '<button type="button" data-retry-feed>加载失败，点击重试</button>';
      sentinel.querySelector('[data-retry-feed]').addEventListener('click', appendFeedBatch, { once: true });
      return;
    }
    feedBatch += 1;
    const holder = document.createElement('div');
    holder.innerHTML = feedTemplates[(feedBatch - 1) % feedTemplates.length](feedBatch);
    const section = holder.firstElementChild;
    sentinel.before(section);
    bindRoutes(section);
    bindImageFallbacks(section);
    feedLoading = false;
    sentinel.dataset.state = 'idle';
    sentinel.textContent = '继续向下，发现新内容';
  }, 520);
}

document.querySelector('#searchForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = document.querySelector('#searchInput').value.trim();
  showWorkflow('search', { query });
});
document.querySelector('.notification-button').addEventListener('click', () => showWorkflow('notifications'));
document.querySelector('[data-refresh-feed]')?.addEventListener('click', (event) => rotateRecommendations(event.currentTarget));
document.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); toggleFavorite(button); }));
document.querySelectorAll('.channel[data-channel]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.channel[data-channel]').forEach((item) => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
  });
  setHeroChannel(button.dataset.channel);
  renderHomeChannel(button.dataset.channel);
  if (window.scrollY > 420) window.scrollTo({ top: 420, behavior: 'smooth' });
}));
document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
  activateTab(button.dataset.tab);
}));
document.querySelector('[data-mine-recipes-back]').addEventListener('click', closeMineRecipeList);
document.querySelector('[data-mine-recipes-retry]').addEventListener('click', retryMineRecipes);
document.querySelector('[data-create-back]').addEventListener('click', hideRecipeCreate);
document.querySelector('[data-create-prev]').addEventListener('click', retreatRecipeCreate);
document.querySelector('[data-create-next]').addEventListener('click', advanceRecipeCreate);
document.querySelector('[data-create-draft]').addEventListener('click', () => showToast('草稿已保存'));
document.querySelector('[data-mine-subpage-back]').addEventListener('click', hideMineSubpage);
document.querySelector('[data-mine-subpage-action]').addEventListener('click', () => {
  const route = document.querySelector('#mineSubpageView')?.dataset.route;
  if (route === 'family:members') openFamilyNameSheet();
  else if (route === 'profile:edit') {
    const nickname = document.querySelector('.mine-subpage-profile-edit input[aria-label="昵称"]')?.value.trim();
    if (!nickname) {
      showToast('请输入昵称');
      return;
    }
    const bio = document.querySelector('.mine-subpage-profile-edit textarea[aria-label="一句话介绍"]')?.value.trim() || '认真吃饭，也认真生活';
    const previewImage = document.querySelector('[data-profile-avatar-preview] img');
    const profile = document.querySelector('.mine-profile');
    profile.querySelector('.mine-avatar').src = previewImage.src;
    profile.querySelector('.mine-avatar').alt = `${nickname}的头像`;
    profile.querySelector('h1').textContent = nickname;
    profile.querySelector('p').textContent = bio;
    showToast('个人资料已保存');
  }
});
document.querySelector('#mineSubpageView').addEventListener('click', (event) => {
  const switcher = event.target.closest('[data-subpage-switch]');
  const toastTarget = event.target.closest('[data-subpage-toast]');
  const familyTarget = event.target.closest('[data-open-family-members]');
  const memberTarget = event.target.closest('[data-family-member]');
  const createFamily = event.target.closest('[data-create-family]');
  const scanFamily = event.target.closest('[data-scan-family]');
  const familyAction = event.target.closest('[data-family-action]');
  const avatarReset = event.target.closest('[data-profile-avatar-reset]');
  const removeFavorite = event.target.closest('[data-remove-favorite]');
  if (removeFavorite) {
    const recipeId = removeFavorite.dataset.removeFavorite;
    if (!favoriteRecipeIds.delete(recipeId)) return;
    favoriteRecipeTotal = Math.max(0, favoriteRecipeTotal - 1);
    const row = removeFavorite.closest('[data-favorite-row]');
    row?.classList.add('is-removing');
    removeFavorite.disabled = true;
    window.setTimeout(() => {
      row?.remove();
      const count = document.querySelector('[data-favorite-count]');
      if (count) count.textContent = `${favoriteRecipeTotal} 道已收藏菜谱`;
      const homeCount = document.querySelector('[data-favorite-home-count]');
      if (homeCount) homeCount.textContent = `${favoriteRecipeTotal} 道菜谱`;
      const list = document.querySelector('[data-favorite-list]');
      if (list && !list.children.length) list.innerHTML = '<div class="subpage-empty-note">当前展示的收藏已整理完</div>';
    }, 180);
    showToast('已取消收藏', { actionLabel: '撤销', onAction: () => {
      favoriteRecipeIds.add(recipeId);
      favoriteRecipeTotal += 1;
      showMineSubpage('favorite:recipe');
      const homeCount = document.querySelector('[data-favorite-home-count]');
      if (homeCount) homeCount.textContent = `${favoriteRecipeTotal} 道菜谱`;
      showToast('已恢复收藏');
    } });
  } else if (avatarReset) {
    resetAvatarPreview(document.querySelector('[data-profile-avatar-preview]'), avatarReset, document.querySelector('[data-profile-avatar-input]'));
  } else if (familyTarget) {
    openManagedFamily(familyTarget.dataset.openFamilyMembers);
  } else if (memberTarget) {
    openFamilyMemberSheet(memberTarget.dataset.familyMember);
  } else if (createFamily) {
    showWorkflow('family-create');
  } else if (scanFamily) {
    showWorkflow('scan-family');
  } else if (familyAction) {
    const messages = { transfer: '请选择要转让创建者的成员', dissolve: '解散家庭前需要再次确认', leave: '退出家庭前需要再次确认' };
    showToast(messages[familyAction.dataset.familyAction]);
  } else if (switcher) {
    const enabled = switcher.getAttribute('aria-checked') === 'true';
    switcher.setAttribute('aria-checked', String(!enabled));
    switcher.classList.toggle('is-on', !enabled);
    switcher.textContent = !enabled ? '开启' : '关闭';
    showToast(!enabled ? '已开启共享或提醒' : '已关闭共享或提醒');
  } else if (toastTarget) {
    showToast(toastTarget.dataset.subpageToast);
  }
});
document.querySelector('#mineSubpageView').addEventListener('change', (event) => {
  const input = event.target.closest('[data-profile-avatar-input]');
  if (!input) return;
  applyAvatarFile(input, document.querySelector('[data-profile-avatar-preview]'), document.querySelector('[data-profile-avatar-reset]'));
});
document.querySelector('#workflowView').addEventListener('click', (event) => {
  const back = event.target.closest('[data-workflow-back]');
  const keyword = event.target.closest('[data-search-keyword]');
  const scanSuccess = event.target.closest('[data-scan-success]');
  const scanAlbum = event.target.closest('[data-scan-album]');
  const confirmJoin = event.target.closest('[data-confirm-join]');
  const preferenceTag = event.target.closest('[data-preference-tag]');
  const addPreference = event.target.closest('[data-add-preference]');
  const savePreferences = event.target.closest('[data-save-preferences]');
  const shareRecipe = event.target.closest('[data-recipe-share]');
  const editRecipe = event.target.closest('[data-edit-owned-recipe]');
  const duplicateRecipe = event.target.closest('[data-duplicate-recipe]');
  const deleteRecipe = event.target.closest('[data-delete-owned-recipe]');
  const sendCode = event.target.closest('[data-send-code]');
  const repurchase = event.target.closest('[data-repurchase]');
  const readAll = event.target.closest('[data-read-all]');
  const mealReady = event.target.closest('[data-meal-ready]');
  const editAttendance = event.target.closest('[data-edit-attendance]');
  const familyAvatarText = event.target.closest('[data-family-avatar-text]');
  const familyAvatarReset = event.target.closest('[data-family-avatar-reset]');
  if (back) {
    hideWorkflow();
  } else if (keyword) {
    renderWorkflow('search', { query: keyword.dataset.searchKeyword });
  } else if (scanSuccess) {
    showWorkflow('join-family');
  } else if (scanAlbum) {
    showToast('请选择包含家庭二维码的图片');
  } else if (confirmJoin) {
    showToast('已加入爸妈家');
    hideWorkflow();
  } else if (preferenceTag) {
    const selected = preferenceTag.getAttribute('aria-pressed') === 'true';
    preferenceTag.setAttribute('aria-pressed', String(!selected));
  } else if (addPreference) {
    showToast('可输入新的口味标签');
  } else if (savePreferences) {
    showToast('个人口味已保存');
    hideWorkflow();
  } else if (shareRecipe) {
    const shared = shareRecipe.getAttribute('aria-checked') === 'true';
    shareRecipe.setAttribute('aria-checked', String(!shared));
    shareRecipe.textContent = shared ? '仅自己' : '已共享';
    shareRecipe.previousElementSibling.querySelector('small').textContent = shared ? '只有自己可以看到这道菜谱' : '周家成员可以看到这道菜谱';
  } else if (editRecipe) {
    hideWorkflow();
    showRecipeCreate();
    showToast('已进入菜谱编辑模式');
  } else if (duplicateRecipe) {
    showToast('已复制为新的个人菜谱');
  } else if (deleteRecipe) {
    if (deleteRecipe.dataset.confirmed === 'true') {
      showToast('菜谱已删除');
      hideWorkflow();
    } else {
      deleteRecipe.dataset.confirmed = 'true';
      deleteRecipe.querySelector('strong').textContent = '再次点击确认删除';
      window.setTimeout(() => {
        if (!deleteRecipe.isConnected) return;
        deleteRecipe.dataset.confirmed = 'false';
        deleteRecipe.querySelector('strong').textContent = '删除菜谱';
      }, 2800);
    }
  } else if (sendCode) {
    sendCode.disabled = true;
    sendCode.textContent = '59 秒后重发';
    showToast('验证码已发送');
  } else if (repurchase) {
    showToast('8 项食材已加入周家菜篮');
    hideWorkflow();
    activateTab('basket');
  } else if (readAll) {
    document.querySelectorAll('.notification-feed-row').forEach((row) => row.classList.remove('is-unread'));
    showToast('已全部标记为已读');
  } else if (mealReady) {
    showToast('“开饭了”已提醒 4 位家庭成员');
  } else if (editAttendance) {
    showToast('可选择本次参加聚餐的家庭成员');
  } else if (familyAvatarText) {
    const preview = document.querySelector('[data-family-avatar-preview]');
    document.querySelectorAll('[data-family-avatar-text]').forEach((button) => {
      const selected = button === familyAvatarText;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    preview.dataset.avatarDefaultText = familyAvatarText.dataset.familyAvatarText;
    preview.textContent = familyAvatarText.dataset.familyAvatarText;
    document.querySelector('[data-family-avatar-input]').value = '';
    document.querySelector('[data-family-avatar-reset]').hidden = true;
  } else if (familyAvatarReset) {
    resetAvatarPreview(document.querySelector('[data-family-avatar-preview]'), familyAvatarReset, document.querySelector('[data-family-avatar-input]'));
  }
});
document.querySelector('#workflowView').addEventListener('change', (event) => {
  const input = event.target.closest('[data-family-avatar-input]');
  if (!input) return;
  applyAvatarFile(input, document.querySelector('[data-family-avatar-preview]'), document.querySelector('[data-family-avatar-reset]'));
});
document.querySelector('#workflowView').addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.matches('[data-workflow-search]')) {
    const query = new FormData(event.target).get('query')?.trim() || '';
    const content = document.querySelector('[data-workflow-content]');
    content.innerHTML = '<section class="workflow-loading" aria-live="polite"><span></span><span></span><span></span><p>正在查找相关内容</p></section>';
    window.setTimeout(() => renderWorkflow('search', { query }), 320);
  } else if (event.target.matches('[data-family-create-form]')) {
    const name = new FormData(event.target).get('familyName')?.trim() || '新家庭';
    const id = `family-${Date.now()}`;
    const avatar = event.target.querySelector('[data-family-avatar-preview] img')?.src || '';
    basketFamilies.push({ id, name, meta: '1 位成员 · 菜篮为空', avatar });
    familyMembersByFamily[id] = [{ id: 'self', name: document.querySelector('.mine-profile-copy h1')?.textContent || '我', note: '', role: 'creator' }];
    selectedManagedFamilyId = id;
    showToast(`${name}已创建，家庭码已生成`);
    hideWorkflow();
    showMineSubpage('family:manage');
  } else if (event.target.matches('[data-auth-form]')) {
    showToast(workflowRoute === 'login' ? '登录成功' : '信息已提交');
    hideWorkflow();
  } else if (event.target.matches('[data-gathering-form]')) {
    showToast('家庭聚餐已保存');
  }
});
document.querySelector('#recipeCreateView').addEventListener('click', (event) => {
  const sourceTrigger = event.target.closest('[data-open-media-source]');
  const sourceChoice = event.target.closest('[data-media-source]');
  const sourceCancel = event.target.closest('[data-close-media-source]');
  const mediaDelete = event.target.closest('[data-media-delete], [data-step-media-delete]');
  if (sourceChoice) handleMediaSource(sourceChoice.dataset.mediaSource);
  else if (sourceCancel) closeMediaSourceSheet();
  else if (sourceTrigger) openMediaSourceSheet();
  else if (mediaDelete) openMediaDeleteDialog(mediaDelete);
  if (event.target.closest('[data-cancel-media-delete]')) closeMediaDeleteDialog();
  if (event.target.closest('[data-confirm-media-delete]')) confirmMediaDelete();
  if (event.target.closest('[data-step-timer]') || event.target.closest('[data-preview-timer]')) showToast('计时器已设置为 5 分钟');
  if (event.target.closest('[data-step-note]')) showToast('提示已添加到步骤 1');
});
window.addEventListener('popstate', () => {
  if (history.state?.view === 'mine-recipes' || window.location.hash === '#mine-recipes') showMineRecipeList({ pushHistory: false });
  else hideMineRecipeList();
});

document.querySelector('#categoryPrimaryNav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category-key]');
  if (!button) return;
  if (button.dataset.categoryKey === categoryKey && !categoryQuery) return;
  setCategoryLoading(() => {
    categoryKey = button.dataset.categoryKey;
    categoryQuery = '';
    document.querySelector('#categorySearchInput').value = '';
    document.querySelector('[data-clear-category-search]').hidden = true;
  });
});

document.querySelector('#categoryPrimaryNav').addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
  const current = tabs.indexOf(document.activeElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].focus();
  tabs[next].click();
});

document.querySelector('#categorySecondaryNav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-secondary-label]');
  if (!button) return;
  if (categoryCatalog[categoryKey].selected === button.dataset.secondaryLabel && !categoryQuery) return;
  setCategoryLoading(() => {
    categoryCatalog[categoryKey].selected = button.dataset.secondaryLabel;
    categoryQuery = '';
    document.querySelector('#categorySearchInput').value = '';
    document.querySelector('[data-clear-category-search]').hidden = true;
  });
});

document.querySelector('#categorySearchForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = document.querySelector('#categorySearchInput').value.trim();
  categoryQuery = query;
  document.querySelector('[data-clear-category-search]').hidden = !query;
  renderCategory();
  if (!query) showToast('请输入搜索内容');
});
document.querySelector('#categorySearchInput').addEventListener('input', (event) => {
  categoryQuery = event.currentTarget.value.trim();
  document.querySelector('[data-clear-category-search]').hidden = !categoryQuery;
  renderCategory();
});
document.querySelector('[data-clear-category-search]').addEventListener('click', clearCategorySearch);
document.querySelector('[data-clear-basket]').addEventListener('click', () => {
  basketItems.clear();
  basketArchived.clear();
  basketPurchased.clear();
  persistBasketItems();
  updateBasketCount();
  renderBasketView();
  showToast('菜篮已清空');
});
document.querySelector('[data-basket-family-trigger]').addEventListener('click', toggleFamilyMenu);
document.querySelector('[data-mine-family-trigger]').addEventListener('click', toggleMineFamilyMenu);
document.addEventListener('click', (event) => {
  if (currentView !== 'basket') return;
  const heading = document.querySelector('.basket-heading');
  if (heading && !heading.contains(event.target)) closeFamilyMenu();
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.mine-family-copy')) closeMineFamilyMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { closeFamilyMenu(); closeMineFamilyMenu(); if (!document.querySelector('#basketOverlay').hidden) closeBasketOverlay(); if (!document.querySelector('#mineRecipeListView').hidden) closeMineRecipeList(); }
});
document.querySelector('#scaleToggle').addEventListener('click', (event) => {
  const current = Number(root.dataset.scale || '1');
  const next = current >= 2 ? 1 : current === 1 ? 1.2 : current === 1.2 ? 1.5 : 2;
  root.dataset.scale = String(next);
  root.style.setProperty('--type-scale', String(next));
  event.currentTarget.textContent = `字体 ${Math.round(next * 100)}%`;
});

heroDots.forEach((dot) => dot.addEventListener('click', () => {
  setActiveHeroSlide(Number(dot.dataset.heroDot));
  startHeroAutoplay();
}));
heroCarousel.addEventListener('touchstart', (event) => { heroTouchStartX = event.changedTouches[0].clientX; }, { passive: true });
heroCarousel.addEventListener('touchend', (event) => {
  const delta = event.changedTouches[0].clientX - heroTouchStartX;
  if (Math.abs(delta) < 36) return;
  setActiveHeroSlide(heroIndex + (delta < 0 ? 1 : -1));
  startHeroAutoplay();
}, { passive: true });
document.addEventListener('visibilitychange', startHeroAutoplay);

bindRoutes();
bindImageFallbacks();
updateBasketCount();
renderRecommendations(0);
setActiveHeroSlide(0);
startHeroAutoplay();
window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState); }, { passive: true });
updateScrollState();
new IntersectionObserver(([entry]) => { if (entry.isIntersecting) appendFeedBatch(); }, { rootMargin: '240px' }).observe(sentinel);

if (window.location.hash === '#mine-recipes') {
  showMineView();
  showMineRecipeList({ pushHistory: false });
}

export { appendFeedBatch, filterCategoryItems, handleRoute, renderBasketView, renderCategoryState, renderRecommendations, rotateRecommendations, searchCategoryCatalog, setActiveHeroSlide, setScrolledState, showBasketView, showToast, toggleFavorite, updateBasketCount, updateScrollState };

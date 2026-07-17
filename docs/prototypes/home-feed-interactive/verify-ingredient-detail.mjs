import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./fixes.css', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(js.includes("tabs: ['怎么挑', '怎么放', '怎么吃']") && js.includes('panels: ['), '食材详情必须为三个 Tab 提供独立内容');
['看颜色', '室温催熟', '生吃', '本地参考', '最近更新'].forEach((token) => assert(js.includes(token), `食材详情缺少内容: ${token}`));
assert(js.includes('role="tabpanel"') && js.includes('aria-controls="detail-panel"') && js.includes('aria-labelledby="detail-tab-'), '食材详情 Tab 缺少完整的可访问语义');
assert(js.includes('data-route="recipe:tomato-egg"') && js.includes('data-route="recipe:tomato-beef"'), '适合做卡片必须提供菜谱详情路由');
assert(js.includes('navigator.share') && js.includes('navigator.clipboard.writeText'), '分享必须调用真实系统分享或复制能力');
assert(js.includes('basketItems.delete(itemKey)') && js.includes('aria-pressed="${isInBasket}"') && js.includes('已加入'), '加入菜篮必须支持已加入状态和取消');
assert(css.includes('.detail-view:not(.is-recipe-detail) .detail-heading') && css.includes('.detail-view:not(.is-recipe-detail) .detail-info-strip'), '非菜谱详情首屏信息区域必须压缩');
assert(/html\[data-scale="2"\] \.detail-info-strip[^}]*grid-template-columns:\s*1fr/s.test(css), '200% 字体下信息条必须改为单列避免截断');
assert(css.includes('.detail-guide-cards') && css.includes('.detail-guide-card img'), '挑选方法必须使用图文识别卡片');
assert(js.includes('function ingredientRelatedRecipesPanel('), '食材详情缺少相关菜谱模块渲染器');
assert(js.includes("type === 'ingredient' ? ingredientRelatedRecipesPanel(data.name) : ''"), '相关菜谱模块必须只在食材详情显示');
assert(js.includes('${detailIngredientDiscovery}</section>'), '相关菜谱模块必须位于详情 Tab 模块之后');
['recipe:tomato-egg', 'recipe:tomato-beef', 'recipe:tomato-soup'].forEach((route) => assert(js.includes(`data-route="${route}"`), `相关菜谱缺少路由: ${route}`));
assert(js.includes('data-detail-ingredient-more'), '相关菜谱缺少更多入口');
assert(css.includes('.ingredient-related-rail') && css.includes('grid-auto-columns:calc((100% - 20px) / 2.3)'), '相关菜谱必须横向露出约 2.3 张');
assert(css.includes('.ingredient-related-card img') && css.includes('aspect-ratio:1'), '相关菜谱图片必须为正方形');

console.log('ingredient detail verification passed');

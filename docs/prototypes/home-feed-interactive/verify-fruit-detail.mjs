import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./fixes.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(js.includes("tabs: ['怎么挑', '成熟度', '怎么放']") && js.includes('常温催熟') && js.includes('果肩微弹'), '水果详情必须提供三个真实 Tab 内容');
['偏生', '正好', '熟软', '冷藏并在 1 天内吃完', '切开后'].forEach((token) => assert(js.includes(token), `水果详情缺少内容: ${token}`));
assert(js.includes("info: [['6月–8月', '时令'], ['约¥10–15/斤', '参考价格'], ['常温催熟', '保存提示']]"), '水果顶部信息必须去重并改为可行动信息');
assert(js.includes('function fruitRelatedRecipesPanel('), '水果详情缺少相关吃法模块');
assert(js.includes("type === 'fruit' ? fruitRelatedRecipesPanel(data.name) : ''"), '水果相关吃法只能出现在水果详情');
assert(js.includes('${detailFruitDiscovery}${detailDrinkDiscovery}${detailSeasoningDiscovery}</section>'), '水果相关吃法必须位于详情 Tab 模块之后');
['recipe:peach-yogurt', 'drink:peach-tea', 'drink:peach-soda'].forEach((route) => assert(js.includes(`data-route="${route}"`), `水果相关吃法缺少路由: ${route}`));
assert(js.includes('data-detail-fruit-more'), '水果相关吃法缺少更多入口');
assert(css.includes('.fruit-ripeness') && css.includes('.fruit-ripeness-track'), '成熟度必须使用连续的视觉刻度');
assert(css.includes('.fruit-related-rail') && css.includes('grid-auto-columns:calc((100% - 20px) / 2.3)'), '水果相关吃法必须横向露出约 2.3 张');
assert(css.includes('.fruit-related-card img') && css.includes('aspect-ratio:1'), '水果相关吃法图片必须为正方形');
assert(css.includes('.detail-tabs button:focus-visible'), '详情 Tab 必须提供键盘焦点反馈');
const styleVersion = html.match(/fixes\.css\?v=([^"']+)/)?.[1];
const scriptVersion = html.match(/app\.js\?v=([^"']+)/)?.[1];
assert(styleVersion && styleVersion === scriptVersion, '详情更新后样式与脚本必须使用统一非空资源版本');

console.log('fruit detail verification passed');

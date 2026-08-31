import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('./fixes.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

['相似菜谱', '鲈鱼还能这样做', '适合搭配的饮品'].forEach((title) => assert(js.includes(title), `缺少详情页继续发现模块: ${title}`));
assert(js.includes('function recipeDiscoveryPanel()'), '缺少菜谱详情页继续发现模板');
assert(js.includes('data-detail-discovery=') && js.includes('data-detail-discovery-more='), '继续发现入口缺少可点击反馈');
assert(js.includes('class="detail-body"') && js.includes('role="tabpanel"') && js.includes('${detailDiscovery}${detailIngredientDiscovery}${detailFruitDiscovery}${detailDrinkDiscovery}${detailSeasoningDiscovery}</section>'), '继续发现内容必须位于详情面板之后');
assert(css.includes('.detail-similar-rail') && css.includes('overflow-x:auto'), '相似菜谱必须支持横向浏览');
assert(css.includes('.detail-drink-rail') && css.includes('grid-auto-flow:column'), '饮品搭配必须使用横向小卡');
assert(css.includes('.detail-ingredient-recipe') && css.includes('min-height:76px'), '同食材菜谱必须使用紧凑列表');
assert(!js.includes('厨房补充') && !js.includes('周家做过 3 次'), '继续发现区域不能混入管理型内容');
const styleVersion = html.match(/fixes\.css\?v=([^"']+)/)?.[1];
const scriptVersion = html.match(/app\.js\?v=([^"']+)/)?.[1];
assert(styleVersion && styleVersion === scriptVersion, 'index.html 的样式与脚本必须使用统一非空资源版本');

console.log('recipe detail discovery verification passed');

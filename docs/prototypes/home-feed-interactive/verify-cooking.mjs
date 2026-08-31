import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('./fixes.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(html.includes('id="cookingView"'), '缺少独立烹饪模式容器');
assert(js.includes("addEventListener('click', showCookingView)"), '去烹饪按钮未进入烹饪模式');
assert((js.match(/title: '[^']+'/g) || []).filter((item) => ['处理鲈鱼', '腌制去腥', '上锅蒸制', '淋油调味', '完成装盘'].some((name) => item.includes(name))).length === 5, '清蒸鲈鱼必须包含 5 个烹饪步骤');
['toggleCookingTimer', 'resetCookingTimer', 'data-cooking-prev', 'data-cooking-next', '完成烹饪', 'closeCookingView'].forEach((token) => assert(js.includes(token), `烹饪流程能力缺失: ${token}`));
assert(css.includes('.cooking-actions { position:fixed'), '烹饪模式底部操作栏必须固定');
assert(css.includes('env(safe-area-inset-top') && css.includes('env(safe-area-inset-bottom'), '烹饪模式缺少安全区适配');
assert(css.includes('transform:scaleX(var(--cooking-progress,0))'), '烹饪进度必须使用无布局抖动的 transform 动画');
assert(js.includes('function recipeIngredientPanel()') && js.includes('detail-ingredient-grid'), '菜谱食材必须使用图文宫格清单');
assert(!js.includes('detail-ingredient-header') && !js.includes('data-detail-basket-all'), '食材页签不能保留重复标题、人数或菜篮入口');
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'), '食材清单默认必须使用四列布局');
assert(js.includes('<div class="detail-tab-module"><nav class="detail-tabs"') && js.includes('</section></div>${detailDiscovery}'), '菜谱详情 Tab 和当前内容必须收进同一个模块');
assert(/\.detail-view\.is-recipe-detail \.detail-tab-module\s*\{[^}]*border-top:[^}]*border-bottom:[^}]*background:\s*transparent/s.test(css), '菜谱详情 Tab 模块必须使用连续页面底色和轻分隔');
assert(/\.detail-view\.is-recipe-detail \.detail-ingredient-card\s*\{[^}]*border:\s*0[^}]*background:\s*transparent/s.test(css), '食材单项必须取消独立白底和描边');
assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))') && css.includes('background:transparent'), '详情底部双按钮必须等宽且取消白色托底');

console.log('cooking flow verification passed');

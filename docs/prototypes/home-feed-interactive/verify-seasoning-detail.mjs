import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./fixes.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(js.includes('const seasoningProfiles = {') && js.includes('function buildSeasoningDetail('), '调料详情必须由独立配置生成');
['海盐', '白胡椒', '生抽', '香醋', '芝麻油', '花椒'].forEach((name) => assert(js.includes(`${name}: {`), `缺少调料详情配置：${name}`));
assert(js.includes("tabs: ['怎么用', '用多少', '可替代']") && js.includes('panels: seasoningPanels(profile)'), '调料三个 Tab 必须有真实内容');
assert(js.includes("type === 'seasoning' && seasoningProfiles[id]"), '分类中的不同调料必须打开各自详情');
assert(js.includes("['酿造酱油', '品类']") && js.includes("['约15ml/汤匙', '用量换算']") && js.includes("['开封后冷藏', '保存']"), '生抽顶部缺少可行动信息');
assert(js.includes('每500g') && js.includes('10–15ml') && js.includes('减少额外食盐'), '生抽用量和减盐提醒不完整');
assert(js.includes('味极鲜') && js.includes('蒸鱼豉油') && js.includes('老抽'), '生抽替代方案不完整');
assert(js.includes('function seasoningRelatedRecipesPanel(') && js.includes("type === 'seasoning' ? seasoningRelatedRecipesPanel(data) : ''"), '调料详情缺少相关菜谱');
assert(js.includes('${detailSeasoningDiscovery}</section>'), '调料相关菜谱必须位于详情 Tab 之后');
assert(css.includes('.seasoning-usage-list') && css.includes('.seasoning-amount-list') && css.includes('.seasoning-substitute-list'), '调料三个 Tab 缺少专用布局');
assert(css.includes('.seasoning-related-rail') && css.includes('grid-auto-columns:calc((100% - 20px) / 2.3)'), '相关菜谱必须横向露出约 2.3 张');
assert(css.includes('.seasoning-related-card img') && css.includes('aspect-ratio:1'), '相关菜谱图片必须为正方形');
const styleVersion = html.match(/fixes\.css\?v=([^"']+)/)?.[1];
const scriptVersion = html.match(/app\.js\?v=([^"']+)/)?.[1];
assert(styleVersion && styleVersion === scriptVersion, '调料详情更新后样式与脚本必须使用统一非空资源版本');

console.log('seasoning detail verification passed');

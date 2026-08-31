import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./fixes.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(js.includes('function buildDrinkDetail(') && js.includes('const drinkProfiles = {'), '饮品详情必须按饮品 ID 生成独立数据');
['oolong', 'lime', 'watermelon', 'americano', 'jasmine'].forEach((id) => assert(js.includes(`${id}: {`), `缺少饮品详情配置: ${id}`));
assert(js.includes("'pour-over': {"), '缺少饮品详情配置: pour-over');
assert(js.includes("tabs: ['风味', '搭餐', '做法']") && js.includes('panels: drinkPanels(profile)'), '无酒精饮品三个 Tab 必须有独立内容');
assert(js.includes("['8 小时', '制作时长']") && js.includes("['4–8°C', '适饮温度']") && js.includes("['中等', '咖啡因']"), '冷泡乌龙顶部必须展示可行动信息');
assert(js.includes('photo-1537401198317-1231361cbd5f'), '冷泡乌龙必须使用茶饮主图，不能继续显示鸡尾酒');
assert(js.includes('function drinkRelatedDiscoveryPanel(') && js.includes("type === 'drink' ? drinkRelatedDiscoveryPanel(data.name, data.isAlcohol) : ''"), '饮品详情缺少继续发现模块');
assert(js.includes('${detailDrinkDiscovery}${detailSeasoningDiscovery}</section>'), '饮品继续发现必须位于详情 Tab 之后');
assert(js.includes('相似饮品') && js.includes('适合搭配的菜谱'), '饮品继续发现内容不完整');
assert(js.includes('理性饮酒') && js.includes("tabs: ['风味', '适饮', '搭餐']") && js.includes('panels: ['), '酒水必须使用独立详情结构和饮酒提示');
assert(js.includes("data.basketTarget === 'ingredients'"), '自制饮品加入菜篮时必须明确加入的是所需原料');
assert(css.includes('.drink-flavor-profile') && css.includes('.drink-method-steps') && css.includes('.drink-pairing-list'), '饮品三个 Tab 缺少专用布局');
assert(css.includes('.drink-related-rail') && css.includes('grid-auto-columns:calc((100% - 20px) / 2.3)'), '相似饮品必须横向露出约 2.3 张');
assert(css.includes('.drink-related-card img') && css.includes('aspect-ratio:1'), '相似饮品图片必须为正方形');
const styleVersion = html.match(/fixes\.css\?v=([^"']+)/)?.[1];
const scriptVersion = html.match(/app\.js\?v=([^"']+)/)?.[1];
assert(styleVersion && styleVersion === scriptVersion, '饮品详情更新后样式与脚本必须使用统一非空资源版本');

console.log('drink detail verification passed');

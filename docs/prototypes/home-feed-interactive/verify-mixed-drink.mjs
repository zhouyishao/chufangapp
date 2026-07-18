import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('./fixes.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(js.includes('function buildMixedDrinkDetail(') && js.includes('const mixedDrinkProfiles = {'), '调饮详情必须使用统一数据工厂');
assert(js.includes("'gin-tonic': {") && js.includes("'citrus-fizz': {"), '必须同时提供鸡尾酒与 Mocktail 示例');
assert(js.includes("tabs: ['配方', '步骤', '小贴士']") && js.includes('panels: mixedDrinkPanels(profile)'), '调饮必须共用配方、步骤、小贴士结构');
assert(js.includes('alcoholic: true') && js.includes('alcoholic: false'), '调饮数据必须区分含酒精和无酒精');
assert(js.includes('理性饮酒') && js.includes("profile.alcoholic ?"), '含酒精配方必须按数据展示饮酒提醒');
assert(['基酒', '辅料', '冰块', '装饰'].every((label) => js.includes(label)), '调饮配方缺少原料分类');
assert(['高球杯', '大冰块', '直调', '量酒器'].every((label) => js.includes(label)), '调饮配方缺少杯型、冰型、技法或工具');
assert(js.includes("action: 'mixology'") && js.includes("basketTarget: 'ingredients'"), '调饮操作与菜篮目标配置不正确');
assert(js.includes('function showGuidedFlow(data)') && js.includes('guidedFlowData = {'), '逐步制作模式必须由当前详情数据驱动');
assert(js.includes("mode: data.action === 'mixology' ? 'mixology' : 'recipe'") && js.includes("mode === 'mixology'"), '逐步流程必须区分制作与烹饪文案');
assert(js.includes('去制作') && js.includes('完成制作'), '调饮详情与逐步流程必须使用去制作和完成制作');
assert(js.includes("showGuidedFlow(data)"), '详情按钮必须把当前调饮数据传给逐步制作流程');
assert(css.includes('.mixed-drink-ingredient-grid') && css.includes('.mixed-drink-tools'), '调饮配方缺少原料与工具布局');
assert(css.includes('.mixed-drink-step-list') && css.includes('.mixed-drink-tips') && css.includes('.mixed-drink-warning'), '调饮步骤、小贴士或饮酒提醒样式缺失');
assert(css.includes('html[data-scale="1.5"] .mixed-drink-ingredient-grid') && css.includes('html[data-scale="2"] .mixed-drink-tools'), '调饮详情缺少大字体适配');
const styleVersion = html.match(/fixes\.css\?v=([^"']+)/)?.[1];
const scriptVersion = html.match(/app\.js\?v=([^"']+)/)?.[1];
assert(styleVersion && styleVersion === scriptVersion, '调饮详情更新后样式与脚本必须使用统一非空资源版本');

console.log('mixed drink verification passed');

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../src/pages/index/index.vue', import.meta.url);
const page = await readFile(pagePath, 'utf8');

assert.match(page, /class="[^"]*\bhome-prototype\b[^"]*"/, '首页必须使用冻结原型的页面母版');
assert.match(page, /class="home-hero-shell"/, '首页必须保留 393×420 的一体化 Banner');
assert.match(page, /class="home-channel-bar"/, '频道必须位于搜索框下方');
assert.match(page, /PrototypeHomeModules/, '后台模块必须映射为原型内容组件');
assert.doesNotMatch(page, /HomeModuleRenderer/, '首页不得继续使用旧通用模块渲染器');
assert.match(page, /aspect-ratio:\s*393\s*\/\s*420/, 'Banner 必须锁定 393:420 比例');
assert.match(page, /padding:\s*0\s+0\s+calc\(/, '首页必须取消全局横向内边距以允许 Banner 顶满');

console.log('home prototype migration checks passed');

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { createApp } from '../app';

const protectedRoutes = [
  { method: 'GET', path: '/api/mobile/search?q=番茄' },
  { method: 'GET', path: '/api/mobile/my-recipes' },
  { method: 'GET', path: '/api/mobile/my-recipes/1' },
  { method: 'POST', path: '/api/mobile/my-recipes' },
  { method: 'GET', path: '/api/mobile/ingredient-price-records?ingredientId=1' },
  { method: 'POST', path: '/api/mobile/ingredient-price-records' },
  { method: 'DELETE', path: '/api/mobile/ingredient-price-records/1' },
  { method: 'GET', path: '/api/mobile/profile' },
  { method: 'PATCH', path: '/api/mobile/profile' },
  { method: 'GET', path: '/api/mobile/families' },
  { method: 'POST', path: '/api/mobile/families' },
  { method: 'GET', path: '/api/mobile/families/1' },
  { method: 'PUT', path: '/api/mobile/families/1' },
  { method: 'POST', path: '/api/mobile/families/1/invites' },
  { method: 'POST', path: '/api/mobile/family-invites/example/join' },
  { method: 'PUT', path: '/api/mobile/families/1/preferences' },
  { method: 'DELETE', path: '/api/mobile/family-members/1' },
  { method: 'PUT', path: '/api/mobile/family-members/1' },
  { method: 'GET', path: '/api/mobile/favorites' },
  { method: 'POST', path: '/api/mobile/favorites' },
  { method: 'DELETE', path: '/api/mobile/favorites/1' },
  { method: 'GET', path: '/api/mobile/view-histories' },
  { method: 'POST', path: '/api/mobile/view-histories' },
  { method: 'GET', path: '/api/mobile/search-histories' },
  { method: 'DELETE', path: '/api/mobile/search-histories' }
] as const;

test('未登录不能访问收藏、浏览历史和搜索历史路由', async () => {
  const server = createApp().listen(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    for (const route of protectedRoutes) {
      const response: Response = await fetch(`http://127.0.0.1:${address.port}${route.path}`, {
        method: route.method,
        headers: route.method === 'GET' ? undefined : { 'content-type': 'application/json' },
        body: route.method === 'GET' ? undefined : JSON.stringify({ recipeId: 1 })
      });
      const body = await response.json() as { code: number };

      assert.equal(response.status, 401, `${route.method} ${route.path} should require App JWT`);
      assert.equal(body.code, 401);
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('用户资产路由只以 App Token 用户为可信身份', async () => {
  const source = await readFile(join(process.cwd(), 'src/routes/api/mobile.ts'), 'utf8');
  const routePatterns = [
    /apiMobileRouter\.get\('\/search', requireAppAuth,/,
    /apiMobileRouter\.get\('\/favorites', requireAppAuth,/,
    /apiMobileRouter\.post\('\/favorites', requireAppAuth,/,
    /apiMobileRouter\.delete\('\/favorites\/:id', requireAppAuth,/,
    /apiMobileRouter\.get\('\/view-histories', requireAppAuth,/,
    /apiMobileRouter\.post\('\/view-histories', requireAppAuth,/,
    /apiMobileRouter\.get\('\/search-histories', requireAppAuth,/,
    /apiMobileRouter\.delete\('\/search-histories', requireAppAuth,/,
    /apiMobileRouter\.patch\('\/profile', requireAppAuth,/
  ];

  for (const pattern of routePatterns) assert.match(source, pattern);

  const assetRouteSource = source.slice(
    source.indexOf("apiMobileRouter.get('/search'"),
    source.indexOf("apiMobileRouter.get('/ingredient-price-records'")
  ) + source.slice(
    source.indexOf("apiMobileRouter.get('/favorites'"),
    source.indexOf("apiMobileRouter.get('/profile'")
  ) + source.slice(
    source.indexOf("apiMobileRouter.post('/favorites'"),
    source.indexOf("apiMobileRouter.get('/my-recipes'")
  );

  assert.match(assetRouteSource, /resolveRequestUserId\(req\.appUser!\.id,/);
  assert.doesNotMatch(assetRouteSource, /where:\s*\{\s*userId:\s*parsed\.data\.userId/);
  assert.doesNotMatch(assetRouteSource, /data:\s*\{\s*userId:\s*parsed\.data\.userId/);
});

test('重复收藏复用已有记录且不会重复增加收藏数', async () => {
  const source = await readFile(join(process.cwd(), 'src/routes/api/mobile.ts'), 'utf8');
  const favoritePost = source.slice(
    source.indexOf("apiMobileRouter.post('/favorites'"),
    source.indexOf("apiMobileRouter.delete('/favorites/:id'")
  );

  assert.match(favoritePost, /if \(existing\)/);
  assert.match(favoritePost, /if \(recipeId && existing\.deletedAt\)/);
});

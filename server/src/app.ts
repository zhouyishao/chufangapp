import cors from 'cors';
import express from 'express';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { errorHandler } from './http/middleware/error-handler';
import { ok } from './http/response';
import { swaggerSpec } from './swagger';
import { adminAuthRouter } from './routes/admin/auth';
import { adminBannersRouter } from './routes/admin/banners';
import { adminBeveragesRouter } from './routes/admin/beverages';
import { adminCategoriesRouter } from './routes/admin/categories';
import { adminCommentsRouter } from './routes/admin/comments';
import { adminContentSelectorRouter } from './routes/admin/content-selector';
import { adminCuisinesRouter } from './routes/admin/cuisines';
import { adminFamiliesRouter } from './routes/admin/families';
// 旧首页轮播图接口已迁移至 /api/admin/home/top-navs/:navId/hero-banners
// import { adminHomeHeroBannersRouter } from './routes/admin/home-hero-banners';
// app.use('/api/admin/home-hero-banners', adminHomeHeroBannersRouter);
import { adminHomeTopNavsRouter } from './routes/admin/home-top-navs';
import { adminContentModulesRouter } from './routes/admin/content-modules';
import { adminTopNavHeroBannersRouter } from './routes/admin/top-nav-hero-banners';
import { adminIngredientsRouter } from './routes/admin/ingredients';
import { adminMenusRouter } from './routes/admin/menus';
import { adminPostsRouter } from './routes/admin/posts';
import { adminRecommendationsRouter } from './routes/admin/recommendations';
import { adminAuditsRouter } from './routes/admin/audits';
import { adminChannelsRouter } from './routes/admin/channels';
import { adminRecipesRouter } from './routes/admin/recipes';
import { adminTagsRouter } from './routes/admin/tags';
import { adminSeasonalFoodsRouter } from './routes/admin/seasonal-foods';
import { adminUploadRouter } from './routes/admin/upload';
import { adminUsersRouter } from './routes/admin/users';
import { apiHomeRouter } from './routes/api/home';
import { apiAppHomeRouter } from './routes/api/app-home';
import { apiIngredientsRouter } from './routes/api/ingredients';
import { apiMobileRouter } from './routes/api/mobile';
import { apiRecipesRouter } from './routes/api/recipes';

const isLocalDevOrigin = (origin: string) =>
  config.env !== 'prod' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const isAllowedCorsOrigin = (origin?: string) => {
  if (!origin) return true;
  if (config.corsOrigin === '*') return true;
  return config.corsOrigin.includes(origin) || isLocalDevOrigin(origin);
};

export const createApp = () => {
  const app = express();

  app.use(express.json({ limit: '2mb' }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), config.uploadDir)));
  app.use('/static', express.static(path.resolve(process.cwd(), 'static')));
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedCorsOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true
    })
  );

  app.get('/health', (_req, res) => res.json(ok({ status: 'ok' })));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/admin/auth', adminAuthRouter);
  app.use('/api/admin/categories', adminCategoriesRouter);
  app.use('/api/admin/ingredients', adminIngredientsRouter);
  app.use('/api/admin/recipes', adminRecipesRouter);
  app.use('/api/admin/recommendations', adminRecommendationsRouter);
  app.use('/api/admin/seasonal-foods', adminSeasonalFoodsRouter);
  app.use('/api/admin/cuisines', adminCuisinesRouter);
  app.use('/api/admin/menus', adminMenusRouter);
  app.use('/api/admin/banners', adminBannersRouter);
  // 旧首页轮播图接口 /api/admin/home-hero-banners 已迁移至 /api/admin/home/top-navs/:navId/hero-banners
  // app.use('/api/admin/home-hero-banners', adminHomeHeroBannersRouter);
  app.use('/api/admin/beverages', adminBeveragesRouter);
  app.use('/api/admin/families', adminFamiliesRouter);
  app.use('/api/admin/upload', adminUploadRouter);
  app.use('/api/admin/users', adminUsersRouter);
  app.use('/api/admin/posts', adminPostsRouter);
  app.use('/api/admin/comments', adminCommentsRouter);
  app.use('/api/admin/audits', adminAuditsRouter);
  app.use('/api/admin/tags', adminTagsRouter);
  app.use('/api/admin/channels', adminChannelsRouter);
  app.use('/api/admin/content-selector', adminContentSelectorRouter);
  app.use('/api/admin/home/top-navs', adminHomeTopNavsRouter);
  app.use('/api/admin/home/top-navs/:navId/hero-banners', adminTopNavHeroBannersRouter);
  app.use('/api/admin/home/top-navs/:navId/modules', adminContentModulesRouter);

  app.use('/api/home', apiHomeRouter);
  app.use('/api/app/home', apiAppHomeRouter);
  app.use('/api/ingredients', apiIngredientsRouter);
  app.use('/api/recipes', apiRecipesRouter);
  app.use('/api/mobile', apiMobileRouter);
  app.use('/api/mobile/ingredients', apiIngredientsRouter);
  app.use('/api/mobile/recipes', apiRecipesRouter);

  app.use(errorHandler);

  return app;
};

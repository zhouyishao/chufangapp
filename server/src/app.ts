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
import { adminCategoriesRouter } from './routes/admin/categories';
import { adminCommentsRouter } from './routes/admin/comments';
import { adminCuisinesRouter } from './routes/admin/cuisines';
import { adminIngredientsRouter } from './routes/admin/ingredients';
import { adminMenusRouter } from './routes/admin/menus';
import { adminPostsRouter } from './routes/admin/posts';
import { adminRecommendationsRouter } from './routes/admin/recommendations';
import { adminRecipesRouter } from './routes/admin/recipes';
import { adminSeasonalFoodsRouter } from './routes/admin/seasonal-foods';
import { adminUploadRouter } from './routes/admin/upload';
import { adminUsersRouter } from './routes/admin/users';
import { apiHomeRouter } from './routes/api/home';
import { apiIngredientsRouter } from './routes/api/ingredients';
import { apiMobileRouter } from './routes/api/mobile';
import { apiRecipesRouter } from './routes/api/recipes';

export const createApp = () => {
  const app = express();

  app.use(express.json({ limit: '2mb' }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), config.uploadDir)));
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
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
  app.use('/api/admin/upload', adminUploadRouter);
  app.use('/api/admin/users', adminUsersRouter);
  app.use('/api/admin/posts', adminPostsRouter);
  app.use('/api/admin/comments', adminCommentsRouter);

  app.use('/api/home', apiHomeRouter);
  app.use('/api/ingredients', apiIngredientsRouter);
  app.use('/api/recipes', apiRecipesRouter);
  app.use('/api/mobile', apiMobileRouter);
  app.use('/api/mobile/ingredients', apiIngredientsRouter);
  app.use('/api/mobile/recipes', apiRecipesRouter);

  app.use(errorHandler);

  return app;
};

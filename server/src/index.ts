import { createApp } from './app';
import { config } from './config';
import { prisma } from './prisma';
import { ensureDefaultResourceApiProviders } from './services/resource-import/provider-presets';

const app = createApp();

void ensureDefaultResourceApiProviders(prisma)
  .catch((error) => {
    console.error('[server] failed to ensure default resource providers', error);
  })
  .finally(() => {
    const server = app.listen(config.port, () => {
      console.log(`[server] listening on :${config.port}`);
    });

    const shutdown = async () => {
      server.close(() => {
        console.log('[server] http closed');
      });
      await prisma.$disconnect();
    };

    process.on('SIGINT', () => void shutdown());
    process.on('SIGTERM', () => void shutdown());
  });

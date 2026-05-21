import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import Components from '@uni-helper/vite-plugin-uni-components';
import { NutResolver } from 'nutui-uniapp';
import Uni from '@uni-helper/plugin-uni';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  },
  plugins: [
    Components({
      dts: true,
      resolvers: [NutResolver()]
    }),
    Uni()
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "nutui-uniapp/styles/variables.scss";'
      }
    }
  }
});

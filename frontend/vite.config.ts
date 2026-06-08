import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import Components from '@uni-helper/vite-plugin-uni-components';
import { NutResolver } from 'nutui-uniapp';
import Uni from '@uni-helper/plugin-uni';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      vue: fileURLToPath(new URL('./src/shims/vue-compat.js', import.meta.url)),
      '@vue/shared': fileURLToPath(new URL('./node_modules/@vue/shared/dist/shared.esm-bundler.js', import.meta.url)),
      '@vue/reactivity': fileURLToPath(new URL('./node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js', import.meta.url)),
      '@vue/runtime-core': fileURLToPath(new URL('./node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js', import.meta.url)),
      '@vue/runtime-dom': fileURLToPath(new URL('./node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js', import.meta.url))
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5175,
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

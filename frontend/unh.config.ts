import { defineConfig } from '@uni-helper/unh';

export default defineConfig({
  platform: {
    default: 'app-plus',
    alias: {
      h5: ['w', 'h'],
      'mp-weixin': 'wx',
      'app-plus': ['app']
    }
  }
});

import { createSSRApp } from 'vue';
import App from './App.vue';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-serif-sc/600.css';
import './styles/global.scss';

export function createApp() {
  const app = createSSRApp(App);
  return {
    app
  };
}

import { createSSRApp } from 'vue';
import App from './App.vue';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-serif-sc/600.css';
import './styles/global.scss';

export function createApp() {
  if (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    window.innerWidth >= 390 &&
    window.innerWidth <= 400 &&
    window.innerHeight >= 800 &&
    window.innerHeight <= 900
  ) {
    document.documentElement.classList.add('safe-area-preview');
  }

  const app = createSSRApp(App);
  return {
    app
  };
}

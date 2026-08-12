import { createSSRApp } from 'vue';
import App from './App.vue';
import './styles/global.scss';

export function createApp() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    document.documentElement.classList.add('safe-area-preview');
  }

  const app = createSSRApp(App);
  return {
    app
  };
}

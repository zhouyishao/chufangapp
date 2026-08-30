import { createApp as createClientApp, createSSRApp } from 'vue';
import App from './App.vue';
import './styles/global.scss';

export function createApp() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    document.documentElement.classList.add('safe-area-preview');
  }

  const app = typeof window !== 'undefined' ? createClientApp(App) : createSSRApp(App);
  return {
    app
  };
}

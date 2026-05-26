export * from '../../node_modules/vue/dist/vue.runtime.esm-bundler.js';
export { createSSRApp as createVueApp } from '../../node_modules/vue/dist/vue.runtime.esm-bundler.js';
import { onBeforeMount, onBeforeUnmount } from '../../node_modules/vue/dist/vue.runtime.esm-bundler.js';

export const isInSSRComponentSetup = false;
export const injectHook = (_lifecycle, hook) => hook;
export const onBeforeActivate = onBeforeMount;
export const onBeforeDeactivate = onBeforeUnmount;
export const logError = (error, _type, _contextVNode, throwInDev = true, throwInProd = false) => {
  if (throwInDev || throwInProd) {
    throw error;
  }
  console.error(error);
};

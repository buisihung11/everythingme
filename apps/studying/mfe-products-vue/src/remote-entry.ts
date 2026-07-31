import { createApp, type App as VueApp } from 'vue';
import ProductsApp from './ProductsApp.vue';

export function mount(element: HTMLElement): () => void {
  const app: VueApp = createApp(ProductsApp);
  app.mount(element);
  return () => app.unmount();
}

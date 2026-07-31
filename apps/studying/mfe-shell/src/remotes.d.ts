declare module 'mfe-dashboard/Module';
declare module 'mfe-analytics/Module';
declare module 'mfe_users/Mount' {
  export function mountUsers(element: HTMLElement): Promise<void>;
}
declare module 'mfe-products/Products' {
  export function mount(element: HTMLElement): () => void;
}

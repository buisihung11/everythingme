<script setup lang="ts">
import { ref } from 'vue';
import ProductCard from './components/ProductCard.vue';
import type { ProductRecord } from './types';

const products = ref<ProductRecord[]>([
  { id: '1', name: 'Wireless Mouse', category: 'Electronics', price: 29.99, stock: 150, status: 'in-stock' },
  { id: '2', name: 'Mechanical Keyboard', category: 'Electronics', price: 89.99, stock: 45, status: 'in-stock' },
  { id: '3', name: 'USB-C Hub', category: 'Accessories', price: 49.99, stock: 8, status: 'low-stock' },
  { id: '4', name: 'Monitor Stand', category: 'Furniture', price: 59.99, stock: 0, status: 'out-of-stock' },
  { id: '5', name: 'Webcam HD', category: 'Electronics', price: 69.99, stock: 72, status: 'in-stock' },
  { id: '6', name: 'Desk Lamp', category: 'Furniture', price: 34.99, stock: 23, status: 'low-stock' },
]);

function viewProduct(product: ProductRecord) {
  const bus = (window as unknown as { __MFE_EVENT_BUS__?: { publish: (type: string, payload: unknown, source: string) => void } }).__MFE_EVENT_BUS__;
  bus?.publish('product:viewed', { id: product.id, name: product.name }, 'mfe_products_vue');
}
</script>

<template>
  <div class="products-module">
    <div class="concept-tags">
      <span class="tag">Vue Remote</span>
      <span class="tag">Vite Federation</span>
      <span class="tag">Event Bus Publisher</span>
    </div>

    <div class="card header-card">
      <h2>Products Catalog</h2>
      <p class="subtitle">Vue micro frontend mounted inside the React shell via a mount function.</p>
    </div>

    <div class="grid">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        @view="viewProduct"
      />
    </div>
  </div>
</template>

<style scoped>
.products-module {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #e2e8f0;
}
.concept-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  background: rgba(56, 189, 248, 0.2);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.3);
}
.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1.25rem;
}
.header-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}
.subtitle {
  color: #94a3b8;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
</style>

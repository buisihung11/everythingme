<script setup lang="ts">
import type { ProductRecord } from '../types';

defineProps<{ product: ProductRecord }>();
defineEmits<{ view: [product: ProductRecord] }>();

const statusColors: Record<ProductRecord['status'], string> = {
  'in-stock': 'status-ok',
  'low-stock': 'status-warn',
  'out-of-stock': 'status-danger',
};
</script>

<template>
  <div class="product-card">
    <div class="top">
      <h3>{{ product.name }}</h3>
      <span :class="['status', statusColors[product.status]]">{{ product.status }}</span>
    </div>
    <p class="category">{{ product.category }}</p>
    <div class="meta">
      <span class="price">${{ product.price.toFixed(2) }}</span>
      <span class="stock">{{ product.stock }} in stock</span>
    </div>
    <button class="btn" @click="$emit('view', product)">View Details</button>
  </div>
</template>

<style scoped>
.product-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}
h3 {
  font-weight: 600;
  margin: 0;
  font-size: 1rem;
}
.status {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  white-space: nowrap;
}
.status-ok { background: rgba(52, 211, 153, 0.2); color: #6ee7b7; }
.status-warn { background: rgba(251, 191, 36, 0.2); color: #fcd34d; }
.status-danger { background: rgba(248, 113, 113, 0.2); color: #fca5a5; }
.category { color: #94a3b8; font-size: 0.8rem; margin: 0; }
.meta { display: flex; justify-content: space-between; font-size: 0.875rem; margin-top: 0.25rem; }
.price { color: #38bdf8; font-weight: 600; }
.stock { color: #94a3b8; }
.btn {
  margin-top: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: #0ea5e9;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn:hover { background: #38bdf8; }
</style>

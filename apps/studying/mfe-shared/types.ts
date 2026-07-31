export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  revenue: number;
  activeSessions: number;
}

export interface ActivityItem {
  id: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface AnalyticsPoint {
  month: string;
  users: number;
  revenue: number;
  orders: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  minStock: number;
}

export interface BillItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface Bill {
  id: string;
  items: BillItem[];
  total: number;
  date: Date;
  customerName: string;
  customerEmail?: string;
}

export interface SalesData {
  date: string;
  revenue: number;
  profit: number;
  itemsSold: number;
}

export interface User {
  id: string;
  name: string;
  role: 'manager' | 'clerk';
  email: string;
}

export interface RecentCustomer {
  name: string;
  email: string;
  lastPurchase: Date;
  totalSpent: number;
}
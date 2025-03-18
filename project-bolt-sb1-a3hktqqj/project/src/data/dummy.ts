import { Product, SalesData } from '../types';

export const dummyProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Bananas',
    code: 'FRUIT001',
    price: 40,
    stock: 100,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=60',
    category: 'Fruits',
    minStock: 20
  },
  {
    id: '2',
    name: 'Whole Wheat Bread',
    code: 'BAKERY001',
    price: 35,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=800&auto=format&fit=crop&q=60',
    category: 'Bakery',
    minStock: 10
  },
  {
    id: '3',
    name: 'Fresh Milk 1L',
    code: 'DAIRY001',
    price: 60,
    stock: 75,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=60',
    category: 'Dairy',
    minStock: 15
  },
  {
    id: '4',
    name: 'Rice 5kg',
    code: 'GRAINS001',
    price: 250,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=60',
    category: 'Grains',
    minStock: 10
  },
  {
    id: '5',
    name: 'Tomatoes 1kg',
    code: 'VEG001',
    price: 40,
    stock: 80,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=60',
    category: 'Vegetables',
    minStock: 15
  },
  {
    id: '6',
    name: 'Chicken 1kg',
    code: 'MEAT001',
    price: 180,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&auto=format&fit=crop&q=60',
    category: 'Meat',
    minStock: 10
  },
  {
    id: '7',
    name: 'Eggs (12 pack)',
    code: 'DAIRY002',
    price: 75,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800&auto=format&fit=crop&q=60',
    category: 'Dairy',
    minStock: 20
  },
  {
    id: '8',
    name: 'Orange Juice 1L',
    code: 'BEV001',
    price: 85,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&auto=format&fit=crop&q=60',
    category: 'Beverages',
    minStock: 5
  },
  {
    id: '9',
    name: 'Potato Chips',
    code: 'SNACK001',
    price: 30,
    stock: 120,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=60',
    category: 'Snacks',
    minStock: 25
  },
  {
    id: '10',
    name: 'Mixed Vegetables',
    code: 'VEG002',
    price: 65,
    stock: 55,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=60',
    category: 'Vegetables',
    minStock: 15
  }
];

// Generate sales data for the last 30 days
const generateSalesData = () => {
  const data: SalesData[] = [];
  const today = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 200) + 1000,
      profit: Math.floor(Math.random() * 5) + 20,
      itemsSold: Math.floor(Math.random() * 10) + 5
    });
  }
  
  return data;
};

export const dummySalesData = generateSalesData();
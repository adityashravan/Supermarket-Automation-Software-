import { create } from 'zustand';
import { dummyProducts, dummySalesData } from '../data/dummy';
import { Bill, Product, SalesData, User } from '../types';

interface Store {
  products: Product[];
  bills: Bill[];
  salesData: SalesData[];
  currentUser: User | null;
  isLoggedIn: boolean;
  currentBill: Bill | null;
  
  login: (email: string, password: string, name?: string) => void;
  logout: () => void;
  addToBill: (product: Product, quantity: number) => void;
  completeBill: (customerName: string, customerEmail?: string) => void;
  updateProduct: (product: Product) => void;
  updateStock: (productId: string, quantity: number) => void;
}

export const useStore = create<Store>((set) => ({
  products: dummyProducts,
  bills: [],
  salesData: dummySalesData,
  currentUser: null,
  isLoggedIn: false,
  currentBill: null,

  login: (email, password, name) => {
    set({
      isLoggedIn: true,
      currentUser: {
        id: '1',
        name: name || 'John Doe',
        role: 'manager',
        email
      }
    });
  },

  logout: () => {
    set({
      isLoggedIn: false,
      currentUser: null
    });
  },

  addToBill: (product, quantity) => {
    set((state) => {
      if (product.stock < quantity) {
        console.error(`Not enough stock for ${product.name}`);
        return state; // Prevent adding if not enough stock
      }
  
      const currentBill = state.currentBill || {
        id: Date.now().toString(),
        items: [],
        total: 0,
        date: new Date(),
        customerName: ''
      }
  
      const existingItem = currentBill.items.find(item => item.product.id === product.id);
  
      const updatedItems = existingItem
        ? currentBill.items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * product.price }
              : item
          )
        : [...currentBill.items, { product, quantity, total: product.price * quantity }];
  
      // Reduce stock immediately
      const updatedProducts = state.products.map(p =>
        p.id === product.id ? { ...p, stock: p.stock - quantity } : p
      );
  
      return {
        products: updatedProducts,
        currentBill: {
          ...currentBill,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.total, 0)
        }
      };
    });
  },
  

  completeBill: (customerName, customerEmail) => {
    set((state) => {
      if (!state.currentBill) return state;

      const completedBill = {
        ...state.currentBill,
        customerName,
        customerEmail,
        date: new Date()
      };

      // Update stock
      const updatedProducts = state.products.map(product => {
        const billItem = completedBill.items.find(item => item.product.id === product.id);
        if (billItem) {
          return {
            ...product,
            stock: product.stock - billItem.quantity
          };
        }
        return product;
      });

      return {
        bills: [...state.bills, completedBill],
        products: updatedProducts,
        currentBill: null
      };
    });
  },

  updateProduct: (updatedProduct) => {
    set((state) => ({
      products: state.products.map(product =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    }));
  },

  updateStock: (productId, quantity) => {
    set((state) => ({
      products: state.products.map(product =>
        product.id === productId
          ? { ...product, stock: product.stock + quantity }
          : product
      )
    }));
  }
}));
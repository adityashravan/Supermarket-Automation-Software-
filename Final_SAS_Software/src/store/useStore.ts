import { create } from 'zustand';
import { Product, Bill, User, SalesData } from '../types';
import { dummyProducts, dummySalesData } from '../data/dummy';

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
      // Initialize the currentBill if it doesn't exist
      const currentBill = state.currentBill || {
        id: Date.now().toString(),
        items: [],
        total: 0,
        date: new Date(),
        customerName: ''
      };
  
      // Check if the product already exists in the currentBill items
      const existingItemIndex = currentBill.items.findIndex(item => item.product.id === product.id);
  
      let updatedItems;
      let updatedTotal = currentBill.total;
  
      if (existingItemIndex !== -1) {
        // If the product exists, update the quantity and total for that product
        const existingItem = currentBill.items[existingItemIndex];
        const updatedItem = {
          ...existingItem,
          quantity: existingItem.quantity + quantity, // Increment the quantity
          total: (existingItem.quantity + quantity) * existingItem.product.price // Recalculate total
        };
  
        // Replace the old item with the updated item
        updatedItems = [
          ...currentBill.items.slice(0, existingItemIndex), 
          updatedItem, 
          ...currentBill.items.slice(existingItemIndex + 1)
        ];
  
        // Update the total of the bill
        updatedTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      } else {
        // If the product doesn't exist, add it as a new item
        const newItem = {
          product,
          quantity,
          total: product.price * quantity
        };
  
        updatedItems = [...currentBill.items, newItem];
        updatedTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      }
  
      // Return the updated state
      return {
        currentBill: {
          ...currentBill,
          items: updatedItems,
          total: updatedTotal
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
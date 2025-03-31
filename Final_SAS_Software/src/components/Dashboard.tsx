import {
  BarChart3,
  LogOut,
  Package,
  Settings,
  ShoppingCart
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { BillingSystem } from './BillingSystem';
import { Inventory } from './Inventory';
import { PriceManager } from './PriceManager';
import { Statistics } from './Statistics';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PrintBillModal from './PrintBillModal';
import { ProductCat } from './ProductCat';
import { ProductManager } from './ProductManager';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('billing');
  // const logout = useStore(state => state.logout);
  const products = useStore(state => state.products);
  const bills = useStore(state => state.bills);
  const [role,setRole] =useState('')
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const navigate = useNavigate()
  useEffect(() => {
    const fetchData = async () => {

      const user = sessionStorage.getItem("user") || ''

      if (user != '') {
        try {
          let u = JSON.parse(user)
          let email = u.email
          // Send the email as part of the body of the POST request
          const response = await axios.post('http://localhost:5000/api/user', {
            email
          });
          console.log(response)
          console.log(response.data.token, u.token)
          const dbToken = response.data.token.split('.');
          const localToken = u.token.split('.');
          setRole(u.role)
          console.log(role)
          // Get the first part (header part of the JWT)

          if (dbToken[0] != localToken[0]) {
            navigate('/')
          }
        } catch (error) {
          console.error('Error checking email:', error);
        }

      } else {
        navigate('/')
      }
    };
    
    fetchData();
  }, []);
  const handleLogout = () => {

    navigate('/')
    sessionStorage.removeItem('user');

  }
  // Get recent customers from bills




  const renderContent = () => {
    switch (activeTab) {
      case 'billing':
        return <BillingSystem />;
      case 'inventory':
        return <Inventory />;
      case 'statistics':
        return <Statistics />;
      case 'pricing':
        return <PriceManager />;
      case 'Mproduct':
        return <ProductManager />;
      case 'catproduct':
        return <ProductCat />;
      case 'PrintBillModal':
        return <PrintBillModal />;
      default:
        return <BillingSystem />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">SuperMart</h1>
        </div>

        <nav className="mt-6">
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center px-6 py-3 ${role == 'employee' ?'hidden':''} text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${activeTab === 'billing' ? 'bg-blue-50 text-blue-500' : ''
              }`}
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Billing
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center px-6 ${role == 'saleclock' ?'hidden':''} py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${activeTab === 'inventory' ? 'bg-blue-50 text-blue-500' : ''
              }`}
          >
            <Package className="w-5 h-5 mr-3" />
            Inventory
            {lowStockProducts.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex items-center ${role == 'saleclock' ?'hidden':''} px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${activeTab === 'statistics' ? 'bg-blue-50 text-blue-500' : ''
              }`}
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            Statistics
          </button>

          {/* <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center px-6 py-3  ${role == 'saleclock' ?'hidden':''} text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${activeTab === 'pricing' ? 'bg-blue-50 text-blue-500' : ''
              }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Price Manager
          </button> */}

          {/* Product Manger */}
          <button
            onClick={() => setActiveTab('catproduct')}
            className={`flex items-center px-6 py-3  ${role == 'saleclock' ?'hidden':''} text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${activeTab === 'catproduct' ? 'bg-blue-50 text-blue-500' : ''
              }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Product Category
          </button>
          {/* Product Manger */}
          <button
            onClick={() => setActiveTab('Mproduct')}
            className={`flex items-center px-6 ${role == 'employee' || role == 'saleclock' ?'hidden':''} py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${activeTab === 'Mproduct' ? 'bg-blue-50 text-blue-500' : ''
              }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Product Manager
          </button>
          {/* Product Manger */}
          <button
            onClick={() => setActiveTab('PrintBillModal')}
            className={`flex items-center ${role == 'employee' ?'hidden':''} px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${activeTab === 'PrintBillModal' ? 'bg-blue-50 text-blue-500' : ''
              }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            PrintBillModal
          </button>
        </nav>

        <div className="mt-auto p-6">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Dashboard Overview */}

        {renderContent()}
        
      </div>

    </div>
  );
};
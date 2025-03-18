import React from "react";
import { useStore } from "../store/useStore";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  LogOut,
  AlertTriangle,
  Users,
  TrendingUp,
} from "lucide-react";
import { BillingSystem } from "./BillingSystem";
import { Inventory } from "./Inventory";
import { Statistics } from "./Statistics";
import { PriceManager } from "./PriceManager";
import { format } from "date-fns";

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("billing");
  const logout = useStore((state) => state.logout);
  const products = useStore((state) => state.products);
  const bills = useStore((state) => state.bills);
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Get recent customers from bills
  const recentCustomers = React.useMemo(() => {
    const last5Bills = [...bills]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    return last5Bills.map((bill) => ({
      name: bill.customerName,
      date: bill.date,
      total: bill.total,
    }));
  }, [bills]);

  const renderContent = () => {
    switch (activeTab) {
      case "billing":
        return <BillingSystem />;
      case "inventory":
        return <Inventory />;
      case "statistics":
        return <Statistics />;
      case "pricing":
        return <PriceManager />;
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
            onClick={() => setActiveTab("billing")}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${
              activeTab === "billing" ? "bg-blue-50 text-blue-500" : ""
            }`}
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Billing
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${
              activeTab === "inventory" ? "bg-blue-50 text-blue-500" : ""
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
            onClick={() => setActiveTab("statistics")}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${
              activeTab === "statistics" ? "bg-blue-50 text-blue-500" : ""
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            Statistics
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors ${
              activeTab === "pricing" ? "bg-blue-50 text-blue-500" : ""
            }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Price Manager
          </button>
        </nav>

        <div className="mt-auto p-6">
          <button
            onClick={logout}
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
        {activeTab === "billing" && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Customers */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold">Recent Customers</h2>
              </div>
              <div className="space-y-4">
                {recentCustomers.map((customer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-500">
                        {format(customer.date, "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center text-green-500">
                      <TrendingUp className="w-4 h-4 mr-1" />₹{customer.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <div className="bg-red-50 rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                  <h2 className="text-xl font-semibold text-red-700">
                    Low Stock Alerts
                  </h2>
                </div>
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-red-600">
                          Current Stock: {product.stock}
                        </p>
                      </div>
                      <p className="text-sm text-red-600">
                        Min Required: {product.minStock}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

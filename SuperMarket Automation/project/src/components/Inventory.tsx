import React from "react";
import { useStore } from "../store/useStore";
import { Package, AlertTriangle, Plus, Minus } from "lucide-react";
import * as Progress from "@radix-ui/react-progress";
import toast from "react-hot-toast";

export const Inventory: React.FC = () => {
  const products = useStore((state) => state.products);
  const updateStock = useStore((state) => state.updateStock);

  const getStockPercentage = (current: number, min: number) => {
    return Math.max(0, Math.min(100, (current / (min * 3)) * 100));
  };

  const getStockColor = (current: number, min: number) => {
    const percentage = getStockPercentage(current, min);
    if (percentage <= 33) return "bg-red-500";
    if (percentage <= 66) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleStockUpdate = (
    productId: string,
    change: number,
    currentStock: number
  ) => {
    if (change < 0 && currentStock + change < 0) {
      toast.error("Stock cannot be negative");
      return;
    }
    updateStock(productId, change);

    // Show low stock alert
    const product = products.find((p) => p.id === productId);
    if (product && currentStock + change <= product.minStock) {
      toast.error(
        `Low stock alert: ${product.name} is below minimum threshold!`,
        {
          duration: 5000,
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Inventory Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const isLowStock = product.stock <= product.minStock;
          const stockPercentage = getStockPercentage(
            product.stock,
            product.minStock
          );

          return (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                isLowStock ? "border-2 border-red-300" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="w-6 h-6 text-blue-500 mr-2" />
                  <h3 className="font-semibold">{product.name}</h3>
                </div>
                {isLowStock && (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                )}
              </div>

              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Code: {product.code}</p>
                  <p className="text-sm text-gray-600">
                    Price: ₹{product.price}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p
                      className={`text-sm ${
                        isLowStock
                          ? "text-red-600 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      Current Stock: {product.stock}
                    </p>
                    <p className="text-sm text-gray-600">
                      Min: {product.minStock}
                    </p>
                  </div>

                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStockColor(
                        product.stock,
                        product.minStock
                      )} transition-all duration-300`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() =>
                      handleStockUpdate(product.id, 1, product.stock)
                    }
                    className="flex-1 flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Stock
                  </button>
                  <button
                    onClick={() =>
                      handleStockUpdate(product.id, -1, product.stock)
                    }
                    className="flex-1 flex items-center justify-center bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    disabled={product.stock <= 0}
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { AlertTriangle, Package, Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
interface Product {
  id: string;
  product_id: number;
  productName: string;
  price: number;
  category: string;
  upc: string;
  imageUrl: string;
  stockQuantity: number;
}

export const Inventory: React.FC = () => {
  const [productList, setProductList] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newselectedProduct, setNewSelectedProduct] = useState<Product | null>(null);
  const [prevStock, setPrevStock] = useState(Number)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/getProducts/');
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
        const data = await response.json();
        setProductList(data);
      } catch (err) {
        console.error('Error fetching product list:', err);
        toast.error(`Failed to fetch products: ${err.message}`);
      }
    };

    fetchProducts();
  }, [refresh]);
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setPrevStock(product.stockQuantity)
    // setNewSelectedProduct(product)
    console.log(newselectedProduct)
    // setSelectedCategoryId(product.category); // Set the selected category ID
    setIsOpen(true);
  };
  const handleEditClose = () => { 
    setIsOpen(false);
     setNewSelectedProduct(null); 
     setSelectedProduct(null); 
     console.log(newselectedProduct)
     }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!selectedProduct) return;

    setNewSelectedProduct({ ...selectedProduct, [e.target.name]: e.target.value });
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newselectedProduct) return;

    console.log("Updating Product ID:", newselectedProduct.product_id);
    let newstock = Number(newselectedProduct.stockQuantity) + Number(prevStock)
    try {
      const response = await fetch(`http://localhost:5000/api/productupdate/${newselectedProduct.product_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockQuantity: newstock,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product");
      }

      setIsOpen(false);
      setRefresh((prev) => !prev);
      toast.success("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product.");
    }
  };

  const products = useStore(state => state.products);
  const updateStock = useStore(state => state.updateStock);

  const getStockPercentage = (current: number, min: number) => {
    return Math.max(0, Math.min(100, (current / (min * 3)) * 100));
  };

  const getStockColor = (current: number, min: number) => {
    const percentage = getStockPercentage(current, min);
    if (percentage <= 33) return 'bg-red-500';
    if (percentage <= 66) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleStockUpdate = (productId: string, change: number, currentStock: number) => {
    if (change < 0 && currentStock + change < 0) {
      toast.error('Stock cannot be negative');
      return;
    }
    updateStock(productId, change);

    // Show low stock alert
    const product = products.find(p => p.id === productId);
    if (product && (currentStock + change) <= product.minStock) {
      toast.error(`Low stock alert: ${product.name} is below minimum threshold!`, {
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Inventory Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {productList.map(product => {
          const isLowStock = product.stockQuantity <= 5;
          const stockPercentage = getStockPercentage(product.stockQuantity, 5);

          return (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow-md p-6 ${isLowStock ? 'border-2 border-red-300' : ''
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="w-6 h-6 text-blue-500 mr-2" />
                  <h3 className="font-semibold">{product.productName}</h3>
                </div>
                {isLowStock && (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                )}
              </div>

              <img
                src={product.imageUrl}
                alt={product.productName}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Code: {product.upc}</p>
                  <p className="text-sm text-gray-600">Price: ₹{product.price}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm ${isLowStock ? 'text-red-600 font-semibold' : 'text-gray-600'
                      }`}>
                      Current Stock: {product.stockQuantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      Min: {5}
                    </p>
                  </div>

                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStockColor(product.stockQuantity, 5)} transition-all duration-300`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="flex-1 flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Stock
                  </button>

                </div>
              </div>

              {isOpen && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-[80%] max-w-3xl">
                    {/* Header */}


                    {/* Modal Content */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Section - Customer Details */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock Available: {selectedProduct.stockQuantity}
                        </label>


                        <label className="inline text-sm font-medium text-gray-700 mt-4 mb-2">
                          Add Stock
                        </label>
                        <input
                          type="number"
                          value={newselectedProduct?.stockQuantity}
                          onChange={handleChange}
                          name="stockQuantity"
                          className="inline w-full pl-10 pr-4 py-2 border rounded-lg"
                          placeholder="Quantity"
                          required
                        />




                      </div>

                      {/* Right Section - Billing Details */}

                    </div>

                    {/* Close Button */}

                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                      <button
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold px-6 py-3  shadow-md transition-all duration-300"
                        onClick={handleSave}
                      >
                        Submit
                      </button>

                      <button
                        className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold px-6 py-3  shadow-md transition-all duration-300"
                        onClick={handleEditClose}
                      >
                        Close
                      </button>
                    </div>


                  </div>
                </div>
              )}





            </div>
          );
        })}
      </div>
    </div>
  );
};
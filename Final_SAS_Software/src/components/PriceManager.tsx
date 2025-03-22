import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Edit2, Save } from 'lucide-react';

export const PriceManager: React.FC = () => {
  const products = useStore(state => state.products);
  const updateProduct = useStore(state => state.updateProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditPrice(product.price);
  };

  const handleSave = (product: any) => {
    updateProduct({
      ...product,
      price: editPrice
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Price Management</h2>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === product.id ? (
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-24 px-2 py-1 border rounded"
                      required
                    />
                  ) : (
                    <div className="text-sm text-gray-900">₹{product.price}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId === product.id ? (
                    <button
                      onClick={() => handleSave(product)}
                      className="flex items-center text-green-600 hover:text-green-900"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex items-center text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
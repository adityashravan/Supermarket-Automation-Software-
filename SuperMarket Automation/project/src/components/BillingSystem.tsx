import { Mail, Plus, Printer, Search, ShoppingBag, User } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useStore } from "../store/useStore";

export const BillingSystem: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [carryBag, setCarryBag] = useState(false);
  const products = useStore((state) => state.products);
  const currentBill = useStore((state) => state.currentBill);
  const addToBill = useStore((state) => state.addToBill);
  const completeBill = useStore((state) => state.completeBill);

  const CARRY_BAG_PRICE = 5;
  const GST_RATE = 0.18; // 18% GST

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTaxes = (subtotal: number) => {
    return subtotal * GST_RATE;
  };

  const calculateTotal = () => {
    if (!currentBill) return { subtotal: 0, tax: 0, total: 0 };

    const subtotal = currentBill.items.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const carryBagCharge = carryBag ? CARRY_BAG_PRICE : 0;
    const tax = calculateTaxes(subtotal);

    return {
      subtotal,
      tax,
      carryBagCharge,
      total: subtotal + tax + carryBagCharge,
    };
  };

  const handlePrint = () => {
    if (!customerName) {
      toast.error("Please enter customer name before printing");
      return;
    }

    const { subtotal, tax, carryBagCharge, total } = calculateTotal();

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Generate bill HTML
    const billHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${customerName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
            .summary { margin-top: 20px; text-align: right; }
            .summary p { margin: 5px 0; }
            .total { font-size: 1.2em; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SuperMart</h1>
            <p>Sales Receipt</p>
          </div>
          <div class="customer-info">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${
              customerEmail
                ? `<p><strong>Email:</strong> ${customerEmail}</p>`
                : ""
            }
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${currentBill?.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.product.price}</td>
                  <td>₹${item.total}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="summary">
            <p>Subtotal: ₹${subtotal}</p>
            <p>GST (18%): ₹${tax.toFixed(2)}</p>
            ${carryBag ? `<p>Carry Bag: ₹${CARRY_BAG_PRICE}</p>` : ""}
            <p class="total">Total Amount: ₹${total.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCompleteBill = () => {
    if (!customerName) {
      toast.error("Please enter customer name");
      return;
    }

    // Ensure all items in bill have stock available
    for (const item of currentBill.items) {
      if (item.product.stock <= 0) {
        toast.error(`Cannot bill ${item.product.name} as stock is 0`);
        return;
      }
    }

    completeBill(customerName, customerEmail);
    setCustomerName("");
    setCustomerEmail("");
    setCarryBag(false);
    toast.success("Bill completed successfully!");
  };

  const { subtotal, tax, carryBagCharge, total } = calculateTotal();

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Product Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Select Products</h2>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name or code..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover rounded-lg mb-2"
              />
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.code}</p>
              <p className="text-lg font-bold mt-2">₹{product.price}</p>
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => {
                    if (product.stock > 0) {
                      addToBill(product, 1); // Adds one item at a time
                    } else {
                      toast.error(`${product.name} is out of stock`);
                    }
                  }}
                  className={`flex items-center px-3 py-1 rounded ${
                    product.stock > 0
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={product.stock <= 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>

                <span className="text-sm text-gray-600">
                  Stock: {product.stock}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Bill */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Current Bill</h2>
          <button
            onClick={handlePrint}
            className="flex items-center bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            <Printer className="w-5 h-5 mr-2" />
            Print Bill
          </button>
        </div>

        {/* Customer Information */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              placeholder="Enter customer name"
            />
            <User className="absolute left-3 top-[34px] text-gray-400 w-5 h-5" />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email (Optional)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              placeholder="Enter customer email"
            />
            <Mail className="absolute left-3 top-[34px] text-gray-400 w-5 h-5" />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="carryBag"
              checked={carryBag}
              onChange={(e) => setCarryBag(e.target.checked)}
              className="rounded text-blue-500"
            />
            <label
              htmlFor="carryBag"
              className="flex items-center text-sm text-gray-700"
            >
              <ShoppingBag className="w-4 h-4 mr-1" />
              Add Carry Bag (₹{CARRY_BAG_PRICE})
            </label>
          </div>
        </div>

        {currentBill?.items.length ? (
          <>
            <div className="border-b pb-4 mb-4">
              <div className="grid grid-cols-4 font-semibold mb-2">
                <span>Item</span>
                <span>Quantity</span>
                <span>Price</span>
                <span>Total</span>
              </div>
              {currentBill.items.map((item, index) => (
                <div key={index} className="grid grid-cols-4 py-2">
                  <span>{item.product.name}</span>
                  <span>{item.quantity}</span>
                  <span>₹{item.product.price}</span>
                  <span>₹{item.total}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-right">
              <p className="text-gray-600">Subtotal: ₹{subtotal}</p>
              <p className="text-gray-600">GST (18%): ₹{tax.toFixed(2)}</p>
              {carryBag && (
                <p className="text-gray-600">Carry Bag: ₹{carryBagCharge}</p>
              )}
              <p className="text-xl font-bold">
                Total Amount: ₹{total.toFixed(2)}
              </p>
            </div>

            <button
              onClick={handleCompleteBill}
              className="w-full mt-6 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
            >
              Complete Bill
            </button>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No items added to the bill yet
          </div>
        )}
      </div>
    </div>
  );
};

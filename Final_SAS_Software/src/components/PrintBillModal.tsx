import { useState } from "react";

const PrintBillModal = () => {
  const [billId, setBillId] = useState("");
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSalesByBillId = async () => {
    if (!billId.trim()) {
      setError("Please enter a Bill ID.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`http://localhost:5000/api/printbill/${billId}`);
      const data = await response.json();

      if (response.ok) {
        setSalesData(data);
      } else {
        setError(data.message || "Sales record not found.");
        setSalesData(null);
      }
    } catch (err) {
      setError("Failed to fetch sales data.");
      console.error("Error fetching sales:", err);
      setSalesData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-md">
      <h2 className="text-xl font-semibold mb-4">Fetch Sales Data</h2>
      
      <input
        type="text"
        value={billId}
        onChange={(e) => setBillId(e.target.value)}
        placeholder="Enter Bill ID"
        className="border rounded p-2 w-full mb-2"
      />
      
      <button
        onClick={fetchSalesByBillId}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={loading}
      >
        {loading ? "Loading..." : "Fetch Sales"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {salesData && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <h3 className="font-bold">Bill No: {salesData.bill_no}</h3>
          <p><strong>Customer:</strong> {salesData.customer.customer_name}</p>
          <p><strong>Phone:</strong> {salesData.customer.customer_phone}</p>
          <h4 className="mt-2 font-semibold">Items:</h4>
          <ul>
            {salesData.items.map((item, index) => (
              <li key={index}>
                {item.product_name} - {item.product_qty} x ₹{item.sale_price} (Discount: ₹{item.discount}) = ₹{item.total}
              </li>
            ))}
          </ul>
          <p className="mt-2"><strong>Subtotal:</strong> ₹{salesData.subtotal}</p>
          <p><strong>GST:</strong> ₹{salesData.gst}</p>
          <p><strong>Carry Bag Charge:</strong> ₹{salesData.carry_bag_charge}</p>
          <p><strong>Discount:</strong> {salesData.discount}</p>
          <p className="font-bold"><strong>Total Amount:</strong> ₹{salesData.total_amount}</p>
        </div>
      )}
    </div>
  );
};

export default PrintBillModal;

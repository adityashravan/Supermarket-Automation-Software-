import axios from "axios";
import { format, startOfMonth, startOfWeek, startOfYear, subDays } from "date-fns";
import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Define types for better type safety
type TimeRange = "daily" | "weekly" | "monthly" | "yearly";
interface SaleItem {
  product_code: string;
  product_name: string;
  sale_price: number;
  product_qty: number;
  discount: number;
  total: number;
}
interface Sale {
  date: string;
  total_amount: number;
  items: SaleItem[];
  customer: {
    customer_name: string;
    customer_phone: string;
    cust_no: string;
  };
}
interface Product {
  product_id: number;
  productName: string;
  price: number;
  category: number;
  upc: string;
  imageUrl: string;
  stockQuantity: number;
  product_url: string;
}
interface Productcat {
  cat_id: number;
  name: string;
  abbreviation: string;
  category_url: string;
  createdAt: Date;
}
// interface Customer {
//   _id: string;
//   name: string;
// }

// Colors for Pie Chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export const Statistics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productscat, setProductsCat] = useState<Productcat[]>([]);
  const [customerphone, setCustomer] = useState<string[]>([]);
  const [todayStats, setTodayStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalItemsSold: 0,
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [salesRes, productsRes, productCat, todayStatsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/sales/"),
          axios.get("http://localhost:5000/api/getProducts/"),
          axios.get("http://localhost:5000/api/getProductsCategory/"),
          axios.get("http://localhost:5000/api/today-stats/"),
        ]);

        setSalesData(salesRes.data || []);
        setProducts(productsRes.data || []);
        setProductsCat(productCat.data || []);
        setTodayStats(todayStatsRes.data || {});
        
        // Update customer phone numbers
        const phoneNumbers = salesRes.data
          .filter((sale: Sale) => sale.customer?.customer_phone)
          .map((sale: Sale) => sale.customer!.customer_phone);
        setCustomer(phoneNumbers);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    fetchStats();
  }, []);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');

    ws.onmessage = (event) => {
      const newSale = JSON.parse(event.data);
      if (newSale.type === 'new_sale') {
        // Update sales data
        setSalesData(prev => [...prev, newSale.sale]);
        
        // Update today's stats
        setTodayStats(prev => ({
          totalRevenue: prev.totalRevenue + (newSale.sale.total_amount || 0),
          totalTransactions: prev.totalTransactions + 1,
          totalItemsSold: prev.totalItemsSold + (newSale.sale.totalItemsSold || 0),
        }));

        // Update customer phone numbers if new customer
        if (newSale.sale.customer?.customer_phone) {
          setCustomer(prev => [...prev, newSale.sale.customer.customer_phone]);
        }
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Filter sales data based on selected time range
  const getFilteredData = () => {
    const today = new Date();
    let startDate = subDays(today, 7); // Default to last 7 days

    switch (timeRange) {
      case "weekly":
        startDate = startOfWeek(subDays(today, 28));
        break;
      case "monthly":
        startDate = startOfMonth(subDays(today, 90));
        break;
      case "yearly":
        startDate = startOfYear(today);
        break;
    }

    return salesData.filter((data) => new Date(data.date) >= startDate);
  };


  // Compute product sales from salesData
  const productSales = products
    .map((product) => {
      const totalQuantity = salesData.reduce((sum, sale) => {
        return (
          sum +
          (sale.items?.reduce((itemSum, item) => {
            return item.product_code === product.upc
              ? itemSum + (item.product_qty || 0)
              : itemSum;
          }, 0) || 0)
        );
      }, 0);

      return { name: product.productName, value: totalQuantity };
    })
    .filter((product) => product.value > 0); // Remove products with zero sales

  const filteredData = getFilteredData();

  // Calculate total items sold for each date
  const itemsSoldData = filteredData.map(sale => ({
    date: format(new Date(sale.date), 'dd MMM'),
    totalItemsSold: sale.items?.reduce((sum, item) => sum + (item.product_qty || 0), 0) || 0
  }));

  // Calculate revenue for each date
  const revenueData = filteredData.map(sale => ({
    date: format(new Date(sale.date), 'dd MMM'),
    total_amount: sale.total_amount || 0
  }));

  return (
    <div className="space-y-8">
      {/* Header and Time Range Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Statistics</h2>
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly", "yearly"] as TimeRange[]).map(
            (range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg ${timeRange === range
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
                  }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Today's Revenue
          </h3>
          <p className="text-3xl font-bold text-green-500">
            ₹{todayStats.totalRevenue.toFixed()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Invoices
          </h3>
          <p className="text-3xl font-bold text-purple-500">
            {salesData.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Items Sold Today
          </h3>
          <p className="text-3xl font-bold text-blue-500">
            {todayStats.totalItemsSold}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
           Customers
          </h3>
          <p className="text-3xl font-bold text-purple-500">
            {customerphone.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Product Category
          </h3>
          <p className="text-3xl font-bold text-purple-500">
            {productscat.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Products
          </h3>
          <p className="text-3xl font-bold text-purple-500">
            {products.length}
          </p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="total_amount"
              stroke="#2563eb"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar and Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Items Sold</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={itemsSoldData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalItemsSold" fill="#6366f1" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Product Sales Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productSales}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {productSales.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

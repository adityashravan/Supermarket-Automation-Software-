import {
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays
} from "date-fns";
import React, { useState } from "react";
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
import { useStore } from "../store/useStore";

type TimeRange = "daily" | "weekly" | "monthly" | "yearly";

export const Statistics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
  const salesData = useStore((state) => state.salesData);
  const bills = useStore((state) => state.bills);
  const products = useStore((state) => state.products);

  // Filter data based on selected time range
  const getFilteredData = () => {
    const today = new Date();
    let startDate;

    switch (timeRange) {
      case "daily":
        startDate = subDays(today, 7);
        break;
      case "weekly":
        startDate = startOfWeek(subDays(today, 28));
        break;
      case "monthly":
        startDate = startOfMonth(subDays(today, 90));
        break;
      case "yearly":
        startDate = startOfYear(today);
        break;
      default:
        startDate = subDays(today, 7);
    }

    return salesData.filter((data) => new Date(data.date) >= startDate);
  };

  // Calculate product-wise sales
  const productSales = React.useMemo(() => {
    const sales: Record<string, number> = {};
    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        const productId = item.product.id;
        sales[productId] = (sales[productId] || 0) + item.quantity;
      });
    });

    return Object.entries(sales).map(([productId, quantity]) => ({
      name: products.find((p) => p.id === productId)?.name || "Unknown",
      value: quantity,
    }));
  }, [bills, products]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const filteredData = getFilteredData();
  const today = new Date().toISOString().split("T")[0];
  const todayBills = bills.filter(
    (bill) => new Date(bill.date).toISOString().split("T")[0] === today
  );
  const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.total, 0);
  const todayItems = todayBills.reduce(
    (sum, bill) =>
      sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Statistics</h2>
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly", "yearly"] as TimeRange[]).map(
            (range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === range
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

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Today's Revenue
          </h3>
          <p className="text-3xl font-bold text-green-500">₹{todayRevenue}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Items Sold Today
          </h3>
          <p className="text-3xl font-bold text-blue-500">{todayItems}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Total Transactions
          </h3>
          <p className="text-3xl font-bold text-purple-500">
            {todayBills.length}
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#16a34a"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items Sold Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Items Sold</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="itemsSold" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product-wise Sales Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Product Sales Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
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
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

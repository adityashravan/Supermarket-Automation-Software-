import axios from 'axios';
import { format } from 'date-fns';
import {
  Plus,
  PrinterIcon,
  Search,
  TrashIcon,
  TrendingUp,
  Users
} from 'lucide-react';
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

export const BillingSystem: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [carryBag, setCarryBag] = useState(false);
  const [productList, setProductList] = useState<Product[]>([]);
  const [exitingCustomer, setExitingCustomer] = useState(false)
  const [recentBill, setRecentBill] = useState([])
  const [isOpen, setIsOpen] = useState(false);

  const [printBill, setPrintBill] = useState(false);

  const [billNo, setBillNo] = useState("");
  const [userNo, setUserNo] = useState("");

  const [showBill, setShowBill] = useState(false);


  const [salesData, setSalesData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentBill, setCurrentBill] = useState({
    items: [] as { product: Product; quantity: number; total: number }[],
    total: 0,
  });


  // Retrieve store data
  // const currentBill = useStore(state => state.currentBill) || { items: [], total: 0 };
  const addToBill = useStore(state => state.addToBill);
  const completeBill = useStore(state => state.completeBill);

  const CARRY_BAG_PRICE = 5;
  const GST_RATE = 0.18;

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
    const fetchRecentCustomer = async () => {
      try {

        const response = await axios.get('http://localhost:5000/api/last-two-bill')
        console.log("last two bill", response.data.lasttwosales)
        setRecentBill(response.data.lasttwosales)
        // Get the first part (header part of the JWT)
      } catch (error) {
        console.error('Error checking email:', error);
      }
    };
    fetchRecentCustomer()
    fetchProducts();
  }, []);

  const filteredProducts = productList.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.upc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTaxes = (subtotal: number) => subtotal * GST_RATE;

  const calculateTotal = () => {
    const subtotal = currentBill.items.reduce((sum, item) => sum + item.total, 0);
    const carryBagCharge = carryBag ? CARRY_BAG_PRICE : 0;
    const tax = calculateTaxes(subtotal);
    return { subtotal, tax, carryBagCharge, total: subtotal + tax + carryBagCharge };
  };

  const handleAddProductToBill = (product: Product, quantity: number = 1) => {
    setCurrentBill((prevBill) => {
      const validQuantity = quantity > 0 ? quantity : 1;

      const existingItemIndex = prevBill.items.findIndex(item => item.product.product_id === product.product_id);
      let updatedItems = [...prevBill.items];

      if (existingItemIndex !== -1) {
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + validQuantity;

        if (newQuantity > product.stockQuantity) {
          toast.success(`Only ${product.stockQuantity} items available in stock!`);
          return prevBill;
        }


        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total: newQuantity * product.price,
        };
      } else {

        if (validQuantity > product.stockQuantity) {
          toast.error(`Only ${product.stockQuantity} items available in stock!`);
          return prevBill;
        }

        updatedItems.push({
          product,
          quantity: validQuantity,
          total: product.price * validQuantity,
        });
      }

      const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

      return { items: updatedItems, total: newTotal };
    });
  };


  const deleteProductFromBill = (productId: number) => {
    setCurrentBill((prevBill) => {
      const updatedItems = prevBill.items.filter(item => item.product.product_id !== productId);
      const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

      return { items: updatedItems, total: newTotal };
    });

    toast.success("Product removed from the bill.");
  };





  useEffect(() => {
    console.log("Updated Current Bill:", currentBill);
  }, [currentBill]);

  const handlePrint = () => {


    setShowBill(true);

    const printContent = document.getElementById("print_bill");
    const originalContent = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore original content
    }
  };
  const checkExistingCustomer = async () => {
    console.log("checking existing customer", customerPhone, customerName)

    const response = await axios.get("http://localhost:5000/api/findcustomer")
    console.log(response.data.saleslist)

    response.data.saleslist.forEach(element => {
      if (element.customer.customer_name === customerName || element.customer.customer_phone === customerPhone) {
        setExitingCustomer(true)
      }

    })

  };




  const { subtotal, tax, carryBagCharge, total } = calculateTotal();



  useEffect(() => {
    const fetchLastBillAndUser = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/last-bill-user/", {
          method: "GET",
        });

        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
        const data = await response.json();

        console.log("last user data", data);


        setBillNo(data.bill_no);
        setUserNo(data.user_no);
      } catch (error) {
        console.error("Error fetching bill and user numbers:", error);
      }
    };

    fetchLastBillAndUser();
  }, []);


  const fetchSalesByBillId = async () => {
    if (!billNo.trim()) {
      setError("Please enter a Bill ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:5000/api/printbill/${billNo}`);
      const data = await response.json();

      console.log("Print Data" + data);


      if (response.ok) {
        setSalesData(data);
        setPrintBill(true);
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




  const handleSubmit = async () => {

    const { subtotal, tax: gst, carryBagCharge, total } = calculateTotal();

    const salesData = {
      bill_no: billNo || "001", // Generate random bill number
      date: new Date(),
      customer_name: customerName || "Walk-in Customer",
      customer_phone: customerPhone || "N/A",
      cust_no: userNo || "USR001",
      items: currentBill.items.map(({ product, quantity }) => ({
        product_code: product.upc,
        product_name: product.productName,
        sale_price: product.price,
        product_qty: quantity,
        discount: 0, // Modify if discount logic exists
        total: product.price * quantity,
      })),
      subtotal,
      gst,
      carry_bag_charge: carryBag ? CARRY_BAG_PRICE : 0,
      discount: exitingCustomer ? '10%' : '0',
      total_amount: exitingCustomer ? total * 0.9 : total.toFixed(2),
    };

    try {
      const response = await fetch("http://localhost:5000/api/salesproduct/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salesData),
      });

      const result = await response.json();
      console.log("Response:", result);
      toast.success("Sale recorded successfully!");

      setCustomerName('');
      setCustomerPhone('');

      fetchSalesByBillId();



    } catch (error) {
      console.error("Error submitting sales data:", error);
      toast.error("Failed to submit sale.");
    }
  };











  return (
    <>
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-[2fr_1fr] gap-6 ">
        {/* Product Selection */}
        <div className="bg-white rounded-lg shadow p-6 overflow-y-auto  ">
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
          <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2 mt-2">
            {filteredProducts.map(product => (
              <div key={product.id} className="border rounded-lg p-2 hover:shadow-lg transition-shadow">
                <img src={product.imageUrl} alt={product.productName} className="w-full h-32 object-cover rounded-lg mb-2" />
                <h3 className="font-semibold">{product.productName}</h3>
                <p className="text-sm text-gray-600">{product.upc}</p>
                <p className="text-lg font-bold mt-2">₹{product.price}</p>
                <span className="text-sm text-gray-600">Stock: {product.stockQuantity}</span>
                <div className="flex justify-between items-center mt-2">
                  <button
                    onClick={() => handleAddProductToBill(product, 1)}
                    className="flex items-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                  
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Bill - Sticky */}
        <div className="relative">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4 z-10 h-fit min-w-[200px]">


            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Current Bill</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentBill.items.map((item, index) => (
                  <tr key={index} className="text-center">
                    <td className="px-6 py-4 whitespace-nowrap">{item.product.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{item.product.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{item.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap">

                      <button onClick={() => deleteProductFromBill(item.product.product_id)} className="text-red-500">
                        <TrashIcon />
                      </button>


                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="carryBag"
                className="rounded text-blue-500"
                onChange={(e) => setCarryBag(e.target.checked)}
              />
              <label
                htmlFor="carryBag"
                className="flex items-center text-sm text-gray-700"
              >
                Add Carry Bag (₹5)
              </label>
            </div>

            <div className="mt-4 bg-white p-4 rounded">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600 mt-2">
                <span>GST (18%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              {carryBag && (
                <div className="flex justify-between text-gray-600 mt-2">
                  <span>Carry Bag</span>
                  <span>₹{CARRY_BAG_PRICE}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>


            <div className="block">
              {/* <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition" onClick={() => setIsOpen(true)}>
            <PrinterIcon className="w-5 h-5" /> Print Bill
          </button>

          <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition">
            <Coins className="w-5 h-5" /> Payment
          </button>

          <button className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition">
            Cancel
          </button> */}


              <button style={{ width: "100%" }} className="w-100 block bg-red-500 text-white px-4 py-2 shadow-md hover:bg-red-600 transition" onClick={() => setIsOpen(true)}>
                Proccess For Checkout
              </button>

            </div>





            {isOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg shadow-lg w-[80%] max-w-3xl">
                  {/* Header */}
                  <div className="text-center text-gray-700 text-sm">
                    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                      width="197.000000pt" height="43.000000pt" viewBox="0 0 197.000000 43.000000"
                      preserveAspectRatio="xMidYMid meet" style={{ margin: "auto" }}>

                      <g transform="translate(0.000000,43.000000) scale(0.100000,-0.100000)"
                        fill="#000000" stroke="none">
                        <path d="M232 324 c-38 -26 -27 -73 23 -101 53 -30 52 -48 -3 -48 -32 0 -42
-4 -42 -16 0 -48 124 -33 136 17 8 33 -10 58 -56 79 -50 23 -47 39 9 43 33 3
42 7 39 20 -4 24 -75 28 -106 6z"/>
                        <path d="M1040 236 c0 -88 3 -106 15 -106 12 0 15 15 15 77 0 89 8 87 40 -9
31 -95 48 -92 88 15 l31 82 0 -82 c1 -76 3 -83 21 -83 19 0 20 7 20 105 l0
105 -33 0 c-32 0 -33 -2 -58 -77 l-25 -78 -25 75 c-24 71 -27 75 -57 78 l-32
3 0 -105z"/>
                        <path d="M1638 322 c-10 -2 -18 -12 -18 -23 0 -10 -7 -19 -15 -19 -8 0 -15 -6
-15 -14 0 -8 7 -16 15 -20 10 -4 15 -19 15 -49 0 -48 13 -67 47 -67 16 0 23 6
23 20 0 11 -7 20 -15 20 -11 0 -15 11 -15 40 0 29 4 40 15 40 8 0 15 7 15 15
0 8 -6 15 -14 15 -8 0 -16 10 -18 23 -2 15 -9 21 -20 19z"/>
                        <path d="M380 215 c0 -61 2 -66 26 -77 20 -9 30 -9 47 1 15 10 22 11 25 2 2
-6 12 -11 23 -11 17 0 19 8 19 75 0 68 -2 75 -20 75 -17 0 -20 -7 -20 -42 0
-52 -11 -71 -36 -66 -15 2 -20 14 -22 56 -3 44 -6 52 -23 52 -17 0 -19 -7 -19
-65z"/>
                        <path d="M560 170 c0 -103 1 -110 20 -110 17 0 20 7 20 45 0 42 2 45 19 35 48
-25 91 7 91 68 0 59 -53 94 -89 60 -11 -10 -14 -10 -18 0 -3 6 -13 12 -24 12
-18 0 -19 -8 -19 -110z m105 35 c0 -25 -4 -31 -26 -33 -29 -3 -44 18 -33 50 4
14 13 18 32 16 23 -2 27 -8 27 -33z"/>
                        <path d="M766 259 c-52 -41 -23 -129 43 -129 39 0 61 9 61 25 0 10 -10 12 -33
8 -23 -3 -37 0 -46 11 -12 14 -8 16 38 16 48 0 51 2 51 25 0 32 -33 65 -64 65
-13 0 -35 -9 -50 -21z m72 -26 c2 -9 -7 -13 -28 -13 -28 0 -31 2 -20 15 15 18
41 16 48 -2z"/>
                        <path d="M910 205 c0 -68 2 -75 20 -75 17 0 20 7 20 43 0 46 13 67 42 67 11 0
18 7 18 20 0 23 -19 26 -39 8 -11 -10 -14 -10 -18 0 -3 6 -13 12 -24 12 -17 0
-19 -8 -19 -75z"/>
                        <path d="M1333 273 c-27 -10 -13 -30 22 -29 42 1 51 -18 10 -22 -38 -5 -55
-19 -55 -47 0 -35 26 -51 61 -38 16 6 29 7 29 2 0 -5 9 -9 20 -9 18 0 20 7 20
55 0 42 -5 60 -20 75 -19 19 -59 25 -87 13z m65 -85 c-6 -16 -36 -34 -44 -26
-3 4 -4 14 -1 23 7 17 51 21 45 3z"/>
                        <path d="M1480 205 c0 -68 2 -75 20 -75 17 0 20 7 20 39 0 52 8 71 31 71 12 0
19 7 19 20 0 22 -20 26 -38 8 -9 -9 -12 -9 -12 0 0 7 -9 12 -20 12 -18 0 -20
-7 -20 -75z"/>
                      </g>
                    </svg>
                    <p className="mt-4">
                      N6/272, IRC Village <br />
                      Jaydev Vihar, Bhubaneswar. 751015
                    </p>
                    <p>
                      <b>GSTIN:</b> XXXXXXXXXX789
                    </p>

                    {printBill && (
                      <div className="flex justify-end">
                        <button className="flex items-center gap-3 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600" onClick={handlePrint}>
                          <PrinterIcon />
                          Print Bill
                        </button>
                      </div>
                    )}

                    <hr className="border-dashed border-gray-500 my-4" />
                  </div>


                  {/* Modal Content */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Section - Customer Details */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        placeholder="Enter customer name"
                        required
                      />

                      <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">
                        Customer Phone
                      </label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        onBlur={checkExistingCustomer}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        placeholder="Enter customer phone"
                        required
                      />



                      <label className="block text-sm font-medium text-gray-700 mt-4">
                        Payment Method
                      </label>
                      <select className="w-full border rounded-lg p-2">
                        <option value="">Select payment Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>

                    {/* Right Section - Billing Details */}
                    <div>
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr>
                            <th>Sn.</th>
                            <th>Item Name</th>
                            <th>QTY</th>
                            <th>Price</th>
                            <th className="text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="h-[150px] overflow-y-scroll">
                          {currentBill.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td>{index + 1}</td>
                              <td>{item.product.productName}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.product.price}</td>
                              <td className="text-right">₹ {item.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <table className="w-full mt-4 border border-green-500 rounded">
                        <thead>
                          <tr>
                            <td>Subtotal In Rs:</td>
                            <td className="text-right">₹{subtotal}</td>
                          </tr>
                          <tr>
                            <td>GST (18%):</td>
                            <td className="text-right">₹{tax.toFixed(2)}</td>
                          </tr>

                          {carryBag && (
                            <tr>
                              <td>Carry Bag</td>
                              <td className="text-right">₹{CARRY_BAG_PRICE}</td>
                            </tr>
                          )}
                          {exitingCustomer && (
                            <tr>
                              <td>Existing Customer Discounted</td>
                              <td className="text-right">10%</td>
                            </tr>
                          )}
                        </thead>
                      </table>

                      <table className="w-full bg-yellow-100 rounded mt-4 p-2">
                        <thead>
                          <tr>
                            <th>Total</th>
                            <th className="text-right">₹{(exitingCustomer ? total * 0.9 : total).toFixed(2)}</th>
                          </tr>
                        </thead>
                      </table>
                    </div>
                  </div>

                  {/* Close Button */}

                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold px-6 py-3  shadow-md transition-all duration-300"
                      onClick={() => handleSubmit()}
                    >
                      Complete Order
                    </button>

                    <button
                      className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold px-6 py-3  shadow-md transition-all duration-300"
                      onClick={() => setIsOpen(false)}
                    >
                      Close
                    </button>
                  </div>


                </div>
              </div>
            )}












          </div>
          <div className="bg-white rounded-lg shadow-md p-6 mt-3 sticky h-fit  z-20">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold">Recent Customers</h2>
            </div>
            <div className="space-y-4">
              {recentBill.map((customer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{customer.customer.customer_name}</p>
                    <p className="text-sm text-gray-500">
                      {format(customer.date, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    ₹{customer.total_amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>



      </div>

      {
        showBill && (
          <div id="print_bill">
            {/* Header */}




            <div className=" text-gray-700 text-sm">
              <div className='text-center'>
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                  width="197.000000pt" height="43.000000pt" viewBox="0 0 197.000000 43.000000"
                  preserveAspectRatio="xMidYMid meet" style={{ margin: "auto" }}>

                  <g transform="translate(0.000000,43.000000) scale(0.100000,-0.100000)"
                    fill="#000000" stroke="none">
                    <path d="M232 324 c-38 -26 -27 -73 23 -101 53 -30 52 -48 -3 -48 -32 0 -42
-4 -42 -16 0 -48 124 -33 136 17 8 33 -10 58 -56 79 -50 23 -47 39 9 43 33 3
42 7 39 20 -4 24 -75 28 -106 6z"/>
                    <path d="M1040 236 c0 -88 3 -106 15 -106 12 0 15 15 15 77 0 89 8 87 40 -9
31 -95 48 -92 88 15 l31 82 0 -82 c1 -76 3 -83 21 -83 19 0 20 7 20 105 l0
105 -33 0 c-32 0 -33 -2 -58 -77 l-25 -78 -25 75 c-24 71 -27 75 -57 78 l-32
3 0 -105z"/>
                    <path d="M1638 322 c-10 -2 -18 -12 -18 -23 0 -10 -7 -19 -15 -19 -8 0 -15 -6
-15 -14 0 -8 7 -16 15 -20 10 -4 15 -19 15 -49 0 -48 13 -67 47 -67 16 0 23 6
23 20 0 11 -7 20 -15 20 -11 0 -15 11 -15 40 0 29 4 40 15 40 8 0 15 7 15 15
0 8 -6 15 -14 15 -8 0 -16 10 -18 23 -2 15 -9 21 -20 19z"/>
                    <path d="M380 215 c0 -61 2 -66 26 -77 20 -9 30 -9 47 1 15 10 22 11 25 2 2
-6 12 -11 23 -11 17 0 19 8 19 75 0 68 -2 75 -20 75 -17 0 -20 -7 -20 -42 0
-52 -11 -71 -36 -66 -15 2 -20 14 -22 56 -3 44 -6 52 -23 52 -17 0 -19 -7 -19
-65z"/>
                    <path d="M560 170 c0 -103 1 -110 20 -110 17 0 20 7 20 45 0 42 2 45 19 35 48
-25 91 7 91 68 0 59 -53 94 -89 60 -11 -10 -14 -10 -18 0 -3 6 -13 12 -24 12
-18 0 -19 -8 -19 -110z m105 35 c0 -25 -4 -31 -26 -33 -29 -3 -44 18 -33 50 4
14 13 18 32 16 23 -2 27 -8 27 -33z"/>
                    <path d="M766 259 c-52 -41 -23 -129 43 -129 39 0 61 9 61 25 0 10 -10 12 -33
8 -23 -3 -37 0 -46 11 -12 14 -8 16 38 16 48 0 51 2 51 25 0 32 -33 65 -64 65
-13 0 -35 -9 -50 -21z m72 -26 c2 -9 -7 -13 -28 -13 -28 0 -31 2 -20 15 15 18
41 16 48 -2z"/>
                    <path d="M910 205 c0 -68 2 -75 20 -75 17 0 20 7 20 43 0 46 13 67 42 67 11 0
18 7 18 20 0 23 -19 26 -39 8 -11 -10 -14 -10 -18 0 -3 6 -13 12 -24 12 -17 0
-19 -8 -19 -75z"/>
                    <path d="M1333 273 c-27 -10 -13 -30 22 -29 42 1 51 -18 10 -22 -38 -5 -55
-19 -55 -47 0 -35 26 -51 61 -38 16 6 29 7 29 2 0 -5 9 -9 20 -9 18 0 20 7 20
55 0 42 -5 60 -20 75 -19 19 -59 25 -87 13z m65 -85 c-6 -16 -36 -34 -44 -26
-3 4 -4 14 -1 23 7 17 51 21 45 3z"/>
                    <path d="M1480 205 c0 -68 2 -75 20 -75 17 0 20 7 20 39 0 52 8 71 31 71 12 0
19 7 19 20 0 22 -20 26 -38 8 -9 -9 -12 -9 -12 0 0 7 -9 12 -20 12 -18 0 -20
-7 -20 -75z"/>
                  </g>
                </svg>
              </div>
              <div className='flex justify-between items-center'>
                <div>
                  <h2>Customer Details : </h2>
                  <p>
                    <strong>Name: </strong> {salesData.customer.customer_name}
                  </p>
                  <p>
                    <strong>Phone: </strong> {salesData.customer.customer_phone}
                  </p>
                </div>
                <div>
                  <p className="mt-4">
                    N6/272, IRC Village <br />
                    Jaydev Vihar, Bhubaneswar. 751015
                  </p>
                  <p>
                    <b>GSTIN:</b> XXXXXXXXXX789
                  </p>
                </div>

              </div>


              <hr className="border-dashed border-gray-500 my-4" />
              <div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th>Sn.</th>
                      <th>Item Name</th>
                      <th>QTY</th>
                      <th>Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {salesData?.items?.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td>{index + 1}</td>
                        <td>{item.product_name}</td> {/* Fixed */}
                        <td>{item.product_qty}</td> {/* Fixed */}
                        <td>₹{item.sale_price}</td> {/* Fixed */}
                        <td className="text-right">₹ {item.total}</td>
                      </tr>
                    ))}
                  </tbody>

                </table>

                <table className="w-full mt-4 border border-green-500 rounded">
                  <thead>
                    <tr>
                      <td>Subtotal In Rs:</td>
                      <td className="text-right">₹{salesData?.subtotal?.toFixed(2) || "0.00"}</td> {/* Fixed */}
                    </tr>
                    <tr>
                      <td>GST (18%):</td>
                      <td className="text-right">₹{salesData?.gst?.toFixed(2) || "0.00"}</td> {/* Fixed */}
                    </tr>

                    {carryBag && (
                      <tr>
                        <td>Carry Bag</td>
                        <td className="text-right">₹{CARRY_BAG_PRICE}</td>
                      </tr>
                    )}
                  </thead>
                </table>

                <table className="w-full bg-yellow-100 rounded mt-4 p-2">
                  <thead>
                    <tr>
                      <th>Total</th>
                      <th className="text-right">₹{salesData?.total_amount?.toFixed(2) || "0.00"}</th> {/* Fixed */}
                    </tr>
                  </thead>
                </table>



              </div>


            </div>
          </div>
        )
      }
    </>
  );
};

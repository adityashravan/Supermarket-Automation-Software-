const express = require("express");
const multer = require("multer");

const slugify = require("slugify");
const path = require("path");
// // supabaseClient.ts
// import { createClient } from '@supabase/supabase-js';

// // Initialize the Supabase client with your project URL and anon key
// const supabaseUrl = 'https://fjlfvydicuniezfevuiw.supabase.co'
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbGZ2eWRpY3VuaWV6ZmV2dWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNzA3MDIsImV4cCI6MjA1Nzg0NjcwMn0.8ZfK7StecxN8dFN9HLRTeDf6uW1ZkaXVs8McqI0Pj3U'
// export const supabase = createClient(supabaseUrl, supabaseKey);

// server.js or app.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // To parse JSON in requests

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Define a simple MongoDB model

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

const customerSchema = new mongoose.Schema({
  cust_id: { type: String, required: true },
  cust_name: { type: String, required: true },
  address: { type: String, required: true },
  cust_no: { type: Number, require: true },
});

const salesSchema = new mongoose.Schema({
  bill_no: { type: Number, required: true }, // Unique bill number
  date: { type: Date, required: true }, // Date of the transaction
  customer: {
    customer_name: { type: String, required: true }, // Customer's name
    customer_phone: { type: String, required: true }, // Customer's email (optional)
    cust_no: { type: String, required: true }, // Customer number (e.g., for loyalty program)
  },
  items: [
    {
      product_code: { type: String, required: true }, // Product code
      product_name: { type: String, required: true }, // Product name
      sale_price: { type: Number, required: true }, // Price per product
      product_qty: { type: Number, required: true }, // Quantity of product
      discount: { type: Number, required: true }, // Discount applied on the product
      total: { type: Number, required: true }, // Total price for this product (after discount)
    },
  ],
  subtotal: { type: Number, required: true }, // Subtotal for the bill before taxes
  gst: { type: Number, required: true }, // GST applied on the subtotal
  carry_bag_charge: { type: Number, default: 0 }, // Charge for carry bag (if any)
  discount: { type: String,required:true },
  total_amount: { type: Number, required: true }, // Total amount after adding GST, carry bag, etc.
});

const purchaseSchema = new mongoose.Schema({
  order_no: { type: Number, required: true },
  date: { type: Date, required: true },
  product_code: { type: String, required: true },
  sale_price: { type: Number, required: true },
  cust_no: { type: Number, required: true },
  product_qty: { type: Number, required: true },
  discount: { type: Number, require: true },
  total: { type: Number, require: true },
});
const productcatSchema = new mongoose.Schema({
  cat_id: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  abbreviation: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  category_url: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

productcatSchema.pre("validate", async function (next) {
  if (!this.cat_id) {
    const lastCategory = await this.constructor.findOne(
      {},
      {},
      { sort: { cat_id: -1 } }
    );
    this.cat_id = lastCategory ? lastCategory.cat_id + 1 : 1;
  }

  if (!this.category_url) {
    this.category_url = slugify(`${this.name}-${this.cat_id}`, {
      lower: true,
      strict: true,
    });
  }

  next();
});

const productSchema = new mongoose.Schema({
  product_id: {
    type: Number,
    unique: true,
    required: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: Number,
    required: true,
  },
  upc: {
    type: String,
    required: true,
    unique: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  product_url: {
    type: String,
    unique: true,
  },
});

productSchema.pre("validate", async function (next) {
  if (!this.product_id) {
    const lastProduct = await this.constructor.findOne(
      {},
      {},
      { sort: { product_id: -1 } }
    );
    this.product_id = lastProduct ? lastProduct.product_id + 1 : 1;
  }

  if (!this.product_url) {
    this.product_url = slugify(`${this.productName}-${this.product_id}`, {
      lower: true,
      strict: true,
    });
  }

  next();
});

const Productcat = mongoose.model("ProductCategory", productcatSchema);

const Product = mongoose.model("Product", productSchema);

const Sales = mongoose.model("Sales", salesSchema);
const User = mongoose.model("User", userSchema);

// POST route to handle signup
app.post("/api/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  // Example validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ name, email, password: hashedPassword, role });

    const savedUser = await newUser.save();
    const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res
      .status(201)
      .json({ message: "User created successfully", token: token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: `Internal Server Error${error}` });
  }
});

// POST route to handle login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" + email });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token:token,role:user.role });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.post("/api/user", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: `User not found ${email} ` });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create a new item (Create operation)
// Get all sales
app.get("/api/sales/", async (req, res) => {
  try {
    const sales = await Sales.find();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get today's revenue, items sold, and transactions from Sales table
app.get("/api/today-stats/", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const todaySales = await Sales.find({
      date: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      },
    });

    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalTransactions = todaySales.length;
    const totalItemsSold = todaySales.reduce((sum, sale) => {
      if (!Array.isArray(sale.items)) return sum;

      return sum + sale.items.reduce((itemSum, item) => {
        if (typeof item.product_qty !== 'number') {
          console.warn("Invalid quantity:", item.product_qty); // Debugging
        }
        return itemSum + (item.product_qty ? Number(item.product_qty) : 0);
      }, 0);
    }, 0);


    res.json({ totalRevenue, totalTransactions, totalItemsSold });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read items (Read operation)

// Add Product Category to the database
app.post("/api/productcatadd/", async (req, res) => {
  try {
    const { name, abbreviation } = req.body;
    if (!name || !abbreviation) {
      return res
        .status(400)
        .json({ message: "Name and abbreviation are required" });
    }
    const newCategory = new Productcat({ name, abbreviation });
    await newCategory.save();
    res
      .status(201)
      .json({ message: "Category added successfully", category: newCategory });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Product Category List API to fetach data form database
app.get("/api/productcatlist/", async (req, res) => {
  try {
    const categories = await Productcat.find({}).sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update product category by cat_id
app.put("/api/productcatupdate/:id", async (req, res) => {
  const cat_id = parseInt(req.params.id, 10); // Convert id to a number
  const { newName, abbreviation } = req.body;

  try {
    const category = await Productcat.findOne({ cat_id });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.name = newName || category.name;
    category.abbreviation = abbreviation || category.abbreviation;

    await category.save();
    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get product category by cat_id
app.get("/api/getproductcatbyid/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    // console.log(categoryId);

    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const products = await Productcat.findOne({ cat_id: categoryId });

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this category" });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Delete product category by cat_id
app.delete("/api/categorydelete/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const subcategories = await Product.find({ category: categoryId });

    if (subcategories.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete category. Subcategories exist under this category.",
      });
    }

    // Proceed to delete the category if no subcategories exist
    const deletedCategory = await Productcat.findOneAndDelete({
      cat_id: categoryId,
    });

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category deleted successfully",
      category: deletedCategory,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// File upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Product Add API
app.post("/api/productadd/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image upload failed" });
    }

    const price = Number(req.body.price);
    const stockQuantity = Number(req.body.stock);
    if (isNaN(price) || isNaN(stockQuantity)) {
      return res
        .status(400)
        .json({ message: "Price and Stock must be numbers" });
    }

    const existingProduct = await Product.findOne({ upc: req.body.upc });
    if (existingProduct) {
      return res.status(400).json({ message: "UPC already exists" });
    }

    const newProduct = new Product({
      productName: req.body.productName,
      price,
      category: req.body.category,
      upc: req.body.upc,
      stockQuantity,
      imageUrl: `/uploads/${req.file.filename}`,
    });

    await newProduct.save();
    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Get all products
app.get("/api/getProducts/", async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
app.get("/api/getProductsCategory/", async (req, res) => {
  try {
    const productscat = await Productcat.find({});
    res.status(200).json(productscat);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Get all products
app.put("/api/productupdate/:product_id", async (req, res) => {
  try {
    const productId = req.params.product_id;
    const updatedData = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { product_id: productId }, // Search by product_id (Number)
      updatedData,
      { new: true }
    );

    console.log(updatedProduct);

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.delete("/api/productdelete/:product_id", async (req, res) => {
  try {
    const productId = req.params.product_id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const deletedProduct = await Product.findOneAndDelete({
      product_id: productId,
    });

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Create Sales Record API
app.post("/api/salesproduct/", async (req, res) => {
  try {
    const {
      bill_no,
      date,
      customer_name,
      customer_phone,
      cust_no,
      items,
      subtotal,
      gst,
      carry_bag_charge,
      discount,
      total_amount,
    } = req.body;

    // Save the sale
    const newSale = new Sales({
      bill_no,
      date,
      customer: {
        customer_name,
        customer_phone,
        cust_no,
      },
      items,
      subtotal,
      gst,
      carry_bag_charge,
      discount,
      total_amount,
    });

    await newSale.save();

    // Update stock quantity for each sold product
    for (const item of items) {
      const product = await Product.findOne({ upc: item.product_code });

      if (product) {
        product.stockQuantity = Math.max(
          product.stockQuantity - item.product_qty,
          0
        );
        await product.save();
      }
    }

    res
      .status(201)
      .json({
        message: "Sale recorded successfully and stock updated",
        sale: newSale,
      });
  } catch (error) {
    console.error("Error saving sale:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

app.get("/api/last-two-bill/", async (req, res) => {
  try {
    const lastTwoSales = await Sales.find().sort({ bill_no: -1 }).limit(2).lean();

    console.log(lastTwoSales);

    

    res.status(200).json({ lasttwosales:lastTwoSales });
  } catch (error) {
    console.error("Database error fetching last bill and user number:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});
app.get("/api/findcustomer/", async (req, res) => {
  // const {
  //   customer_name,customer_phone
  // } = req.body;
  try {
    const salesList = await Sales.find();

    console.log(salesList);

    

    res.status(200).json({ saleslist:salesList });
  } catch (error) {
    console.error("Database error fetching last bill and user number:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

app.get("/api/last-bill-user/", async (req, res) => {
  try {
    const lastSale = await Sales.findOne().sort({ bill_no: -1 }).lean();

    console.log(lastSale);

    let lastBillNo =
      lastSale && lastSale.bill_no ? parseInt(lastSale.bill_no, 10) : 0;
    let lastUserNo =
      lastSale && lastSale.customer.cust_no
        ? lastSale.customer.cust_no
        : "USR0000";

    const numericUserNo = lastUserNo.startsWith("USR")
      ? parseInt(lastUserNo.replace("USR", ""), 10)
      : 0;

    const nextBillNo = String(lastBillNo + 1).padStart(3, "0");
    function incrementString(str) {
      let match = str.match(/(\D+)(\d+)$/);

      if (match) {
        let prefix = match[1];
        let number = match[2];

        let incrementedNumber = (parseInt(number, 10) + 1)
          .toString()
          .padStart(number.length, "0");

        return prefix + incrementedNumber;
      }

      return str;
    }

    const nextUserNo = `USR${String(numericUserNo + 1).padStart(4, "0")}`;

    console.log("Next Bill No:", nextBillNo);
    console.log("Next User No:", nextUserNo);

    res.status(200).json({ bill_no: nextBillNo, user_no: nextUserNo });
  } catch (error) {
    console.error("Database error fetching last bill and user number:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// API to fetch sales data by bill_no
app.get("/api/printbill/:bill_id", async (req, res) => {
  try {
    const { bill_id } = req.params;

    // Find sale record using bill_no
    const saleData = await Sales.findOne({ bill_no: bill_id });

    if (!saleData) {
      return res.status(404).json({ message: "Sale record not found" });
    }

    res.status(200).json(saleData);
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

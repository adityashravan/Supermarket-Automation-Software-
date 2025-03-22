import React, { useEffect, useRef, useState } from 'react';
import { Delete, Edit, Edit2, TrashIcon, X } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { Spinner } from './Spinner';
import toast, { Toaster } from 'react-hot-toast';

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

const fetchProductCategories = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/productcatlist/');
        if (!response.ok) throw new Error('Failed to fetch categories');
        return await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

export const ProductManager: React.FC = () => {
    const [productList, setProductList] = useState<Product[]>([]);
    const [categories, setCategories] = useState<[]>([]);
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [upc, setUpc] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [stock, setStock] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [refresh, setRefresh] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const barcodeRef = useRef<SVGSVGElement>(null);

    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

    const generateUPC = () => {
        setUpc(Math.floor(100000000000 + Math.random() * 900000000000).toString());
    };


    useEffect(() => {
        if (upc && barcodeRef.current) {
            JsBarcode(barcodeRef.current, upc, { format: 'CODE128', width: 2, height: 50, displayValue: true });
        }
    }, [upc]);

    useEffect(() => {
        const loadCategories = async () => {
            const categoryData = await fetchProductCategories();
            setCategories(categoryData);
        };
        loadCategories();
    }, []);



    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/getProducts/");
                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`);
                }
                const data = await response.json();
                setProductList(data);
            } catch (err) {
                console.error("Error fetching product list:", err);
                toast.error(`Failed to fetch products: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [refresh]);  // fetching product list when the page is refreshed
    
    useEffect(() => {
        const fetchCategoriesByProductIds = async () => {
            // Make sure productList is available before trying to fetch categories
            if (productList.length === 0) return;
    
            const uniqueCategoryIds = [...new Set(productList.map((p) => p.category))]; // map to category ID
            const categoryData: Record<string, string> = {};
            console.log(uniqueCategoryIds,productList)
            for (let id of uniqueCategoryIds) {
                try {
                    const response = await fetch(`http://localhost:5000/api/getproductcatbyid/${id}`);
                    const data = await response.json();
                    if (response.ok) {
                        categoryData[id] = data.categoryName; // category name is fetched here
                    } else {
                        categoryData[id] = "Unknown Category"; // fallback if category fetch fails
                    }
                } catch (error) {
                    console.error("Error fetching category:", error);
                    categoryData[id] = "Error Loading";
                    toast.error("Error loading category data.");
                }
            }
    
            setCategoryMap(categoryData);  // store the fetched category data
        };
    
        fetchCategoriesByProductIds();
    }, [productList]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && !file.type.startsWith("image/")) {
            setErrorMessage("Only image files (JPEG, PNG, GIF, WebP) are allowed");
            setImage(null);
            toast.error("Invalid file type. Only images are allowed.");
        } else {
            setErrorMessage("");
            setImage(file || null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!productName || !price || !selectedCategoryId || !upc || !image || !stock) {
            setErrorMessage("All fields are required.");
            toast.error("All fields are required.");
            return;
        }

        const formData = new FormData();
        formData.append("productName", productName);
        formData.append("price", price);
        formData.append("category", selectedCategoryId.toString());
        formData.append("upc", upc);
        formData.append("stock", stock);
        if (image) formData.append("image", image);

        try {
            const response = await fetch("http://localhost:5000/api/productadd/", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to add product");

            setProductName("");
            setPrice("");
            setSelectedCategoryId(null);
            setUpc("");
            setImage(null);
            setStock("");
            setErrorMessage("");
            setRefresh((prev) => !prev);
            toast.success("Product added successfully!");
        } catch (error) {
            console.error("Error adding product:", error);
            toast.error(error.message || "Failed to add product. Try again.");
        }
    };

const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    // setSelectedCategoryId(product.category); // Set the selected category ID
    setModalOpen(true);
};

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!selectedProduct) return;
        setSelectedProduct({ ...selectedProduct, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProduct) return;

        console.log("Updating Product ID:", selectedProduct.product_id,selectedCategoryId);

        try {
            const response = await fetch(`http://localhost:5000/api/productupdate/${selectedProduct.product_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName: selectedProduct.productName,
                    price: selectedProduct.price,
                    category: selectedCategoryId, // Use selectedCategoryId here
                    stockQuantity: selectedProduct.stockQuantity,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update product");
            }

            setModalOpen(false);
            setRefresh((prev) => !prev);
            toast.success("Product updated successfully!");
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Failed to update product.");
        }
    };
    const handleDeleteClick = async (product: Product) => {
        if (!product || !product.product_id) return;

        const confirmDelete = window.confirm(`Are you sure you want to delete ${product.productName}?`);
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:5000/api/productdelete/${product.product_id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete product");
            }

            setRefresh((prev) => !prev);
            toast.success("Product deleted successfully!");
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product.");
        }
    };





    return (
        <>
            <div className="flex min-h-screen bg-gray-100">
                <div className="flex-1 flex p-6">
                    <div className="w-2/3">
                        <h2 className="text-2xl font-bold text-gray-700 mb-4">Product List</h2>
                        <div className="bg-white rounded-lg shadow overflow-hidden">



                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">UPC</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Stock</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                {loading ? <tr>
                                    <td colSpan={6}><Spinner /></td>
                                </tr> : (
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {productList.map((product) => {
                                            // Find category by ID
                                            const categoryName = categories.find(cat => cat.cat_id === product.category)?.name || "Loading...";
                                           

                                            return (
                                                <tr key={product.product_id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 text-sm text-gray-900">{product.productName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">₹{product.price}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{categoryName}</td> {/* Display the category name */}
                                                    <td className="px-6 py-4 text-sm text-gray-900">{product.upc}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{product.stockQuantity}</td>
                                                    <td className="px-6 py-4 text-sm flex space-x-4">
                                                        <button className="text-blue-600 hover:text-blue-900 flex items-center" onClick={() => handleEditClick(product)}>
                                                            <Edit2 className="w-4 h-4 mr-1" /> Edit
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-800 flex items-center" onClick={() => handleDeleteClick(product)}>
                                                            <TrashIcon className="w-4 h-4 mr-1" /> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                )
                                }
                            </table>
                        </div>
                    </div>

                    <div className="w-1/3">
                        <div className="fixed top-6 right-6 w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
                            <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">Add Product</h2>
                            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full p-3 border rounded-lg" required />
                                <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-3 border rounded-lg" required />
                                <select
                                    value={selectedCategoryId || ""}
                                    onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                                    className="w-full p-3 border rounded-lg"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((category) => (
                                        <option key={category.cat_id} value={category.cat_id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>


                                {/* UPC & Barcode */}
                                <div>
                                    <label className="block text-sm font-medium">Unique Product Code (UPC)</label>
                                    <div className="flex space-x-2">
                                    <input type="number" value={upc} className="w-full p-2 border rounded bg-gray-100" onChange={(e)=>{setUpc(e.target.value)}} />
                                        {/* <button type="button" onClick={generateUPC} className="bg-blue-500 text-white px-3 py-1 rounded">Generate</button> */}
                                    </div>
                                    {upc && <svg ref={barcodeRef} className="mt-2"></svg>}
                                </div>

                                <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-3 border rounded-lg" />
                                <input type="number" placeholder="Stock Quantity" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full p-3 border rounded-lg" required />
                                <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg">Add Product</button>
                            </form>
                        </div>
                    </div>






                    {/* Edit Modal */}
                    {modalOpen && selectedProduct && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Edit Product</h2>
                                    <button onClick={() => setModalOpen(false)}>
                                        <X className="w-6 h-6 text-gray-500 hover:text-gray-800" />
                                    </button>
                                </div>

                                <label className="block text-sm font-medium text-gray-600">Product Name</label>
                                <input
                                    type="text"
                                    name="productName"
                                    value={selectedProduct.productName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg mb-2"
                                />

                                <label className="block text-sm font-medium text-gray-600">Price</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={selectedProduct.price}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg mb-2"
                                />

                                <label className="block text-sm font-medium text-gray-600">Category</label>

                                <select
                                    value={selectedProduct?.category || ""}
                                    onChange={(e) => {setSelectedProduct({ ...selectedProduct, category: e.target.value });setSelectedCategoryId(Number(e.target.value))}}
                                    className="w-full p-3 border rounded-lg"
                                >   <option value="">Select Product Cat</option>
                                    {categories.map((category) => (
                                        <option key={category.cat_id} value={category.cat_id} selected={selectedProduct?.category == String(category.cat_id)}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                                <label className="block text-sm font-medium text-gray-600">UPC (Cannot be changed)</label>
                                <input
                                    type="text"
                                    value={selectedProduct.upc}
                                    disabled
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-200 cursor-not-allowed mb-2"
                                />

                                <label className="block text-sm font-medium text-gray-600">Stock Quantity</label>
                                <input
                                    type="number"
                                    name="stockQuantity"
                                    value={selectedProduct.stockQuantity}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg mb-4"
                                />

                                <button
                                    onClick={handleSave}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition duration-200"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}









                </div>
            </div>

        </>
    );
};

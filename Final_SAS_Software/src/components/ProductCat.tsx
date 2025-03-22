import React, { useEffect, useState } from 'react';
import { Edit2, TrashIcon } from 'lucide-react';
import { Spinner } from './Spinner';
import toast, { Toaster } from 'react-hot-toast';

interface Product {
    cat_id: number;
    name: string;
    abbreviation: string;
}



export const ProductCat: React.FC = () => {
    const [refresh, setRefresh] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [categoryAbbreviation, setCategoryAbbreviation] = useState('');
    const [productList, setProductList] = useState<Product[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editAbbreviation, setEditAbbreviation] = useState('');

    const [loading, setLoading] = useState<boolean>(true);

    const generateAbbreviation = (cat: string) => {
        if (!cat) return '';
        const words = cat.trim().split(/\s+/);
        return words.length > 1 ? words.map(word => word[0]).join('') : cat.substring(0, 3).toUpperCase();
    };





    const fetchProductCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/productcatlist/', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            } else {
                setLoading(false);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    };



    useEffect(() => {
        const loadCategories = async () => {
            const categories = await fetchProductCategories();
            setProductList(categories);
        };
        loadCategories();
    }, [refresh]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (categoryName) {
            try {
                const response = await fetch('http://localhost:5000/api/productcatadd/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: categoryName,
                        abbreviation: categoryAbbreviation,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to add category');
                }

                setRefresh(prev => !prev);
                setCategoryName('');
                setCategoryAbbreviation('');
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.cat_id); // Use cat_id instead of name
        setEditName(product.name);
        setEditAbbreviation(product.abbreviation);
    };




    const handleSave = async () => {
        if (!editingId) {
            console.error("Error: No category selected for update");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/productcatupdate/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newName: editName,
                    abbreviation: editAbbreviation
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update category: ${errorText}`);
            }

            setEditingId(null);
            setRefresh((prev) => !prev);
        } catch (error) {
            console.error('Error updating category:', error.message);
        }
    };


    const handleDeleteCategory = async (categoryId: Number) => {
        if (!categoryId) {
            toast.error("Category ID is required");
            return;
        }

        const confirmDelete = window.confirm("Are you sure you want to delete this category?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:5000/api/categorydelete/${categoryId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete category");
            }

            toast.success("Category deleted successfully!");
            setRefresh((prev) => !prev); // Refresh the category list

        } catch (error: any) {
            toast.error(error.message || "Error deleting category");
            console.error("Error deleting category:", error);
        }
    };



    return (
        <div className="flex min-h-screen bg-gray-100">
            <div className="flex-1 flex p-6">
                <div className="w-2/3">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">Product Category List</h2>
                    {productList.length === 0 ? (
                        <Spinner />
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category Abbreviation
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                {loading ? <tr>
                                    <td colSpan={6}><Spinner /></td>
                                </tr> : (

                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {productList.map((product) => (
                                            <tr key={product.cat_id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {editingId === product.cat_id ? (
                                                        <input
                                                            type="text"
                                                            value={editName}
                                                            onChange={(e) => { setEditName(e.target.value); setEditAbbreviation(generateAbbreviation(e.target.value)); }}
                                                            className="w-full px-2 py-1 border rounded"
                                                        />
                                                    ) : (
                                                        <div className="text-sm text-gray-900">{product.name}</div>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {editingId === product.cat_id ? (
                                                        <input
                                                            type="text"
                                                            value={editAbbreviation}
                                                            className="w-full px-2 py-1 border rounded"
                                                            disabled
                                                        />
                                                    ) : (
                                                        <div className="text-sm text-gray-900">{product.abbreviation}</div>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-sm flex space-x-4">
                                                    {editingId === product.cat_id ? (
                                                        <button
                                                            onClick={handleSave}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Save
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="text-blue-600 hover:text-blue-900 flex items-center"
                                                        >
                                                            <Edit2 className="w-4 h-4 mr-1" />
                                                            Edit
                                                        </button>
                                                    )}

                                                    <button className="text-red-600 hover:text-red-800 flex items-center" onClick={() => handleDeleteCategory(product.cat_id)} >
                                                        <TrashIcon className="w-4 h-4 mr-1" /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>
                    )}
                </div>

                <div className="w-1/3">
                    <div className="fixed top-6 right-6 w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">Add Product Category</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-600">
                                    Category Name
                                </label>
                                <input
                                    type="text"
                                    id="categoryName"
                                    value={categoryName}
                                    onChange={(e) => {
                                        setCategoryName(e.target.value);
                                        setCategoryAbbreviation(generateAbbreviation(e.target.value));
                                    }}
                                    placeholder="Enter category name"
                                    className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    required
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg transition duration-200">
                                Add Category
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

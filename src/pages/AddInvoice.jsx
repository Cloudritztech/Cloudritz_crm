import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { customersAPI, productsAPI, invoicesAPI } from '../services/api';

const AddInvoice = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: "",
    items: [{ product: "", quantity: 1, price: 0, discount: 0, discountType: "amount", name: "", isCustom: false }],
    discount: 0,
    discountType: "amount",
    paymentMethod: "cash",
    paymentStatus: "paid",
    notes: "",
    
    // GST Controls
    applyGST: false,
    
    // Invoice details
    deliveryNote: "",
    referenceNo: "",
    buyerOrderNo: "",
    destination: "",
    
    // Buyer details (optional address override)
    buyerDetails: {
      gstin: "",
      street: "",
      city: "",
      state: "",
      pincode: ""
    },
    
    dueDate: "",
    terms: "Payment due within 30 days"
  });
  
  // Quick customer add
  const [quickCustomer, setQuickCustomer] = useState({ name: "", phone: "" });
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  
  // Product search and add
  const [productSearch, setProductSearch] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [addingProduct, setAddingProduct] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        customersAPI.getAll(),
        productsAPI.getAll()
      ]);
      setCustomers(customersRes.data.customers || customersRes.data.data || []);
      setProducts(productsRes.data.products || productsRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // Quick add customer during invoice creation
  const handleQuickAddCustomer = async () => {
    if (!quickCustomer.name || !quickCustomer.phone) return;
    
    try {
      const response = await customersAPI.create({
        name: quickCustomer.name,
        phone: quickCustomer.phone,
        address: { street: "", city: "", state: "", pincode: "" }
      });
      
      const newCustomer = response.data.customer;
      setCustomers([...customers, newCustomer]);
      setFormData({ ...formData, customer: newCustomer._id });
      setQuickCustomer({ name: "", phone: "" });
      setShowQuickCustomer(false);
    } catch (err) {
      alert("Failed to add customer");
    }
  };

  // Search products by name, ID, or partial match
  const searchProducts = (query) => {
    if (!query || query.length < 2) return [];
    
    return products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);
  };

  // Check if product exists
  const productExists = (query) => {
    return products.some(product => 
      product.name.toLowerCase() === query.toLowerCase()
    );
  };

  // Add custom product during invoice creation
  const addCustomProduct = async (itemIndex, productName) => {
    setAddingProduct({ ...addingProduct, [itemIndex]: true });
    
    try {
      const response = await productsAPI.create({
        name: productName,
        category: 'accessories',
        purchasePrice: 100, // Default price
        sellingPrice: 120, // Default selling price
        stock: 1000,
        brand: 'Generic'
      });
      
      const newProduct = response.data.product;
      setProducts([...products, newProduct]);
      
      // Auto-fill the new product
      updateItem(itemIndex, "product", newProduct._id);
      setProductSearch({ ...productSearch, [itemIndex]: newProduct.name });
      setShowSuggestions({ ...showSuggestions, [itemIndex]: false });
      
    } catch (err) {
      alert("Failed to add product");
    } finally {
      setAddingProduct({ ...addingProduct, [itemIndex]: false });
    }
  };

  // Handle product selection
  const selectProduct = (itemIndex, product) => {
    const newItems = [...formData.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      product: product._id,
      price: product.sellingPrice,
      name: product.name
    };
    setFormData({ ...formData, items: newItems });
    setProductSearch({ ...productSearch, [itemIndex]: product.name });
    setShowSuggestions({ ...showSuggestions, [itemIndex]: false });
  };

  // Handle search input change
  const handleSearchChange = (itemIndex, value) => {
    setProductSearch({ ...productSearch, [itemIndex]: value });
    setShowSuggestions({ ...showSuggestions, [itemIndex]: value.length >= 2 });
    
    // Check for exact match
    const exactMatch = products.find(p => 
      p.name.toLowerCase() === value.toLowerCase()
    );
    
    if (exactMatch) {
      selectProduct(itemIndex, exactMatch);
    } else {
      // Clear product selection if search is modified
      const newItems = [...formData.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        product: "",
        price: 0,
        name: ""
      };
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate form data
      if (!formData.customer) {
        alert("Please select a customer");
        setLoading(false);
        return;
      }
      
      // Filter out empty items and ensure product IDs exist
      const validItems = formData.items.filter(item => 
        item.product && item.quantity > 0 && item.price > 0
      );
      
      if (validItems.length === 0) {
        alert("Please add at least one valid item");
        setLoading(false);
        return;
      }
      
      const invoiceData = {
        customer: formData.customer,
        items: validItems,
        applyGST: formData.applyGST || false,
        discount: formData.discount || 0,
        discountType: formData.discountType,
        paymentMethod: formData.paymentMethod || 'cash',
        paymentStatus: formData.paymentStatus || 'paid',
        deliveryNote: formData.deliveryNote,
        referenceNo: formData.referenceNo,
        buyerOrderNo: formData.buyerOrderNo,
        destination: formData.destination,
        buyerDetails: formData.buyerDetails,
        notes: formData.notes,
        dueDate: formData.dueDate,
        terms: formData.terms
      };
      
      console.log('📤 Sending invoice data:', invoiceData);
      console.log('📊 Calculated totals:', totals);
      
      const response = await invoicesAPI.create(invoiceData);
      
      console.log('Invoice response:', response);
      console.log('Invoice response data:', response.data);
      
      if (response.data?.success) {
        alert("Invoice created successfully!");
        // Refresh dashboard data
        if (window.refreshDashboard) {
          window.refreshDashboard();
        }
        navigate("/invoices");
      } else {
        throw new Error(response.data?.message || 'Failed to create invoice');
      }
    } catch (err) {
      console.error('❌ Invoice creation error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      const errorDetails = err.response?.data?.error || '';
      alert(`Failed to create invoice: ${errorMessage}${errorDetails ? '\n\nDetails: ' + errorDetails : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: "", quantity: 1, price: 0, discount: 0, discountType: "amount", name: "", isCustom: false }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === "product" && value) {
      const product = products.find(p => p._id === value);
      if (product) {
        newItems[index].price = product.sellingPrice;
        newItems[index].name = product.name;
        newItems[index].isCustom = false;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    // Calculate gross amount
    let grossAmount = 0;
    let itemDiscountTotal = 0;
    
    formData.items.forEach(item => {
      if (item.quantity > 0 && item.price > 0) {
        grossAmount += item.quantity * item.price;
        
        const itemDiscount = item.discount || 0;
        const discountType = item.discountType || 'amount';
        
        if (discountType === 'percentage') {
          itemDiscountTotal += (item.quantity * item.price * itemDiscount) / 100;
        } else {
          itemDiscountTotal += itemDiscount;
        }
      }
    });
    
    // Amount after item discounts
    let amountAfterItemDiscount = grossAmount - itemDiscountTotal;
    
    // Calculate additional discount BEFORE GST
    let additionalDiscount = formData.discount || 0;
    if (formData.discountType === 'percentage') {
      additionalDiscount = (amountAfterItemDiscount * additionalDiscount) / 100;
    }
    
    let totalDiscountAmount = itemDiscountTotal + additionalDiscount;
    let amountAfterDiscount = grossAmount - totalDiscountAmount;
    
    // Calculate GST
    let cgst = 0;
    let sgst = 0;
    let totalGst = 0;
    let taxableAmount = amountAfterDiscount;
    let autoDiscount = 0;
    
    if (formData.applyGST) {
      if (formData.reverseGST) {
        // Reverse GST: Start with base amount, add GST, then discount it
        taxableAmount = amountAfterDiscount;
        cgst = (taxableAmount * 9) / 100;
        sgst = (taxableAmount * 9) / 100;
        totalGst = cgst + sgst;
        autoDiscount = totalGst; // Discount the GST amount
        totalDiscountAmount = totalDiscountAmount + totalGst;
      } else {
        // Normal GST: Add on top
        cgst = (amountAfterDiscount * 9) / 100;
        sgst = (amountAfterDiscount * 9) / 100;
        totalGst = cgst + sgst;
        taxableAmount = amountAfterDiscount;
      }
    }
    
    // Calculate grand total
    let subtotal = formData.applyGST && !formData.reverseGST ? (taxableAmount + totalGst) : amountAfterDiscount;
    const roundOff = Math.round(subtotal) - subtotal;
    const grandTotal = Math.round(subtotal);
    
    return {
      grossAmount: grossAmount.toFixed(2),
      itemDiscountTotal: itemDiscountTotal.toFixed(2),
      additionalDiscount: additionalDiscount.toFixed(2),
      totalDiscountAmount: totalDiscountAmount.toFixed(2),
      taxableAmount: taxableAmount.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      totalGst: totalGst.toFixed(2),
      autoDiscount: autoDiscount.toFixed(2),
      roundOff: roundOff.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    };
  };
  
  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Create Invoice</h2>
        <button
          onClick={() => navigate("/invoices")}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium w-full sm:w-auto"
        >
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-6">
        {/* Customer Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer</label>
              <div className="flex gap-2">
                <select
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium whitespace-nowrap"
                >
                  + Quick Add
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Items</h3>
          {formData.items.map((item, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 mb-4 bg-gray-50 dark:bg-gray-900 relative">
              <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-end">
                {/* Product Search/Select */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search product name..."
                      value={productSearch[index] || ""}
                      onChange={(e) => handleSearchChange(index, e.target.value)}
                      onFocus={() => {
                        if (productSearch[index] && productSearch[index].length >= 2) {
                          setShowSuggestions({ ...showSuggestions, [index]: true });
                        }
                      }}
                      onBlur={(e) => {
                        // Don't hide if clicking on dropdown
                        if (!e.relatedTarget || !e.relatedTarget.closest('.suggestions-dropdown')) {
                          setTimeout(() => {
                            setShowSuggestions({ ...showSuggestions, [index]: false });
                          }, 150);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    
                    {/* Search Results Dropdown */}
                    {showSuggestions[index] && productSearch[index] && (
                      <div className="suggestions-dropdown absolute z-[100] w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {/* Existing Products */}
                        {searchProducts(productSearch[index]).map(product => (
                          <div
                            key={product._id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectProduct(index, product);
                            }}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">₹{product.sellingPrice} - {product.category}</div>
                          </div>
                        ))}
                        
                        {/* Add New Product Option */}
                        {productSearch[index].length >= 2 && !productExists(productSearch[index]) && (
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addCustomProduct(index, productSearch[index]);
                            }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-blue-600 border-t border-blue-200 font-medium"
                          >
                            {addingProduct[index] ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Adding...
                              </span>
                            ) : (
                              `+ Add "${productSearch[index]}" as new product`
                            )}
                          </div>
                        )}
                        
                        {/* No Results */}
                        {searchProducts(productSearch[index]).length === 0 && productExists(productSearch[index]) && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No matching products found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qty</label>
                  <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    min="1"
                    required
                  />
                </div>
                
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate</label>
                  <input
                    type="number"
                    value={item.price || ''}
                    onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    step="0.01"
                    required
                  />
                </div>
                
                {/* Discount */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={item.discount || 0}
                      onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      step="0.01"
                      min="0"
                    />
                    <select
                      value={item.discountType || 'amount'}
                      onChange={(e) => updateItem(index, "discountType", e.target.value)}
                      className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="amount">₹</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                </div>
                
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 font-medium text-gray-900 dark:text-white text-sm">
                    ₹{(() => {
                      const itemDiscount = item.discount || 0;
                      const discountType = item.discountType || 'amount';
                      let discountAmount = 0;
                      
                      if (discountType === 'percentage') {
                        discountAmount = (item.quantity * item.price * itemDiscount) / 100;
                      } else {
                        discountAmount = itemDiscount;
                      }
                      
                      return ((item.quantity * item.price) - discountAmount).toFixed(2);
                    })()}
                  </div>
                </div>
                
                {/* Remove Button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                    className="w-full px-3 py-2 text-sm border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            + Add Item
          </button>
        </div>

        {/* GST & Billing Summary */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Billing Summary</h3>
          
          {/* GST Toggle */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.applyGST}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  applyGST: e.target.checked,
                  reverseGST: e.target.checked ? formData.reverseGST : false
                })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900 dark:text-white">Apply 18% GST (9% CGST + 9% SGST)</span>
            </label>
            

          </div>
          
          {/* Billing Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Summary Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-2">
              <div className="flex justify-between text-sm border-b border-gray-300 dark:border-gray-600 pb-2">
                <span className="font-medium text-gray-900 dark:text-white">Item Total:</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{totals.grossAmount}</span>
              </div>
              
              {parseFloat(totals.totalDiscountAmount) > 0 && (
                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>Discount{formData.reverseGST && parseFloat(totals.autoDiscount) > 0 ? ' (incl. GST)' : ''}:</span>
                  <span>-₹{totals.totalDiscountAmount}</span>
                </div>
              )}
              
              {formData.reverseGST && parseFloat(totals.autoDiscount) > 0 && (
                <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400 pl-4">
                  <span>└ Auto GST Discount:</span>
                  <span>-₹{totals.autoDiscount}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm font-semibold border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                <span className="text-gray-900 dark:text-white">Taxable Amount:</span>
                <span className="text-gray-900 dark:text-white">₹{totals.taxableAmount}</span>
              </div>
              
              {formData.applyGST && parseFloat(totals.totalGst) > 0 && (
                <>
                  <div className="flex justify-between text-xs text-blue-700 dark:text-blue-400">
                    <span>CGST @ 9%:</span>
                    <span>₹{totals.cgst}</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-700 dark:text-blue-400">
                    <span>SGST @ 9%:</span>
                    <span>₹{totals.sgst}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-blue-800 dark:text-blue-300">
                    <span>Total GST (18%):</span>
                    <span>₹{totals.totalGst}</span>
                  </div>
                </>
              )}
              
              {parseFloat(totals.roundOff) !== 0 && (
                <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                  <span>Round Off:</span>
                  <span>{parseFloat(totals.roundOff) >= 0 ? '+' : ''}₹{totals.roundOff}</span>
                </div>
              )}
              
              <div className="flex justify-between text-xl font-bold text-green-700 dark:text-green-400 border-t-2 border-gray-400 dark:border-gray-600 pt-3 mt-2">
                <span>Grand Total:</span>
                <span>₹{totals.grandTotal}</span>
              </div>
            </div>
            
            {/* Right: Additional Discount Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Discount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.discount || ''}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="amount">Amount (₹)</option>
                    <option value="percentage">Percent (%)</option>
                  </select>
                </div>
                {formData.discountType === 'percentage' && formData.discount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Discount Amount: ₹{totals.additionalDiscount}
                  </p>
                )}
              </div>
              
              {/* Formula Display */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Calculation Formula:</h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {formData.applyGST ? (
                    <>
                      <p className="font-medium text-blue-700">Normal GST Mode:</p>
                      <p>Taxable = Gross - Discounts</p>
                      <p>CGST = Taxable × 9%</p>
                      <p>SGST = Taxable × 9%</p>
                      <p className="font-medium text-gray-800 mt-2">Total = Taxable + GST + Round Off</p>
                    </>
                  ) : (
                    <>
                      <p>Taxable = Gross - Discounts</p>
                      <p className="font-medium text-gray-800 mt-2">Total = Taxable + Round Off</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Address Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Customer Address (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Street Address"
              value={formData.buyerDetails.street || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                buyerDetails: { ...formData.buyerDetails, street: e.target.value }
              })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="City"
              value={formData.buyerDetails.city || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                buyerDetails: { ...formData.buyerDetails, city: e.target.value }
              })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="State"
              value={formData.buyerDetails.state || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                buyerDetails: { ...formData.buyerDetails, state: e.target.value }
              })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Pincode"
              value={formData.buyerDetails.pincode || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                buyerDetails: { ...formData.buyerDetails, pincode: e.target.value }
              })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Customer GSTIN (Optional)"
              value={formData.buyerDetails.gstin || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                buyerDetails: { ...formData.buyerDetails, gstin: e.target.value }
              })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Invoice Details Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Invoice Details (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Delivery Note"
              value={formData.deliveryNote}
              onChange={(e) => setFormData({ ...formData, deliveryNote: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Reference No."
              value={formData.referenceNo}
              onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Buyer's Order No."
              value={formData.buyerOrderNo}
              onChange={(e) => setFormData({ ...formData, buyerOrderNo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Destination"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Additional Details */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Additional Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Terms</label>
              <select
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Payment due within 30 days">Net 30</option>
                <option value="Payment due within 15 days">Net 15</option>
                <option value="Payment due within 7 days">Net 7</option>
                <option value="Payment due immediately">Due on Receipt</option>
                <option value="Payment due in advance">Advance Payment</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
              placeholder="Additional notes or instructions..."
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Quick Add Customer Modal */}
      {showQuickCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Add Customer</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Customer Name *"
                value={quickCustomer.name}
                onChange={(e) => setQuickCustomer({ ...quickCustomer, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={quickCustomer.phone}
                onChange={(e) => setQuickCustomer({ ...quickCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <button
                onClick={handleQuickAddCustomer}
                disabled={!quickCustomer.name || !quickCustomer.phone}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                Add Customer
              </button>
              <button
                onClick={() => {
                  setShowQuickCustomer(false);
                  setQuickCustomer({ name: "", phone: "" });
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AddInvoice;
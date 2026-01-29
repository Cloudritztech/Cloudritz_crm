import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { customersAPI, productsAPI, invoicesAPI } from '../services/api';
import toast from 'react-hot-toast';

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    customer: "",
    items: [{ id: Date.now(), product: "", quantity: 1, price: 0, discount: 0, discountType: "amount", name: "", isCustom: false }],
    discount: 0,
    discountType: "amount",
    paymentMethod: "cash",
    paymentStatus: "paid",
    paidAmount: 0,
    notes: "",
    applyGST: false,
    deliveryNote: "",
    referenceNo: "",
    buyerOrderNo: "",
    destination: "",
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
  
  const [productSearch, setProductSearch] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes, invoiceRes] = await Promise.all([
        customersAPI.getAll(),
        productsAPI.getAll(),
        invoicesAPI.getById(id)
      ]);
      
      setCustomers(customersRes.data.customers || customersRes.data.data || []);
      setProducts(productsRes.data.products || productsRes.data.data || []);
      
      if (invoiceRes.data?.success && invoiceRes.data?.invoice) {
        const invoice = invoiceRes.data.invoice;
        
        // Pre-fill form with invoice data
        setFormData({
          customer: invoice.customer?._id || invoice.customer,
          items: invoice.items?.map((item, index) => ({
            id: Date.now() + index, // Add unique ID
            product: item.product?._id || item.product,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            discountType: item.discountType || 'amount',
            name: item.product?.name || '',
            isCustom: false
          })) || [],
          discount: invoice.discount || 0,
          discountType: invoice.discountType || 'amount',
          paymentMethod: invoice.paymentMethod || 'cash',
          paymentStatus: invoice.paymentStatus || 'paid',
          paidAmount: invoice.paidAmount || 0,
          notes: invoice.notes || '',
          applyGST: invoice.applyGST || false,
          deliveryNote: invoice.deliveryNote || '',
          referenceNo: invoice.referenceNo || '',
          buyerOrderNo: invoice.buyerOrderNo || '',
          destination: invoice.destination || '',
          buyerDetails: {
            gstin: invoice.buyerDetails?.gstin || '',
            street: '',
            city: '',
            state: '',
            pincode: ''
          },
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
          terms: invoice.terms || 'Payment due within 30 days'
        });

        // Set product search values
        const searchValues = {};
        invoice.items?.forEach((item, index) => {
          searchValues[index] = item.product?.name || '';
        });
        setProductSearch(searchValues);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error('Failed to load invoice data');
    } finally {
      setInitialLoading(false);
    }
  };

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!formData.customer) {
        toast.error("Please select a customer");
        setLoading(false);
        return;
      }
      
      const validItems = formData.items.filter(item => 
        item.product && item.quantity > 0 && item.price > 0
      );
      
      if (validItems.length === 0) {
        toast.error("Please add at least one valid item");
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
        paidAmount: formData.paidAmount || 0,
        deliveryNote: formData.deliveryNote,
        referenceNo: formData.referenceNo,
        buyerOrderNo: formData.buyerOrderNo,
        destination: formData.destination,
        buyerDetails: formData.buyerDetails,
        notes: formData.notes,
        dueDate: formData.dueDate,
        terms: formData.terms
      };
      
      const response = await invoicesAPI.update(id, invoiceData);
      
      if (response.data?.success) {
        toast.success("Invoice updated successfully!");
        window.dispatchEvent(new Event('data-changed'));
        navigate(`/invoices/${id}`);
      } else {
        throw new Error(response.data?.message || 'Failed to update invoice');
      }
    } catch (err) {
      console.error('Update invoice error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      toast.error(`Failed to update invoice: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItem = { 
      id: Date.now(), // Unique ID for React key
      product: "", 
      quantity: 1, 
      price: 0, 
      discount: 0, 
      discountType: "amount", 
      name: "", 
      isCustom: false 
    };
    const newItems = [...formData.items, newItem];
    updateFormData({ items: newItems });
    
    // Fix: Add empty search state for new item
    const newIndex = newItems.length - 1;
    setProductSearch({ ...productSearch, [newIndex]: '' });
    setShowSuggestions({ ...showSuggestions, [newIndex]: false });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    updateFormData({ items: newItems });
    
    // Fix: Rebuild productSearch and showSuggestions with correct indices
    const newProductSearch = {};
    const newShowSuggestions = {};
    
    newItems.forEach((item, newIndex) => {
      // Find the original index for this item
      const originalIndex = formData.items.findIndex((originalItem, originalIdx) => 
        originalIdx !== index && originalItem === item
      );
      
      if (originalIndex !== -1 && productSearch[originalIndex]) {
        newProductSearch[newIndex] = productSearch[originalIndex];
      } else {
        newProductSearch[newIndex] = item.name || '';
      }
      
      newShowSuggestions[newIndex] = false;
    });
    
    setProductSearch(newProductSearch);
    setShowSuggestions(newShowSuggestions);
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
    
    updateFormData({ items: newItems });
  };

  const selectProduct = (itemIndex, product) => {
    const newItems = [...formData.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      product: product._id,
      price: product.sellingPrice,
      name: product.name
    };
    updateFormData({ items: newItems });
    setProductSearch({ ...productSearch, [itemIndex]: product.name });
    setShowSuggestions({ ...showSuggestions, [itemIndex]: false });
  };

  const searchProducts = (query) => {
    if (!query || query.length < 2) return [];
    return products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);
  };

  const handleSearchChange = (itemIndex, value) => {
    setProductSearch({ ...productSearch, [itemIndex]: value });
    setShowSuggestions({ ...showSuggestions, [itemIndex]: value.length >= 2 });
    
    const exactMatch = products.find(p => 
      p.name.toLowerCase() === value.toLowerCase()
    );
    
    if (exactMatch) {
      selectProduct(itemIndex, exactMatch);
    } else {
      const newItems = [...formData.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        product: "",
        price: 0,
        name: ""
      };
      updateFormData({ items: newItems });
    }
  };

  const calculateTotals = () => {
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
    
    let amountAfterItemDiscount = grossAmount - itemDiscountTotal;
    let additionalDiscount = formData.discount || 0;
    if (formData.discountType === 'percentage') {
      additionalDiscount = (amountAfterItemDiscount * additionalDiscount) / 100;
    }
    
    let totalDiscountAmount = itemDiscountTotal + additionalDiscount;
    let amountAfterDiscount = grossAmount - totalDiscountAmount;
    
    let cgst = 0;
    let sgst = 0;
    let totalGst = 0;
    let taxableAmount = amountAfterDiscount;
    
    if (formData.applyGST) {
      cgst = (amountAfterDiscount * 9) / 100;
      sgst = (amountAfterDiscount * 9) / 100;
      totalGst = cgst + sgst;
      taxableAmount = amountAfterDiscount;
    }
    
    let subtotal = formData.applyGST ? (taxableAmount + totalGst) : amountAfterDiscount;
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
      roundOff: roundOff.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    };
  };
  
  const totals = calculateTotals();

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-6 pb-20">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Edit Invoice</h2>
        <button
          onClick={() => navigate(`/invoices/${id}`)}
          className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium whitespace-nowrap flex-shrink-0"
        >
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-6">
        {/* Customer Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer</label>
              <select
                value={formData.customer}
                onChange={(e) => updateFormData({ customer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                required
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => updateFormData({ paymentMethod: e.target.value })}
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
                onChange={(e) => {
                  const status = e.target.value;
                  const grandTotal = parseFloat(calculateTotals().grandTotal);
                  updateFormData({ 
                    paymentStatus: status,
                    paidAmount: status === 'paid' ? grandTotal : status === 'partial' ? 0 : 0
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="paid">Paid</option>
                <option value="unpaid">Pending</option>
                <option value="partial">Partial Payment</option>
              </select>
            </div>
            
            {/* Paid Amount Field */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {formData.paymentStatus === 'paid' ? 'Amount Paid' : formData.paymentStatus === 'partial' ? 'Advance Amount' : 'Paid Amount'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
                <input
                  type="number"
                  value={formData.paidAmount || ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    const grandTotal = parseFloat(calculateTotals().grandTotal);
                    let status = formData.paymentStatus;
                    
                    if (amount === 0) status = 'unpaid';
                    else if (amount >= grandTotal) status = 'paid';
                    else status = 'partial';
                    
                    updateFormData({ 
                      paidAmount: amount,
                      paymentStatus: status
                    });
                  }}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  step="0.01"
                  min="0"
                  max={calculateTotals().grandTotal}
                  placeholder="0.00"
                />
              </div>
              {formData.paidAmount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Pending: ₹{(parseFloat(calculateTotals().grandTotal) - (formData.paidAmount || 0)).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items Section - Similar to AddInvoice but with pre-filled data */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Items</h3>
          {formData.items.map((item, index) => (
            <div key={item.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 mb-4 bg-gray-50 dark:bg-gray-900 relative">
              <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-end">
                {/* Product Search */}
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    
                    {showSuggestions[index] && productSearch[index] && (
                      <div className="absolute z-[100] w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
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

        {/* GST Toggle */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.applyGST}
                onChange={(e) => updateFormData({ applyGST: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900 dark:text-white">Apply 18% GST (9% CGST + 9% SGST)</span>
            </label>
          </div>
          
          {/* Billing Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm border-b border-gray-300 dark:border-gray-600 pb-2">
              <span className="font-medium text-gray-900 dark:text-white">Item Total:</span>
              <span className="font-medium text-gray-900 dark:text-white">₹{totals.grossAmount}</span>
            </div>
            
            {parseFloat(totals.totalDiscountAmount) > 0 && (
              <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                <span>Total Discount:</span>
                <span>-₹{totals.totalDiscountAmount}</span>
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
        </div>

        {/* Additional Discount */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Discount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.discount || ''}
              onChange={(e) => updateFormData({ discount: parseFloat(e.target.value) || 0 })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
            <select
              value={formData.discountType}
              onChange={(e) => updateFormData({ discountType: e.target.value })}
              className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="amount">₹</option>
              <option value="percentage">%</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows="3"
            placeholder="Additional notes or instructions..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Updating..." : "Update Invoice"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/invoices/${id}`)}
            className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditInvoice;
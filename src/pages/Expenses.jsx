import React, { useState, useEffect } from 'react';
import { expensesAPI, employeesAPI } from '../services/api';
import { Plus, DollarSign, Calendar, Tag, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'miscellaneous',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: 'cash',
    employee: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await expensesAPI.getAll();
      setExpenses(res.data.expenses || []);
    } catch (error) {
      console.error('Fetch expenses error:', error);
      setExpenses([]);
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await employeesAPI.getAll();
      setEmployees(res.data.employees || []);
    } catch (error) {
      console.error('Fetch employees error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await expensesAPI.create(formData);
      toast.success('Expense added successfully');
      setShowModal(false);
      setFormData({ title: '', amount: '', type: 'miscellaneous', expenseDate: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'cash', employee: '' });
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expensesAPI.delete(id);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const filteredExpenses = filterType === 'all' ? expenses : expenses.filter(e => e.type === filterType);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const expensesByType = expenses.reduce((acc, exp) => {
    acc[exp.type] = (acc[exp.type] || 0) + exp.amount;
    return acc;
  }, {});

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-gray-600">Track business expenses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center px-4 py-2 rounded-xl">
          <Plus className="h-4 w-4 mr-2" />Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            <DollarSign className="h-12 w-12 text-red-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div>
            <p className="text-orange-100 mb-1">Total Transactions</p>
            <p className="text-3xl font-bold">{filteredExpenses.length}</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div>
            <p className="text-purple-100 mb-1">Salary Expenses</p>
            <p className="text-3xl font-bold">₹{(expensesByType.salary || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field">
            <option value="all">All Expenses</option>
            <option value="salary">Salary</option>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="travel">Travel</option>
            <option value="marketing">Marketing</option>
            <option value="purchase">Purchase</option>
            <option value="miscellaneous">Miscellaneous</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
          <div key={expense._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{expense.title}</h3>
                  <span className="badge-info text-xs capitalize">{expense.type}</span>
                </div>
                {expense.description && <p className="text-sm text-gray-600 mt-1">{expense.description}</p>}
                {expense.employee?.name && <p className="text-sm text-blue-600 mt-1">Employee: {expense.employee.name}</p>}
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" />{new Date(expense.expenseDate).toLocaleDateString()}</span>
                  <span className="flex items-center"><Tag className="h-4 w-4 mr-1" />{expense.paymentMethod}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <p className="text-2xl font-bold text-red-600">₹{expense.amount.toLocaleString('en-IN')}</p>
                <button onClick={() => handleDelete(expense._id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="card text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No expenses found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input-field" required />
              <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input-field" required />
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="input-field">
                <option value="salary">Salary</option>
                <option value="rent">Rent</option>
                <option value="utilities">Utilities</option>
                <option value="travel">Travel</option>
                <option value="marketing">Marketing</option>
                <option value="purchase">Purchase</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
              {formData.type === 'salary' && (
                <select value={formData.employee} onChange={(e) => setFormData({...formData, employee: e.target.value})} className="input-field" required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} - ₹{emp.salary}</option>
                  ))}
                </select>
              )}
              <input type="date" value={formData.expenseDate} onChange={(e) => setFormData({...formData, expenseDate: e.target.value})} className="input-field" required />
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="input-field">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
              <textarea placeholder="Description (optional)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field" rows="3"></textarea>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;

import React, { useState, useEffect } from 'react';
import { expensesAPI } from '../services/api';
import { Plus, DollarSign, Calendar, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'operational',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchExpenses();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await expensesAPI.create(formData);
      toast.success('Expense added');
      setShowModal(false);
      setFormData({ title: '', amount: '', category: 'operational', date: new Date().toISOString().split('T')[0], description: '' });
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

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

      <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 mb-1">Total Expenses</p>
            <p className="text-3xl font-bold">₹{totalExpenses.toLocaleString('en-IN')}</p>
          </div>
          <DollarSign className="h-12 w-12 text-red-200" />
        </div>
      </div>

      <div className="grid gap-4">
        {expenses.map((expense) => (
          <div key={expense._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{expense.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" />{new Date(expense.date).toLocaleDateString()}</span>
                  <span className="flex items-center"><Tag className="h-4 w-4 mr-1" />{expense.category}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">₹{expense.amount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input-field" required />
              <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input-field" required />
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="input-field">
                <option value="operational">Operational</option>
                <option value="salary">Salary</option>
                <option value="rent">Rent</option>
                <option value="utilities">Utilities</option>
                <option value="other">Other</option>
              </select>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="input-field" required />
              <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field" rows="3"></textarea>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;

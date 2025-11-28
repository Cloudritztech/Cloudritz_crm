const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  totalPurchases: { type: Number, default: 0 },
  lastPurchaseDate: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
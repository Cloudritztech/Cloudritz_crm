import connectDB from '../lib/mongodb.js';
import SubscriptionPlan from '../lib/models/SubscriptionPlan.js';
import User from '../lib/models/User.js';
import bcrypt from 'bcryptjs';

const plans = [
  { name: 'trial', displayName: 'Free Trial', price: 0, billingCycle: 'monthly', limits: { maxUsers: 2, maxProducts: 100, maxInvoices: 50, maxCustomers: 100, storageGB: 1 }, features: { whatsappIntegration: false, aiInsights: true, multiCurrency: false, advancedReports: false, apiAccess: false, prioritySupport: false }, trialDays: 14 },
  { name: 'basic', displayName: 'Basic Plan', price: 999, billingCycle: 'monthly', limits: { maxUsers: 5, maxProducts: 500, maxInvoices: 200, maxCustomers: 500, storageGB: 5 }, features: { whatsappIntegration: true, aiInsights: true, multiCurrency: false, advancedReports: false, apiAccess: false, prioritySupport: false }, trialDays: 14 },
  { name: 'professional', displayName: 'Professional Plan', price: 2499, billingCycle: 'monthly', limits: { maxUsers: 15, maxProducts: 2000, maxInvoices: 1000, maxCustomers: 2000, storageGB: 20 }, features: { whatsappIntegration: true, aiInsights: true, multiCurrency: true, advancedReports: true, apiAccess: false, prioritySupport: true }, trialDays: 14 },
  { name: 'enterprise', displayName: 'Enterprise Plan', price: 4999, billingCycle: 'monthly', limits: { maxUsers: 999, maxProducts: 999999, maxInvoices: 999999, maxCustomers: 999999, storageGB: 100 }, features: { whatsappIntegration: true, aiInsights: true, multiCurrency: true, advancedReports: true, apiAccess: true, prioritySupport: true }, trialDays: 14 }
];

export default async function handler(req, res) {
  try {
    await connectDB();
    
    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      return res.json({ success: true, message: 'Already seeded' });
    }

    for (const plan of plans) {
      await SubscriptionPlan.findOneAndUpdate({ name: plan.name }, plan, { upsert: true });
    }

    const hashedPassword = await bcrypt.hash('Cloudritz@2024', 12);
    await User.create({
      name: 'Cloudritz Admin',
      email: 'admin@cloudritz.com',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true
    });

    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

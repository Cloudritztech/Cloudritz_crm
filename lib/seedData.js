import connectDB from './mongodb.js';
import SubscriptionPlan from './models/SubscriptionPlan.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

const plans = [
  {
    name: 'trial', displayName: 'Free Trial', price: 0, billingCycle: 'monthly',
    limits: { maxUsers: 2, maxProducts: 100, maxInvoices: 50, maxCustomers: 100, storageGB: 1 },
    features: { whatsappIntegration: false, aiInsights: true, multiCurrency: false, advancedReports: false, apiAccess: false, prioritySupport: false },
    trialDays: 14
  },
  {
    name: 'basic', displayName: 'Basic Plan', price: 999, billingCycle: 'monthly',
    limits: { maxUsers: 5, maxProducts: 500, maxInvoices: 200, maxCustomers: 500, storageGB: 5 },
    features: { whatsappIntegration: true, aiInsights: true, multiCurrency: false, advancedReports: false, apiAccess: false, prioritySupport: false },
    trialDays: 14
  },
  {
    name: 'professional', displayName: 'Professional Plan', price: 2499, billingCycle: 'monthly',
    limits: { maxUsers: 15, maxProducts: 2000, maxInvoices: 1000, maxCustomers: 2000, storageGB: 20 },
    features: { whatsappIntegration: true, aiInsights: true, multiCurrency: true, advancedReports: true, apiAccess: false, prioritySupport: true },
    trialDays: 14
  },
  {
    name: 'enterprise', displayName: 'Enterprise Plan', price: 4999, billingCycle: 'monthly',
    limits: { maxUsers: 999, maxProducts: 999999, maxInvoices: 999999, maxCustomers: 999999, storageGB: 100 },
    features: { whatsappIntegration: true, aiInsights: true, multiCurrency: true, advancedReports: true, apiAccess: true, prioritySupport: true },
    trialDays: 14
  }
];

export async function seedPlans() {
  await connectDB();
  console.log('📦 Seeding plans...');
  for (const plan of plans) {
    await SubscriptionPlan.findOneAndUpdate({ name: plan.name }, plan, { upsert: true, new: true });
  }
  console.log('✅ Subscription plans seeded');
}

export async function createSuperAdmin(email, password, name = 'Super Admin') {
  await connectDB();
  const existing = await User.findOne({ email, role: 'superadmin' });
  if (existing) {
    console.log('⚠️  Super admin already exists');
    return existing;
  }
  const superAdmin = await User.create({ name, email, password, role: 'superadmin', isActive: true });
  console.log('✅ Super admin created:', email);
  return superAdmin;
}

const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
  console.log('🌱 Starting seed...');
  await seedPlans();
  await createSuperAdmin('admin@cloudritz.com', 'Cloudritz@2024', 'Cloudritz Admin');
  console.log('✅ Seed complete');
  process.exit(0);
}

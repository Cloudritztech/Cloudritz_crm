import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  appearance: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    accentColor: { type: String, default: '#3B82F6' }
  },
  
  invoice: {
    prefix: { type: String, default: 'INV' },
    startingNumber: { type: Number, default: 1001 },
    currentNumber: { type: Number, default: 1001 },
    autoIncrement: { type: Boolean, default: true },
    termsAndConditions: { type: String, default: 'Payment due within 30 days.\nGoods once sold will not be taken back.' },
    footerNote: { type: String, default: 'Thank you for your business!' },
    showLogo: { type: Boolean, default: true },
    showBankDetails: { type: Boolean, default: true },
    showSignature: { type: Boolean, default: true }
  },
  
  product: {
    defaultUnit: { type: String, default: 'piece' },
    lowStockThreshold: { type: Number, default: 10 },
    maxImageSize: { type: Number, default: 2 },
    allowNegativeStock: { type: Boolean, default: false },
    autoCalculatePurchasePrice: { type: Boolean, default: true },
    showStockValue: { type: Boolean, default: true }
  },
  
  notifications: {
    lowStockEmail: { type: Boolean, default: true },
    lowStockSMS: { type: Boolean, default: false },
    newOrderEmail: { type: Boolean, default: true },
    newOrderSMS: { type: Boolean, default: true },
    paymentReceivedEmail: { type: Boolean, default: true },
    paymentReceivedSMS: { type: Boolean, default: false },
    soundAlerts: { type: Boolean, default: true },
    desktopNotifications: { type: Boolean, default: true }
  },
  
  backup: {
    autoBackup: { type: Boolean, default: false },
    backupFrequency: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], default: 'daily' },
    lastBackup: { type: Date }
  },
  
  integrations: {
    whatsapp: {
      enabled: { type: Boolean, default: false },
      apiKey: String,
      phoneNumber: String
    },
    smtp: {
      enabled: { type: Boolean, default: false },
      host: String,
      port: Number,
      username: String,
      password: String,
      fromEmail: String
    }
  }
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

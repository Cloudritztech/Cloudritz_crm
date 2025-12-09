import dotenv from 'dotenv';
dotenv.config();

import connectDB from './lib/mongodb.js';
import User from './lib/models/User.js';

async function test() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find();
    console.log('\n📊 Total users:', users.length);
    
    const superadmin = await User.findOne({ role: 'superadmin' });
    if (superadmin) {
      console.log('\n✅ Superadmin found:');
      console.log('  Email:', superadmin.email);
      console.log('  Name:', superadmin.name);
      console.log('  Role:', superadmin.role);
      console.log('  isActive:', superadmin.isActive);
      console.log('  organizationId:', superadmin.organizationId);
    } else {
      console.log('\n❌ No superadmin found');
      
      const adminEmail = await User.findOne({ email: 'admin@cloudritz.com' });
      if (adminEmail) {
        console.log('\n⚠️  Found user with admin email but different role:');
        console.log('  Email:', adminEmail.email);
        console.log('  Role:', adminEmail.role);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();

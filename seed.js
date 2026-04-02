const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Record = require('./models/Record');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Connected to DB for seeding...');

    //Clear existing data
    await User.deleteMany({});
    await Record.deleteMany({});

    //Admin Creation
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'Admin'
    });

    //Sample Records for testing
    await Record.create([
      { amount: 5000, type: 'Income', category: 'Salary', description: 'Monthly Pay', userId: admin._id },
      { amount: 1200, type: 'Expense', category: 'Rent', description: 'Apartment', userId: admin._id },
      { amount: 200, type: 'Expense', category: 'Food', description: 'Groceries', userId: admin._id },
      { amount: 150, type: 'Expense', category: 'Utilities', description: 'Electricity', userId: admin._id }
    ]);

    console.log('✅ Database Seeded Successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
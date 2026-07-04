const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Unit = require('../models/Unit');

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bms_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for Seeding...');

    // Clear existing users and units
    await User.deleteMany({});
    await Unit.deleteMany({});
    console.log('Cleared existing User and Unit collections.');

    // Seed default users
    const users = [
      {
        id: 'owner',
        name: 'Ramanjaneyulu',
        email: 'owner@biztracker.com',
        password: 'admin123',
        role: 'owner',
        shopName: 'Ramanjaneyulu Super Mart'
      },
      {
        id: 'cashier',
        name: 'Ravi Kumar',
        email: 'cashier@biztracker.com',
        password: 'staff123',
        role: 'cashier',
        shopName: 'Ramanjaneyulu Super Mart'
      }
    ];

    for (let u of users) {
      const user = new User(u);
      await user.save();
    }
    console.log('Default user accounts seeded successfully:');
    console.log('- Owner: owner / admin123');
    console.log('- Employee: employee / staff123');

    // Seed basic units
    const units = [
      { id: 'pcs', name: 'Pieces', abbreviation: 'pcs', isDecimalAllowed: false },
      { id: 'kg', name: 'Kilograms', abbreviation: 'kg', isDecimalAllowed: true },
      { id: 'ltr', name: 'Liters', abbreviation: 'ltr', isDecimalAllowed: true },
      { id: 'box', name: 'Boxes', abbreviation: 'box', isDecimalAllowed: false }
    ];

    await Unit.insertMany(units);
    console.log('Core system units seeded successfully.');

    mongoose.connection.close();
    console.log('Seeding script completed and database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();

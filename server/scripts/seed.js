const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ShiftLog = require('../models/ShiftLog');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const initialLogs = [
  {
    date: '2026-01-04',
    shift: 'A',
    name: 'Shanmugam',
    id: 'A131',
    work_description: 'Electrical maintenance in production area'
  },
  {
    date: '2026-01-06',
    shift: 'A',
    name: 'Desai',
    id: 'D500',
    work_description: 'Machine inspection and servicing'
  },
  {
    date: '2026-01-08',
    shift: 'A',
    name: 'Arun',
    id: 'C301',
    work_description: 'Material loading and unloading'
  },
  {
    date: '2026-01-11',
    shift: 'B',
    name: 'Rajesh',
    id: 'R701',
    work_description: 'Welding work in fabrication section'
  },
  {
    date: '2026-01-15',
    shift: 'C',
    name: 'Praveen',
    id: 'P802',
    work_description: 'General maintenance and cleaning'
  }
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shiftsync';
    console.log(`Connecting to database: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);

    // Delete existing logs
    await ShiftLog.deleteMany();
    console.log('Cleared existing shift logs.');

    // Insert initial logs
    await ShiftLog.insertMany(initialLogs);
    console.log('Seeded database with initial shift logs:');
    console.log(initialLogs);

    mongoose.connection.close();
    console.log('Database seeding complete. Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedData();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Report = require('./models/reportModel');
const Reporter = require('./models/reporterModel');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedData = async () => {
    try {
        await Report.deleteMany();
        await Reporter.deleteMany();

        const reporter = await Reporter.create({
            name: 'John Doe',
            email: 'john@example.com',
            password: '$2a$10$YourHashedPasswordHere', // You might want to use a real hash
            phone: '1234567890'
        });

        const reports = [
            {
                trackingId: 'CYB-20231027-1234',
                reporter: reporter._id,
                type: 'Phishing',
                description: 'Received a suspicious email asking for bank details.',
                date: new Date(),
                status: 'Pending'
            },
            {
                trackingId: 'CYB-20231026-5678',
                reporter: reporter._id,
                type: 'Identity Theft',
                description: 'Someone opened a credit card in my name.',
                date: new Date(),
                status: 'In Progress'
            },
            {
                trackingId: 'CYB-20231025-9012',
                reporter: reporter._id,
                type: 'Financial Fraud',
                description: 'Unauthorized transaction on my account.',
                date: new Date(),
                status: 'Resolved'
            }
        ];

        await Report.insertMany(reports);

        console.log('Data Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();

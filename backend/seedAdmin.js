const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Admin = require('./models/adminModel');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedAdmin = async () => {
    try {
        await Admin.deleteMany();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await Admin.create({
            email: 'admin@cybersafe.com',
            password: hashedPassword
        });

        console.log('Admin seeded successfully');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();

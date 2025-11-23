const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5500', 'http://localhost:5501', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(require('cookie-parser')());

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Static folder for uploads (including profiles)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/reporters', require('./routes/reporterRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({ 
        message: err.message || 'Server Error', 
        error: process.env.NODE_ENV === 'production' ? undefined : err.stack 
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

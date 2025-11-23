const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/adminModel');

const protectAdmin = asyncHandler(async (req, res, next) => {
    let token;

    // Check for JWT_SECRET
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'JWT_SECRET is not configured. Please set it in your .env file.' });
    }

    // Check for token in cookies
    if (req.cookies && req.cookies.token) {
        try {
            token = req.cookies.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin) {
                return res.status(401).json({ message: 'Not authorized as admin' });
            }

            return next();
        } catch (error) {
            console.error('Admin token verification error:', error);
            // Clear invalid token cookie
            res.clearCookie('token');
            return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
    }

    // No token found
    return res.status(401).json({ message: 'Not authorized, no token' });
});

module.exports = { protectAdmin };

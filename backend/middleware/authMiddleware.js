const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Reporter = require('../models/reporterModel');
const Admin = require('../models/adminModel');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for JWT_SECRET
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'JWT_SECRET is not configured. Please set it in your .env file.' });
    }

    // Check for token in cookies
    if (req.cookies && req.cookies.token) {
        try {
            token = req.cookies.token;

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            // Check if it's a reporter first
            req.user = await Reporter.findById(decoded.id).select('-password');

            // If not found, check if it's an admin (though usually admin has separate middleware, this is a fallback or shared)
            if (!req.user) {
                req.user = await Admin.findById(decoded.id).select('-password');
                if (req.user) req.user.role = 'admin';
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            return next();
        } catch (error) {
            console.error('Token verification error:', error);
            // Clear invalid token cookie
            res.clearCookie('token');
            return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
    }

    // No token found
    return res.status(401).json({ message: 'Not authorized, no token' });
});

module.exports = { protect };

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Reporter = require('../models/reporterModel');
const Admin = require('../models/adminModel');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Ensure JWT secret exists
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server error: JWT_SECRET missing in .env' });
    }

    // Get token from HTTP-only cookie
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized. Token missing.' });
    }

    try {
        // Decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Try finding Reporter first
        let user = await Reporter.findById(decoded.id).select('-password');

        // If not a reporter, try finding Admin
        if (!user) {
            user = await Admin.findById(decoded.id).select('-password');
            if (user) user.role = 'admin';
        }

        if (!user) {
            res.clearCookie("token");
            return res.status(401).json({ message: 'Not authorized. User not found.' });
        }

        // Attach user to request
        req.user = user;

        return next();

    } catch (error) {
        console.error('Token verification error:', error);

        // Clear cookie if token invalid or expired
        res.clearCookie("token");

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: 'Session expired. Please login again.' });
        }

        return res.status(401).json({ message: 'Not authorized. Invalid token.' });
    }
});

module.exports = { protect };

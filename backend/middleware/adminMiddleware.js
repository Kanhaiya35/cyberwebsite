const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/adminModel');

const protectAdmin = asyncHandler(async (req, res, next) => {
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "Server error: JWT_SECRET missing" });
    }

    let token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Not authorized. Token missing." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.admin = await Admin.findById(decoded.id).select("-password");

        if (!req.admin) {
            res.cookie("token", "", {
                httpOnly: true,
                expires: new Date(0),
                secure: false,
                sameSite: "none",
                path: "/"
            });
            return res.status(401).json({ message: "Admin not found. Unauthorized." });
        }

        next();

    } catch (error) {
        console.error("ADMIN TOKEN ERROR:", error);

       res.cookie("token", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    expires: new Date(0),
    path: "/"
});


        const message =
            error.name === "TokenExpiredError"
                ? "Session expired. Please login again."
                : "Invalid token. Please login again.";

        return res.status(401).json({ message });
    }
});

module.exports = { protectAdmin };

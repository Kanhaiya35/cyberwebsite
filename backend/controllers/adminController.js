const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/adminModel');

// LOGIN ADMIN
const loginAdmin = asyncHandler(async (req, res) => {
    let { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please enter both email and password');
    }

    email = email.trim().toLowerCase();
    const admin = await Admin.findOne({ email });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
        res.status(400);
        throw new Error('Invalid credentials');
    }

    const token = generateToken(admin._id);

    // FINAL COOKIE SETTINGS THAT WORK ON LOCALHOST
    res.cookie("token", token, {
        httpOnly: true,
        secure: false,      // localhost ONLY
        sameSite: "lax",    // cross-port allowed
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
        _id: admin.id,
        email: admin.email,
        name: admin.name || "Admin",
    });
});

// GET ADMIN PROFILE
const getMe = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin.id).select("-password");

    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }

    res.status(200).json(admin);
});

// UPDATE PROFILE
const updateProfile = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }

    const updateData = {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address
    };

    if (req.file) updateData.profilePhoto = req.file.path;

    const updatedAdmin = await Admin.findByIdAndUpdate(req.admin.id, updateData, {
        new: true,
    }).select("-password");

    res.status(200).json(updatedAdmin);
});

// LOGOUT ADMIN
const logoutAdmin = (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        expires: new Date(0),
        path: "/"
    });

    res.json({ message: "Logged out successfully" });
};

// TOKEN GENERATOR
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = {
    loginAdmin,
    getMe,
    updateProfile,
    logoutAdmin,
};

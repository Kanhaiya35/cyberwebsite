const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/adminModel');

// @desc    Authenticate admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for admin email
    const admin = await Admin.findOne({ email });

    if (admin && (await bcrypt.compare(password, admin.password))) {
        const token = generateToken(admin._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/'
        });

        res.json({
            _id: admin.id,
            email: admin.email,
            name: admin.name || 'Admin'
        });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

// Generate JWT
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured. Please set it in your .env file.');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Get admin data
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getMe = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin.id).select('-password');

    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }

    res.status(200).json({
        id: admin._id,
        name: admin.name || 'Admin',
        email: admin.email,
        phone: admin.phone || '',
        address: admin.address || '',
        profilePhoto: admin.profilePhoto || ''
    });
});

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin)
const updateProfile = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
        res.status(401);
        throw new Error('Admin not found');
    }

    const updateData = { ...req.body };
    
    // Handle profile photo upload if provided
    if (req.file) {
        updateData.profilePhoto = req.file.path;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(req.admin.id, updateData, {
        new: true,
    }).select('-password');

    res.status(200).json(updatedAdmin);
});

module.exports = {
    loginAdmin,
    getMe,
    updateProfile
};

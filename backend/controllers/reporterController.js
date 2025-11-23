const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const Reporter = require('../models/reporterModel');

// @desc    Register new reporter
// @route   POST /api/reporters/register
// @access  Public
const registerReporter = asyncHandler(async (req, res) => {
    const { name, email, password, phone, address } = req.body;
    const profilePhoto = req.file ? req.file.path : '';

    if (!name || !email || !password || !phone) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    // Check if reporter exists
    const reporterExists = await Reporter.findOne({ email });

    if (reporterExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create reporter
    const reporter = await Reporter.create({
        name,
        email,
        password: hashedPassword,
        phone,
        address: address || '',
        profilePhoto: profilePhoto || ''
    });

    if (reporter) {
        const token = generateToken(reporter._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/'
        });

        res.status(201).json({
            _id: reporter.id,
            name: reporter.name,
            email: reporter.email
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a reporter
// @route   POST /api/reporters/login
// @access  Public
const loginReporter = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for reporter email
    const reporter = await Reporter.findOne({ email });

    if (reporter && (await bcrypt.compare(password, reporter.password))) {
        const token = generateToken(reporter._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/'
        });

        res.json({
            _id: reporter.id,
            name: reporter.name,
            email: reporter.email
        });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

// @desc    Get reporter data
// @route   GET /api/reporters/profile
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const reporter = await Reporter.findById(req.user.id).select('-password');

    if (!reporter) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json({
        id: reporter._id,
        name: reporter.name,
        email: reporter.email,
        phone: reporter.phone,
        address: reporter.address || '',
        profilePhoto: reporter.profilePhoto || ''
    });
});

// @desc    Update reporter profile
// @route   PUT /api/reporters/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const reporter = await Reporter.findById(req.user.id);

    if (!reporter) {
        res.status(401);
        throw new Error('User not found');
    }

    const updateData = { ...req.body };
    
    // Handle profile photo upload if provided
    if (req.file) {
        updateData.profilePhoto = req.file.path;
    }

    const updatedReporter = await Reporter.findByIdAndUpdate(req.user.id, updateData, {
        new: true,
    }).select('-password');

    res.status(200).json(updatedReporter);
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

module.exports = {
    registerReporter,
    loginReporter,
    getMe,
    updateProfile
};

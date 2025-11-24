const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    name: {
        type: String,
        default: 'Admin',
        trim: true
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    profilePhoto: {
        type: String, // Path to uploaded file
        default: ''
    },
    role: {
        type: String,
        default: 'admin'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);

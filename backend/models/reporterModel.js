const mongoose = require('mongoose');

const reporterSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
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
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        trim: true
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
        default: 'reporter'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reporter', reporterSchema);

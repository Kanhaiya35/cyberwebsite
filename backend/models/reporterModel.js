const mongoose = require('mongoose');

const reporterSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    address: {
        type: String,
        default: ''
    },
    profilePhoto: {
        type: String, // Path to uploaded file
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reporter', reporterSchema);

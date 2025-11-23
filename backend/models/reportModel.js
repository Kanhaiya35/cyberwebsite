const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    trackingId: {
        type: String,
        required: true,
        unique: true
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reporter',
        required: true
    },
    type: {
        type: String,
        required: [true, 'Please select an incident type']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    date: {
        type: Date,
        required: [true, 'Please add the date of incident']
    },
    evidence: {
        type: String // Path to uploaded file
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Closed', 'Withdrawn'],
        default: 'Pending'
    },
    withdrawn: {
        type: Boolean,
        default: false
    },
    withdrawnAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);

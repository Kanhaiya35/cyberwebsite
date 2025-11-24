const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    trackingId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reporter',
        required: true
    },
    type: {
        type: String,
        required: [true, 'Please select an incident type'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Please add the date of incident']
    },
    evidence: {
        type: String, // Path to uploaded file
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Closed', 'Withdrawn'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    incidentLocation: {
        type: String,
        default: ''
    },
    assignedTo: {
        type: String, // Officer name or ID (optional)
        default: ''
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

const asyncHandler = require('express-async-handler');
const Report = require('../models/reportModel');

// Helper to generate Tracking ID
const generateTrackingId = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CYB-${date}-${random}`;
};

// @desc    Submit a new report
// @route   POST /api/reports/submit-authenticated
// @access  Private
const submitReport = asyncHandler(async (req, res) => {
    const { type, description, date } = req.body;
    const evidence = req.file ? req.file.path : null;

    if (!type || !description || !date) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    const trackingId = generateTrackingId();

    const report = await Report.create({
        trackingId,
        reporter: req.user.id,
        type,
        description,
        date,
        evidence
    });

    res.status(201).json(report);
});

// @desc    Get user reports
// @route   GET /api/reports/my-reports
// @access  Private
const getMyReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({ reporter: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(reports);
});

// @desc    Track a report by ID
// @route   GET /api/reports/track/:trackingId
// @access  Public
const trackReport = asyncHandler(async (req, res) => {
    const report = await Report.findOne({ trackingId: req.params.trackingId });

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    res.status(200).json({
        trackingId: report.trackingId,
        status: report.status,
        type: report.type,
        date: report.date,
        updatedAt: report.updatedAt
    });
});

// @desc    Get all reports (Admin)
// @route   GET /api/reports
// @access  Private (Admin)
const getAllReports = asyncHandler(async (req, res) => {
    const status = req.query.status;
    let query = {};
    if (status) {
        query.status = status;
    }

    const reports = await Report.find(query).populate('reporter', 'name email phone').sort({ createdAt: -1 });
    res.status(200).json(reports);
});

// @desc    Update report status (Admin)
// @route   PUT /api/reports/:id
// @access  Private (Admin)
const updateReportStatus = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    const updatedReport = await Report.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedReport);
});

// @desc    Withdraw a report
// @route   PUT /api/reports/:id/withdraw
// @access  Private
const withdrawReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Check if user owns the report
    if (report.reporter.toString() !== req.user.id.toString()) {
        res.status(403);
        throw new Error('Not authorized to withdraw this report');
    }

    // Check if already withdrawn
    if (report.withdrawn) {
        res.status(400);
        throw new Error('Report already withdrawn');
    }

    const updatedReport = await Report.findByIdAndUpdate(
        req.params.id,
        {
            withdrawn: true,
            withdrawnAt: new Date(),
            status: 'Withdrawn'
        },
        { new: true }
    );

    res.status(200).json(updatedReport);
});

// @desc    Get stats
// @route   GET /api/reports/stats
// @access  Public
const getStats = asyncHandler(async (req, res) => {
    const total = await Report.countDocuments({ withdrawn: { $ne: true } });
    const resolved = await Report.countDocuments({ status: 'Resolved', withdrawn: { $ne: true } });
    const pending = await Report.countDocuments({ status: 'Pending', withdrawn: { $ne: true } });

    // Mocking "Avg Response Time" as it requires complex calculation not supported by simple schema yet
    const avgResponseTime = 48;

    res.status(200).json({
        total,
        resolved,
        pending,
        avgResponseTime
    });
});

module.exports = {
    submitReport,
    getMyReports,
    trackReport,
    getAllReports,
    updateReportStatus,
    withdrawReport,
    getStats
};

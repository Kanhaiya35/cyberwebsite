const asyncHandler = require('express-async-handler');
const Report = require('../models/reportModel');

// =========================
// Generate Tracking ID
// =========================
const generateTrackingId = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CYB-${date}-${random}`;
};

// =========================
// SUBMIT REPORT
// =========================
const submitReport = asyncHandler(async (req, res) => {
    const { type, description, date } = req.body;
    const evidence = req.file ? req.file.path : null;

    // Validate fields
    if (!type || !description || !date) {
        res.status(400);
        throw new Error('Please fill all required fields (type, description, date).');
    }

    // Validate date
    if (isNaN(Date.parse(date))) {
        res.status(400);
        throw new Error('Invalid date format.');
    }

    // Create report
    const trackingId = generateTrackingId();

    const report = await Report.create({
        trackingId,
        reporter: req.user.id,
        type: type.trim(),
        description: description.trim(),
        date: new Date(date),
        evidence
    });

    // Return full report so frontend can display it
    res.status(201).json({
        message: "Report submitted successfully!",
        trackingId: report.trackingId,
        report
    });
});

// =========================
// GET MY REPORTS
// =========================
const getMyReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({ reporter: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(reports);
});

// =========================
// TRACK REPORT BY ID
// =========================
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

// =========================
// ADMIN – GET ALL REPORTS
// =========================
const getAllReports = asyncHandler(async (req, res) => {
    const status = req.query.status || null;

    const filter = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
        .populate("reporter", "name email phone")
        .sort({ createdAt: -1 });

    res.status(200).json(reports);
});

// =========================
// ADMIN – UPDATE REPORT STATUS
// =========================
const updateReportStatus = asyncHandler(async (req, res) => {
    const { status, priority, assignedTo } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;

    const updatedReport = await Report.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
    );

    res.status(200).json(updatedReport);
});

// =========================
// WITHDRAW REPORT
// =========================
const withdrawReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    if (report.reporter.toString() !== req.user.id.toString()) {
        res.status(403);
        throw new Error('Not authorized to withdraw this report');
    }

    if (report.withdrawn) {
        res.status(400);
        throw new Error('This report is already withdrawn');
    }

    const updatedReport = await Report.findByIdAndUpdate(
        req.params.id,
        {
            withdrawn: true,
            withdrawnAt: new Date(),
            status: "Withdrawn"
        },
        { new: true }
    );

    res.status(200).json(updatedReport);
});

// =========================
// DASHBOARD – STATS
// =========================
const getStats = asyncHandler(async () => {
    const total = await Report.countDocuments({ withdrawn: { $ne: true } });
    const resolved = await Report.countDocuments({ status: "Resolved", withdrawn: { $ne: true } });
    const pending = await Report.countDocuments({ status: "Pending", withdrawn: { $ne: true } });

    // Placeholder avg response time
    const avgResponseTime = 48;

    return {
        total,
        resolved,
        pending,
        avgResponseTime
    };
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

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
    submitReport,
    getMyReports,
    trackReport,
    getAllReports,
    updateReportStatus,
    withdrawReport,
    getStats
} = require('../controllers/reportController');

const { protect } = require('../middleware/authMiddleware');
const { protectAdmin } = require('../middleware/adminMiddleware');

// =========================
// CREATE /uploads/evidence DIR
// =========================
const evidenceDir = path.join(__dirname, '../uploads/evidence/');
if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
}

// =========================
// MULTER SETUP
// =========================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, evidenceDir);
    },
    filename: function (req, file, cb) {
        cb(null, "evidence-" + Date.now() + path.extname(file.originalname));
    }
});

const allowedEvidence = /jpeg|jpg|png|gif|pdf|mp4|mov|avi|mp3|wav/;

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter(req, file, cb) {
        const extname = allowedEvidence.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedEvidence.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type"));
        }
    }
});

// =========================
// SUBMIT REPORT — FIXED ORDER
// =========================
// NOTE: Multer MUST come BEFORE validation

router.post(
    '/submit-authenticated',
    protect,
    upload.single("evidence"),  // <-- MUST COME FIRST
    submitReport                // <-- Validation happens inside controller
);

// =========================
// USER ROUTES
// =========================
router.get('/my-reports', protect, getMyReports);
router.get('/track/:trackingId', trackReport);
router.get('/stats', getStats);
router.put('/:id/withdraw', protect, withdrawReport);

// =========================
// ADMIN ROUTES
// =========================
router.get('/', protectAdmin, getAllReports);
router.put('/:id', protectAdmin, updateReportStatus);

module.exports = router;

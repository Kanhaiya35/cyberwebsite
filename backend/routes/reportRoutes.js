const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
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

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'))
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Error handling for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ message: err.message });
    }
    next(err);
};

const { validateReportSubmission } = require('./validation');

router.post('/submit-authenticated', protect, upload.single('evidence'), handleMulterError, validateReportSubmission, submitReport);
router.get('/my-reports', protect, getMyReports);
router.get('/track/:trackingId', trackReport);
router.get('/stats', getStats);
router.put('/:id/withdraw', protect, withdrawReport);

// Admin routes
router.get('/', protectAdmin, getAllReports);
router.put('/:id', protectAdmin, updateReportStatus);

module.exports = router;

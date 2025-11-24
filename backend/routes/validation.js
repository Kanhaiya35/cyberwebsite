const { check, validationResult } = require('express-validator');

// Reporter Registration Validation
const validateReporterRegistration = [
    check('name')
        .not().isEmpty()
        .withMessage('Name is required')
        .trim(),

    check('email')
        .not().isEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please include a valid email')
        .trim()
        .toLowerCase(),

    check('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

    check('phone')
        .not().isEmpty().withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be 10 digits'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Report Submission Validation
const validateReportSubmission = [
    check('type')
        .not().isEmpty()
        .withMessage('Incident type is required')
        .trim(),

    check('description')
        .not().isEmpty()
        .withMessage('Description is required')
        .trim(),

    check('date')
        .not().isEmpty()
        .withMessage('Date is required')
        .custom((value) => {
            if (isNaN(Date.parse(value))) {
                throw new Error('Invalid date format');
            }
            return true;
        }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = {
    validateReporterRegistration,
    validateReportSubmission
};

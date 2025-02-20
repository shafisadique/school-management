const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');

// 📌 Add Monthly Fee Record (Admission Number in URL)
router.post('/add/:admissionNo', feeController.addFee);

// 📌 Update Fee Payment for a Specific Month (Admission Number in URL)
router.put('/update/:admissionNo', feeController.updateFee);

// 📌 Get Fee Record for a Specific Month (Admission Number in URL)
router.get('/:admissionNo/:month/:year', feeController.getFeeByMonth);

// 📌 Get Overall Fee Summary for a Student (Admission Number in URL)
router.get('/summary/:admissionNo', feeController.getFeeSummary);

// 📌 Get Monthly Fee Breakdown for a Student (Admission Number in URL)
router.get('/monthly-summary/:admissionNo', feeController.getMonthlyFeeSummary);

router.post('/records/:admissionNo', feeController.getFeeByDateRange);
module.exports = router;

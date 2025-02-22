const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
router.post('/add/:admissionNo', feeController.addFee);
router.post('/academic-year/:admissionNo', feeController.getAcademicYearFees);
router.patch('/:admissionNo/month/:month/academicYear/:academicYear', feeController.updatePayment);
router.get('/monthly-summary/:admissionNo', feeController.getMonthlyFeeSummary);
router.post('/records/:admissionNo', feeController.getFeeByDateRange);


router.post('/totalFee', feeController.getFeeTable);
router.get('/summary/:admissionNo', feeController.getFeeSummary);

module.exports = router;

const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  admissionNo: { type: String, required: true },
  studentName: { type: String, required: true },
  class: {
    type: String,
    required: true,
    enum: ['Nursery', 'KG1', 'KG2', '1st', '2nd'] // Class validation
  },
  academicYear: { type: String, required: true }, // "2024-25"
  
  // Monthly Fees
  month: { type: Number, required: true }, // 4=April, 5=May,...3=March
  year: { type: Number, required: true }, // Actual calendar year
  
  // Fee Components
  tuitionFee: { type: Number, required: true },
  transportationFee: { type: Number, required: true },
  backDues: { type: Number, default: 0 },
  
  // Payment Details
  totalFee: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  
  // Audit
  createdAt: { type: Date, default: Date.now }
});

// Unique constraint for monthly records
feeSchema.index({ admissionNo: 1, month: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Fee', feeSchema);
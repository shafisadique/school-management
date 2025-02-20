const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  admissionNo: { type: String, required: true }, // No unique constraint here
  studentName: { type: String, required: true },
  class: { type: String, required: true },
  rollNo: { type: String, required: true },
  
  // Fee Breakdown
  admissionFee: { type: Number, default: 0 },
  registrationFee: { type: Number, default: 0 },
  computerFee: { type: Number, default: 0 },
  transportationFee: { type: Number, default: 0 },
  examinationFee: { type: Number, default: 0 },
  developmentFee: { type: Number, default: 0 },
  annualProgrammeFee: { type: Number, default: 0 },
  miscellaneousCharges: { type: Number, default: 0 },
  backDues: { type: Number, default: 0 },
  lateFine: { type: Number, default: 0 },
  tieBeltIdFee: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },

  // Monthly Tracking
  month: { type: Number, required: true }, // Store month (1-12)
  year: { type: Number, required: true }, // Store year (2025, etc.)

  // Financial Summary
  totalFee: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },

  // Date of Fee Entry
  date: { type: Date, default: Date.now }
});

// ✅ Fix: Allow multiple fee records per student, but only one per month-year
feeSchema.index({ admissionNo: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Fee', feeSchema);

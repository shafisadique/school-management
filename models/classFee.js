// models/ClassFee.js
const mongoose = require('mongoose');

const classFeeSchema = new mongoose.Schema({
  className: { 
    type: String, 
    required: true,
    unique: true,
    enum: ['Nursery', 'KG1', 'KG2', '1st', '2nd'] // Your class names
  },
  tuitionFee: { type: Number, required: true },
  transportationFee: { type: Number, required: true },
  effectiveFrom: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClassFee', classFeeSchema);
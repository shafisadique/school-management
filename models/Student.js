const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  admissionNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true }, // Date of Birth
  dateOfJoining: { type: Date, required: true }, // Date of Joining
  address: { type: String, required: true }, // Address
  rollNo: { type: String, required: true, unique: true }, // Roll No
});

module.exports = mongoose.model('Student', studentSchema); 
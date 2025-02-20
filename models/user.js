const mongoose = require('mongoose');
const generateSchoolId = () => {
  return Math.floor(100000 + Math.random() * 900000);
};
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true }, // Unique username for login
  email: { type: String, unique: true, sparse: true }, // Optional email (sparse index)
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'teacher', 'student', 'parent'], required: true },
  schoolId: { 
    type: Number, 
    unique: true,
    default: function () {
      return this.role !== 'superadmin' ? generateSchoolId() : null; // ✅ Auto-generate ONLY if NOT SuperAdmin
    }
  },
  additionalInfo: { type: mongoose.Schema.Types.Mixed } // Store role-specific data
});

module.exports = mongoose.model('User', userSchema);
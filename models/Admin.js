const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Store only one-time hashed passwords
});

module.exports = mongoose.model('Admin', adminSchema);

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const studentRoutes = require('./routes/studentRoutes');
const feeRoutes = require('./routes/feeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auth = require('./middleware/auth');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: ['https://fantastic-truffle-935128.netlify.app', 'http://localhost:4200'], // Add Netlify domain here
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Log environment variable to debug Railway issue
console.log("🚀 MONGO_URI from env:", process.env.MONGO_URI);

// Validate if MONGO_URI is correctly set
if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is undefined. Check your Railway environment variables.");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Define Routes
app.use('/admin', adminRoutes);
app.use('/student', auth, studentRoutes);
app.use('/fee', auth, feeRoutes);

module.exports = app;

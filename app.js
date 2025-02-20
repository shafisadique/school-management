const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const feeRoutes = require('./routes/feeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auth = require('./middleware/auth');
const cors = require('cors'); 
const { mongoose } = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
// connectDB();


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(bodyParser.json());


app.use(cors({
  origin: 'http://localhost:4200', // Allow requests from this origin
  credentials: true, // Allow cookies and credentials
}));


app.use('/admin', adminRoutes);
app.use('/student', auth, studentRoutes);
app.use('/fee', auth, feeRoutes);


module.exports = app;
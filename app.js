const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const feeRoutes = require('./routes/feeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auth = require('./middleware/auth');
const cors = require('cors'); 

const app = express();
connectDB();

app.use(bodyParser.json());


app.use(cors({
  origin: 'http://localhost:4200', // Allow requests from this origin
  credentials: true, // Allow cookies and credentials
}));


app.use('/admin', adminRoutes);
app.use('/student', auth, studentRoutes);
app.use('/fee', auth, feeRoutes);


module.exports = app;
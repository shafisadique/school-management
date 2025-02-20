const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://School:Patanahi%40123@cluster0.bawv9.mongodb.net/SchoolDB?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists.');
      return;
    }

    // Hash the password
    const password = 'AtharAzim@123'; // Change password if needed
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user
    const admin = new Admin({
      username: 'admin',
      password: hashedPassword, // Store hashed password
    });

    // Save to the database
    await admin.save();
    console.log('✅ Admin user created successfully');
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

createAdmin();

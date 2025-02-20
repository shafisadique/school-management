const Student = require('../models/Student');

exports.addStudent = async (req, res) => {
  try {
    const { admissionNo, name, dob, dateOfJoining, address, rollNo } = req.body;

    // Validate required fields
    if (!admissionNo || !name || !dob || !dateOfJoining || !address || !rollNo) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if admissionNo or rollNo already exists
    const existingStudent = await Student.findOne({ $or: [{ admissionNo }, { rollNo }] });
    if (existingStudent) {
      return res.status(400).json({ error: 'Admission No or Roll No already exists' });
    }

    // Create a new student
    const student = new Student({ admissionNo, name, dob, dateOfJoining, address, rollNo });
    await student.save();

    res.status(201).json({ message: 'Student added successfully', student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find(); // Fetch all students
    res.status(200).json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
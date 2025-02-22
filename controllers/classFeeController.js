
const ClassFee = require('../models/classFee')
// controllers/feeController.js
exports.generateMonthlyClassFees = async (req, res) => {
    try {
      const { className, month, year } = req.body;
      const currentDate = new Date();
      
      // Get class fee structure
      const classFees = await ClassFee.findOne({ className });
      if (!classFees) {
        return res.status(404).json({ message: `Fee structure not found for ${className}` });
      }
  
      // Get all students in the class
      const students = await Student.find({ class: className });
      if (students.length === 0) {
        return res.status(404).json({ message: `No students found in ${className}` });
      }
  
      // Process each student
      const processedStudents = [];
      
      for (const student of students) {
        // Check if fee already exists
        const existingFee = await Fee.findOne({ 
          admissionNo: student.admissionNo,
          month: month || currentDate.getMonth() + 1,
          year: year || currentDate.getFullYear()
        });
  
        if (!existingFee) {
          // Get previous month's due
          const previousFee = await Fee.findOne({
            admissionNo: student.admissionNo,
            year: month === 1 ? (year || currentDate.getFullYear()) - 1 : year || currentDate.getFullYear(),
            month: month === 1 ? 12 : (month || currentDate.getMonth() + 1) - 1
          });
  
          // Create new fee record
          const newFee = new Fee({
            admissionNo: student.admissionNo,
            studentName: student.name,
            class: className,
            rollNo: student.rollNo,
            tuitionFee: classFees.tuitionFee,
            transportationFee: classFees.transportationFee,
            backDues: previousFee?.remainingAmount || 0,
            totalFee: classFees.tuitionFee + classFees.transportationFee,
            paidAmount: 0,
            remainingAmount: classFees.tuitionFee + classFees.transportationFee + (previousFee?.remainingAmount || 0),
            month: month || currentDate.getMonth() + 1,
            year: year || currentDate.getFullYear()
          });
  
          await newFee.save();
          processedStudents.push(student.admissionNo);
        }
      }
  
      res.status(201).json({
        message: `Fees generated for ${processedStudents.length} students in ${className}`,
        processedStudents
      });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
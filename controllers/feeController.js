const Fee = require('../models/Fee');
const Student = require('../models/Student'); // Import Student Model

exports.addFee = async (req, res) => {
  try {
    const { admissionNo } = req.params;
    const {
      class: className,
      tuitionFee,
      transportationFee,
      paidAmount,
      month,
      academicYear
    } = req.body;

    // Validate numeric fields
    if (isNaN(month)) {
      return res.status(400).json({ message: 'Invalid month format' });
    }

    if (!/^\d{4}-\d{2}$/.test(academicYear)) {
      return res.status(400).json({ message: 'Academic year must be in YYYY-YY format' });
    }

    // Validate Student
    const student = await Student.findOne({ admissionNo });
    if (!student) {
      return res.status(404).json({ message: `Student ${admissionNo} not found` });
    }

    // Validate class
    const validClasses = ['Nursery', 'KG1', 'KG2', '1st', '2nd'];
    if (!validClasses.includes(className)) {
      return res.status(400).json({ message: 'Invalid class specified' });
    }

    // Check existing record
    const numericMonth = Number(month);
    const existingFee = await Fee.findOne({ 
      admissionNo, 
      month: numericMonth, 
      academicYear 
    });
    
    if (existingFee) {
      return res.status(400).json({ message: 'Fee record already exists for this month' });
    }

    // Calculate Back Dues
    const prevMonth = numericMonth === 4 ? 3 : numericMonth - 1;
    const [startYear] = academicYear.split('-');
    const prevAcademicYear = numericMonth === 4 ? 
      `${Number(startYear)-1}-${startYear.slice(2)}` : 
      academicYear;

    const previousFee = await Fee.findOne({
      admissionNo,
      month: prevMonth,
      academicYear: prevAcademicYear
    });

    const backDues = previousFee?.remainingAmount || 0;

    // Calculate Totals
    const currentTotal = Number(tuitionFee) + Number(transportationFee);
    const totalPayable = currentTotal + backDues;
    const remainingAmount = totalPayable - Number(paidAmount);

    // Validate Payment
    if (paidAmount > totalPayable) {
      return res.status(400).json({
        message: `Paid amount (${paidAmount}) exceeds total payable (${totalPayable})`
      });
    }

    // Create Fee Record
    const fee = new Fee({
      admissionNo,
      class: className,
      studentName: student.name,
      academicYear,
      month: numericMonth,
      year: numericMonth >= 4 ? 
        Number(academicYear.split('-')[0]) : 
        Number(academicYear.split('-')[1].padStart(2, '20')),
      tuitionFee: Number(tuitionFee),
      transportationFee: Number(transportationFee),
      backDues,
      totalFee: currentTotal,
      paidAmount: Number(paidAmount),
      remainingAmount
    });

    await fee.save();
    res.status(201).json(fee);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Update Fee Payment for a Specific Month
exports.updatePayment = async (req, res) => {
  try {
    const { admissionNo, month, academicYear } = req.params;
    const { amount } = req.body;

    const fee = await Fee.findOne({ admissionNo, month, academicYear });
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Update Payments
    fee.paidAmount += amount;
    fee.remainingAmount = (fee.totalFee + fee.backDues) - fee.paidAmount;

    // Validate
    if (fee.paidAmount < 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    await fee.save();
    res.status(200).json(fee);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 📌 Get Fee Record for a Specific Month

exports.getMonthlyFee = async (req, res) => {
  try {
    const { admissionNo, month, academicYear } = req.params;

    const fee = await Fee.findOne({ admissionNo, month, academicYear });
    if (!fee) {
      return res.status(404).json({ message: 'No fee record found' });
    }

    // Calculate Next Month's Back Due
    const response = {
      ...fee.toObject(),
      nextMonthBackDue: fee.remainingAmount
    };

    res.status(200).json(response);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 📌 Get Monthly Fee Breakdown for a Student
exports.getMonthlyFeeSummary = async (req, res) => {
  try {
    const { admissionNo } = req.params;

    const summary = await Fee.aggregate([
      { $match: { admissionNo } },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$remainingAmount" },
          totalFee: { $sum: "$totalFee" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    if (!summary.length) {
      return res.status(404).json({ message: "No monthly fee records found for this student" });
    }

    res.status(200).json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFeeByDateRange = async (req, res) => {
  try {
    const { admissionNo } = req.params;
    const { dateFrom, dateTo } = req.body; // Accept date range in request body

    // ✅ Convert date strings to Date objects
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "Invalid date range provided." });
    }

    // ✅ Check if student exists and get their name
    const student = await Student.findOne({ admissionNo });
    if (!student) {
      return res.status(404).json({ message: `Student with admissionNo ${admissionNo} not found.` });
    }

    // ✅ Find all fee records within the date range
    const fees = await Fee.find({
      admissionNo,
      date: { $gte: fromDate, $lte: toDate }
    }).sort({ date: 1 });

    if (fees.length === 0) {
      return res.status(200).json({ message: "No fee records found in the given date range." });
    }

    // ✅ Calculate total back due (sum of previous months' remaining amounts)
    const previousDues = await Fee.aggregate([
      {
        $match: {
          admissionNo,
          date: { $lt: fromDate } // Fetch remaining amounts before the selected date range
        }
      },
      {
        $group: {
          _id: null,
          totalBackDue: { $sum: "$remainingAmount" }
        }
      }
    ]);

    const totalBackDue = previousDues.length > 0 ? previousDues[0].totalBackDue : 0;

    // ✅ Prepare response data
    const responseData = {
      admissionNo: student.admissionNo,
      studentName: student.name,
      totalBackDue: totalBackDue, // Total due before date range
      content: fees.map(fee => ({
        month: new Date(fee.date).toLocaleString('default', { month: 'long' }),
        year: fee.year,
        totalFee: fee.totalFee,
        paidAmount: fee.paidAmount,
        remainingAmount: fee.remainingAmount,
        currentPayment: fee.paidAmount,
        date: fee.date
      }))
    };

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// controllers/feeController.js
exports.getAcademicYearFees = async (req, res) => {
  try {
    const { admissionNo } = req.params;
    const { academicYear } = req.body;

    // Validate academic year format
    if (!/^\d{4}-\d{2}$/.test(academicYear)) {
      return res.status(400).json({ message: 'Invalid academic year format' });
    }

    // Get all fees for academic year (April to March)
    const fees = await Fee.find({
      admissionNo,
      academicYear
    }).sort({ month: 1 });

    // Calculate cumulative back dues
    let runningBalance = 0;
    const processedFees = fees.map(fee => {
      runningBalance += fee.remainingAmount;
      return {
        ...fee.toObject(),
        cumulativeDue: runningBalance
      };
    });

    res.status(200).json({
      academicYear,
      totalRecords: processedFees.length,
      fees: processedFees
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getFeeSummary = async (req, res) => {
  try {
    const { admissionNo } = req.params;
    console.log('Fetching fees for:', admissionNo);

    const fees = await Fee.find({ admissionNo });
    console.log('Found fees:', fees);

    const totalDue = fees.reduce((sum, fee) => sum + fee.remainingAmount, 0);
    console.log('Calculated totalDue:', totalDue);

    res.status(200).json({ totalDue, totalPaid: 0 });
    
  } catch (err) {
    console.error('Error in getFeeSummary:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.getFeeTable = async (req, res) => {
  try {
    const { className, academicYear } = req.body;

    // Validate required fields
    if (!className || !academicYear) {
      return res.status(400).json({ message: 'Class and academic year are required' });
    }

    // Validate academic year format
    if (!/^\d{4}-\d{2}$/.test(academicYear)) {
      return res.status(400).json({ message: 'Invalid academic year format' });
    }

    // Fetch all fee records for the specified class and academic year
    const fees = await Fee.find({ class: className, academicYear }).sort({ admissionNo: 1, month: 1 });

    // Organize data per student
    let studentFees = {};

    fees.forEach(fee => {
      if (!studentFees[fee.admissionNo]) {
        studentFees[fee.admissionNo] = {
          admissionNo: fee.admissionNo,
          studentName: fee.studentName,
          class: fee.class, // ✅ Include the class
          tuitionFee: fee.tuitionFee,
          transportationFee: fee.transportationFee,
          totalFee: fee.tuitionFee + fee.transportationFee,
          payments: {}, // Monthly payments
          backDues: 0 // Initialize back dues
        };
      }

      // Store monthly fee details
      studentFees[fee.admissionNo].payments[fee.month] = {
        paidAmount: fee.paidAmount,
        remainingAmount: fee.remainingAmount
      };

      // Update back dues
      studentFees[fee.admissionNo].backDues = fee.remainingAmount;
    });

    // Convert object to array for response
    const formattedData = Object.values(studentFees);

    res.status(200).json(formattedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

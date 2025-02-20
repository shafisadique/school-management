const Fee = require('../models/Fee');
const Student = require('../models/Student'); // Import Student Model

exports.addFee = async (req, res) => {
  try {
    const { admissionNo } = req.params;
    const {
      class: studentClass,
      rollNo,
      admissionFee,
      registrationFee,
      computerFee,
      transportationFee,
      examinationFee,
      developmentFee,
      annualProgrammeFee,
      miscellaneousCharges,
      lateFine,
      tieBeltIdFee,
      otherCharges,
      paidAmount,
      date
    } = req.body;

    // ✅ Check if student exists
    const student = await Student.findOne({ admissionNo });
    if (!student) {
      return res.status(404).json({ message: `Student with admissionNo ${admissionNo} not found.` });
    }

    // ✅ Extract Month & Year
    const feeDate = date ? new Date(date) : new Date();
    const month = feeDate.getMonth() + 1;
    const year = feeDate.getFullYear();

    // ✅ Check if a fee record already exists for the given month
    let existingFee = await Fee.findOne({ admissionNo, month, year });
    if (existingFee) {
      return res.status(400).json({ message: `Fee record already exists for ${month}-${year}.` });
    }

    // ✅ Fetch Last Month’s Remaining Amount
    const previousFee = await Fee.findOne({
      admissionNo,
      year: month === 1 ? year - 1 : year,
      month: month === 1 ? 12 : month - 1
    });

    const previousDue = previousFee ? previousFee.remainingAmount : 0;

    // ✅ Calculate Total Fee for Current Month
    const totalFee =
      (admissionFee || 0) +
      (registrationFee || 0) +
      (computerFee || 0) +
      (transportationFee || 0) +
      (examinationFee || 0) +
      (developmentFee || 0) +
      (annualProgrammeFee || 0) +
      (miscellaneousCharges || 0) +
      (lateFine || 0) +
      (tieBeltIdFee || 0) +
      (otherCharges || 0);

    // ✅ Calculate Total Payable (Current Fee + Previous Due)
    const totalPayable = totalFee + previousDue;

    // ✅ Validate Paid Amount
    if (paidAmount > totalPayable) {
      return res.status(400).json({ message: `Paid amount (${paidAmount}) exceeds total payable (${totalPayable}).` });
    }

    // ✅ Calculate Remaining Amount
    const remainingAmount = totalPayable - paidAmount;

    // ✅ Save New Fee Record
    const fee = new Fee({
      admissionNo,
      studentName: student.name,
      class: studentClass,
      rollNo,
      admissionFee,
      registrationFee,
      computerFee,
      transportationFee,
      examinationFee,
      developmentFee,
      annualProgrammeFee,
      miscellaneousCharges,
      backDues: previousDue, // ✅ Store previous remaining balance
      lateFine,
      tieBeltIdFee,
      otherCharges,
      totalFee,
      paidAmount,
      remainingAmount,
      month,
      year,
      date: feeDate
    });

    await fee.save();
    res.status(201).json({ message: 'Monthly fee record added successfully', fee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 📌 Update Fee Payment for a Specific Month
exports.updateFee = async (req, res) => {
  try {
    const { admissionNo } = req.params; // Get admission number from URL
    const { paidAmount, month, year } = req.body;
    
    // ✅ Check if student exists
    const student = await Student.findOne({ admissionNo });
    if (!student) {
      return res.status(404).json({ message: `Student with admissionNo ${admissionNo} not found.` });
    }

    const fee = await Fee.findOne({ admissionNo, month, year });
    if (!fee) {
      return res.status(404).json({ message: `No fee record found for ${month}-${year}.` });
    }

    fee.paidAmount += paidAmount;
    fee.remainingAmount = fee.totalFee - fee.paidAmount;
    fee.date = Date.now(); // Update the payment date

    await fee.save();
    res.status(200).json({ message: 'Fee updated successfully', fee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get Fee Record for a Specific Month

exports.getFeeByMonth = async (req, res) => {
  try {
    const { admissionNo, month, year } = req.params;
    const numericMonth = parseInt(month);
    const numericYear = parseInt(year);

    // ✅ Convert month number to month name
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[numericMonth - 1];

    // ✅ Find the current month's fee record
    const fee = await Fee.findOne({ admissionNo, month: numericMonth, year: numericYear });

    if (!fee) {
      return res.status(404).json({ message: `No fee record found for ${monthName} ${year}.` });
    }

    // ✅ Get past months' remaining dues
    const previousDues = await Fee.aggregate([
      {
        $match: {
          admissionNo,
          year: numericYear,
          month: { $lt: numericMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalBackDue: { $sum: "$remainingAmount" } // Sum of unpaid amounts
        }
      }
    ]);

    const pastDue = previousDues.length > 0 ? previousDues[0].totalBackDue : 0;
    const totalBackDue = pastDue + (fee.backDues || 0);

    // ✅ Calculate next month's carried over due
    const totalPayable = fee.totalFee + totalBackDue;
    const remainingDueForNextMonth = totalPayable - fee.paidAmount;

    // ✅ Prepare response data
    const responseData = {
      admissionNo: fee.admissionNo,
      studentName: fee.studentName,
      month: monthName,
      year: fee.year,
      totalFee: fee.totalFee,
      backDues: fee.backDues,
      totalPayable: totalPayable,
      paidAmount: fee.paidAmount,
      remainingAmount: fee.remainingAmount,
      totalBackDue: totalBackDue,
      remainingDueForNextMonth: remainingDueForNextMonth
    };

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get Overall Fee Summary for a Student
exports.getFeeSummary = async (req, res) => {
  try {
    const { admissionNo } = req.params;

    const summary = await Fee.aggregate([
      { $match: { admissionNo } },
      {
        $group: {
          _id: "$admissionNo",
          studentName: { $first: "$studentName" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$remainingAmount" },
          totalFee: { $sum: "$totalFee" }
        }
      }
    ]);

    if (!summary.length) {
      return res.status(404).json({ message: "No fee records found for this student" });
    }

    res.status(200).json(summary[0]);
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

const express = require('express');
const studentController = require('../controllers/studentController');
const router = express.Router();

router.post('/add', studentController.addStudent); // Add a new student
router.get('/list', studentController.getStudents); // Get list of students

module.exports = router;
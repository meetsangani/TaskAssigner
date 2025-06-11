const express = require('express');
const registerUser = require('../controller/registerUser');
const login = require('../controller/login');
const userDetails = require('../controller/userDetail');
const logout = require('../controller/logout');
const updateUserDetails = require('../controller/updateUserDetails');
const ForgotPassword = require('../controller/forgot-password');
const taskController = require('../controller/TaskController')
const searchUser = require('../controller/searchUser');
const descriptionController = require('../controller/descriptionController');
const loginUser = require('../controller/login');
const attendanceController = require('../controller/AttendanceController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/getAllUsers', userDetails.getAllUsers);
router.get('/user-details', userDetails.userDetails);
router.get('/logout', logout);

router.post('/send_otp_email', ForgotPassword.send_otp);
router.post('/verify_otp', ForgotPassword.verify_otp);
router.post('/update_password', ForgotPassword.update_password);

// tasks
router.get('/tasks', taskController.getAllTasks);
router.post('/tasks', taskController.createTask);
router.get('/tasks/:id', taskController.getTasks);
// router.post('/tasks/:id/notes', taskController.addNote);
router.put('/tasks/:id', taskController.updateStatus);
router.delete('/tasks/:id', taskController.deleteTask);

// descriptions
router.post('/descriptions', descriptionController.addDescription);
router.get('/descriptions', descriptionController.getDescriptions);

// Attendance report and PDF
router.get('/attendance-report', attendanceController.getAttendanceReport);
router.get('/attendance-report/pdf', attendanceController.downloadAttendancePDF);

// router.put('/update-user', updateUserDetails);

// router.post('/search-user', searchUser)

module.exports = router;
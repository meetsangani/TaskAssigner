const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken");
const User = require('../models/UserModel');

async function userDetails(req, res) {
  try {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
        error: true,
      });
    }

    const user = await getUserDetailsFromToken(token);

    return res.status(200).json({
      message: "User details retrieved successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
    });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await User.find({}, { password: 0 }); 
    return res.status(200).json({
      message: "All users retrieved successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
    });
  }
}

module.exports = { userDetails, getAllUsers };
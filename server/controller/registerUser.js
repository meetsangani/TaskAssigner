const UserModel = require('../models/UserModel');
const bcryptjs = require('bcryptjs');

async function registerUser(req, res) {
  try {
    const { name, phone, email, password, profile_pic, role } = req.body;

    const checkEmail = await UserModel.findOne({ email });
    if (checkEmail) {
      return res.status(400).json({
        message: 'User already exists',
        error: true,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const payload = {
      name,
      phone,
      email,
      profile_pic,
      password: hashedPassword,
      role,
    };

    const user = new UserModel(payload);
    await user.save();

    return res.status(201).json({
      message: 'User registered successfully. Please log in.',
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
    });
  }
}

module.exports = registerUser;
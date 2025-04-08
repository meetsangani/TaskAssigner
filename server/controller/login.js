const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if OTP is verified
        if (user.otp) {
            return res.status(400).json({ message: "Please verify your OTP first" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        // Store the token in the user's document in MongoDB
        user.token = token;
        await user.save(); // Save the updated user document  

        // Set the token in a cookie (for web-based apps)
        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });

        // Redirect based on user role
        let redirectTo = '/TaskManager';
        if (user.role === 'admin') {
            redirectTo = '/TaskDashboard';
        } else if (user.role === 'hr') {
            redirectTo = '/HRDashboard';
        }

        return res.status(200).json({
            message: 'Login successful',
            redirectTo,
            token,
            success: true,
        });      
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = loginUser;

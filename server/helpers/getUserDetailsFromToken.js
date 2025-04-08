const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

async function getUserDetailsFromToken(token) {
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Fetch the user using the decoded token's id
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new Error('Invalid token or user not found');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid token or user not found');
  }
}

module.exports = getUserDetailsFromToken;

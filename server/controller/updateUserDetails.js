const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken")
const UserModel = require("../models/UserModel")

async function updateUserDetails(request, response) {
    try {
        const token = request.cookies.token || "";
        const user = await getUserDetailsFromToken(token);

        // Log the user ID for debugging
        console.log("User ID from token:", user._id);

        const { name, profile_pic } = request.body;

        // Check if the user exists
        const existingUser = await UserModel.findById(user._id);
        if (!existingUser) {
            return response.status(404).json({
                message: "User not found",
                data: null,
                success: false
            });
        }

        // Log incoming request data
        console.log("Incoming request data:", { name, profile_pic });

        // Update user details in the database
        const updateUser = await UserModel.updateOne(
            { _id: user._id },
            {
                $set: {
                    name,
                    profile_pic
                }
            }
        );

        // Log the result of the update operation
        console.log("Update Result:", updateUser);

        // Check if the update was acknowledged and modified
        if (updateUser.acknowledged && updateUser.modifiedCount > 0) {
            // Fetch updated user information from UserModel
            const userInformation = await UserModel.findById(user._id);

            return response.json({
                message: "User updated successfully",
                data: userInformation,
                success: true
            });
        } else {
            return response.json({
                message: "No changes made to the user",
                data: null,
                success: false
            });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true
        });
    }
}

module.exports = updateUserDetails
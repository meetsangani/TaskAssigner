const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken")
const UserModel = require("../models/UserModel")

async function updateUserDetails(request, response) {
    try {
        const token = request.cookies.token || "";
        const user = await getUserDetailsFromToken(token);
        console.log("User ID from token:", user._id);

        const { name, profile_pic } = request.body;

        const existingUser = await UserModel.findById(user._id);
        if (!existingUser) {
            return response.status(404).json({
                message: "User not found",
                data: null,
                success: false
            });
        }

        console.log("Incoming request data:", { name, profile_pic });

        const updateUser = await UserModel.updateOne(
            { _id: user._id },
            {
                $set: {
                    name,
                    profile_pic
                }
            }
        );

        console.log("Update Result:", updateUser);

        if (updateUser.acknowledged && updateUser.modifiedCount > 0) {
            
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
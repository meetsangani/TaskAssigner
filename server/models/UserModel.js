const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name : {
        type: String,
        required: [true , "Provide name"]
    },
    phone : {
        type: Number, 
        required: [true, "Provide phone number"], 
        unique: true
    },
    email : {
        type: String,
        required: [true, "provide email"],
        unique: true
    },
    password : {
        type: String,
        required: [true, "provide password"]
    },
    profile_pic : {
        type: String,
        default: ""
    },
    otp: {
        type: Number,
        default: ""
    },
    token: { 
        type: String, 
        default: "" 
    },
    role: {
        type: String,
        enum: ["user", "admin", "hr"],
        default: "user"
    }
},{
    timestamps : true
})

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;


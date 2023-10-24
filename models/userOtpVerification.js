const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userOTPVerificationSchema = new Schema({
    userId: String,
    otp:String,
    createdAt: Date,
    expiresAt: Date,
});

const userOTPVerification = mongoose.model(
    "userOTPVerification",
    userOTPVerificationSchema
)

module.exports = userOTPVerification;
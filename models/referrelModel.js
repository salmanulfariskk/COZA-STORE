const mongoose = require('mongoose')

const referralSchema = new mongoose.Schema({
    referralAmount: {
        type: Number,
        default:0
    }
})

const Referral = mongoose.model("Referral",referralSchema)
module.exports = Referral
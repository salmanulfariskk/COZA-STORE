const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema({
    email:{
        required: true,
        type: String,
    },
    password:{
        required: true,
        type: String,
    },
    name:{
        required: true,
        type: String,
    },
    referralAmount:{
        type: Number,
        default: 0,
    }
})

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
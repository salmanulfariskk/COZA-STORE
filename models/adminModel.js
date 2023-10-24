const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema({
    email:{
        required: true,
        type: String,
    },
    password:{
        required: true,
        type: String,
    }
})

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
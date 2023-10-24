const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        required: true,
        type: String,
        maxLength: 25,
    },
    lastName: {
        required: true,
        type: String,
        maxLength: 25,
    },
    email: {
        required: true,
        type: String,
    
        unique: true,
        lowercase: true,
        match: /^\S+@\S+\.\S+$/,
    },
    phone: {
        required: true,
        type: Number,
        minLength: 10,
        maxLength: 10,
    },
    profile: {
        type: String,
        default: ''
    },
    // wishlist: [
    //     { type: mongoose.Types.ObjectId, ref: 'Product' }
    // ],
    // cart: [
    //     {
    //         product: {
    //             type: mongoose.Schema.Types.ObjectId,
    //             ref: 'Product',
    //         },
    //         quantity: {
    //             type: Number,
    //             default: 1
    //         },
    //     },
    // ],
    password: {
        required: true,
        type: String,
        minLength: 6,
    },
    verified: {
        type: Boolean,
        default: false
    },
    blocked: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
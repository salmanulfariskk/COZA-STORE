const mongoose = require("mongoose");

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
    default: "",
  },
  // wishlist: [
  //     { type: mongoose.Types.ObjectId, ref: 'Product' }
  // ],
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        default: 1,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
  ],
  totalCartAmount: {
    type: Number,
    default: 0,
  },
  earnedCoupons: [
    {
      coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
      isUsed: {
        type: Boolean,
        default: false,
      },
    },
  ],
  password: {
    required: true,
    type: String,
    minLength: 6,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  referralCode: {
    type: String,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  walletHistory: [
    {
      amount: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: new Date(),
      },
      description: {
        type: String,
        required: true,
      },
    },
  ],
});
const User = mongoose.model("User", userSchema);
module.exports = User;

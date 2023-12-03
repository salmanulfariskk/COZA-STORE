const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../../models/userModel");
const nodemailer = require("nodemailer");
const userOTPVerification = require("../../models/userOtpVerification");
const Product = require("../../models/productModel");
const Address = require("../../models/addressModel");
const Order = require("../../models/orderModel");
const Category = require("../../models/categoryModel");
const { ObjectId } = require("mongodb");
const Return = require("../../models/returnProductModel");
const Cancel = require("../../models/cancelProductModel");
const razorpay = require("../../controllers/utils/razorpayConfig");
const Coupon = require("../../models/couponModel");
const Admin = require("../../models/adminModel");
const { response } = require("express");



const isLoggedIn = (req, res) => {
    if (req.session.user) {
      return true;
    } else {
      return false;
    }
};

let salt;

async function generateSalt() {
  salt = await bcrypt.genSalt(10);
}

generateSalt();

//user profile
const loadProfile = async (req, res) => {
    try {
      const userProfile = await User.findById(req.session.user);
      const userAddress = await Address.find({ userId: req.session.user });
      res.render("user/profile", {
        user: req.session.user,
        userProfile,
        userAddress,
        isLoggedIn,
      });
    } catch (error) {
      console.log(error.message);
    }
};

const updateProfilePhoto = async (req, res) => {
    try {
      await User.updateOne(
        { _id: req.session.user },
        { $set: { profile: req.body.image } }
      );
  
      res.redirect("/profile");
    } catch (error) {
      res.render("error/internalError", { error });
    }
};

const deleteProfilePhoto = async (req, res) => {
    try {
      await User.updateOne({ _id: req.session.user }, { $set: { profile: "" } });
  
      res.redirect("/profile");
    } catch (error) {
      res.render("error/internalError", { error });
    }
};

const loadEditProfile = async (req, res) => {
    try {
      const userData = await User.findById(req.query.id);
      res.render("user/editProfile", { userData });
    } catch (error) {
      console.log(error.message);
    }
};

const editProfile = async (req, res) => {
    try {
      const { id, firstName, lastName, email, phone } = req.body;
      await User.updateOne(
        { _id: id },
        {
          $set: {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
          },
        }
      );
      res.redirect("/profile");
    } catch (error) {
      console.log(error.message);
    }
};

//address
const addAddress = async (req, res) => {
    try {
      res.render("user/add-address", { isLoggedIn });
    } catch (error) {
      console.log(error.message);
    }
};

const addAddressPost = async (req, res) => {
    try {
      const { name, mobile, country, state, district, city, pincode, address } =
        req.body;
      //validate mobile for 10 digits
      if (!/^\d{10}$/.test(mobile)) {
        return res.render("user/add-address", {
          user: req.session.user,
          error: "Mobile number should be 10 digits",
          isLoggedIn,
        });
      }
  
      const check = await Address.find({ userId: req.session.user });
      console.log(check);
  
      if (check.length0 > 0) {
        const addAddress = new Address({
          userId: req.session.user,
          name,
          mobile,
          country,
          state,
          district,
          city,
          pincode,
          address,
        });
        addAddress.save();
      } else {
        const addAddress = new Address({
          userId: req.session.user,
          name,
          mobile,
          country,
          state,
          district,
          city,
          pincode,
          address,
        });
        addAddress.save();
      }
      res.redirect("/profile");
    } catch (error) {
      console.log(error.message);
    }
};

const loadEditAddress = async (req, res) => {
    try {
      const id = req.query.id;
      const findAddress = await Address.findOne({ _id: id });
      res.render("user/edit-address", { isLoggedIn, findAddress });
    } catch (error) {
      console.log(error.message);
    }
};

const editAddressPost = async (req, res) => {
    try {
      await Address.updateOne(
        { _id: req.body.id },
        {
          $set: {
            name: req.body.name,
            mobile: req.body.mobile,
            country: req.body.country,
            state: req.body.state,
            district: req.body.district,
            city: req.body.city,
            pincode: req.body.pincode,
            address: req.body.pincode,
          },
        }
      );
      res.redirect("/profile");
    } catch (error) {
      console.log(error.message);
    }
};

const deleteAddress = async (req, res) => {
    try {
      await Address.deleteOne({ _id: req.query.id });
      res.redirect("/profile");
    } catch (error) {
      console.log(error.message);
    }
};

//changePassword
const loadPassword = async (req, res) => {
    try {
      const userProfile = await User.findById(req.session.user);
      res.render("user/changeUserPass", { isLoggedIn, userProfile });
    } catch (error) {
      console.log(error.message);
    }
};

const ChangePass = async (req, res) => {
    try {
      const { id, oldPassword, newPassword } = req.body;
  
      const userProfile = await User.findById(id);
  
      const passwordMatch = await bcrypt.compare(
        oldPassword,
        userProfile.password
      );
  
      if (passwordMatch) {
        const hashPassword = await bcrypt.hash(newPassword, salt);
        console.log(hashPassword);
        await User.updateOne({ _id: id }, { $set: { password: hashPassword } });
  
        return res.redirect("/profile");
      } else {
        return res.render("user/changeUserPass", {
          isLoggedIn,
          userProfile,
          error: "Your old password is incorrect",
        });
      }
    } catch (error) {
      console.log(error.message);
    }
};

//coupons
const getCoupons = async (req, res) => {
    try {
      const currentUser = await User.findById(req.session.user).populate(
        "earnedCoupons.coupon"
      );
      const allCoupons = await Coupon.find({ isActive: true });
      const earnedCoupons = currentUser.earnedCoupons;
  
      // Convert the list of earned coupon IDs to an array
      const earnedCouponIds = earnedCoupons.map((coupon) =>
        coupon.coupon._id.toString()
      );
      // Filter out earned coupons from the active coupons list
      const remainingCoupons = allCoupons.filter(
        (coupon) => !earnedCouponIds.includes(coupon._id.toString())
      );
  
      res.render("user/coupons", {
        activePage: "profile",
        user: req.session.user,
        isLoggedIn,
        currentUser,
        allCoupons: remainingCoupons,
        earnedCoupons,
      });
    } catch (error) {
      console.log(error.message);
    }
};

const applyCoupon = async (req, res) => {
    try {
      const userData = await User.findById(req.session.user).populate(
        "earnedCoupons.coupon"
      );
      await userData.populate("cart.product");
      await userData.populate("cart.product.category");
      const cartProducts = userData.cart;
      const selectAddress = await Address.findOne({
        userId: req.session.user,
        default: true,
      });
      const allAddress = await Address.find({
        userId: req.session.user,
        default: false,
      });
      const currentCoupon = await Coupon.findOne({ code: req.body.coupon });
      const grandTotal = cartProducts.reduce((total, element) => {
        return total + element.total;
      }, 0);
      let couponError = "";
      let discount = 0;
      const errorMessage = req.query.error;
      if (currentCoupon) {
        const foundCoupon = userData.earnedCoupons.find((coupon) =>
          coupon.coupon._id.equals(currentCoupon._id)
        );
        if (foundCoupon) {
          if (foundCoupon.coupon.isActive) {
            if (!foundCoupon.isUsed) {
              if (foundCoupon.coupon.discountType === "fixedAmount") {
                if (foundCoupon.coupon.discountAmount > grandTotal) {
                  couponError = "Your total is less than coupon amount.";
                } else {
                  discount = foundCoupon.coupon.discountAmount;
                }
              } else {
                discount = (foundCoupon.coupon.discountAmount / 100) * grandTotal;
              }
            } else {
              couponError = foundCoupon.isUsed
                ? "Coupon already used."
                : "Coupon is inactive.";
            }
          } else {
            couponError = foundCoupon.isUsed
              ? "Coupon already used."
              : "Coupon is inactive.";
          }
        } else {
          couponError = "Invalid coupon code.";
        }
      } else {
        couponError = "Invalid coupon code.";
      }
  
      res.render("user/checkout", {
        activePage: "shopingCart",
        user: req.session.user,
        userData,
        isLoggedIn,
        cartProducts,
        selectAddress,
        allAddress,
        discount,
        grandTotal,
        currentCoupon: couponError ? "" : currentCoupon._id,
        couponError,
        errorMessage,
        error: "",
      });
    } catch (error) {
      console.log(error.message);
    }
};

//wallet
const loadWallet = async (req, res) => {
    try {
      const userWallet = await User.findById(req.session.user);
      const walletAmount = userWallet.wallet;
      const walletHistory = userWallet.walletHistory;
      res.render("user/wallet", { isLoggedIn, walletAmount, walletHistory });
    } catch (error) {
      console.log(error.message);
    }
};

const generateCode = async (req, res) => {
    try {
      const length = 10;
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let randomCode = "";
  
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomCode += characters.charAt(randomIndex);
      }
  
      const findUser = await User.findByIdAndUpdate(req.session.user, {
        referralCode: randomCode,
      });
      if (findUser) {
        return res.redirect("/profile");
      } else {
        return res.redirect("/login");
      }
  
      // Redirect with randomCode as a query parameter
      // res.redirect('/profile?randomCode=' + encodeURIComponent(randomCode));
    } catch (error) {
      +console.log(error.message);
    }
};
  

module.exports = {
    loadProfile,
    updateProfilePhoto,
    deleteProfilePhoto,
    loadEditProfile,
    editProfile,
    addAddress,
    addAddressPost,
    loadEditAddress,
    editAddressPost,
    deleteAddress,
    loadPassword,
    ChangePass,
    getCoupons,
    applyCoupon,
    loadWallet,
    generateCode
}
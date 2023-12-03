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

const loadHome = async (req, res) => {
    try {
      const userId = req.session.user;
      const products = await Product.find().populate("category");
      const user = isLoggedIn(req, res);
      // console.log(user);
      res.render("user/home", { isLoggedIn: user, commonError: "", products });
    } catch (error) {
      console.log(error.message);
    }
};

const loadShop = async (req, res) => {
    try {
      const userId = req.session.user;
      const products = await Product.find();
      const user = isLoggedIn(req, res);
      // console.log(user);
      res.render("user/shop", { isLoggedIn: user, commonError: "", products });
    } catch (error) {
      console.log(error.message);
    }
  };

  const loadProductDetails = async (req, res) => {
    try {
      const user = isLoggedIn(req, res);
  
      const userId = req.session.user;
  
      const productIdToCheck = req.query.productId;
  
      const check = await User.findOne({
        _id: userId,
        cart: { $elemMatch: { product: productIdToCheck } },
      });
  
      const productData = await Product.findById(productIdToCheck);
  
      console.log(check);
  
      if (check) {
        res.render("user/productDetails", {
          product: productData,
          isLoggedIn: user,
          message: "already exist in a cart",
        });
      } else {
        res.render("user/productDetails", {
          product: productData,
          isLoggedIn: user,
          message: "",
        });
      }
    } catch (error) {
      console.log(error.message);
    }
};

const loadAbout = async (req, res) => {
    try {
      var isLog = false;
      if (req.session.user) {
        isLog = true;
      }
      res.render("user/about", { isLoggedIn: isLog });
    } catch (error) {
      console.log(error.message);
    }
};

const loadContact = async (req, res) => {
    try {
      var isLog = false;
      if (req.session.user) {
        isLog = true;
      }
      res.render("user/contact", { isLoggedIn: isLog });
    } catch (error) {
      console.log(error.message);
    }
  };


module.exports = {
    loadHome,
    loadShop,
    loadProductDetails,
    loadAbout,
    loadContact

}


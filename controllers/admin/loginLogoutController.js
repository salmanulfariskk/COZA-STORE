const mongoose = require("mongoose");
const Admin = require("../../models/adminModel");
const users = require("../../models/userModel");
const Category = require("../../models/categoryModel");
const Product = require("../../models/productModel");
const Order = require("../../models/orderModel");
const fs = require("fs");
const path = require("path");
const User = require("../../models/userModel");
const Return = require("../../models/returnProductModel");
const Cancel = require("../../models/cancelProductModel");
const Coupon = require("../../models/couponModel");
const Referral = require("../../models/referrelModel")


const adminLogin = async (req, res) => {
    res.render("admin/login");
};

const adminSession = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
    const validEmail = await Admin.findOne({ email });
  
    if (validEmail) {
      if (password === validEmail.password) {
        req.session.admin = email;
        res.redirect("/admin/dashboard");
      } else {
        req.session.error = "password error";
        res.render("admin/login");
      }
    } else {
      req.session.error = "user not found";
      res.redirect("login");
    }
};

//logout

const logout = async (req,res) => {
    try {
        req.session.destroy()
        res.redirect("/admin/login")
    }catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    adminLogin,
    adminSession,
    logout
}
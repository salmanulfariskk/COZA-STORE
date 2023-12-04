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

//referral  
const loadReferral = async (req, res) => {
    try {
      const admin = await Admin.findOne({ email: req.session.admin });
      res.render("admin/referral",{admin});
    } catch (error) {
      console.log(error.message);
    }
};
  
const addReferral = async (req,res) => {
    try {
      const {referralAmount} = req.body
      
      await Admin.updateOne({email: req.session.admin},{ $set: { referralAmount: referralAmount } })
  
      res.redirect("/admin/referral")
    }catch (error){
      console.log(error.message);
    }
}



module.exports = {
    loadReferral,
    addReferral
}
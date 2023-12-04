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


const adminUsers = async (req, res) => {
    const user = await users.find();
    try {
      res.render("admin/usersTable", { customers: user });
    } catch (error) {
      console.log(error.message);
    }
};

const UnblockTheUser = async (req, res) => {
    try {
      const { id } = req.query;
      const userUpdated1 = await users.updateOne(
        { _id: id },
        { $set: { blocked: false } }
      );
      if (userUpdated1) {
        return res.redirect("/admin/users");
      }
    } catch (error) {
      console.log(error.message);
    }
};

const blockTheUser = async (req, res) => {
    try {
      const { id } = req.query;
      const userUpdated = await users.updateOne(
        { _id: id },
        { $set: { blocked: true } }
      );
      if (userUpdated) {
        return res.redirect("/admin/users");
      }
    } catch (error) {
      console.log(error.message);
    }
};


module.exports = {
    adminUsers,
    UnblockTheUser,
    blockTheUser
}
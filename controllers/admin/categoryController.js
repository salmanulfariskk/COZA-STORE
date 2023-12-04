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

const loadCategory = async (req, res) => {
    const category = await Category.find();
    try {
      res.render("admin/category", { category });
    } catch (error) {
      console.log(error.message);
    }
};

const loadAddCategory = async (req, res) => {
    try {
      res.render("admin/add-category");
    } catch (error) {
      console.log(error.message);
    }
};
  
const AddCategory = async (req, res) => {
    try {
      const categoryName = req.body.categoryName.trim(); // Remove leading and trailing whitespace
  
      if (categoryName === "") {
        return res.render("admin/add-category", {
          error: "Please enter a non-empty category name",
        });
      } else {
        // Use a case-insensitive query to check for existing categories
        const check = await Category.findOne({
          name: { $regex: new RegExp(`^${categoryName}$`, "i") },
        });
  
        if (check) {
          res.render("admin/add-category", { error: "Category already exists" });
          console.log(check);
        } else {
          const category = await Category.create({
            name: categoryName,
            offer: req.body.offer,
          });
          if (category) {
            return res.render("admin/add-category", {
              success: "Category added successfully",
            });
          } else {
            return res.render("admin/add-category", {
              error: "Category creation failed",
            });
          }
        }
      }
    } catch (error) {
      console.log(error.message);
    }
};

const editCategory = async (req, res) => {
    try {
      const id = req.query.id;
      const categoryData = await Category.findOne({ _id: id });
      res.render("admin/editCategory", { category: categoryData });
    } catch (error) {
      console.log(error.message);
    }
};

const deleteCategory = async (req, res) => {
    try {
      const id = req.query.id;
      await Category.deleteOne({ _id: id });
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error.message);
    }
};

const postEditCategory = async (req, res) => {
    try {
      const catName = req.body.categoryName;
      const catOff = req.body.offer || 0;
      const id = req.query.id;
      var offerPrice = 0;
      const pp = await Product.find({ category: id });
      console.log(`pp is : ${pp}`);
      console.log(pp);
      for (let i = 0; i < pp.length; i++) {
        offerPrice = Math.round(
          pp[i].price - (pp[i].price * req.body.offer) / 100
        );
        await Product.updateOne(
          { category: id, productName: pp[i].productName },
          { $set: { offerPrice: offerPrice, offer: catOff } }
        );
      }
  
      const kk = Product.find({ category: id });
      await Category.updateOne(
        { _id: id },
        { $set: { name: catName, offer: catOff } }
      );
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error.message);
    }
};


module.exports = {
    loadCategory,
    loadAddCategory,
    AddCategory,
    editCategory,
    deleteCategory,
    postEditCategory

}
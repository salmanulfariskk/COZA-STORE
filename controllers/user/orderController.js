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

const loadOrder = async (req, res) => {
    try {
      const currentUser = await User.findById(req.session.user_id);
      const perPage = 5; // Number of orders per page
      const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)
  
      const ordersCount = await Order.countDocuments({
        user: req.session.user_id,
      });
      const totalPages = Math.ceil(ordersCount / perPage);
      const userIdVariable = new mongoose.Types.ObjectId(req.session.user_id);
      const orders = await Order.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.session.user),
          },
        },
        { $unwind: "$products" },
        {
          $lookup: {
            from: "products", // Replace with the correct collection name
            localField: "products.product",
            foreignField: "_id",
            as: "orderedProducts",
          },
        },
        { $sort: { orderDate: -1 } },
      ]);
  
      res.render("user/order", {
        activePage: "profile",
        isLoggedIn,
        currentUser,
        orders,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.log(error.message);
    }
};

const cancelOrder = async (req, res) => {
    try {
      const foundOrder = await Order.findById(req.body.orderId).populate(
        "products.product"
      );
      const foundProduct = foundOrder.products.find(
        (product) => product.product._id.toString() === req.body.productId
      );
      if (foundOrder.paymentMethod !== "Cash on delivery") {
        const currentUser = await User.findById(req.session.user_id);
  
        if (currentUser) {
          // Check if currentUser is defined
          const refundAmount = foundProduct.total;
          currentUser.wallet.balance += refundAmount;
  
          const transactionData = {
            amount: refundAmount,
            description: "Order cancelled.",
            type: "Credit",
          };
          currentUser.wallet.transactions.push(transactionData);
  
          // Save changes to the user's wallet, canceled product, and order
          await currentUser.save();
        } else {
          console.log("User not found");
        }
      }
      foundProduct.isCancelled = true;
  
      const EditProduct = await Product.findOne({
        _id: foundProduct.product._id,
      });
  
      const currentStock = EditProduct.quantity;
      EditProduct.quantity = currentStock + foundProduct.quantity;
  
      foundOrder.totalAmount -= foundProduct.total;
  
      foundProduct.quantity = 0;
      foundProduct.total = 0;
  
      await EditProduct.save();
  
      // Function to check if all products in the order are cancelled
      function areAllProductsCancelled(order) {
        for (const product of order.products) {
          if (!product.isCancelled) {
            return false; // If any product is not cancelled, return false
          }
        }
        return true; // All products are cancelled
      }
  
      // Check if all products in the order are cancelled
      if (areAllProductsCancelled(foundOrder)) {
        // Update the order status to "Cancelled"
  
        foundOrder.totalAmount -= 0;
        foundOrder.status = "Cancelled";
      }
  
      await foundOrder.save();
      res.redirect("/order");
    } catch (error) {
      console.log(error);
    }
};

const loadOrderSuccess = async (req, res) => {
    try {
      const userId = req.session.user;
  
      const order = await Order.findOne({ user: userId }).sort({ orderDate: -1 });
      const randomSixDigitNumber = Math.floor(100000 + Math.random() * 900000);
      res.render("user/orderSuccess", { orderData: order, randomSixDigitNumber });
    } catch (error) {
      console.log(error.message);
    }
};

const getCancelProductForm = async (req, res) => {
    try {
      const currentUser = await User.findById(req.session.user);
      const product = await Product.findById(req.query.product);
      const category = await Category.findById(req.query.category);
      const defaultAddress = await Address.findOne({
        userId: req.session.user,
        default: true,
      });
      res.render("user/cancelForm", {
        isLoggedIn,
        currentUser,
        currentAddress: defaultAddress,
        order: req.query.order,
        category,
        product,
        quantity: req.query.quantity,
        totalPrice: req.query.totalPrice,
      });
    } catch (error) {
      console.log(error.message);
    }
};

const requestCancelProduct = async (req, res) => {
    try {
      const foundOrder = await Order.findById(req.body.order).populate(
        "products.product"
      );
      const foundProduct = await Product.findById(req.body.productId);
      const cancelProduct = new Cancel({
        user: req.session.user,
        order: foundOrder._id,
        product: foundProduct._id,
        quantity: parseInt(req.body.quantity),
        totalPrice: parseInt(req.body.totalPrice),
        reason: req.body.reason,
        address: req.body.address,
      });
      await cancelProduct.save();
  
      foundOrder.products.forEach((product) => {
        if (product.product._id.toString() === foundProduct._id.toString()) {
          product.cancelRequested = "Pending";
        }
      });
      await foundOrder.save();
  
      res.redirect("/order");
    } catch (error) {
      console.log(error.message);
    }
};

const getReturnProductForm = async (req, res) => {
    try {
      const currentUser = await User.findById(req.session.user);
      const product = await Product.findById(req.query.product);
      const category = await Category.findById(req.query.category);
      const defaultAddress = await Address.findOne({
        userId: req.session.user,
        default: true,
      });
      res.render("user/returnForm", {
        isLoggedIn,
        currentUser,
        currentAddress: defaultAddress,
        order: req.query.order,
        category,
        product,
        quantity: req.query.quantity,
        totalPrice: req.query.totalPrice,
      });
    } catch (error) {
      console.log(error.message);
    }
};

const requestReturnProduct = async (req, res) => {
    try {
      const foundOrder = await Order.findById(req.body.order).populate(
        "products.product"
      );
      const foundProduct = await Product.findById(req.body.productId);
      const returnProduct = new Return({
        user: req.session.user,
        order: foundOrder._id,
        product: foundProduct._id,
        quantity: parseInt(req.body.quantity),
        totalPrice: parseInt(req.body.totalPrice),
        reason: req.body.reason,
        condition: req.body.condition,
        address: req.body.address,
      });
      await returnProduct.save();
  
      foundOrder.products.forEach((product) => {
        if (product.product._id.toString() === foundProduct._id.toString()) {
          product.returnRequested = "Pending";
        }
      });
      await foundOrder.save();
  
      res.redirect("/order");
    } catch (error) {
      console.log(error.message);
    }
};

module.exports ={
    loadOrder,
    cancelOrder,
    loadOrderSuccess,
    getCancelProductForm,
    requestCancelProduct,
    getReturnProductForm,
    requestReturnProduct
}
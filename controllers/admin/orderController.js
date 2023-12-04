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


//order
const loadOrder = async (req, res) => {
    const perPage = 50; // Number of orders per page
    const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)
    const { customer, status } = req.query;
    try {
      let ordersQuery = Order.find().populate([
        { path: "products.product" },
        { path: "user" },
      ]);
      if (customer) {
        ordersQuery = ordersQuery
          .where("user.username")
          .regex(new RegExp(customer, "i"));
      }
  
      if (status) {
        ordersQuery = ordersQuery.where("status").equals(status);
      }
  
      const orders = await ordersQuery
        .sort({ orderDate: -1 }) // Sort by orderDate in descending order
        .skip((page - 1) * perPage) // Skip orders on previous pages
        .limit(perPage); // Limit the number of orders per page
  
      console.log(orders.length);
      const totalOrders = await Order.countDocuments();
      const totalPages = Math.ceil(totalOrders / perPage);
      res.render("admin/order", {
        activePage: "order",
        orders,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.log(error.message);
    }
};
  
const updateActionOrder = async (req, res) => {
    try {
      const orderData = await Order.findById(req.query.orderId);
      const userData = await User.findById(orderData.user);
  
      const foundCoupon = await Coupon.findOne({
        isActive: true,
        minimumPurchaseAmount: { $lte: orderData.totalAmount },
      }).sort({ minimumPurchaseAmount: -1 });
  
      if (foundCoupon) {
        const couponExists = userData.earnedCoupons.some((coupon) =>
          coupon.coupon.equals(foundCoupon._id)
        );
        if (!couponExists) {
          userData.earnedCoupons.push({ coupon: foundCoupon._id });
        }
      }
      await userData.save();
      await Order.updateOne(
        { _id: req.query.orderId },
        { status: req.query.action }
      );
      res.redirect("/admin/orders");
    } catch (error) {
      console.log(error.message);
    }
};
  
const updateOrderCancel = async (req, res) => {
    try {
      const foundOrder = await Order.findById(req.query.orderId);
  
      for (let i = 0; i < foundOrder.products.length; i++) {
        foundOrder.products[i].isCancelled = true;
      }
  
      foundOrder.status = req.query.action;
  
      await foundOrder.save();
  
      res.redirect("/admin/orders");
    } catch (error) {
      console.log(error.message);
    }
};
  
const getReturnRequests = async (req, res) => {
    try {
      const ITEMS_PER_PAGE = 5;
  
      const page = parseInt(req.query.page) || 1;
  
      const totalRequests = await Return.countDocuments();
  
      const returnRequests = await Return.find()
        .populate([{ path: "user" }, { path: "order" }, { path: "product" }])
        .sort({ createdAt: -1 })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
  
      const totalPages = Math.ceil(totalRequests / ITEMS_PER_PAGE);
  
      res.render("admin/returns", { returnRequests, totalPages });
    } catch (error) {
      console.log(error.message);
    }
};
  
const returnRequestAction = async (req, res) => {
    try {
      const foundRequet = await Return.findById(req.body.request);
      const foundOrders = await Order.findById(req.body.order);
      const currentProduct = foundOrders.products.find(
        (product) => product.product.toString() === req.body.product.toString()
      );
      if (req.body.action === "approve") {
        foundRequet.status = "Approved";
        currentProduct.returnRequested = "Approved";
      } else if (req.body.action === "reject") {
        foundRequet.status = "Rejected";
        currentProduct.returnRequested = "Rejected";
      } else {
        const EditProduct = await Product.findOne({ _id: req.body.product });
  
        const currentStock = EditProduct.quantity;
        EditProduct.quantity = currentStock + foundRequet.quantity;
  
        await EditProduct.save();
  
        foundRequet.status = "Completed";
        currentProduct.returnRequested = "Completed";
      }
      await foundRequet.save();
      await foundOrders.save();
      res.redirect("/admin/return-requests");
    } catch (error) {
      console.log(error.message);
    }
};
  
const getCancelRequests = async (req, res) => {
    try {
      const ITEMS_PER_PAGE = 5;
  
      const page = parseInt(req.query.page) || 1;
  
      const totalRequests = await Cancel.countDocuments();
  
      const cancelRequests = await Cancel.find()
        .populate([{ path: "user" }, { path: "order" }, { path: "product" }])
        .sort({ createdAt: -1 });
      // .skip((page -1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
  
      const totalPages = Math.ceil(totalRequests / ITEMS_PER_PAGE);
  
      res.render("admin/cancels", { cancelRequests, totalPages });
    } catch (error) {
      console.log(error.message);
    }
};
  
const returnCancelAction = async (req, res) => {
    try {
      const foundCancel = await Cancel.findById(req.body.request).populate(
        "user"
      );
      const foundOrders = await Order.findById(req.body.order).populate(
        "products.product"
      );
      const currentProduct = foundOrders.products.find(
        (product) =>
          product.product._id.toString() === req.body.product.toString()
      );
      if (req.body.action === "approve") {
        foundCancel.status = "Approved";
        currentProduct.cancelRequested = "Approved";
      } else {
        if (foundOrders.paymentMethod !== "Cash on delivery") {
          const currentUser = await User.findById(foundCancel.user._id);
          console.log(currentUser);
  
          if (currentUser) {
            // Check if currentUser is defined
            // const refundAmount = currentProduct.total;
            // currentUser.wallet.balance += refundAmount;
  
            // const transactionData = {
            //   amount: refundAmount,
            //   description: "Order cancelled.",
            //   type: "Credit",
            // };
            // currentUser.wallet.transactions.push(transactionData);
  
            // Save changes to the user's wallet, canceled product, and order
            await currentUser.save();
          } else {
            console.log("user not found");
          }
        }
        foundCancel.status = "Completed";
        currentProduct.isCancelled = true;
        currentProduct.cancelRequested = "Completed";
  
        const EditProduct = await Product.findOne({
          _id: currentProduct.product._id,
        });
  
        const currentStock = EditProduct.quantity;
        EditProduct.quantity = currentStock + currentProduct.quantity;
  
        foundOrders.totalAmount -= currentProduct.total;
  
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
        if (areAllProductsCancelled(foundOrders)) {
          // Update the order status to "Cancelled"
  
          foundOrders.totalAmount -= 0;
          foundOrders.status = "Cancelled";
        }
      }
      await foundCancel.save();
      await foundOrders.save();
      res.redirect("/admin/cancel-requests");
    } catch (error) {
      console.log(error.message);
    }
};


module.exports = {
    loadOrder,
    updateActionOrder,
    updateOrderCancel,
    getReturnRequests,
    returnRequestAction,
    getCancelRequests,
    returnCancelAction

}
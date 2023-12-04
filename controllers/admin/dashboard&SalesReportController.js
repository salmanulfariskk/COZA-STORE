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


const loadDashboard = async (req, res) => {
    try {
      const admin = await Admin.findOne({ email: req.session.admin });
      const today = new Date();
      //calculate the start and end dates for this month
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      // MongoDB aggregation pipeline to fetch the required data
      const pipeline = [
        {
          $match: {
            status: {
              $nin: ["Cancelled"],
            },
            orderDate: {
              $gte: thisMonthStart,
              $lte: thisMonthEnd,
            },
          },
        },
        {
          $facet: {
            todaysOrders: [
              {
                $match: {
                  orderDate: {
                    $gte: new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate()
                    ),
                    $lt: new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate() + 1
                    ),
                  },
                },
              },
              { $count: "count" },
            ],
            thisMonthsOrders: [{ $count: "count" }],
            thisMonthsTotalRevenue: [
              { $group: { _id: null, total: { $sum: "$totalAmount" } } },
            ],
            totalCustomersThisMonth: [
              {
                $group: {
                  _id: "$user",
                },
              },
              { $count: "count" },
            ],
          },
        },
      ];
  
      const order = await Order.aggregate(pipeline);
  
      let todaysOrders;
      let thisMonthsOrders;
      let thisMonthsTotalRevenue;
      let totalCustomersThisMonth;
  
      order.forEach((ord) => {
        todaysOrders = ord.todaysOrders[0] ? ord.todaysOrders[0].count : 0;
        thisMonthsOrders = ord.thisMonthsOrders[0]
          ? ord.thisMonthsOrders[0].count
          : 0;
        thisMonthsTotalRevenue = ord.thisMonthsTotalRevenue[0]
          ? ord.thisMonthsTotalRevenue[0].total
          : 0;
        totalCustomersThisMonth = ord.totalCustomersThisMonth[0]
          ? ord.totalCustomersThisMonth[0].count
          : 0;
      });
  
      // for charts
      const orderChartData = await Order.find({ status: "Delivered" });
      // Initialize objects to store payment method counts and monthly order counts
      const paymentMethods = {};
      const monthlyOrderCountsCurrentYear = {};
  
      // Get the current year
      const currentYear = new Date().getFullYear();
  
      // Iterate through each order
      orderChartData.forEach((order) => {
        // Extract payment method and order date from the order object
        let { paymentMethod, orderDate } = order;
  
        // Count payment methods
        if (paymentMethod) {
          switch (paymentMethod) {
            case "Cash on delivery": {
              paymentMethod = "cod";
              break;
            }
            case "Razorpay": {
              paymentMethod = "rzp";
              break;
            }
            case "Wallet": {
              paymentMethod = "wlt";
              break;
            }
          }
          if (!paymentMethods[paymentMethod]) {
            paymentMethods[paymentMethod] = order.totalAmount;
          } else {
            paymentMethods[paymentMethod] += order.totalAmount;
          }
        }
  
        // Count orders by month
        if (orderDate) {
          const orderYear = orderDate.getFullYear();
          if (orderYear === currentYear) {
            const orderMonth = orderDate.getMonth(); // Get the month (0-11)
  
            // Create a unique key for the month
            const monthKey = `${orderMonth}`; // Month is 0-based
  
            if (!monthlyOrderCountsCurrentYear[monthKey]) {
              monthlyOrderCountsCurrentYear[monthKey] = 1;
            } else {
              monthlyOrderCountsCurrentYear[monthKey]++;
            }
          }
        }
      });
  
      const resultArray = new Array(12).fill(0);
      for (const key in monthlyOrderCountsCurrentYear) {
        const intValue = parseInt(key);
        resultArray[intValue] = monthlyOrderCountsCurrentYear[key];
      }
      res.render("admin/dashboard", {
        activePage: "dashboard",
        todaysOrders,
        thisMonthsOrders,
        thisMonthsTotalRevenue,
        totalCustomersThisMonth,
        paymentMethods,
        monthlyOrderCountsCurrentYear: resultArray,
        admin,
      });
    } catch (error) {
      console.log(error.message);
    }
};
  
const loadSalesReport = async (req, res) => {
    try {
      let startOfMonth;
      let endOfMonth;
      if (req.query.filtered) {
        startOfMonth = new Date(req.body.from);
        endOfMonth = new Date(req.body.upto);
        endOfMonth.setHours(23, 59, 59, 999);
      } else {
        const today = new Date();
        startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
  
      var orderStatusFilter = {
        status: { $in: ["Processing", "Shipped", "Cancelled", "Delivered"] },
      };
      // Check if order status is provided in the request
      if (req.body.status) {
        if (req.body.status === "Cancelled") {
          orderStatusFilter = { "products.isCancelled": true };
        } else if (req.body.status === "Returned") {
          orderStatusFilter = { "products.returnRequested": "Completed" };
        } else {
          orderStatusFilter = {
            status: req.body.status,
            "products.isCancelled": { $ne: true },
            "products.returnRequested": { $ne: "Completed" },
          };
        }
      }
  
      const filteredOrders = await Order.aggregate([
        {
          $unwind: "$products", // Unwind the products array
        },
        {
          $match: {
            orderDate: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
            ...orderStatusFilter,
          },
          // Use the complete orderStatusFilter object
        },
        {
          $lookup: {
            from: "products", // Replace with the actual name of your products collection
            localField: "products.product",
            foreignField: "_id",
            as: "productInfo", // Store the product info in the "productInfo" array
          },
        },
        {
          $addFields: {
            "products.productInfo": {
              $arrayElemAt: ["$productInfo", 0], // Get the first (and only) element of the "productInfo" array
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $unwind: "$userInfo",
        },
        {
          $project: {
            _id: 1,
            userInfo: 1,
            totalAmount: 1,
            paymentMethod: 1,
            deliveryAddress: 1,
            status: 1,
            orderDate: 1,
            deliveryDate: 1,
            "products.quantity": 1,
            "products.total": 1,
            "products.isCancelled": 1,
            "products.returnRequested": 1,
            "products.productInfo": 1,
          },
        },
      ]);
  
      let orderDone = 0;
      let totalRevenue = 0;
      for (let i = 0; i < filteredOrders.length; i++) {
        if (
          filteredOrders[i].status === "Delivered" &&
          filteredOrders[i].products.returnRequested !== "Completed"
        ) {
          orderDone += 1;
          totalRevenue += filteredOrders[i].products.total;
        }
      }
  
      res.render("admin/salesReport", {
        salesReport: filteredOrders,
        activePage: "salesReport",
        orderDone,
        totalRevenue,
      });
    } catch (error) {
      console.log(error.message);
    }
};


module.exports = {
    loadDashboard,
    loadSalesReport,
}
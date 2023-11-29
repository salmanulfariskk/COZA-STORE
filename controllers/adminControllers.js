const mongoose = require("mongoose");
const Admin = require("../models/adminModel");
const users = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");
const Return = require("../models/returnProductModel");
const Cancel = require("../models/cancelProductModel");

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
        const category = await Category.create({ name: categoryName,offer:req.body.offer });
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
    const catOff = req.body.offer
    const id = req.query.id;
    var offerPrice = 0;
    const pp = await Product.find({category:id})
    console.log(`pp is : ${pp}`)
    console.log(pp);
    for(let i = 0 ; i < pp.length; i++) {
      offerPrice = (Math.round(pp[i].price - (pp[i].price*req.body.offer)/100))
      await Product.updateOne({category:id,productName:pp[i].productName},{$set:{offerPrice:offerPrice,offer:catOff}})
    }
  
    const kk = Product.find({category:id})
    await Category.updateOne({ _id: id }, { $set: { name: catName,offer:catOff } });
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};
const loadProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    res.render("admin/products", { products });
  } catch (error) {
    console.log(error.message);
  }
};
const addProduct = async (req, res) => {
  try {
    const category = await Category.find();
    res.render("admin/add-Products", { category });
  } catch (error) {
    console.log(error.message);
  }
};

const addProductPost = async (req, res) => {
  try {
    const imagesWithPath = req.body.images.map((img) => "/products/" + img);
    const { productName, category, quantity, description, price } = req.body;
    console.log(typeof price);
    if(!req.body.offer){
      var offer = 0
      var offerPrice = 0
    } else {
      var offerPrice = Math.round(req.body.price - (req.body.price * req.body.offer) / 100);

      var offer = req.body.offer
    }
    const newProduct = new Product({
      productName: productName,
      description: description,
      quantity: quantity,
      price: price,
      offer: offer,
      offerPrice:offerPrice,
      category: category,
      images: imagesWithPath,
    });
    await newProduct.save();
    res.redirect("/admin/products/add-product");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await Product.deleteOne({ _id: id });
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    console.log(req.query.id);
    const id = req.query.id;
    const categories = await Category.find();
    const product = await Product.findOne({ _id: id }).populate("category");
    console.log(product);
    console.log(categories);

    res.render("admin/editProduct", { product, categories });
  } catch (error) {
    console.log(error.message);
  }
};

const editProduct = async (req, res) => {
  try {  
    if(!req.body.offer || req.body.offer == 0){
      var offerPrice = 0
      var offer = 0
    } else {
      var offerPrice = Math.round(req.body.price - (req.body.price * req.body.offer) / 100);

      var offer = req.body.offer
    }
    await Product.updateOne(
      { _id: req.body.id },
      {
        $set: {
          productName: req.body.productName,
          category: req.body.category,
          price: req.body.price,
          offer:offer,
          offerPrice:offerPrice,
          description: req.body.description,
          quantity: req.body.quantity,
        },
      }
    );
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};

const destroyProductImage = async (req, res) => {
  const { id } = req.params;
  const { image } = req.body;
  try {
    await Product.findByIdAndUpdate(
      id,
      { $pull: { images: image } },
      { new: true }
    );

    fs.unlink(path.join(__dirname, "../public", image), (err) => {
      if (err) console.log(err);
    });

    res.redirect(`/admin/products/edit-product?id=${id}`);
  } catch (error) {
    console.log(error);
  }
};

const updateProductImages = async (req, res) => {
  console.log("halo");
  const { id } = req.params;
  const { images } = req.body;
  let imagesWithPath;
  if (images.length) {
    imagesWithPath = images.map((image) => "/products/" + image);
  }
  try {
    await Product.findByIdAndUpdate(
      id,
      { $push: { images: imagesWithPath } },
      { new: true }
    );
    res.redirect(`/admin/products/edit-product?id=${id}`);
  } catch (error) {
    console.log(error.message);
  }
};

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

//sales report
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
  adminLogin,
  adminSession,
  adminUsers,
  UnblockTheUser,
  blockTheUser,
  loadCategory,
  loadAddCategory,
  AddCategory,
  editCategory,
  deleteCategory,
  postEditCategory,
  loadProducts,
  addProduct,
  addProductPost,
  deleteProduct,
  loadEditProduct,
  editProduct,
  destroyProductImage,
  updateProductImages,
  loadOrder,
  updateActionOrder,
  updateOrderCancel,
  loadDashboard,
  getReturnRequests,
  returnRequestAction,
  getCancelRequests,
  returnCancelAction,
  loadSalesReport,
};

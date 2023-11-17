const mongoose = require("mongoose");
const Admin = require("../models/adminModel");
const users = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const fs = require("fs")
const path = require("path");
const User = require("../models/userModel");

const adminLogin = async (req, res) => {
  res.render("admin/login");
};

const adminSession = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const validEmail = await Admin.findOne({ email });

  if (validEmail) {
    if ((password === validEmail.password)) {
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
  const user = await users.find()
  try{
    res.render('admin/usersTable',{customers:user});
  }catch (error) {
    console.log(error.message);
  }
}
const UnblockTheUser = async (req, res) => {
  try {
      const { id } = req.query
      const userUpdated1 = await users.updateOne({ _id: id }, { $set: { blocked: false } });
      if (userUpdated1) {

          return res.redirect('/admin/users')
      }
  } catch (error) {
      console.log(error.message);
  }
}
const blockTheUser = async (req, res) => {
  try {
      const { id } = req.query
      const userUpdated = await users.updateOne({ _id: id }, { $set: { blocked: true } })
      if (userUpdated) {
          return res.redirect('/admin/users')
      }
  } catch (error) {
      console.log(error.message);
  }
}

const loadCategory = async (req, res) => {
  const category = await Category.find()
  try{
    res.render('admin/category',{category});
  }catch (error) {
    console.log(error.message);
  }
}

const loadAddCategory = async (req, res) => {
  try{
    res.render('admin/add-category');
  }catch (error) {
    console.log(error.message);
  }
}

const AddCategory = async (req, res) => {
  try {
    const categoryName = req.body.categoryName.trim(); // Remove leading and trailing whitespace

    if (categoryName === "") {
      return res.render('admin/add-category', { error: "Please enter a non-empty category name" });
    } else {
      // Use a case-insensitive query to check for existing categories
      const check = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } });

      if (check) {
        res.render('admin/add-category', { error: "Category already exists" });
        console.log(check);
      } else {
        const category = await Category.create({ name: categoryName });
        if (category) {
          return res.render('admin/add-category', { success: "Category added successfully" });
        } else {
          return res.render('admin/add-category', { error: "Category creation failed" });
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
}



const editCategory = async (req,res)=>{
  try {
    const id = req.query.id;
    const categoryData = await Category.findOne({_id:id});
    res.render('admin/editCategory', {category: categoryData});
  }catch (error) {
    console.log(error.message);
  }
}

const deleteCategory = async (req,res)=>{
  try {
    const id = req.query.id;
    await Category.deleteOne({_id:id});
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
}

const postEditCategory = async(req, res) => {
  try {
    const catName = req.body.categoryName;
    const id = req.query.id;
    await Category.updateOne({_id:id}, {$set: {name:catName}});
    res.redirect("/admin/category")
  } catch (error) {
    console.log(error.message);
  }
}
const loadProducts = async (req,res) => {
  
  try {
    const products = await Product.find().populate("category")
    res.render('admin/products',{products})
  }catch (error) {
    console.log(error.message);
  }
}
const addProduct = async (req, res) => {
  try {
    const category = await Category.find()
    res.render("admin/add-Products",{category})
  }catch (error) {
    console.log(error.message);
  }
}

const addProductPost = async (req, res) => {
  try {
    const imagesWithPath = req.body.images.map(img => '/products/' + img)
    console.log(imagesWithPath);
    const{productName,category,quantity,description,price}=req.body
    const newProduct = new Product({
      productName:productName,
      description:description,
      quantity:quantity,
      price:price,
      category:category,
      images:imagesWithPath
    });
    await newProduct.save()
    res.redirect('/admin/products/add-product')
  }catch (error) {
    console.log(error.message);
  }
}

const deleteProduct = async (req,res)=>{
  try {
    const id = req.query.id;
    await Product.deleteOne({_id:id});
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
}

const loadEditProduct = async (req,res)=>{
  try {
    const id = req.query.id;
    const categories = await Category.find()
    const product = await Product.findOne({_id:id}).populate('category');
    console.log(product);
    console.log(categories);
    
    res.render('admin/editProduct', {product, categories});
  }catch (error) {
    console.log(error.message);
  }
}

const editProduct = async (req,res)=>{
  try {

    await Product.updateOne({ _id: req.body.id }, { $set: { productName: req.body.productName, category: req.body.category, price: req.body.price, description: req.body.description, quantity: req.body.quantity } })
    res.redirect('/admin/products')

  }catch (error) {
    console.log(error.message);
  }
}

const destroyProductImage = async (req, res) => {
  const { id } = req.params
  const { image } = req.body
  try {
      await Product.findByIdAndUpdate(id, { $pull: { images: image } }, { new: true })

      fs.unlink(path.join(__dirname, '../public', image), (err) => {
          if (err) console.log(err)
      })

      res.redirect(`/admin/products/edit-product?id=${id}`)

  } catch (error) {
      console.log(error);
  }
}

const updateProductImages = async (req, res) => {
  console.log("halo");
  const { id } = req.params
  const { images } = req.body
  let imagesWithPath
  if (images.length) {
      imagesWithPath = images.map(image => '/products/' + image)
  }
  try {
      await Product.findByIdAndUpdate(id, { $push: { images: imagesWithPath } }, { new: true })
      res.redirect(`/admin/products/edit-product?id=${id}`)
  } catch (error) {
      console.log(error.message)
  }
}

//order
const loadOrder = async (req, res) => {
  const perPage = 8; // Number of orders per page
  const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)
  const { customer, status } = req.query;
  try {
      let ordersQuery = Order.find().populate([{ path: 'products.product' }, { path: 'user' }]);
      if (customer) {
          ordersQuery = ordersQuery.where('user.username').regex(new RegExp(customer, 'i'));
      }

      if (status) {
          ordersQuery = ordersQuery.where('status').equals(status);
      }

      const orders = await ordersQuery
          .sort({ orderDate: -1 }) // Sort by orderDate in descending order
          .skip((page - 1) * perPage) // Skip orders on previous pages
          .limit(perPage); // Limit the number of orders per page

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
    const orderData = await Order.findById(req.query.orderId)
    const userData = await User.findById(orderData.user)

    await Order.updateOne({_id:req.query.orderId},{status:req.query.action})
    res.redirect('/admin/orders')
  }catch (error) {
    console.log(error.message);
  }
}

const updateOrderCancel = async (req, res) => {

  try {

      const foundOrder = await Order.findById(req.query.orderId);

      for (let i = 0; i < foundOrder.products.length; i++) {
          foundOrder.products[i].isCancelled = true
      }

      foundOrder.status = req.query.action

      await foundOrder.save();

      res.redirect("/admin/orders")
  } catch (error) {
      console.log(error.message);
  }

}

//sales report
const loadDashboard = async (req, res) => {
  try {
    const admin = await Admin.findOne({email:req.session.admin})
    const today = new Date()
    //calculate the start and end dates for this month
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // MongoDB aggregation pipeline to fetch the required data
    const pipeline = [
      {
          $match: {
              status:{
                  $nin:["Cancelled"]
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
                              $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                              $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                          },
                      },
                  },
                  { $count: 'count' },
              ],
              thisMonthsOrders: [
                  { $count: 'count' },
              ],
              thisMonthsTotalRevenue: [
                  { $group: { _id: null, total: { $sum: '$totalAmount' } } },
              ],
              totalCustomersThisMonth: [
                  {
                      $group: {
                          _id: '$user',
                      },
                  },
                  { $count: 'count' },
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
    thisMonthsOrders = ord.thisMonthsOrders[0] ? ord.thisMonthsOrders[0].count : 0;
    thisMonthsTotalRevenue = ord.thisMonthsTotalRevenue[0] ? ord.thisMonthsTotalRevenue[0].total : 0;
    totalCustomersThisMonth = ord.totalCustomersThisMonth[0] ? ord.totalCustomersThisMonth[0].count : 0;
  });

  // for charts
  const orderChartData = await Order.find({ status: 'Delivered' });
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
              case 'Cash on delivery': {
                  paymentMethod = 'cod';
                  break;
              };
              case 'Razorpay': {
                  paymentMethod = 'rzp';
                  break;
              };
              case 'Wallet': {
                  paymentMethod = 'wlt';
                  break;
              };
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
  res.render('admin/dashboard', {
    activePage: "dashboard",
    todaysOrders,
    thisMonthsOrders,
    thisMonthsTotalRevenue,
    totalCustomersThisMonth,
    paymentMethods,
    monthlyOrderCountsCurrentYear: resultArray,
    admin
});
  
  }catch (error) {
    console.log(error.message);
  }
}


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
  loadDashboard
 }

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

//cart
const loadShoppingCart = async (req, res) => {
    try {
      const user = await User.findById(req.session.user).populate("cart.product");
  
      // Filter out any cart items where the associated product is null
      user.cart = user.cart.filter((cartItem) => cartItem.product !== null);
  
      // Calculate the totalCartAmount based on the valid products in the cart
      user.totalCartAmount = user.cart.reduce((total, cartItem) => {
        return total + (cartItem.total || 0);
      }, 0);
  
      // Save the updated cart to the database
      await user.save();
  
      res.render("user/shoppingCart", {
        isLoggedIn,
        user: req.session.user,
        userData: user,
      });
    } catch (error) {
      console.log("Error loading shopping cart:", error);
      res.status(500).send("Internal Server Error");
    }
};

const addToCart = async (req, res) => {
    try {
      const productId = req.query.productId;
      const productData = await Product.findById(productId);
      let total = 0;
      if (productData.offer > 0) {
        total = productData.offerPrice;
      } else {
        total = productData.price;
      }
  
      const obj = {
        product: productData._id,
        quantity: 1,
        total,
      };
  
      const userData = await User.findById(req.session.user);
  
      const totalCartAmt = userData.totalCartAmount + total;
  
      await User.updateOne(
        { _id: req.session.user },
        { $set: { totalCartAmount: totalCartAmt } }
      );
  
      userData.cart.push(obj);
      await userData.save();
  
      res.redirect(`/productDetails?productId=${productData._id}`);
    } catch (error) {
      console.log(error.message);
    }
};

const updateCart = async (req, res) => {
    try {
      const currentUser = await User.findById(req.session.user);
  
      const cartItem = currentUser.cart.find((item) =>
        item.product.equals(new mongoose.Types.ObjectId(req.params.id))
      );
      if (cartItem) {
        const product = await Product.findById(cartItem.product);
  
        if (req.body.type === "increment") {
          if (cartItem.quantity + 1 > product.quantity) {
            return res.status(200).json({ message: "Stock limit exeeded" });
          } else {
            cartItem.quantity++;
          }
        } else {
          if (cartItem.quantity !== 1) {
            cartItem.quantity--;
          }
        }
  
        let insufficientStock = false;
        if (product.quantity < cartItem.quantity) {
          insufficientStock = true;
        }
  
        await currentUser.populate("cart.product");
  
        for (const item of currentUser.cart) {
          const currentProduct = await Product.findById(item.product);
          if (currentProduct.offer > 0) {
            item.total = item.quantity * currentProduct.offerPrice;
          } else {
            item.total = item.quantity * currentProduct.price;
          }
        }
  
        const grandTotal = currentUser.cart.reduce((total, element) => {
          if (element.product.offer > 0) {
            return total + element.quantity * element.product.offerPrice;
          } else {
            return total + element.quantity * element.product.price;
          }
        }, 0);
  
        currentUser.totalCartAmount = grandTotal;
  
        if (product.offer > 0) {
          var totalPrice = product.offerPrice * cartItem.quantity;
        } else {
          var totalPrice = product.price * cartItem.quantity;
        }
  
        await currentUser.save();
        return res.status(200).json({
          message: "Success",
          quantity: cartItem.quantity,
          totalPrice,
          grandTotal,
          stock: product.quantity,
          insufficientStock,
        });
      } else {
        return res
          .status(404)
          .json({ message: "Product not found in the user's cart." });
      }
    } catch (error) {
      console.log(error.message);
    }
};

const deleteItemFromCart = async (req, res) => {
    try {
      const userData = await User.findById(req.session.user);
  
      const cartId = req.query.cartId;
  
      let itemIndex = userData.cart.findIndex((item) =>
        item._id.equals(new ObjectId(cartId))
      );
      // Check if the item was found in the cart
      if (itemIndex !== -1) {
        userData.totalCartAmount -= userData.cart[itemIndex].total;
        userData.cart.splice(itemIndex, 1);
        await userData.save();
      }
  
      return res.redirect("/shoppingCart");
    } catch (error) {
      console.log(error.message);
    }
};

//checkout

const loadCheckout = async (req, res) => {
    try {
      const userData = await User.findById(req.session.user).populate(
        "cart.product"
      );
      const selectAddress = await Address.findOne({
        userId: req.session.user,
        default: true,
      });
      const allAddress = await Address.find({
        userId: req.session.user,
        default: false,
      });
      let errorMessage = "";
      if (req.query.error) {
        errorMessage = req.query.error;
      }
      res.render("user/checkout", {
        isLoggedIn,
        userData,
        selectAddress,
        allAddress,
        discount: 0,
        couponError: false,
        balance: false,
        currentCoupon: false,
        errorMessage,
      });
    } catch (error) {
      console.log(error.message);
    }
};

const loadEditAddressCheckout = async (req, res) => {
    try {
      const address = await Address.findById(req.query.id);
      res.render("user/checkoutEditAddress", { isLoggedIn, address });
    } catch (error) {
      console.log(error.message);
    }
};

const checkoutEditAddressPost = async (req, res) => {
    try {
      await Address.updateOne(
        { _id: req.body.id },
        {
          $set: {
            name: req.body.name,
            mobile: req.body.mobile,
            country: req.body.country,
            state: req.body.state,
            district: req.body.district,
            city: req.body.city,
            pincode: req.body.pincode,
            address: req.body.pincode,
          },
        }
      );
      res.redirect("/checkout");
    } catch (error) {
      console.log(error.message);
    }
};

const selectAddress = async (req, res) => {
    try {
      console.log(req.query.id);
  
      await Address.updateOne(
        { userId: req.session.user, default: true },
        { default: false }
      );
  
      await Address.updateOne({ _id: req.query.id }, { default: true });
  
      res.redirect("/checkout");
    } catch (error) {
      res.render("error/internalError", { error });
    }
};

const loadAddAddressCheckout = async (req, res) => {
    try {
      res.render("user/addAddressCheckout", { isLoggedIn });
    } catch (error) {
      console.log(error.message);
    }
};

const checkoutAddAddressPost = async (req, res) => {
    try {
      const { name, mobile, country, state, district, city, pincode, address } =
        req.body;
      //validate mobile for 10 digits
      if (!/^\d{10}$/.test(mobile)) {
        return res.render("user/addAddressCheckout", {
          user: req.session.user,
          error: "Mobile number should be 10 digits",
          isLoggedIn,
        });
      }
  
      const check = await Address.find({ userId: req.session.user });
      console.log(check);
  
      if (check.length0 > 0) {
        const addAddress = new Address({
          userId: req.session.user,
          name,
          mobile,
          country,
          state,
          district,
          city,
          pincode,
          address,
        });
        addAddress.save();
      } else {
        const addAddress = new Address({
          userId: req.session.user,
          name,
          mobile,
          country,
          state,
          district,
          city,
          pincode,
          address,
        });
        addAddress.save();
      }
      res.redirect("/checkout");
    } catch (error) {
      console.log(error.message);
    }
};

//orders
const orderProduct = async (req, res) => {
    try {
      const selectedPaymentOptions = req.body.paymentOptions;
      const discount = req.body.discount || 0;
  
      if (selectedPaymentOptions && selectedPaymentOptions !== undefined) {
        const userData = await User.findById(req.session.user).populate(
          "cart.product"
        );
  
        const selectAddress = await Address.findOne({
          userId: req.session.user,
          default: true,
        });
  
        const products = userData.cart.map((cartItem) => {
          return {
            product: cartItem.product, // Product reference
            quantity: cartItem.quantity, // Quantity
            total: cartItem.total,
          };
        });
  
        const order = new Order({
          user: req.session.user,
          products: products,
          totalAmount: req.body.totalAmount,
          paymentMethod: selectedPaymentOptions,
          deliveryAddress: {
            _id: selectAddress._id,
            userId: userData._id,
            name: selectAddress.name,
            mobile: selectAddress.mobile,
            country: selectAddress.country,
            state: selectAddress.state,
            district: selectAddress.district,
            city: selectAddress.city,
            pincode: selectAddress.pincode,
            address: selectAddress.address,
          },
        });
  
        if (selectedPaymentOptions === "Cash on delivery") {
          await order.save();
        } else if (selectedPaymentOptions === "Razorpay") {
          console.log("i am in razhorpay");
          console.log(userData);
          let amountUserHasToPay = 0;
          if (discount) {
            console.log(`Disccount amout is ${discount}`);
            amountUserHasToPay = (userData.totalCartAmount - discount) * 100;
          } else {
            amountUserHasToPay = userData.totalCartAmount * 100;
          }
          // Create a Razorpay order
          const razorpayOrder = await razorpay.orders.create({
            amount: amountUserHasToPay, // Total amount in paise
            currency: "INR", // Currency code (change as needed)
            receipt: `${Math.floor(Math.random() * 10000)
              .toString()
              .padStart(4, "0")}${Date.now()}`, // Provide a unique receipt ID
          });
          console.log("i am in razhorpay 2");
  
          // Save the order details to your database
          order.razorpayOrderId = razorpayOrder.id;
  
          // Redirect the user to the Razorpay checkout page
          return res.render("user/razorpay", {
            activePage: "shopingCart",
            order: razorpayOrder,
            key_id: process.env.RAZORPAY_ID_KEY,
            user: userData,
          });
        } else {
          console.log("i am in razhorpay 3");
  
          if (userData.wallet.balance < userData.totalCartAmount) {
            const errorMessage = "Insufficient wallet balance";
            return res.redirect(
              `/checkout?error=${encodeURIComponent(errorMessage)}`
            );
          } else {
            await order.save();
            userData.wallet.balance -= userData.totalCartAmount;
            const transactionData = {
              amount: userData.totalCartAmount,
              description: "Order placed.",
              type: "Debit",
            };
            userData.wallet.transactions.push(transactionData);
            // stock update
            for (let i = 0; i < userData.cart.length; i++) {
              const changeStock = await Product.findById(
                userData.cart[i].product
              );
  
              await Product.updateOne(
                { _id: changeStock._id },
                { stock: changeStock.stock - userData.cart[i].quantity }
              );
            }
  
            userData.cart = [];
            userData.totalCartAmount = 0;
          }
        }
  
        if (selectedPaymentOptions === "Wallet") {
          // stock update
          for (let i = 0; i < userData.cart.length; i++) {
            const changeStock = await Product.findById(userData.cart[i].product);
  
            await Product.updateOne(
              { _id: changeStock._id },
              { stock: changeStock.stock - userData.cart[i].quantity }
            );
          }
  
          userData.cart = [];
          userData.totalCartAmount = 0;
        }
  
        if (
          selectedPaymentOptions === "Razorpay" ||
          selectedPaymentOptions === "Cash on delivery"
        ) {
          // stock update
          for (let i = 0; i < userData.cart.length; i++) {
            const changeStock = await Product.findById(userData.cart[i].product);
            console.log(userData.cart[i].product, changeStock);
  
            await Product.updateOne(
              { _id: changeStock._id },
              { quantity: changeStock.quantity - userData.cart[i].quantity }
            );
          }
  
          userData.cart = [];
          userData.totalCartAmount = 0;
        }
        console.log("trying to find current coupon");
        const currentUsedCoupon = await userData.earnedCoupons.find((coupon) =>
          coupon.coupon.equals(req.body.currentCoupon)
        );
        if (currentUsedCoupon) {
          currentUsedCoupon.isUsed = true;
          await Coupon.findByIdAndUpdate(req.body.currentCoupon, {
            $inc: { usedCount: 1 },
          });
        }
  
        await userData.save();
        res.redirect(`/orderSuccess?orderId=${order._id}`);
      } else {
        const errorMessage = "Please select any payment option";
        res.redirect(`/checkout?error=${encodeURIComponent(errorMessage)}`);
      }
    } catch (error) {
      console.log(error.message);
    }
};

const saveRzpOrder = async (req, res) => {
    try {
      console.log("I am in save order");
      const { transactionId, orderId, signature } = req.body;
      const amount = parseInt(req.body.amount / 100);
      const currentUser = await User.findById(req.session.user).populate(
        "cart.product"
      );
      const deliveryAddress = await Address.findOne({
        userId: req.session.user,
        default: true,
      });
      if (transactionId && orderId && signature) {
        const orderedProducts = currentUser.cart.map((item) => {
          return {
            product: item.product,
            quantity: item.quantity,
            total: item.total,
          };
        });
  
        let newOrder = new Order({
          user: req.session.user,
          products: orderedProducts,
          totalAmount: amount,
          paymentMethod: "Razorpay",
          deliveryAddress,
        });
  
        await newOrder.save();
  
        // stock update
        for (let i = 0; i < currentUser.cart.length; i++) {
          const changeStock = await Product.findById(currentUser.cart[i].product);
          await Product.updateOne(
            { _id: changeStock._id },
            { quantity: changeStock.quantity - currentUser.cart[i].quantity }
          );
          await changeStock.save();
        }
  
        currentUser.cart = [];
        currentUser.totalCartAmount = 0;
  
        await currentUser.save();
  
        return res.status(200).json({
          message: "order placed successfully",
        });
      }
    } catch (error) {
      console.log(error.message);
    }
};



module.exports = {
    loadShoppingCart,
    addToCart,
    updateCart,
    deleteItemFromCart,
    loadCheckout,
    loadEditAddressCheckout,
    checkoutEditAddressPost,
    selectAddress,
    loadAddAddressCheckout,
    checkoutAddAddressPost,
    orderProduct,
    saveRzpOrder
}
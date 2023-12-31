const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const userOTPVerification = require("../models/userOtpVerification");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Category = require("../models/categoryModel");
const { ObjectId } = require("mongodb");
const Return = require("../models/returnProductModel");
const Cancel = require("../models/cancelProductModel");
const razorpay = require("../controllers/utils/razorpayConfig");
const Coupon = require("../models/couponModel");
const Admin = require("../models/adminModel");
const { response } = require("express");

let salt;

async function generateSalt() {
  salt = await bcrypt.genSalt(10);
}

generateSalt();

const loadHome = async (req, res) => {
  try {
    const userId = req.session.user;
    const products = await Product.find().populate("category");
    const user = isLoggedIn(req, res);
    // console.log(user);
    res.render("user/home", { isLoggedIn: user, commonError: "", products });
  } catch (error) {
    console.log(error.message);
  }
};

const loadShop = async (req, res) => {
  try {
    const userId = req.session.user;
    const products = await Product.find();
    const user = isLoggedIn(req, res);
    // console.log(user);
    res.render("user/shop", { isLoggedIn: user, commonError: "", products });
  } catch (error) {
    console.log(error.message);
  }
};

const loadProductDetails = async (req, res) => {
  try {
    const user = isLoggedIn(req, res);

    const userId = req.session.user;

    const productIdToCheck = req.query.productId;

    const check = await User.findOne({
      _id: userId,
      cart: { $elemMatch: { product: productIdToCheck } },
    });

    const productData = await Product.findById(productIdToCheck);

    console.log(check);

    if (check) {
      res.render("user/productDetails", {
        product: productData,
        isLoggedIn: user,
        message: "already exist in a cart",
      });
    } else {
      res.render("user/productDetails", {
        product: productData,
        isLoggedIn: user,
        message: "",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const login = async (req, res) => {
  try {
    res.render("user/login", {
      isLoggedIn: isLoggedIn(req, res),
      commonError: "",
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getSignUp = async (req, res) => {
  try {
    res.render("user/signup", {
      isLoggedIn: isLoggedIn(req, res),
      commonError: "",
    });
  } catch (error) {
    console.log(error.message);
  }
};

const signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      referralCode,
    } = req.body;
    if (
      firstName &&
      lastName &&
      email &&
      phone &&
      password &&
      confirmPassword
    ) {
      const code = referralCode.trim();
      const foundUser = await User.findOne({ email: email });

      if (foundUser) {
        res.render("user/signup", {
          isLoggedIn: isLoggedIn(req, res),
          commonError: "User already exist.",
        });
      } else {
        if (password === confirmPassword) {
          const hashPassword = await bcrypt.hash(password, salt);

          const newUser = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            password: hashPassword,
          });

          if (code !== "") {
            const admin = await Admin.find();
            console.log(admin);
            const amount = admin[0].referralAmount
            console.log(amount);
            const referdUser = await User.findOne({ referralCode: code });
            if (referdUser) {
              const transactionData = {
                amount: (amount * 20) / 100,
                description: `${referdUser.firstName} user reffered you ${
                  (amount * 20) / 100
                } credited your wallet`,
              };
              referdUser.wallet = (referdUser.wallet + amount);
              const transactionData1 = {
                amount: amount,
                description: `${newUser.firstName} is joined using for your referral code  amount ${amount} credited your wallet  `,
              };
              newUser.wallet = (amount * 20) / 100;
              referdUser.walletHistory.push(transactionData1);
              await referdUser.save();
              newUser.walletHistory.push(transactionData);
            }
          }

          await newUser.save();

          const savedUser = await User.findOne({ email });

          // sendOTPVerificationEmail(newUser); **salman changed**
          console.log(email);
          await sendOTPVerificationEmail(
            { _id: savedUser._id, email: email },
            res
          );
          res.render("user/otp", {
            isLoggedIn: isLoggedIn(req, res),
            userId: savedUser._id,
            commonError: "",
            email,
          });
        } else {
          res.render("user/signup", {
            isLoggedIn: isLoggedIn(req, res),
            commonError: "Password and confirm password didn't match.",
          });
        }
      }
    } else {
      res.render("user/signup", {
        isLoggedIn: isLoggedIn(req, res),
        commonError: "All fields are required.",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};
const isLoggedIn = (req, res) => {
  if (req.session.user) {
    return true;
  } else {
    return false;
  }
};
const signValidation = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.render("user/login", {
        commonError: "Please enter your email and password",
      });
      return; // Add a return statement to exit the function
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.render("user/login", { commonError: "User not found" });
      return; // Add a return statement to exit the function
    }

    if (user.blocked === true) {
      res.render("user/login", { commonError: "Your account is blocked" });
      return; // Add a return statement to exit the function
    }

    if (user.verified === false) {
      return res.render("user/login", {
        commonError: "Your account is not verified",
      });
    }

    const equalPassword = await bcrypt.compare(password, user.password);

    if (equalPassword) {
      req.session.user = user._id;
      res.redirect("/");
    } else {
      res.render("user/login", { commonError: "Password is incorrect..!" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//send email models
let transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "cozasttore@gmail.com",
    pass: "cnbw ghyy qeln vtow",
  },
});

//send otp verification email

const sendOTPVerificationEmail = async ({ _id, email }, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    console.log("email" + email);
    //Mail options
    const mailOption = {
      from: "cozasttore@gmail.com", // Use the correct environment variable
      to: email,
      subject: "Verify Your Email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the verification</p>
             <p>This code <b>expires in 1 hour</b>.</p>`,
    };

    // Hash the OTP
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);
    const newOTPVerification = new userOTPVerification({
      userId: _id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expireAt: Date.now() + 3600000,
    });

    //save otp record
    await userOTPVerification.deleteMany({ userId: _id });

    await newOTPVerification.save();
    //send email
    await transporter.sendMail(mailOption);

    //send a single response at the end of the try block
  } catch (error) {
    //handle errors and send an error response
    console.error(error);
    res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
};

const checkOtp = async (req, res) => {
  try {
    const id = req.body.userId;
    const email = req.body.email;
    const otp = req.body.otp;
    const user = await userOTPVerification.findOne({ userId: id });

    if (!user) {
      return res.render("user/otp", {
        commonError: "User not found",
        userId: id,
        email: email,
      });
    }

    const currentDate = Date.now();

    if (user.expiresAt < currentDate) {
      return res.render("user/otp", {
        commonError: "OTP expired",
        userId: id,
        email: email,
      });
    }
    const hashedOTP = user.otp;
    const validOtp = await bcrypt.compare(otp, hashedOTP);
    if (!validOtp) {
      return res.render("user/otp", {
        commonError: "Entered OTP is invalid",
        userId: id,
        email: email,
      });
    }
    await User.findByIdAndUpdate(id, { $set: { verified: true } });
    // Assuming successful OTP validation, you can redirect to the "/login" route
    return res.redirect("/login");
  } catch (error) {
    console.log(error.message);
    // Handle the error appropriately, e.g., by rendering an error page or sending an error response
    return res.render("error", { commonError: "An error occurred" });
  }
};
//cart

// const loadShoppingCart = async (req, res) => {
//   try {
//     const userData = await User.findById(req.session.user).populate(
//       "cart.product"
//     );

//     res.render("user/shoppingCart", {
//       isLoggedIn,
//       user: req.session.user,
//       userData,
//     });
//   } catch (error) {
//     console.log("here");
//     console.log(error);
//     console.log("here");
//   }
// };

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

//about
const loadAbout = async (req, res) => {
  try {
    var isLog = false;
    if (req.session.user) {
      isLog = true;
    }
    res.render("user/about", { isLoggedIn: isLog });
  } catch (error) {
    console.log(error.message);
  }
};
//contact
const loadContact = async (req, res) => {
  try {
    var isLog = false;
    if (req.session.user) {
      isLog = true;
    }
    res.render("user/contact", { isLoggedIn: isLog });
  } catch (error) {
    console.log(error.message);
  }
};

//user profile
const loadProfile = async (req, res) => {
  try {
    const userProfile = await User.findById(req.session.user);
    const userAddress = await Address.find({ userId: req.session.user });
    res.render("user/profile", {
      user: req.session.user,
      userProfile,
      userAddress,
      isLoggedIn,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const updateProfilePhoto = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.session.user },
      { $set: { profile: req.body.image } }
    );

    res.redirect("/profile");
  } catch (error) {
    res.render("error/internalError", { error });
  }
};

const deleteProfilePhoto = async (req, res) => {
  try {
    await User.updateOne({ _id: req.session.user }, { $set: { profile: "" } });

    res.redirect("/profile");
  } catch (error) {
    res.render("error/internalError", { error });
  }
};

const loadEditProfile = async (req, res) => {
  try {
    const userData = await User.findById(req.query.id);
    res.render("user/editProfile", { userData });
  } catch (error) {
    console.log(error.message);
  }
};

const editProfile = async (req, res) => {
  try {
    const { id, firstName, lastName, email, phone } = req.body;
    await User.updateOne(
      { _id: id },
      {
        $set: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
        },
      }
    );
    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
  }
};

//address
const addAddress = async (req, res) => {
  try {
    res.render("user/add-address", { isLoggedIn });
  } catch (error) {
    console.log(error.message);
  }
};

const addAddressPost = async (req, res) => {
  try {
    const { name, mobile, country, state, district, city, pincode, address } =
      req.body;
    //validate mobile for 10 digits
    if (!/^\d{10}$/.test(mobile)) {
      return res.render("user/add-address", {
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
    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const findAddress = await Address.findOne({ _id: id });
    res.render("user/edit-address", { isLoggedIn, findAddress });
  } catch (error) {
    console.log(error.message);
  }
};

const editAddressPost = async (req, res) => {
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
    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    await Address.deleteOne({ _id: req.query.id });
    res.redirect("/profile");
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

//changePassword
const loadPassword = async (req, res) => {
  try {
    const userProfile = await User.findById(req.session.user);
    res.render("user/changeUserPass", { isLoggedIn, userProfile });
  } catch (error) {
    console.log(error.message);
  }
};
const ChangePass = async (req, res) => {
  try {
    const { id, oldPassword, newPassword } = req.body;

    const userProfile = await User.findById(id);

    const passwordMatch = await bcrypt.compare(
      oldPassword,
      userProfile.password
    );

    if (passwordMatch) {
      const hashPassword = await bcrypt.hash(newPassword, salt);
      console.log(hashPassword);
      await User.updateOne({ _id: id }, { $set: { password: hashPassword } });

      return res.redirect("/profile");
    } else {
      return res.render("user/changeUserPass", {
        isLoggedIn,
        userProfile,
        error: "Your old password is incorrect",
      });
    }
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

const resendOTP = async (req, res) => {
  try {
    console.log(req.body);
    sendOTPVerificationEmail(req.body, res);
    return res.render("user/otp", {
      userId: req.body._id,
      commonError: "Otp sended",
      email: req.body.email,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//forgotPassword
const forgotPassword = async (req, res) => {
  try {
    res.render("user/forgotPassword");
  } catch (error) {
    console.log(error.message);
  }
};

const loadOTPForgetPass = async (req, res) => {
  try {
    if (!req.body.email)
      return res.render("user/forgotPassword", {
        message: "email should be filled",
      });
    const userData = await User.findOne({ email: req.body.email });
    if (userData) {
      if (userData.email === req.body.email) {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

        // mail options
        const mailOptions = {
          from: process.env.EMAIL,
          to: userData.email,
          subject: "Verify Your Email",
          html: `<p>Enter <b>${otp}</b> in the website verify your email address to forget password process</p>
                  <p>This code <b>expire in 1 minutes</b>.</p>`,
        };

        // hash the otp
        const saltRounds = 10;

        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        const newOTPVerification = await new userOTPVerification({
          userId: userData._id,
          otp: hashedOTP,
          createdAt: Date.now(),
          expiresAt: Date.now() + 3600000,
        });

        // save otp record
        await newOTPVerification.save();
        await transporter.sendMail(mailOptions);

        res.redirect(`/verifyOTPForgetPass?userId=${userData._id}`);
      } else {
        res.render("user/forgotPassword", { message: "email is incorrect" });
      }
    } else {
      res.render("user/forgotPassword", { message: "email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadOTPForgetPassPage = async (req, res) => {
  try {
    res.render("user/forgetPass-otp", { userId: req.query.userId });
  } catch (error) {
    console.log(error.message);
  }
};
const verifyOTPForgetPassPage = async (req, res) => {
  try {
    console.log(req.body);
    let { otp, userId } = req.body;
    if (!userId || !otp) {
      res.render("user/forgetPass-otp", {
        message: `Empty otp details are not allowed`,
        userId,
      });
    } else {
      const UserOTPVerificationRecords = await userOTPVerification.find({
        userId,
      });

      if (UserOTPVerificationRecords.length <= 0) {
        //no record found
        res.render("user/forgetPass-otp", {
          message: "Account record doesn't exist . Please sign up",
          userId,
        });
      } else {
        //user otp records exists
        const { expiresAt } =
          UserOTPVerificationRecords[UserOTPVerificationRecords.length - 1];
        const hashedOTP =
          UserOTPVerificationRecords[UserOTPVerificationRecords.length - 1].otp;

        if (expiresAt < Date.now()) {
          //user otp records has expires
          await userOTPVerification.deleteMany({ userId });
          res.render("user/forgetPass-otp", {
            message: "Code has expires. Please request again.",
            userId,
          });
        } else {
          const validOTP = await bcrypt.compare(otp, hashedOTP);

          if (!validOTP) {
            //supplied otp is wrong
            res.render("user/forgetPass-otp", {
              message: "Invalid OTP. Check your Email.",
              userId,
            });
          } else {
            //success
            await userOTPVerification.deleteMany({ userId });
            res.render("user/changePass", { userId });
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};
const changePassFor = async (req, res) => {
  try {
    let { userId, password } = req.body;
    if (!userId || !password) {
      res.render("users/changePass", {
        message: `Empty password is not allowed`,
        userId,
      });
    } else {
      const UserOTPVerificationRecords = await User.find({
        _id: userId,
      });
      if (UserOTPVerificationRecords.length <= 0) {
        //no record found
        res.render("users/changePass", {
          message: `Account record doesn't exist . Please sign up`,
          userId,
        });
      } else {
        //success
        const spassword = await bcrypt.hash(password, salt);
        await User.updateOne(
          { _id: userId },
          { $set: { password: spassword } }
        );
        await userOTPVerification.deleteMany({ userId });

        res.render("user/login", { commonError: "Password is changed" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

//coupons
const getCoupons = async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user).populate(
      "earnedCoupons.coupon"
    );
    const allCoupons = await Coupon.find({ isActive: true });
    const earnedCoupons = currentUser.earnedCoupons;

    // Convert the list of earned coupon IDs to an array
    const earnedCouponIds = earnedCoupons.map((coupon) =>
      coupon.coupon._id.toString()
    );
    // Filter out earned coupons from the active coupons list
    const remainingCoupons = allCoupons.filter(
      (coupon) => !earnedCouponIds.includes(coupon._id.toString())
    );

    res.render("user/coupons", {
      activePage: "profile",
      user: req.session.user,
      isLoggedIn,
      currentUser,
      allCoupons: remainingCoupons,
      earnedCoupons,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const applyCoupon = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user).populate(
      "earnedCoupons.coupon"
    );
    await userData.populate("cart.product");
    await userData.populate("cart.product.category");
    const cartProducts = userData.cart;
    const selectAddress = await Address.findOne({
      userId: req.session.user,
      default: true,
    });
    const allAddress = await Address.find({
      userId: req.session.user,
      default: false,
    });
    const currentCoupon = await Coupon.findOne({ code: req.body.coupon });
    const grandTotal = cartProducts.reduce((total, element) => {
      return total + element.total;
    }, 0);
    let couponError = "";
    let discount = 0;
    const errorMessage = req.query.error;
    if (currentCoupon) {
      const foundCoupon = userData.earnedCoupons.find((coupon) =>
        coupon.coupon._id.equals(currentCoupon._id)
      );
      if (foundCoupon) {
        if (foundCoupon.coupon.isActive) {
          if (!foundCoupon.isUsed) {
            if (foundCoupon.coupon.discountType === "fixedAmount") {
              if (foundCoupon.coupon.discountAmount > grandTotal) {
                couponError = "Your total is less than coupon amount.";
              } else {
                discount = foundCoupon.coupon.discountAmount;
              }
            } else {
              discount = (foundCoupon.coupon.discountAmount / 100) * grandTotal;
            }
          } else {
            couponError = foundCoupon.isUsed
              ? "Coupon already used."
              : "Coupon is inactive.";
          }
        } else {
          couponError = foundCoupon.isUsed
            ? "Coupon already used."
            : "Coupon is inactive.";
        }
      } else {
        couponError = "Invalid coupon code.";
      }
    } else {
      couponError = "Invalid coupon code.";
    }

    res.render("user/checkout", {
      activePage: "shopingCart",
      user: req.session.user,
      userData,
      isLoggedIn,
      cartProducts,
      selectAddress,
      allAddress,
      discount,
      grandTotal,
      currentCoupon: couponError ? "" : currentCoupon._id,
      couponError,
      errorMessage,
      error: "",
    });
  } catch (error) {
    console.log(error.message);
  }
};

//wallet
const loadWallet = async (req, res) => {
  try {
    const userWallet = await User.findById(req.session.user);
    const walletAmount = userWallet.wallet;
    const walletHistory = userWallet.walletHistory;
    res.render("user/wallet", { isLoggedIn, walletAmount, walletHistory });
  } catch (error) {
    console.log(error.message);
  }
};

const generateCode = async (req, res) => {
  try {
    const length = 10;
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomCode = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomCode += characters.charAt(randomIndex);
    }

    const findUser = await User.findByIdAndUpdate(req.session.user, {
      referralCode: randomCode,
    });
    if (findUser) {
      return res.redirect("/profile");
    } else {
      return res.redirect("/login");
    }

    // Redirect with randomCode as a query parameter
    // res.redirect('/profile?randomCode=' + encodeURIComponent(randomCode));
  } catch (error) {
    +console.log(error.message);
  }
};

module.exports = {
  loadHome,
  loadShop,
  login,
  getSignUp,
  signUp,
  loadLogout,
  signValidation,
  checkOtp,
  loadProductDetails,
  loadShoppingCart,
  addToCart,
  updateCart,
  loadProfile,
  updateProfilePhoto,
  deleteProfilePhoto,
  addAddress,
  addAddressPost,
  loadEditAddress,
  editAddressPost,
  deleteAddress,
  deleteItemFromCart,
  loadCheckout,
  loadEditAddressCheckout,
  checkoutEditAddressPost,
  selectAddress,
  loadAddAddressCheckout,
  checkoutAddAddressPost,
  orderProduct,
  loadOrder,
  cancelOrder,
  loadPassword,
  ChangePass,
  loadEditProfile,
  editProfile,
  resendOTP,
  forgotPassword,
  loadOTPForgetPass,
  loadOTPForgetPassPage,
  verifyOTPForgetPassPage,
  changePassFor,
  loadOrderSuccess,
  getCancelProductForm,
  requestCancelProduct,
  getReturnProductForm,
  requestReturnProduct,
  saveRzpOrder,
  loadAbout,
  loadContact,
  getCoupons,
  applyCoupon,
  loadWallet,
  generateCode,
};

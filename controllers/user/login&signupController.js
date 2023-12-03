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

let salt;

async function generateSalt() {
  salt = await bcrypt.genSalt(10);
}

generateSalt();


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



  module.exports = {
    login,
    getSignUp,
    signUp,
    loadLogout,
    isLoggedIn,
    signValidation,
    checkOtp,
    resendOTP,
    forgotPassword,
    loadOTPForgetPass,
    loadOTPForgetPassPage,
    verifyOTPForgetPassPage,
    changePassFor
    
  }


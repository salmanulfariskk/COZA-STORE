const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const userOTPVerification = require("../models/userOtpVerification");
const Product = require("../models/productModel");

let salt;

async function generateSalt() {
  salt = await bcrypt.genSalt(10);
}

generateSalt();

const loadHome = async (req, res) => {
  try {
    const userId = req.session.user;
    const products = await Product.find()
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
    const products = await Product.find()
    const user = isLoggedIn(req, res);
    // console.log(user);
    res.render("user/shop", { isLoggedIn: user, commonError: "", products });
  } catch (error) {
    console.log(error.message);
  }
};

const loadProductDetails = async (req, res) => {
  try {
    console.log(req.query.productId);
    const product = await Product.findById(req.query.productId);
    console.log(product);
    const user = isLoggedIn(req, res);
    res.render("user/productDetails", { isLoggedIn: user, product })
    
  } catch (error) {
    console.log(error.message);
  }
}

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

const  getSignUp = async (req, res) => {
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
    const { firstName, lastName, email, phone, password, confirmPassword } =
      req.body;
    if (
      firstName &&
      lastName &&
      email &&
      phone &&
      password &&
      confirmPassword
    ) {
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

          await newUser.save();

          const savedUser = await User.findOne({ email });

          req.session.user = savedUser._id;
           sendOTPVerificationEmail(newUser)
          res.render("user/otp", { isLoggedIn: isLoggedIn(req, res) ,userId:savedUser._id,commonError:""});
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
    if(!email&&!password){
      res.render('user/login',{commonError:"Please enter your email and password"})
    }
    const user = await User.findOne({ email });
    if(user.blocked===true){
      res.render('user/login',{commonError:"Your account is blocked"})
    }
    
    if (!user) {
      res.render("user/login", { commonError: "user not found" });
    } else {
      const equalPassword = await bcrypt.compare(password, user.password);
      if (equalPassword) {
        req.session.user = user._id;
        res.redirect("/");
      } else {
        res.render("user/login", { commonError: "password is incorrect..!" });
      }
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
    user: "cozasttore@gmail.com" ,
    pass: 'cnbw ghyy qeln vtow',
  },
});

//send otp verification email

const sendOTPVerificationEmail = async ({ _id, email }, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    //Mail options
    const mailOption = {
      from:"cozasttore@gmail.com"  , // Use the correct environment variable
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
    console.log("here");
    //send email
    await transporter.sendMail(mailOption);
    console.log("here");

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
    const otp = req.body.otp;
    const user = await userOTPVerification.findOne({ userId: id });

    if (!user) {
      return res.render("user/otp", { commonError: "User not found" ,userId:id});
    }

    const currentDate = Date.now();

    if (user.expiresAt < currentDate) {
      return res.render("user/otp", { commonError: "OTP expired",userId:id });
    }
    const hashedOTP = user.otp
    const validOtp = await bcrypt.compare(otp, hashedOTP);
    if (!validOtp) {
      return res.render("user/otp", { commonError: "Entered OTP is invalid" ,userId:id});
    }
    await User.findByIdAndUpdate(id,{$set:{verified:true}});
    // Assuming successful OTP validation, you can redirect to the "/login" route
    return res.redirect("/login");
  } catch (error) {
    console.log(error.message);
    // Handle the error appropriately, e.g., by rendering an error page or sending an error response
    return res.render("error", { commonError: "An error occurred" });
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
  loadProductDetails
};

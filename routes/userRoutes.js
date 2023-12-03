const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/userControllers");
const Product = require("../models/productModel");
const auth = require('../middlewares/auth')
const middlewares = require('../middlewares/imageUpload')

//new edits
const loginSignupControllers = require('../controllers/user/login&signupController')
const homeControllers = require('../controllers/user/homeController')
const profileControllers = require('../controllers/user/profileController')
const cartCheckoutControllers = require('../controllers/user/cart&CheckoutController')
const orderControllers = require('../controllers/user/orderController')

//home
router.get("/",homeControllers.loadHome);
router.get("/shop",homeControllers.loadShop);
router.get('/productDetails',homeControllers.loadProductDetails)
//about
router.get('/about',homeControllers.loadAbout)
//contact
router.get('/contact',homeControllers.loadContact)

// login
router.get("/login",auth.isLogout, loginSignupControllers.login);
router.get('/logout',loginSignupControllers.loadLogout)
router.route("/register").get(loginSignupControllers.getSignUp).post(loginSignupControllers.signUp);
router.post("/otp-valid", loginSignupControllers.checkOtp)
router.post('/login',loginSignupControllers.signValidation)

//forgotPassword
router.get('/forgot-password',auth.isLogout,loginSignupControllers.forgotPassword)
router.post('/forgot-password',auth.isLogout,loginSignupControllers.loadOTPForgetPass)
router.get('/verifyOTPForgetPass',auth.isLogout,loginSignupControllers.loadOTPForgetPassPage)
router.post('/verifyOTPForgetPass',auth.isLogout,loginSignupControllers.verifyOTPForgetPassPage)
router.post('/changePass',auth.isLogout,loginSignupControllers.changePassFor)

//resendOtp
router.post('/resend-otp',loginSignupControllers.resendOTP)

// cart
router.get('/addToCart', auth.isLogin,cartCheckoutControllers.addToCart)
router.get('/shoppingCart', auth.isLogin,cartCheckoutControllers.loadShoppingCart)
router.post("/update-cart/:id", auth.isLogin,cartCheckoutControllers.updateCart)
router.get('/deleteItem',auth.isLogin,cartCheckoutControllers.deleteItemFromCart)
router.post('/checkIfProductExists', async (req, res) => {
    console.log(req.body);

    try {
        for (const element of req.body.productData) {
            console.log(element.productId);
            const productIsThere = await Product.findById(element.productId);
            if (!productIsThere) {
                res.status(404).json({ productExists: false });
                return;
            }
        }

        res.status(200).json({ productExists: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//checkout
router.get('/checkout',auth.isLogin,cartCheckoutControllers.loadCheckout)
router.get('/edit-address-checkout',auth.isLogin,cartCheckoutControllers.loadEditAddressCheckout)
router.post('/checkoutEditAddressPost',auth.isLogin,cartCheckoutControllers.checkoutEditAddressPost)
router.get('/select-address',auth.isLogin,cartCheckoutControllers.selectAddress)
router.get('/add-address-checkout',auth.isLogin,cartCheckoutControllers.loadAddAddressCheckout)
router.post('/checkoutAddAddressPost',auth.isLogin,cartCheckoutControllers.checkoutAddAddressPost)

//orders
router.post('/order-product',auth.isLogin,cartCheckoutControllers.orderProduct)
router.post("/save-rzporder", auth.isLogin, cartCheckoutControllers.saveRzpOrder)


//profile
router.get('/profile',auth.isLogin,profileControllers.loadProfile)
router.patch('/profile/editPhoto', auth.isLogin, middlewares.uploadProfileImage, middlewares.resizeProfileImage, profileControllers.updateProfilePhoto)
router.get("/profile/deletePhoto", auth.isLogin, profileControllers.deleteProfilePhoto)
router.get("/edit-profile", auth.isLogin,profileControllers.loadEditProfile )
router.post("/edit-profile",auth.isLogin,profileControllers.editProfile)

//address
router.get("/add-address", auth.isLogin,profileControllers.addAddress)
router.post('/add-address', auth.isLogin, profileControllers.addAddressPost)
router.get('/editAddress',auth.isLogin,profileControllers.loadEditAddress)
router.post('/editAddressPost',auth.isLogin,profileControllers.editAddressPost)
router.get('/deleteAddress',auth.isLogin,profileControllers.deleteAddress)

//password
router.get('/change-password', auth.isLogin, profileControllers.loadPassword)
router.post('/change-password', auth.isLogin, profileControllers.ChangePass)

//Coupons
router.get("/coupons", auth.isLogin, profileControllers.getCoupons)
router.post("/apply-coupon", auth.isLogin, profileControllers.applyCoupon)

//wallet
router.get("/wallet", auth.isLogin, profileControllers.loadWallet)

//referral
router.post("/generateReferralCode",auth.isLogin,profileControllers.generateCode)


//orders list
router.get('/order',auth.isLogin,orderControllers.loadOrder)
// router.post('/cancel-order',auth.isLogin,userControllers.cancelOrder)
router.get('/cancel-order',auth.isLogin,orderControllers.getCancelProductForm)
router.post('/cancel-order',auth.isLogin,orderControllers.requestCancelProduct)
router.get('/orderSuccess',auth.isLogin,orderControllers.loadOrderSuccess)
router.get('/return-product',auth.isLogin,orderControllers.getReturnProductForm)
router.post('/return-product',auth.isLogin,orderControllers.requestReturnProduct)


module.exports = router;

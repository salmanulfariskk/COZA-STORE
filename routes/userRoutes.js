const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/userControllers");

const auth = require('../middlewares/auth')

const middlewares = require('../middlewares/imageUpload')

router.get("/",userControllers.loadHome);
router.get("/shop",userControllers.loadShop);
router.get('/productDetails',userControllers.loadProductDetails)

// login
router.get("/login",auth.isLogout, userControllers.login);
router.get('/logout',userControllers.loadLogout)
router.route("/register").get(userControllers.getSignUp).post(userControllers.signUp);
router.post("/otp-valid", userControllers.checkOtp)
router.post('/login',userControllers.signValidation)

//forgotPassword
router.get('/forgot-password',auth.isLogout,userControllers.forgotPassword)
router.post('/forgot-password',auth.isLogout,userControllers.loadOTPForgetPass)
router.get('/verifyOTPForgetPass',auth.isLogout,userControllers.loadOTPForgetPassPage)
router.post('/verifyOTPForgetPass',auth.isLogout,userControllers.verifyOTPForgetPassPage)
router.post('/changePass',auth.isLogout,userControllers.changePassFor)

// cart
router.get('/addToCart', auth.isLogin,userControllers.addToCart)
router.get('/shoppingCart', auth.isLogin,userControllers.loadShoppingCart)
router.post("/update-cart/:id", auth.isLogin,userControllers.updateCart)
router.get('/deleteItem',auth.isLogin,userControllers.deleteItemFromCart)

//profile
router.get('/profile',auth.isLogin,userControllers.loadProfile)
router.patch('/profile/editPhoto', auth.isLogin, middlewares.uploadProfileImage, middlewares.resizeProfileImage, userControllers.updateProfilePhoto)
router.get("/profile/deletePhoto", auth.isLogin, userControllers.deleteProfilePhoto)
router.get("/edit-profile", auth.isLogin,userControllers.loadEditProfile )
router.post("/edit-profile",auth.isLogin,userControllers.editProfile)

//password
router.get('/change-password', auth.isLogin, userControllers.loadPassword)
router.post('/change-password', auth.isLogin, userControllers.ChangePass)


//address
router.get("/add-address", auth.isLogin,userControllers.addAddress)
router.post('/add-address', auth.isLogin, userControllers.addAddressPost)
router.get('/editAddress',auth.isLogin,userControllers.loadEditAddress)
router.post('/editAddressPost',auth.isLogin,userControllers.editAddressPost)
router.get('/deleteAddress',auth.isLogin,userControllers.deleteAddress)


//checkout
router.get('/checkout',auth.isLogin,userControllers.loadCheckout)
router.get('/edit-address-checkout',auth.isLogin,userControllers.loadEditAddressCheckout)
router.post('/checkoutEditAddressPost',auth.isLogin,userControllers.checkoutEditAddressPost)
router.get('/select-address',auth.isLogin,userControllers.selectAddress)
router.get('/add-address-checkout',auth.isLogin,userControllers.loadAddAddressCheckout)
router.post('/checkoutAddAddressPost',auth.isLogin,userControllers.checkoutAddAddressPost)


//orders
router.post('/order-product',auth.isLogin,userControllers.orderProduct)
router.get('/order',auth.isLogin,userControllers.loadOrder)
// router.post('/cancel-order',auth.isLogin,userControllers.cancelOrder)
router.get('/cancel-order',auth.isLogin,userControllers.getCancelProductForm)
router.post('/cancel-order',auth.isLogin,userControllers.requestCancelProduct)
router.get('/orderSuccess',auth.isLogin,userControllers.loadOrderSuccess)
router.get('/return-product',auth.isLogin,userControllers.getReturnProductForm)
router.post('/return-product',auth.isLogin,userControllers.requestReturnProduct)

//resendOtp
router.post('/resend-otp',userControllers.resendOTP)



module.exports = router;

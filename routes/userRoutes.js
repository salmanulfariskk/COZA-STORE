const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/userControllers");

const auth = require('../middlewares/auth')


router.get("/",userControllers.loadHome);
router.get("/shop",userControllers.loadShop);
router.get("/login",auth.isLogout, userControllers.login);
router.get('/logout',userControllers.loadLogout)
router.post('/login',userControllers.signValidation)
router.get('/productDetails',userControllers.loadProductDetails)


router.route("/register").get(userControllers.getSignUp).post(userControllers.signUp);
router.post("/otp-valid", userControllers.checkOtp)

module.exports = router;

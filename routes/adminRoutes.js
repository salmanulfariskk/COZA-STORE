const express = require("express");
const router = express.Router();
const adminControllers = require("../controllers/adminControllers");
const auth = require("../middlewares/auth");

const ImageMiddleware = require('../middlewares/imageUpload')

//new edit
const loginLogoutController = require('../controllers/admin/loginLogoutController')
const userControllers = require('../controllers/admin/userController')
const categoryControllers = require('../controllers/admin/categoryController');
const productControllers = require('../controllers/admin/productController');
const orderControllers = require('../controllers/admin/orderController');
const dashboardAndSalesReportControllers = require('../controllers/admin/dashboard&SalesReportController');
const couponControllers = require('../controllers/admin/couponController');
const referralControllers = require('../controllers/admin/referralController');


//login logout
router.get("/login", loginLogoutController.adminLogin);
router.post("/login", loginLogoutController.adminSession);
//logout
router.get("/logout",auth.adminLogin,loginLogoutController.logout)

//user
router.get("/users",auth.adminLogin,userControllers.adminUsers)
router.get("/users/unblock-theUser",auth.adminLogin,userControllers.UnblockTheUser)
router.get("/users/unblock-theUser",auth.adminLogin,userControllers.UnblockTheUser)
router.get("/users/block-theUser",auth.adminLogin,userControllers.blockTheUser)

//category
router.get("/category",auth.adminLogin,categoryControllers.loadCategory)
router.get("/category/add-category",auth.adminLogin,categoryControllers.loadAddCategory)
router.post("/category/add-category",auth.adminLogin,categoryControllers.AddCategory)
router.get("/category/edit-category",auth.adminLogin,categoryControllers.editCategory)
router.get("/category/delete-category",auth.adminLogin,categoryControllers.deleteCategory);
router.post("/category/edit-category",auth.adminLogin,categoryControllers.postEditCategory)

//product
router.get("/products",auth.adminLogin,productControllers.loadProducts)
router.get("/products/add-product",auth.adminLogin,productControllers.addProduct)
router.post("/products/add-product",auth.adminLogin,ImageMiddleware.uploadProductImages, ImageMiddleware.resizeProductImages,productControllers.addProductPost)
router.get("/products/delete-product",auth.adminLogin,productControllers.deleteProduct)
router.get("/products/edit-product",auth.adminLogin,productControllers.loadEditProduct)
router.post("/products/edit-product",auth.adminLogin,productControllers.editProduct)
router.delete("/products/:id/img/delete",auth.adminLogin,productControllers .destroyProductImage)
router.patch("/products/:id/img/add",auth.adminLogin,ImageMiddleware.uploadProductImages, ImageMiddleware.resizeProductImages, productControllers.updateProductImages)

//order
router.get('/orders',auth.adminLogin,orderControllers.loadOrder)
router.get('/order/action-update',auth.adminLogin,orderControllers.updateActionOrder)
router.get('/order-cancel',auth.adminLogin,orderControllers.updateOrderCancel)
router.get('/return-requests',auth.adminLogin,orderControllers.getReturnRequests)
router.post('/return-requests',auth.adminLogin,orderControllers.returnRequestAction)
router.get('/cancel-requests',auth.adminLogin,orderControllers.getCancelRequests)
router.post("/cancel-requests", auth.adminLogin, orderControllers.returnCancelAction)


//dashBoard
router.get("/dashboard", auth.adminLogin, dashboardAndSalesReportControllers.loadDashboard);
//sales report 
router.get('/sales-report',auth.adminLogin,dashboardAndSalesReportControllers.loadSalesReport)
router.post('/sales-report',auth.adminLogin,dashboardAndSalesReportControllers.loadSalesReport)


// router.get("/category",auth.adminLogin,adminControllers.loadCategory)


//coupons
router.get("/coupons",auth.adminLogin,couponControllers.loadCoupons)
router.get("/new-coupon",auth.adminLogin,couponControllers.getAddNewCoupon)
router.post("/new-coupon",auth.adminLogin,couponControllers.addNewCoupon)
router.patch("/coupons/action/:id",auth.adminLogin,couponControllers.couponAction)

//referral
router.get("/referral",auth.adminLogin,referralControllers.loadReferral)
router.post("/addReferral",auth.adminLogin,referralControllers.addReferral)



// router.get("/", checkAuth, getDashboard);
// router.route("/login").get(isLoggedIn, getLogin).post(loginAdmin);

module.exports = router;
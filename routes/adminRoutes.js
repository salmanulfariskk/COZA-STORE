const express = require("express");
const router = express.Router();
const adminControllers = require("../controllers/adminControllers");
const auth = require("../middlewares/auth");

const ImageMiddleware = require('../middlewares/imageUpload')

//get
router.get("/login", adminControllers.adminLogin);
router.get("/dashboard", auth.adminLogin, adminControllers.loadDashboard);
router.get("/users",auth.adminLogin,adminControllers.adminUsers)
router.get("/users/unblock-theUser",auth.adminLogin,adminControllers.UnblockTheUser)
router.get("/users/block-theUser",auth.adminLogin,adminControllers.blockTheUser)
router.get("/category",auth.adminLogin,adminControllers.loadCategory)
router.get("/category/add-category",auth.adminLogin,adminControllers.loadAddCategory)
router.get("/category/edit-category",auth.adminLogin,adminControllers.editCategory)
router.get("/category/delete-category",auth.adminLogin,adminControllers.deleteCategory);
router.get("/products",auth.adminLogin,adminControllers.loadProducts)
router.get("/products/add-product",auth.adminLogin,adminControllers.addProduct)
router.get("/products/delete-product",auth.adminLogin,adminControllers.deleteProduct)
router.get("/products/edit-product",auth.adminLogin,adminControllers.loadEditProduct)


//post
router.post("/login", adminControllers.adminSession,);
router.post("/category/add-category",auth.adminLogin,adminControllers.AddCategory)
router.post("/category/edit-category",auth.adminLogin,adminControllers.postEditCategory)
router.post("/products/add-product",auth.adminLogin,ImageMiddleware.uploadProductImages, ImageMiddleware.resizeProductImages,adminControllers.addProductPost)
router.post("/products/edit-product",auth.adminLogin,adminControllers.editProduct)
router.delete("/products/:id/img/delete",auth.adminLogin,adminControllers .destroyProductImage)
router.patch("/products/:id/img/add",auth.adminLogin,ImageMiddleware.uploadProductImages, ImageMiddleware.resizeProductImages, adminControllers.updateProductImages)


//orders
router.get('/orders',auth.adminLogin,adminControllers.loadOrder)
router.get('/order/action-update',auth.adminLogin,adminControllers.updateActionOrder)
router.get('/order-cancel',auth.adminLogin,adminControllers.updateOrderCancel)
router.get('/return-requests',auth.adminLogin,adminControllers.getReturnRequests)
router.post('/return-requests',auth.adminLogin,adminControllers.returnRequestAction)
router.get('/cancel-requests',auth.adminLogin,adminControllers.getCancelRequests)
router.post("/cancel-requests", auth.adminLogin, adminControllers.returnCancelAction)

//sales report 
router.get('/sales-report',auth.adminLogin,adminControllers.loadSalesReport)
router.post('/sales-report',auth.adminLogin,adminControllers.loadSalesReport)

//coupons
router.get("/coupons",auth.adminLogin,adminControllers.loadCoupons)
router.get("/new-coupon",auth.adminLogin,adminControllers.getAddNewCoupon)
router.post("/new-coupon",auth.adminLogin,adminControllers.addNewCoupon)
router.patch("/coupons/action/:id",auth.adminLogin,adminControllers.couponAction)

//referral
router.get("/referral",auth.adminLogin,adminControllers.loadReferral)
router.post("/addReferral",auth.adminLogin,adminControllers.addReferral)

// router.get("/", checkAuth, getDashboard);
// router.route("/login").get(isLoggedIn, getLogin).post(loginAdmin);

module.exports = router;
const mongoose = require("mongoose");
const Admin = require("../../models/adminModel");
const users = require("../../models/userModel");
const Category = require("../../models/categoryModel");
const Product = require("../../models/productModel");
const Order = require("../../models/orderModel");
const fs = require("fs");
const path = require("path");
const User = require("../../models/userModel");
const Return = require("../../models/returnProductModel");
const Cancel = require("../../models/cancelProductModel");
const Coupon = require("../../models/couponModel");
const Referral = require("../../models/referrelModel")


const loadProducts = async (req, res) => {
    try {
      const products = await Product.find().populate("category");
      res.render("admin/products", { products });
    } catch (error) {
      console.log(error.message);
    }
};

const addProduct = async (req, res) => {
    try {
      const category = await Category.find();
      res.render("admin/add-Products", { category });
    } catch (error) {
      console.log(error.message);
    }
};
  
const addProductPost = async (req, res) => {
    try {
      const imagesWithPath = req.body.images.map((img) => "/products/" + img);
      const { productName, category, quantity, description, price } = req.body;
  
      const catOff = await Category.findById(category);
      if (!catOff.offer) {
        if (!req.body.offer) {
          var offer = 0;
          var offerPrice = 0;
        } else {
          var offerPrice = Math.round(
            req.body.price - (req.body.price * req.body.offer) / 100
          );
  
          var offer = req.body.offer;
        }
        const newProduct = new Product({
          productName: productName,
          description: description,
          quantity: quantity,
          price: price,
          offer: offer,
          offerPrice: offerPrice,
          category: category,
          images: imagesWithPath,
        });
        await newProduct.save();
        res.redirect("/admin/products/add-product");
      } else {
        if (catOff.offer <= 0) {
          var offer = 0;
          var offerPrice = 0;
        } else {
          var offerPrice = Math.round(
            req.body.price - (req.body.price * catOff.offer) / 100
          );
  
          var offer = catOff.offer;
        }
        const newProduct = new Product({
          productName: productName,
          description: description,
          quantity: quantity,
          price: price,
          offer: offer,
          offerPrice: offerPrice,
          category: category,
          images: imagesWithPath,
        });
        await newProduct.save();
        res.redirect("/admin/products/add-product");
      }
    } catch (error) {
      console.log(error.message);
    }
};
  
const deleteProduct = async (req, res) => {
    try {
      const id = req.query.id;
      await Product.deleteOne({ _id: id });
      res.redirect("/admin/products");
    } catch (error) {
      console.log(error.message);
    }
};
  
const loadEditProduct = async (req, res) => {
    try {
      console.log(req.query.id);
      const id = req.query.id;
      const categories = await Category.find();
      const product = await Product.findOne({ _id: id }).populate("category");
      console.log(product);
      console.log(categories);
  
      res.render("admin/editProduct", { product, categories });
    } catch (error) {
      console.log(error.message);
    }
};
  
const editProduct = async (req, res) => {
    try {
      const category = await Category.findById(req.body.category);
      const catOff = category.offer || 0;
      let currOffer = req.body.offer || 0;
  
      let newOffer;
      if (catOff > currOffer) {
        newOffer = catOff;
      } else {
        newOffer = currOffer;
      }
  
      var offerPrice = Math.round(
        req.body.price - (req.body.price * newOffer) / 100
      );
      var offer = newOffer || 0;
  
      await Product.updateOne(
        { _id: req.body.id },
        {
          $set: {
            productName: req.body.productName,
            category: req.body.category,
            price: req.body.price,
            offer: offer,
            offerPrice: offerPrice,
            description: req.body.description,
            quantity: req.body.quantity,
          },
        }
      );
  
      res.redirect("/admin/products");
    } catch (error) {
      console.log.error(error.message);
    }
};
  
const destroyProductImage = async (req, res) => {
    const { id } = req.params;
    const { image } = req.body;
    try {
      await Product.findByIdAndUpdate(
        id,
        { $pull: { images: image } },
        { new: true }
      );
  
      fs.unlink(path.join(__dirname, "../public", image), (err) => {
        if (err) console.log(err);
      });
  
      res.redirect(`/admin/products/edit-product?id=${id}`);
    } catch (error) {
      console.log(error);
    }
};
  
const updateProductImages = async (req, res) => {
    console.log("halo");
    const { id } = req.params;
    const { images } = req.body;
    let imagesWithPath;
    if (images.length) {
      imagesWithPath = images.map((image) => "/products/" + image);
    }
    try {
      await Product.findByIdAndUpdate(
        id,
        { $push: { images: imagesWithPath } },
        { new: true }
      );
      res.redirect(`/admin/products/edit-product?id=${id}`);
    } catch (error) {
      console.log(error.message);
    }
};



module.exports = {
    loadProducts,
    addProduct,
    addProductPost,
    deleteProduct,
    loadEditProduct,
    editProduct,
    destroyProductImage,
    updateProductImages
}
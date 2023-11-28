const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },  
    price:{
         type:Number,
         required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category"
    },
    description:{
        type:String,
        
    },
    images:[String], 
    additionalInfo:{
        type:String,
        
    },
    blocked:{
        type:Boolean,
        default:false
    },
    offer:{
        type:Number,
        default:0
    },
    offerPrice:{
        type:Number
    }

   
})
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
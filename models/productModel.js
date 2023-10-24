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
    }

   
})
const Product = mongoose.model("product", productSchema);
module.exports = Product;
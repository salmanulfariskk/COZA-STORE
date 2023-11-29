const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        required: true,
        type: String,
    },
    offer: {
        type: Number,
    }
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
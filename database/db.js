const mongoose = require('mongoose');

const Connection = async () => {
    try {
        const URL = "mongodb://127.0.0.1:27017/EcommerceDB";
        // const URL = "mongodb+srv://SalmanulFaris:admin123@brototype.sejqvgt.mongodb.net/EcommerceDB";
        

        mongoose.set('strictQuery', false);
        await mongoose.connect(URL, { useUnifiedTopology: true, useNewUrlParser: true });
        console.log("Connected to database succesfully.");
    } catch (error) {
        console.log(error);
    }
}

module.exports = Connection;
const userRoute = require("./routes/userRoutes");
const adminRoute = require('./routes/adminRoutes')
require('dotenv').config();
const methodOverride = require('method-override')
const express = require("express");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const Connection = require("./database/db");
const nocache = require("nocache");
const morgan = require('morgan')

const app = express();
app.use(methodOverride("_method"))
const port = process.env.PORT

app.set("view engine", "ejs");
app.use(nocache())
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(
  session({
    secret: "mybigsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: 60000 * 60 * 24 * 7,
    },
  })
);

app.use("/", userRoute);
app.use("/admin", adminRoute)
app.get('/salman',(req,res)=>{
  res.render('user/orderSuccess');
})


Connection();

app.listen(port, () => {
  console.log(`server is running`);
});

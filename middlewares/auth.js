const User = require("../models/userModel");

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user);
      if (user.blocked) {
        req.session.user = null;
        res.redirect("/login");
      } else {
        next();
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user) {
      return res.redirect("/");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogout = async (req, res, next) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
  adminLogin,
  adminLogout,
};

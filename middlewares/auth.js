const isLogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      next();
    } else {
      res.redirect("/");
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

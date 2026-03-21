const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(500).json({
        message: "Thiếu thông tin user",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập",
      });
    }

    return next();
  };
};

module.exports = authorizeRoles;
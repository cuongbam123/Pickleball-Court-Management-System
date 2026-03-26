const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    ["params", "query", "body"].forEach((key) => {
      if (schema[key]) {
        // Chú ý: Lấy cả value đã được Joi format
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          errors.push(...error.details.map((e) => e.message));
        } else {
          // Gán ngược dữ liệu đã chuẩn hóa vào request
          req[key] = value;
        }
      }
    });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }
    next();
  };
};

module.exports = validate;

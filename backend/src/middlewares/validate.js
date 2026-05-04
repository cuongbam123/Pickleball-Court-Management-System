const VALIDATION_KEYS = ["params", "query", "body"];

// Kiểm tra shape schema truyền vào middleware. Schema đúng phải là object
// có ít nhất một key params/query/body. Nếu truyền thẳng Joi schema vào
// sẽ không có các key này và toàn bộ validation bị bỏ qua âm thầm — case
// nguy hiểm đã xảy ra với updateStatusValidation (xem audit ngày 2026-04).
// Ở dev environment ta cảnh báo cho lập trình viên nhận ra sớm.
const warnIfInvalidSchemaShape = (schema) => {
  if (process.env.NODE_ENV === "production") return;
  if (!schema || typeof schema !== "object") return;

  const hasValidKey = VALIDATION_KEYS.some((key) => schema[key]);
  if (hasValidKey) return;

  console.warn(
    "[validate] Schema truyền vào không có key params/query/body, " +
      "validation sẽ bị bỏ qua. Hãy bọc lại theo dạng { body: Joi.object({...}) }.",
  );
};

const validate = (schema) => {
  warnIfInvalidSchemaShape(schema);

  return (req, res, next) => {
    const errors = [];
    VALIDATION_KEYS.forEach((key) => {
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

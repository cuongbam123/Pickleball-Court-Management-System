const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) errors.push(...error.details.map((e) => e.message));
    }
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) errors.push(...error.details.map((e) => e.message));
    }
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) errors.push(...error.details.map((e) => e.message));
    }
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
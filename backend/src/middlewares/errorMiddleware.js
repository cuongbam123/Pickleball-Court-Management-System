const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error({
    message: err.message,
    stack: err.stack,
    status: err.status,
  });

  const status = err.status || 500;
  const isDev = process.env.NODE_ENV !== "production";

  res.status(status).json({
    message: isDev ? err.message : "Internal Server Error",
    code: err.code || "SERVER_ERROR",
  });
};

module.exports = errorHandler;
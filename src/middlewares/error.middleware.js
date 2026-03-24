import { errorResponse } from "../lib/general.js";
const errorHandler = (err, req, res, next) => {
  
  console.error(" Unhandled Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const msg = err.msg || "Internal server error";
  const flag = err.flag || 0;

  return res.status(statusCode).json(
    errorResponse(msg, null, flag)
  );
};

export default errorHandler;

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors and pass them to Express error handling middleware
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;

/**
 * Error Handler Middleware - Handles application errors
 */

module.exports = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const errorMessage = err.message || 'An unexpected error occurred';
  
  // Log error for server-side debugging
  console.error(`Error ${statusCode}: ${errorMessage}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  // Send formatted error response to client
  res.status(statusCode).json({
    error: {
      message: errorMessage,
      status: statusCode
    }
  });
}; 
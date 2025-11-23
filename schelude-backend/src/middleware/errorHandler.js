const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Server Error',
    statusCode: err.statusCode || 500
  };

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // In production, don't leak error details
  const response = {
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  };

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;

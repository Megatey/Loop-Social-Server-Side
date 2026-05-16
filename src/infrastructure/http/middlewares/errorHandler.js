const AppError = require('../../../domain/errors/AppError');

function mapMongooseError(error) {
  if (error.name === 'ValidationError') {
    return new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors);
  }

  if (error.name === 'CastError') {
    return new AppError('Invalid resource identifier', 400, 'INVALID_ID');
  }

  if (error.code === 11000) {
    return new AppError('Duplicate resource', 409, 'DUPLICATE_RESOURCE', error.keyValue);
  }

  return error;
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
}

function errorHandler(error, req, res, _next) {
  const mappedError = mapMongooseError(error);
  const statusCode = mappedError.statusCode || 500;
  const response = {
    status: false,
    error: {
      code: mappedError.code || 'INTERNAL_ERROR',
      message: mappedError.message || 'Internal Error',
    },
  };

  if (mappedError.details && statusCode < 500) {
    response.error.details = mappedError.details;
  }

  req.log.error(
    {
      err: mappedError,
      statusCode,
      path: req.originalUrl,
      method: req.method,
    },
    'request failed',
  );

  res.status(statusCode).json(response);
}

module.exports = {
  errorHandler,
  notFoundHandler,
};

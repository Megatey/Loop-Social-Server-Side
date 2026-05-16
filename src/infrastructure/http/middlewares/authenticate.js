const jwt = require('jsonwebtoken');
const { env } = require('../../../config/env');
const AppError = require('../../../domain/errors/AppError');

function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication invalid', 401, 'AUTHENTICATION_INVALID'));
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role || 'user',
    };
    return next();
  } catch {
    return next(new AppError('Authentication invalid', 401, 'AUTHENTICATION_INVALID'));
  }
}

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }
    return next();
  };
}

module.exports = {
  authenticate,
  authorize,
};

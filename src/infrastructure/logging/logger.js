const pino = require('pino');
const { env, isTest } = require('../../config/env');

const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'password', '*.password', 'token', '*.token'],
});

module.exports = logger;

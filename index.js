const startServer = require('./src/server');
const logger = require('./src/infrastructure/logging/logger');

startServer().catch((error) => {
  logger.fatal({ err: error }, 'server failed to start');
  process.exit(1);
});

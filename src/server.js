const { env } = require('./config/env');
const createApp = require('./app');
const { connectDatabase } = require('./infrastructure/database/connection');
const logger = require('./infrastructure/logging/logger');

async function startServer() {
  await connectDatabase(env.MONGO_URI);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'server started');
  });

  const shutdown = (signal) => {
    logger.info({ signal }, 'shutdown requested');
    server.close(() => {
      logger.info('http server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = startServer;

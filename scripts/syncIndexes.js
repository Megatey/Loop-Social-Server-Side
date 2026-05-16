const { env } = require('../src/config/env');
const { connectDatabase, disconnectDatabase } = require('../src/infrastructure/database/connection');
const User = require('../src/infrastructure/database/models/User');
const Post = require('../src/infrastructure/database/models/Post');
const Notification = require('../src/infrastructure/database/models/Notification');
const logger = require('../src/infrastructure/logging/logger');

async function syncIndexes() {
  await connectDatabase(env.MONGO_URI);
  await Promise.all([User.syncIndexes(), Post.syncIndexes(), Notification.syncIndexes()]);
  logger.info('database indexes synchronized');
  await disconnectDatabase();
}

syncIndexes().catch(async (error) => {
  logger.fatal({ err: error }, 'failed to synchronize indexes');
  await disconnectDatabase();
  process.exit(1);
});

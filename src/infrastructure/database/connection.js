const mongoose = require('mongoose');
const logger = require('../logging/logger');

async function connectDatabase(uri) {
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
  });

  logger.info({ database: mongoose.connection.name }, 'database connected');
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
};

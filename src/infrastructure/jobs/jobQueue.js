const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { env, isProduction, isTest } = require('../../config/env');
const logger = require('../logging/logger');

const handlers = {
  'audit.auth.registered': async (payload) => {
    logger.info({ userId: payload.userId }, 'user registered audit event');
  },
};

let queue;
let worker;

function getQueue() {
  if (isTest || !env.REDIS_URL) {
    if (isProduction) {
      throw new Error('REDIS_URL is required for production background jobs');
    }
    return null;
  }

  if (!queue) {
    const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
    queue = new Queue('loop-social', { connection });
    worker = new Worker(
      'loop-social',
      async (job) => {
        const handler = handlers[job.name];
        if (!handler) {
          logger.warn({ jobName: job.name }, 'job handler not registered');
          return;
        }
        await handler(job.data);
      },
      { connection },
    );
    worker.on('failed', (job, error) => logger.error({ err: error, jobName: job?.name }, 'background job failed'));
  }

  return queue;
}

async function enqueue(jobName, payload) {
  const bullQueue = getQueue();
  if (bullQueue) {
    await bullQueue.add(jobName, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
    return;
  }

  const handler = handlers[jobName];
  if (!handler) {
    logger.warn({ jobName }, 'job handler not registered');
    return;
  }

  setImmediate(() => {
    handler(payload).catch((error) => logger.error({ err: error, jobName }, 'background job failed'));
  });
}

module.exports = {
  enqueue,
};

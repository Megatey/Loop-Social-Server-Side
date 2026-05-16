const jobQueue = require('../../src/infrastructure/jobs/jobQueue');

describe('job queue adapter', () => {
  it('ignores unknown jobs without throwing', async () => {
    await expect(jobQueue.enqueue('unknown.job', { id: '1' })).resolves.toBeUndefined();
  });
});

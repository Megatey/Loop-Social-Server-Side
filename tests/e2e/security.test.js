const request = require('supertest');
const createApp = require('../../src/app');

describe('security middleware', () => {
  it('requires a bearer token for protected routes', async () => {
    const response = await request(createApp()).get('/api/users');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_INVALID');
  });
});

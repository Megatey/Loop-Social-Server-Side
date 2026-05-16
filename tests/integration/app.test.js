const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../../src/app');

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongo.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe('Loop Social API', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('registers, authenticates, creates posts, and reads user posts', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      username: 'benjamin',
      email: 'benjamin@example.com',
      password: 'password123',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.token).toEqual(expect.any(String));

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'benjamin@example.com',
      password: 'password123',
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;
    const postResponse = await request(app)
      .post('/api/posts/create-post')
      .set('Authorization', `Bearer ${token}`)
      .send({ desc: 'First production-ready post', images: [] });

    expect(postResponse.status).toBe(201);

    const postsResponse = await request(app).get('/api/posts/user-posts').set('Authorization', `Bearer ${token}`);

    expect(postsResponse.status).toBe(200);
    expect(postsResponse.body.data).toHaveLength(1);
    expect(postsResponse.body.data[0].desc).toBe('First production-ready post');
  });

  it('updates profiles and supports follow/unfollow flows', async () => {
    const first = await request(app).post('/api/auth/register').send({
      username: 'benjamin',
      email: 'benjamin@example.com',
      password: 'password123',
    });
    const second = await request(app).post('/api/auth/register').send({
      username: 'adauser',
      email: 'ada@example.com',
      password: 'password123',
    });

    const token = first.body.token;
    const targetId = second.body.user._id;

    const updateResponse = await request(app)
      .patch('/api/users/update-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ city: 'Lagos', desc: 'Backend engineer' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.city).toBe('Lagos');

    const followResponse = await request(app)
      .patch(`/api/users/${targetId}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(followResponse.status).toBe(200);

    const duplicateFollow = await request(app)
      .patch(`/api/users/${targetId}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(duplicateFollow.status).toBe(403);

    const unfollowResponse = await request(app)
      .patch(`/api/users/${targetId}/unfollow`)
      .set('Authorization', `Bearer ${token}`);

    expect(unfollowResponse.status).toBe(200);
  });

  it('supports post likes, comments, comment deletion, and post deletion', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      username: 'benjamin',
      email: 'benjamin@example.com',
      password: 'password123',
    });
    const token = registerResponse.body.token;

    await request(app)
      .post('/api/posts/create-post')
      .set('Authorization', `Bearer ${token}`)
      .send({ desc: 'A post with interactions', images: ['image-1.png'] });

    const postsResponse = await request(app).get('/api/posts/user-posts').set('Authorization', `Bearer ${token}`);
    const postId = postsResponse.body.data[0]._id;

    expect(
      await request(app).patch(`/api/posts/${postId}/like-post`).set('Authorization', `Bearer ${token}`),
    ).toMatchObject({
      status: 200,
    });
    expect(
      await request(app).patch(`/api/posts/${postId}/unlike-post`).set('Authorization', `Bearer ${token}`),
    ).toMatchObject({
      status: 200,
    });
    expect(
      await request(app)
        .patch(`/api/posts/${postId}/leave-comment`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Helpful post' }),
    ).toMatchObject({ status: 200 });
    expect(
      await request(app).patch(`/api/posts/${postId}/delete-comment`).set('Authorization', `Bearer ${token}`),
    ).toMatchObject({
      status: 200,
    });
    expect(await request(app).delete(`/api/posts/${postId}`).set('Authorization', `Bearer ${token}`)).toMatchObject({
      status: 200,
    });
  });

  it('supports feeds, explore, bookmarks, shares, analytics, search, graph, and notifications', async () => {
    const author = await request(app).post('/api/auth/register').send({
      username: 'authoruser',
      email: 'author@example.com',
      password: 'password123',
      city: 'Lagos',
    });
    const reader = await request(app).post('/api/auth/register').send({
      username: 'readeruser',
      email: 'reader@example.com',
      password: 'password123',
    });

    const authorToken = author.body.token;
    const readerToken = reader.body.token;
    const authorId = author.body.user._id;

    await request(app)
      .post('/api/posts/create-post')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        desc: 'Production social APIs need discovery and analytics',
        images: [],
        tags: ['Backend', 'Node'],
        visibility: 'public',
      });

    await request(app).patch(`/api/users/${authorId}/follow`).set('Authorization', `Bearer ${readerToken}`);

    const feed = await request(app).get('/api/posts/feed?limit=10').set('Authorization', `Bearer ${readerToken}`);
    const explore = await request(app)
      .get('/api/posts/explore?tag=backend')
      .set('Authorization', `Bearer ${readerToken}`);
    const postId = feed.body.data[0]._id;

    expect(feed.status).toBe(200);
    expect(feed.body.data).toHaveLength(1);
    expect(explore.status).toBe(200);
    expect(explore.body.data[0]._id).toBe(postId);

    expect(
      await request(app).patch(`/api/posts/${postId}/bookmark`).set('Authorization', `Bearer ${readerToken}`),
    ).toMatchObject({
      status: 200,
    });

    const bookmarks = await request(app).get('/api/users/bookmarks').set('Authorization', `Bearer ${readerToken}`);
    expect(bookmarks.status).toBe(200);
    expect(bookmarks.body.data[0]._id).toBe(postId);

    expect(
      await request(app).post(`/api/posts/${postId}/share`).set('Authorization', `Bearer ${readerToken}`),
    ).toMatchObject({
      status: 200,
    });
    expect(
      await request(app)
        .patch(`/api/posts/${postId}/leave-comment`)
        .set('Authorization', `Bearer ${readerToken}`)
        .send({ text: 'This belongs in a portfolio.' }),
    ).toMatchObject({ status: 200 });
    expect(
      await request(app).patch(`/api/posts/${postId}/like-post`).set('Authorization', `Bearer ${readerToken}`),
    ).toMatchObject({
      status: 200,
    });

    const analytics = await request(app)
      .get(`/api/posts/${postId}/analytics`)
      .set('Authorization', `Bearer ${authorToken}`);
    expect(analytics.status).toBe(200);
    expect(analytics.body.data.metrics).toMatchObject({ likes: 1, comments: 1, shares: 1 });

    const users = await request(app).get('/api/users/search?q=author').set('Authorization', `Bearer ${readerToken}`);
    const graph = await request(app)
      .get(`/api/users/${authorId}/social-graph`)
      .set('Authorization', `Bearer ${readerToken}`);
    const notifications = await request(app).get('/api/notifications').set('Authorization', `Bearer ${authorToken}`);

    expect(users.status).toBe(200);
    expect(users.body.data[0].username).toBe('authoruser');
    expect(graph.status).toBe(200);
    expect(graph.body.data.followersCount).toBe(1);
    expect(notifications.status).toBe(200);
    expect(notifications.body.data.map((item) => item.type)).toEqual(
      expect.arrayContaining(['follow', 'share', 'comment', 'like']),
    );

    const notificationId = notifications.body.data[0]._id;
    expect(
      await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authorToken}`),
    ).toMatchObject({
      status: 200,
    });
    expect(
      await request(app).patch('/api/notifications/read-all').set('Authorization', `Bearer ${authorToken}`),
    ).toMatchObject({
      status: 200,
    });
    expect(
      await request(app).patch(`/api/posts/${postId}/unbookmark`).set('Authorization', `Bearer ${readerToken}`),
    ).toMatchObject({
      status: 200,
    });
  });

  it('returns 404 for unknown protected resources and routes', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      username: 'benjamin',
      email: 'benjamin@example.com',
      password: 'password123',
    });

    const missingId = new mongoose.Types.ObjectId().toString();

    const missingUser = await request(app)
      .get(`/api/users/${missingId}`)
      .set('Authorization', `Bearer ${registerResponse.body.token}`);
    const missingRoute = await request(app).get('/api/unknown');

    expect(missingUser.status).toBe(404);
    expect(missingRoute.status).toBe(404);
  });

  it('rejects invalid auth payloads before hitting controllers', async () => {
    const response = await request(app).post('/api/auth/register').send({
      username: 'ab',
      email: 'not-an-email',
      password: '123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

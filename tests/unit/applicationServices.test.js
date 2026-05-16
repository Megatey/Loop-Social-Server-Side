const services = require('../../src/applicationServices');
const userRepository = require('../../src/infrastructure/database/repositories/userRepository');
const postRepository = require('../../src/infrastructure/database/repositories/postRepository');
const notificationRepository = require('../../src/infrastructure/database/repositories/notificationRepository');

jest.mock('../../src/infrastructure/database/repositories/userRepository');
jest.mock('../../src/infrastructure/database/repositories/postRepository');
jest.mock('../../src/infrastructure/database/repositories/notificationRepository', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
  findByRecipient: jest.fn().mockResolvedValue([]),
  markRead: jest.fn().mockResolvedValue({ _id: 'notification-id' }),
  markAllRead: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
}));
jest.mock('../../src/infrastructure/jobs/jobQueue', () => ({
  enqueue: jest.fn().mockResolvedValue(undefined),
}));

function mockUser(overrides = {}) {
  return {
    followers: [],
    followings: [],
    updateOne: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockPost(overrides = {}) {
  return {
    comments: [],
    updateOne: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('application services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates a user profile and hashes a replacement password', async () => {
    userRepository.updateById.mockResolvedValue({ username: 'benjamin' });

    const result = await services.updateProfile('507f1f77bcf86cd799439011', { password: 'password123' });

    expect(result.username).toBe('benjamin');
    expect(userRepository.updateById.mock.calls[0][1].password).not.toBe('password123');
  });

  it('throws when profile update or deletion targets a missing user', async () => {
    userRepository.updateById.mockResolvedValue(null);
    userRepository.deleteById.mockResolvedValue(null);

    await expect(services.updateProfile('507f1f77bcf86cd799439011', { city: 'Lagos' })).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
    await expect(services.deleteAccount('507f1f77bcf86cd799439011')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
  });

  it('handles profile lookup, follow, and unfollow error branches', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(services.getUserProfile('507f1f77bcf86cd799439011')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
    await expect(services.followUser('same-user', 'same-user')).rejects.toMatchObject({
      code: 'CANNOT_FOLLOW_SELF',
    });
    await expect(services.unfollowUser('same-user', 'same-user')).rejects.toMatchObject({
      code: 'CANNOT_FOLLOW_SELF',
    });
  });

  it('follows and unfollows valid users while blocking invalid relationship states', async () => {
    const currentUser = mockUser();
    const targetUser = mockUser();
    userRepository.followUser.mockResolvedValueOnce({ currentUser, targetUser });

    await services.followUser('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');

    expect(targetUser.updateOne).toHaveBeenCalledWith({ $addToSet: { followers: '507f1f77bcf86cd799439011' } });

    userRepository.followUser.mockResolvedValueOnce({
      currentUser: mockUser(),
      targetUser: mockUser({ followers: ['507f1f77bcf86cd799439011'] }),
    });

    await expect(services.followUser('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).rejects.toMatchObject({
      code: 'ALREADY_FOLLOWING',
    });

    userRepository.followUser.mockResolvedValueOnce({
      currentUser: mockUser({ followings: ['507f1f77bcf86cd799439012'] }),
      targetUser: mockUser({ followers: ['507f1f77bcf86cd799439011'] }),
    });

    await services.unfollowUser('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');

    userRepository.followUser.mockResolvedValueOnce({ currentUser: mockUser(), targetUser: mockUser() });
    await expect(services.unfollowUser('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).rejects.toMatchObject({
      code: 'NOT_FOLLOWING',
    });
  });

  it('throws for missing user pair during follow operations', async () => {
    userRepository.followUser.mockResolvedValue({ currentUser: null, targetUser: null });

    await expect(services.followUser('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
    await expect(services.unfollowUser('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
  });

  it('handles post service not-found and forbidden branches', async () => {
    postRepository.findByCreator.mockResolvedValue([]);
    postRepository.findById.mockResolvedValue(null);
    postRepository.deleteOwnedPost.mockResolvedValue(null);

    await expect(services.getPostsByUser('507f1f77bcf86cd799439011')).rejects.toMatchObject({
      code: 'POSTS_NOT_FOUND',
    });
    await expect(services.getPostsByProfile('507f1f77bcf86cd799439011')).rejects.toMatchObject({
      code: 'POSTS_NOT_FOUND',
    });
    await expect(services.likePost('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).rejects.toMatchObject({
      code: 'POST_NOT_FOUND',
    });
    await expect(services.unlikePost('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).rejects.toMatchObject({
      code: 'POST_NOT_FOUND',
    });
    await expect(
      services.leaveComment('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', { text: 'x' }),
    ).rejects.toMatchObject({
      code: 'POST_NOT_FOUND',
    });
    await expect(services.deleteComment('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).rejects.toMatchObject({
      code: 'POST_NOT_FOUND',
    });
    await expect(
      services.deleteOwnedPost('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'),
    ).rejects.toMatchObject({
      code: 'POST_NOT_FOUND',
    });
  });

  it('blocks duplicate and missing comments', async () => {
    postRepository.findById.mockResolvedValueOnce(mockPost({ comments: [{ commentor: '507f1f77bcf86cd799439011' }] }));

    await expect(
      services.leaveComment('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', { text: 'x' }),
    ).rejects.toMatchObject({
      code: 'ALREADY_COMMENTED',
    });

    postRepository.findById.mockResolvedValueOnce(mockPost());

    await expect(services.deleteComment('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).rejects.toMatchObject({
      code: 'COMMENT_NOT_FOUND',
    });
  });

  it('builds cursor feeds and rejects feeds for missing users', async () => {
    userRepository.findById.mockResolvedValueOnce(null);

    await expect(services.getFeed('507f1f77bcf86cd799439011', { limit: 2 })).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });

    userRepository.findById.mockResolvedValueOnce({ followings: ['507f1f77bcf86cd799439012'] });
    postRepository.findFeed.mockResolvedValue([
      { _id: 'post-1', createdAt: new Date('2026-01-03T00:00:00.000Z') },
      { _id: 'post-2', createdAt: new Date('2026-01-02T00:00:00.000Z') },
      { _id: 'post-3', createdAt: new Date('2026-01-01T00:00:00.000Z') },
    ]);

    const feed = await services.getFeed('507f1f77bcf86cd799439011', { limit: 2 });

    expect(feed.data).toHaveLength(2);
    expect(feed.pagination).toEqual({ hasMore: true, nextCursor: '2026-01-02T00:00:00.000Z' });
  });

  it('returns explore results and bookmark lists with pagination metadata', async () => {
    postRepository.explore.mockResolvedValue([{ _id: 'post-1' }]);
    userRepository.findBookmarks.mockResolvedValue({ bookmarks: [{ _id: 'post-1' }] });

    await expect(services.explorePosts({ page: 1, limit: 10, q: 'node' })).resolves.toMatchObject({
      data: [{ _id: 'post-1' }],
      pagination: { page: 1, limit: 10 },
    });
    await expect(services.getBookmarks('507f1f77bcf86cd799439011', { page: 1, limit: 10 })).resolves.toMatchObject({
      data: [{ _id: 'post-1' }],
      pagination: { page: 1, limit: 10 },
    });
  });

  it('handles bookmark, share, and analytics authorization branches', async () => {
    postRepository.findById.mockResolvedValueOnce(null);
    await expect(services.bookmarkPost('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).rejects.toMatchObject({
      code: 'POST_NOT_FOUND',
    });

    postRepository.findById.mockResolvedValueOnce(mockPost({ createdBy: '507f1f77bcf86cd799439013' }));
    await expect(services.sharePost('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')).resolves.toBeUndefined();

    await expect(
      services.unbookmarkPost('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'),
    ).resolves.toBeUndefined();

    postRepository.findByIdWithAuthor.mockResolvedValueOnce(null);
    await expect(
      services.getPostAnalytics('507f1f77bcf86cd799439011', 'user', '507f1f77bcf86cd799439012'),
    ).rejects.toMatchObject({ code: 'POST_NOT_FOUND' });

    postRepository.findByIdWithAuthor.mockResolvedValueOnce({
      _id: '507f1f77bcf86cd799439012',
      createdBy: { _id: '507f1f77bcf86cd799439013' },
      likes: [],
      comments: [],
      images: [],
      shareCount: 0,
    });

    await expect(
      services.getPostAnalytics('507f1f77bcf86cd799439011', 'user', '507f1f77bcf86cd799439012'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('handles notification listing and missing notification reads', async () => {
    notificationRepository.findByRecipient.mockResolvedValue([{ _id: 'notification-id' }]);
    notificationRepository.markRead.mockResolvedValueOnce(null);

    await expect(services.listNotifications('507f1f77bcf86cd799439011', { page: 1, limit: 10 })).resolves.toMatchObject(
      {
        data: [{ _id: 'notification-id' }],
        pagination: { page: 1, limit: 10 },
      },
    );
    await expect(
      services.markNotificationRead('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'),
    ).rejects.toMatchObject({ code: 'NOTIFICATION_NOT_FOUND' });
    await expect(services.markAllNotificationsRead('507f1f77bcf86cd799439011')).resolves.toMatchObject({
      modifiedCount: 1,
    });
  });
});

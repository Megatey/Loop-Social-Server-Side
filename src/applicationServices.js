const bcrypt = require('bcryptjs');
const AppError = require('./domain/errors/AppError');
const userRepository = require('./infrastructure/database/repositories/userRepository');
const postRepository = require('./infrastructure/database/repositories/postRepository');
const notificationRepository = require('./infrastructure/database/repositories/notificationRepository');
const jobQueue = require('./infrastructure/jobs/jobQueue');

const publicUserProjection =
  'username email profilePicture coverPicture followers followings desc city from relationship isAdmin createdAt updatedAt';

async function registerUser(input) {
  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser) {
    throw new AppError('This Email Already Used try with another email', 409, 'EMAIL_ALREADY_USED');
  }

  const user = await userRepository.createUser(input);
  const token = user.createJwt();
  await jobQueue.enqueue('audit.auth.registered', { userId: user._id.toString() });
  return { user, token };
}

async function loginUser(email, password) {
  const user = await userRepository.findByEmail(email, { includePassword: true });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid Credentials', 401, 'INVALID_CREDENTIALS');
  }

  return { user, token: user.createJwt() };
}

async function updateProfile(userId, data) {
  const update = { ...data };
  if (update.password) {
    update.password = await bcrypt.hash(update.password, 10);
  }

  const user = await userRepository.updateById(userId, update);
  if (!user) {
    throw new AppError(`No user with id ${userId}`, 404, 'USER_NOT_FOUND');
  }
  return user;
}

async function deleteAccount(userId) {
  const user = await userRepository.deleteById(userId);
  if (!user) {
    throw new AppError(`No user with id ${userId}`, 404, 'USER_NOT_FOUND');
  }
}

async function getUserProfile(profileId) {
  const user = await userRepository.findById(profileId, publicUserProjection);
  if (!user) {
    throw new AppError(`No user with id ${profileId}`, 404, 'USER_NOT_FOUND');
  }
  return user;
}

async function followUser(currentUserId, targetUserId) {
  if (currentUserId === targetUserId) {
    throw new AppError('You cannot follow yourself', 403, 'CANNOT_FOLLOW_SELF');
  }

  const { targetUser, currentUser } = await userRepository.followUser(currentUserId, targetUserId);
  if (!targetUser || !currentUser) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (targetUser.followers.some((id) => id.toString() === currentUserId)) {
    throw new AppError('You have already follow this user', 403, 'ALREADY_FOLLOWING');
  }

  await Promise.all([
    targetUser.updateOne({ $addToSet: { followers: currentUserId } }),
    currentUser.updateOne({ $addToSet: { followings: targetUserId } }),
    notificationRepository.createNotification({
      recipient: targetUserId,
      actor: currentUserId,
      type: 'follow',
    }),
  ]);
}

async function unfollowUser(currentUserId, targetUserId) {
  if (currentUserId === targetUserId) {
    throw new AppError('You cannot follow yourself', 403, 'CANNOT_FOLLOW_SELF');
  }

  const { targetUser, currentUser } = await userRepository.followUser(currentUserId, targetUserId);
  if (!targetUser || !currentUser) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const followsTarget = targetUser.followers.some((id) => id.toString() === currentUserId);
  const hasTargetFollowing = currentUser.followings.some((id) => id.toString() === targetUserId);
  if (!followsTarget && !hasTargetFollowing) {
    throw new AppError('You dont follow this user', 403, 'NOT_FOLLOWING');
  }

  await Promise.all([
    targetUser.updateOne({ $pull: { followers: currentUserId } }),
    currentUser.updateOne({ $pull: { followings: targetUserId } }),
  ]);
}

async function createPost(userId, input) {
  return postRepository.createPost({ ...input, createdBy: userId });
}

async function getFeed(userId, input) {
  const currentUser = await userRepository.findById(userId, 'followings');
  if (!currentUser) {
    throw new AppError(`No user with id ${userId}`, 404, 'USER_NOT_FOUND');
  }

  const authorIds = [userId, ...currentUser.followings.map((id) => id.toString())];
  const posts = await postRepository.findFeed({
    viewerId: userId,
    authorIds,
    cursor: input.cursor,
    limit: input.limit,
  });
  const hasMore = posts.length > input.limit;
  const data = hasMore ? posts.slice(0, input.limit) : posts;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

  return { data, pagination: { nextCursor, hasMore } };
}

async function explorePosts(input) {
  const data = await postRepository.explore(input);
  return { data, pagination: { page: input.page, limit: input.limit } };
}

async function getPostsByUser(userId) {
  const posts = await postRepository.findByCreator(userId);
  if (!posts.length) {
    throw new AppError('You have no posts', 404, 'POSTS_NOT_FOUND');
  }
  return posts;
}

async function getPostsByProfile(profileId) {
  const posts = await postRepository.findByCreator(profileId);
  if (!posts.length) {
    throw new AppError('This user have no posts', 404, 'POSTS_NOT_FOUND');
  }
  return posts;
}

async function likePost(userId, postId) {
  const post = await postRepository.findById(postId);
  if (!post) {
    throw new AppError(`There is no post with the id ${postId}`, 404, 'POST_NOT_FOUND');
  }
  await Promise.all([
    post.updateOne({ $addToSet: { likes: userId } }),
    notificationRepository.createNotification({
      recipient: post.createdBy,
      actor: userId,
      type: 'like',
      post: postId,
    }),
  ]);
}

async function unlikePost(userId, postId) {
  const post = await postRepository.findById(postId);
  if (!post) {
    throw new AppError(`There is no post with the id ${postId}`, 404, 'POST_NOT_FOUND');
  }
  await post.updateOne({ $pull: { likes: userId } });
}

async function leaveComment(userId, postId, input) {
  const post = await postRepository.findById(postId);
  if (!post) {
    throw new AppError(`There is no post with the id ${postId}`, 404, 'POST_NOT_FOUND');
  }

  const alreadyCommented = post.comments.some((comment) => comment.commentor.toString() === userId);
  if (alreadyCommented) {
    throw new AppError('Already commented on this post', 403, 'ALREADY_COMMENTED');
  }

  await post.updateOne({ $push: { comments: { commentor: userId, text: input.text } } });
  await notificationRepository.createNotification({
    recipient: post.createdBy,
    actor: userId,
    type: 'comment',
    post: postId,
  });
}

async function deleteComment(userId, postId) {
  const post = await postRepository.findById(postId);
  if (!post) {
    throw new AppError(`There is no post with the id ${postId}`, 404, 'POST_NOT_FOUND');
  }

  const hasComment = post.comments.some((comment) => comment.commentor.toString() === userId);
  if (!hasComment) {
    throw new AppError('You have no comment on this post', 403, 'COMMENT_NOT_FOUND');
  }

  await post.updateOne({ $pull: { comments: { commentor: userId } } });
}

async function deleteOwnedPost(userId, postId) {
  const post = await postRepository.deleteOwnedPost(postId, userId);
  if (!post) {
    throw new AppError(`No post with id ${postId}`, 404, 'POST_NOT_FOUND');
  }
}

async function bookmarkPost(userId, postId) {
  const post = await postRepository.findById(postId);
  if (!post) {
    throw new AppError(`There is no post with the id ${postId}`, 404, 'POST_NOT_FOUND');
  }

  await userRepository.addBookmark(userId, postId);
}

async function unbookmarkPost(userId, postId) {
  await userRepository.removeBookmark(userId, postId);
}

async function getBookmarks(userId, input) {
  const user = await userRepository.findBookmarks(userId, input);
  if (!user) {
    throw new AppError(`No user with id ${userId}`, 404, 'USER_NOT_FOUND');
  }

  return { data: user.bookmarks, pagination: { page: input.page, limit: input.limit } };
}

async function sharePost(userId, postId) {
  const post = await postRepository.findById(postId);
  if (!post) {
    throw new AppError(`There is no post with the id ${postId}`, 404, 'POST_NOT_FOUND');
  }

  await Promise.all([
    post.updateOne({ $inc: { shareCount: 1 } }),
    notificationRepository.createNotification({
      recipient: post.createdBy,
      actor: userId,
      type: 'share',
      post: postId,
    }),
  ]);
}

async function getPostAnalytics(userId, role, postId) {
  const post = await postRepository.findByIdWithAuthor(postId);
  if (!post) {
    throw new AppError(`There is no post with the id ${postId}`, 404, 'POST_NOT_FOUND');
  }

  if (post.createdBy._id.toString() !== userId && role !== 'admin') {
    throw new AppError('Only the post owner can view analytics', 403, 'FORBIDDEN');
  }

  return {
    postId: post._id,
    createdBy: post.createdBy,
    metrics: {
      likes: post.likes.length,
      comments: post.comments.length,
      shares: post.shareCount,
      images: post.images.length,
    },
  };
}

async function searchUsers(input) {
  const data = await userRepository.searchUsers(input);
  return { data, pagination: { page: input.page, limit: input.limit } };
}

async function getSocialGraph(profileId) {
  const user = await userRepository.findById(profileId, 'username followers followings');
  if (!user) {
    throw new AppError(`No user with id ${profileId}`, 404, 'USER_NOT_FOUND');
  }

  return {
    userId: user._id,
    username: user.username,
    followersCount: user.followers.length,
    followingsCount: user.followings.length,
    followers: user.followers,
    followings: user.followings,
  };
}

async function listNotifications(userId, input) {
  const data = await notificationRepository.findByRecipient(userId, input);
  return { data, pagination: { page: input.page, limit: input.limit } };
}

async function markNotificationRead(userId, notificationId) {
  const notification = await notificationRepository.markRead(notificationId, userId);
  if (!notification) {
    throw new AppError(`No notification with id ${notificationId}`, 404, 'NOTIFICATION_NOT_FOUND');
  }
  return notification;
}

async function markAllNotificationsRead(userId) {
  return notificationRepository.markAllRead(userId);
}

module.exports = {
  registerUser,
  loginUser,
  updateProfile,
  deleteAccount,
  getUserProfile,
  followUser,
  unfollowUser,
  createPost,
  getFeed,
  explorePosts,
  getPostsByUser,
  getPostsByProfile,
  likePost,
  unlikePost,
  leaveComment,
  deleteComment,
  deleteOwnedPost,
  bookmarkPost,
  unbookmarkPost,
  getBookmarks,
  sharePost,
  getPostAnalytics,
  searchUsers,
  getSocialGraph,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

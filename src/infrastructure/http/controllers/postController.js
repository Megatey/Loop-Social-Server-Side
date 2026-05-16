const services = require('../../../applicationServices');

async function createPost(req, res) {
  await services.createPost(req.user.userId, req.validated.body);
  res.status(201).json({ status: true, msg: 'Post created successfully' });
}

async function getFeed(req, res) {
  const feed = await services.getFeed(req.user.userId, req.validated.query);
  res.status(200).json({
    status: true,
    msg: 'Success',
    ...feed,
  });
}

async function explorePosts(req, res) {
  const posts = await services.explorePosts(req.validated.query);
  res.status(200).json({
    status: true,
    msg: 'Success',
    ...posts,
  });
}

async function getCurrentUserPosts(req, res) {
  const posts = await services.getPostsByUser(req.user.userId);
  res.status(200).json({
    status: true,
    msg: 'Success',
    data: posts,
  });
}

async function getUserPosts(req, res) {
  const posts = await services.getPostsByProfile(req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'Success',
    data: posts,
  });
}

async function likePost(req, res) {
  await services.likePost(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'You have successfully like this post.',
  });
}

async function unlikePost(req, res) {
  await services.unlikePost(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'You have successfully unlike this post.',
  });
}

async function leaveComment(req, res) {
  await services.leaveComment(req.user.userId, req.validated.params.id, req.validated.body);
  res.status(200).json({
    status: true,
    msg: 'You have successfully leave a comment on this post.',
  });
}

async function deleteComment(req, res) {
  await services.deleteComment(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'You have successfully delete your comment on this post.',
  });
}

async function deletePost(req, res) {
  await services.deleteOwnedPost(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    message: 'Deleted Successfully',
  });
}

async function bookmarkPost(req, res) {
  await services.bookmarkPost(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'Post bookmarked successfully',
  });
}

async function unbookmarkPost(req, res) {
  await services.unbookmarkPost(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'Post removed from bookmarks',
  });
}

async function sharePost(req, res) {
  await services.sharePost(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'Post shared successfully',
  });
}

async function getPostAnalytics(req, res) {
  const analytics = await services.getPostAnalytics(req.user.userId, req.user.role, req.validated.params.id);
  res.status(200).json({
    status: true,
    data: analytics,
  });
}

module.exports = {
  createPost,
  getFeed,
  explorePosts,
  getCurrentUserPosts,
  getUserPosts,
  likePost,
  unlikePost,
  leaveComment,
  deleteComment,
  deletePost,
  bookmarkPost,
  unbookmarkPost,
  sharePost,
  getPostAnalytics,
};

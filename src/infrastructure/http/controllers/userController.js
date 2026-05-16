const services = require('../../../applicationServices');

async function updateProfile(req, res) {
  const user = await services.updateProfile(req.user.userId, req.validated.body);
  res.status(200).json({
    status: true,
    message: 'Update Successfully',
    data: user,
  });
}

async function deleteAccount(req, res) {
  await services.deleteAccount(req.user.userId);
  res.status(200).json({
    status: true,
    message: 'Deleted Successfully',
  });
}

async function getProfile(req, res) {
  const user = await services.getUserProfile(req.validated.params.id);
  res.status(200).json({
    status: true,
    data: user,
  });
}

async function getCurrentUser(req, res) {
  const user = await services.getUserProfile(req.user.userId);
  res.status(200).json({
    status: true,
    data: user,
  });
}

async function searchUsers(req, res) {
  const users = await services.searchUsers(req.validated.query);
  res.status(200).json({
    status: true,
    msg: 'Success',
    ...users,
  });
}

async function getSocialGraph(req, res) {
  const graph = await services.getSocialGraph(req.validated.params.id);
  res.status(200).json({
    status: true,
    data: graph,
  });
}

async function getBookmarks(req, res) {
  const bookmarks = await services.getBookmarks(req.user.userId, req.validated.query);
  res.status(200).json({
    status: true,
    msg: 'Success',
    ...bookmarks,
  });
}

async function follow(req, res) {
  await services.followUser(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'You are now following this user',
  });
}

async function unfollow(req, res) {
  await services.unfollowUser(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'You have successfully unfollow this user',
  });
}

module.exports = {
  updateProfile,
  deleteAccount,
  getProfile,
  getCurrentUser,
  searchUsers,
  getSocialGraph,
  getBookmarks,
  follow,
  unfollow,
};

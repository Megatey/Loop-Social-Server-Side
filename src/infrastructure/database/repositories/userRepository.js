const User = require('../models/User');

function createUser(data) {
  return User.create(data);
}

function findByEmail(email, options = {}) {
  const query = User.findOne({ email });
  if (options.includePassword) {
    query.select('+password');
  }
  return query;
}

function findById(id, projection) {
  return User.findById(id).select(projection || '');
}

function updateById(id, data) {
  return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

function deleteById(id) {
  return User.findByIdAndDelete(id);
}

function searchUsers({ q, page, limit }) {
  const filter = q
    ? {
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { desc: { $regex: q, $options: 'i' } },
          { city: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  return User.find(filter)
    .select('username email profilePicture coverPicture followers followings desc city from relationship')
    .sort({ username: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
}

async function followUser(currentUserId, targetUserId) {
  const [targetUser, currentUser] = await Promise.all([User.findById(targetUserId), User.findById(currentUserId)]);
  return { targetUser, currentUser };
}

function addBookmark(userId, postId) {
  return User.findByIdAndUpdate(userId, { $addToSet: { bookmarks: postId } }, { new: true });
}

function removeBookmark(userId, postId) {
  return User.findByIdAndUpdate(userId, { $pull: { bookmarks: postId } }, { new: true });
}

function findBookmarks(userId, { page, limit }) {
  return User.findById(userId)
    .select('bookmarks')
    .populate({
      path: 'bookmarks',
      options: {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
      },
      populate: {
        path: 'createdBy',
        select: 'username profilePicture',
      },
    });
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateById,
  deleteById,
  searchUsers,
  followUser,
  addBookmark,
  removeBookmark,
  findBookmarks,
};

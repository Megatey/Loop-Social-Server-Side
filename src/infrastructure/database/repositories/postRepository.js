const Post = require('../models/Post');

function createPost(data) {
  return Post.create(data);
}

function findByCreator(userId) {
  return Post.find({ createdBy: userId }).sort({ createdAt: -1 });
}

function findFeed({ viewerId, authorIds, cursor, limit }) {
  const filter = {
    createdBy: { $in: authorIds },
    $or: [
      { visibility: { $in: ['public', 'followers'] } },
      { createdBy: viewerId },
      { visibility: { $exists: false } },
    ],
  };

  if (cursor) {
    filter.createdAt = { $lt: new Date(cursor) };
  }

  return Post.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('createdBy', 'username profilePicture');
}

function explore({ q, tag, page, limit }) {
  const filter = { visibility: 'public' };
  if (q) {
    filter.$text = { $search: q };
  }
  if (tag) {
    filter.tags = tag.toLowerCase();
  }

  return Post.find(filter)
    .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('createdBy', 'username profilePicture');
}

function findById(id) {
  return Post.findById(id);
}

function findByIdWithAuthor(id) {
  return Post.findById(id).populate('createdBy', 'username profilePicture');
}

function deleteOwnedPost(postId, userId) {
  return Post.findOneAndDelete({ _id: postId, createdBy: userId });
}

module.exports = {
  createPost,
  findByCreator,
  findFeed,
  explore,
  findById,
  findByIdWithAuthor,
  deleteOwnedPost,
};

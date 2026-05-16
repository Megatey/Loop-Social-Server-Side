const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    commentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 500,
      required: true,
    },
  },
  { _id: false, timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    desc: {
      type: String,
      maxLength: 500,
      default: '',
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
      index: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
      index: true,
    },
  },
  { timestamps: true },
);

postSchema.index({ desc: 'text', tags: 'text' });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);

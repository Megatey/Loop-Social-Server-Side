const router = require('express').Router();
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validate');
const postController = require('../controllers/postController');
const {
  createPostSchema,
  feedSchema,
  exploreSchema,
  postIdSchema,
  userPostsSchema,
  commentSchema,
} = require('../validators/postSchemas');

router.post('/create-post', validate(createPostSchema), asyncHandler(postController.createPost));
router.get('/feed', validate(feedSchema), asyncHandler(postController.getFeed));
router.get('/explore', validate(exploreSchema), asyncHandler(postController.explorePosts));
router.get('/user-posts', asyncHandler(postController.getCurrentUserPosts));
router.get('/:id/user-posts', validate(userPostsSchema), asyncHandler(postController.getUserPosts));
router.patch('/:id/like-post', validate(postIdSchema), asyncHandler(postController.likePost));
router.patch('/:id/unlike-post', validate(postIdSchema), asyncHandler(postController.unlikePost));
router.patch('/:id/leave-comment', validate(commentSchema), asyncHandler(postController.leaveComment));
router.patch('/:id/delete-comment', validate(postIdSchema), asyncHandler(postController.deleteComment));
router.patch('/:id/bookmark', validate(postIdSchema), asyncHandler(postController.bookmarkPost));
router.patch('/:id/unbookmark', validate(postIdSchema), asyncHandler(postController.unbookmarkPost));
router.post('/:id/share', validate(postIdSchema), asyncHandler(postController.sharePost));
router.get('/:id/analytics', validate(postIdSchema), asyncHandler(postController.getPostAnalytics));
router.delete('/:id', validate(postIdSchema), asyncHandler(postController.deletePost));

module.exports = router;

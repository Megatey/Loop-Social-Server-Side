const router = require('express').Router();
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validate');
const userController = require('../controllers/userController');
const {
  updateProfileSchema,
  profileIdSchema,
  userSearchSchema,
  bookmarksSchema,
} = require('../validators/userSchemas');

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get the authenticated user's profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', asyncHandler(userController.getCurrentUser));

router.get('/search', validate(userSearchSchema), asyncHandler(userController.searchUsers));
router.get('/bookmarks', validate(bookmarksSchema), asyncHandler(userController.getBookmarks));
router.patch('/update-profile', validate(updateProfileSchema), asyncHandler(userController.updateProfile));
router.delete('/delete-account', asyncHandler(userController.deleteAccount));
router.get('/:id/social-graph', validate(profileIdSchema), asyncHandler(userController.getSocialGraph));
router.get('/:id', validate(profileIdSchema), asyncHandler(userController.getProfile));
router.patch('/:id/follow', validate(profileIdSchema), asyncHandler(userController.follow));
router.patch('/:id/unfollow', validate(profileIdSchema), asyncHandler(userController.unfollow));

module.exports = router;

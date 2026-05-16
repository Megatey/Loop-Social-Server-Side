const router = require('express').Router();
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validate');
const notificationController = require('../controllers/notificationController');
const { listNotificationsSchema, notificationIdSchema } = require('../validators/notificationSchemas');

router.get('/', validate(listNotificationsSchema), asyncHandler(notificationController.listNotifications));
router.patch('/read-all', asyncHandler(notificationController.markAllNotificationsRead));
router.patch('/:id/read', validate(notificationIdSchema), asyncHandler(notificationController.markNotificationRead));

module.exports = router;

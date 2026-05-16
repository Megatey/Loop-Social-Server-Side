const router = require('express').Router();
const authRoutes = require('./authRoutes');
const notificationRoutes = require('./notificationRoutes');
const postRoutes = require('./postRoutes');
const userRoutes = require('./userRoutes');
const { authenticate } = require('../middlewares/authenticate');

router.use('/auth', authRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/posts', authenticate, postRoutes);
router.use('/notifications', authenticate, notificationRoutes);

module.exports = router;

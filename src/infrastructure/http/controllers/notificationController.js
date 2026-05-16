const services = require('../../../applicationServices');

async function listNotifications(req, res) {
  const notifications = await services.listNotifications(req.user.userId, req.validated.query);
  res.status(200).json({
    status: true,
    msg: 'Success',
    ...notifications,
  });
}

async function markNotificationRead(req, res) {
  const notification = await services.markNotificationRead(req.user.userId, req.validated.params.id);
  res.status(200).json({
    status: true,
    msg: 'Notification marked as read',
    data: notification,
  });
}

async function markAllNotificationsRead(req, res) {
  const result = await services.markAllNotificationsRead(req.user.userId);
  res.status(200).json({
    status: true,
    msg: 'Notifications marked as read',
    data: { modifiedCount: result.modifiedCount },
  });
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

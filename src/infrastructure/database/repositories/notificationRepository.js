const Notification = require('../models/Notification');

function createNotification(data) {
  if (data.recipient.toString() === data.actor.toString()) {
    return null;
  }

  return Notification.create(data);
}

function findByRecipient(recipient, { page, limit, unreadOnly }) {
  const filter = { recipient };
  if (unreadOnly) {
    filter.readAt = null;
  }

  return Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('actor', 'username profilePicture')
    .populate('post', 'desc images');
}

function markRead(notificationId, recipient) {
  return Notification.findOneAndUpdate({ _id: notificationId, recipient }, { readAt: new Date() }, { new: true });
}

function markAllRead(recipient) {
  return Notification.updateMany({ recipient, readAt: null }, { readAt: new Date() });
}

module.exports = {
  createNotification,
  findByRecipient,
  markRead,
  markAllRead,
};

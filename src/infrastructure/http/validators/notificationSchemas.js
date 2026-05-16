const { z } = require('zod');
const { objectId, paginationQuery } = require('./commonSchemas');

const listNotificationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: paginationQuery.extend({
    unreadOnly: z.coerce.boolean().default(false),
  }),
});

const notificationIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: objectId }),
  query: z.object({}).optional(),
});

module.exports = {
  listNotificationsSchema,
  notificationIdSchema,
};

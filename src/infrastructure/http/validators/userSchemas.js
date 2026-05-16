const { z } = require('zod');
const { objectId, paginationQuery } = require('./commonSchemas');

const updateProfileSchema = z.object({
  body: z
    .object({
      username: z.string().trim().min(3).max(50).optional(),
      email: z.string().trim().email().toLowerCase().optional(),
      password: z.string().min(6).max(128).optional(),
      profilePicture: z.string().trim().max(2048).optional(),
      coverPicture: z.string().trim().max(2048).optional(),
      desc: z.string().trim().max(100).optional(),
      city: z.string().trim().max(50).optional(),
      from: z.string().trim().max(50).optional(),
      relationship: z.number().int().min(1).max(4).nullable().optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const profileIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: objectId }),
  query: z.object({}).optional(),
});

const userSearchSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: paginationQuery.extend({
    q: z.string().trim().min(1).max(100).optional(),
  }),
});

const bookmarksSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: paginationQuery,
});

module.exports = {
  updateProfileSchema,
  profileIdSchema,
  userSearchSchema,
  bookmarksSchema,
};

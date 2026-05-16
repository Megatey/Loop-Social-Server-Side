const { z } = require('zod');
const { objectId, paginationQuery } = require('./commonSchemas');

const createPostSchema = z.object({
  body: z.object({
    desc: z.string().trim().max(500).default(''),
    images: z.array(z.string().trim().max(2048)).default([]),
    tags: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(30)
          .transform((tag) => tag.toLowerCase()),
      )
      .max(10)
      .default([]),
    visibility: z.enum(['public', 'followers', 'private']).default('public'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const feedSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().datetime().optional(),
  }),
});

const exploreSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: paginationQuery.extend({
    q: z.string().trim().min(1).max(100).optional(),
    tag: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .transform((tag) => tag.toLowerCase())
      .optional(),
  }),
});

const postIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: objectId }),
  query: z.object({}).optional(),
});

const userPostsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: objectId }),
  query: z.object({}).optional(),
});

const commentSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(500),
  }),
  params: z.object({ id: objectId }),
  query: z.object({}).optional(),
});

module.exports = {
  createPostSchema,
  feedSchema,
  exploreSchema,
  postIdSchema,
  userPostsSchema,
  commentSchema,
};

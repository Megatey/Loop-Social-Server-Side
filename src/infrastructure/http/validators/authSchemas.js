const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(50),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(6).max(128),
    profilePicture: z.string().trim().max(2048).optional(),
    coverPicture: z.string().trim().max(2048).optional(),
    desc: z.string().trim().max(100).optional(),
    city: z.string().trim().max(50).optional(),
    from: z.string().trim().max(50).optional(),
    relationship: z.number().int().min(1).max(4).nullable().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
};

const router = require('express').Router();
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validate');
const authController = require('../controllers/authController');
const { registerSchema, loginSchema } = require('../validators/authSchemas');

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new Loop Social user.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully.
 */
router.post('/register', validate(registerSchema), asyncHandler(authController.register));

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate an existing user.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Authenticated successfully.
 */
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

module.exports = router;

const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { authRateLimiter } = require('../middleware/rateLimiters');

const router = Router();

const emailValidator = body('email').isEmail().withMessage('Valid email is required').normalizeEmail();
const passwordValidator = body('password')
  .isString()
  .isLength({ min: 8, max: 72 })
  .withMessage('Password must be 8-72 characters');

router.post('/register', authRateLimiter, [emailValidator, passwordValidator], validateRequest, authController.register);
router.post('/login', authRateLimiter, [emailValidator, passwordValidator], validateRequest, authController.login);
router.post(
  '/refresh',
  authRateLimiter,
  [body('refreshToken').isString().notEmpty().withMessage('refreshToken is required')],
  validateRequest,
  authController.refresh
);

module.exports = router;

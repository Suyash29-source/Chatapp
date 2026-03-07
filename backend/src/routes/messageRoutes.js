const { Router } = require('express');
const { param, query } = require('express-validator');
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = Router();

router.get(
  '/:userId',
  authMiddleware,
  [
    param('userId').isUUID().withMessage('userId must be a UUID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('cursor').optional().isString().notEmpty().withMessage('cursor must be a non-empty string')
  ],
  validateRequest,
  messageController.getConversation
);

module.exports = router;

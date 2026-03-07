const { Router } = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

router.get('/me', authMiddleware, userController.getMe);

module.exports = router;

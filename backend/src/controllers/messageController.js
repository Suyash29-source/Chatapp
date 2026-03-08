const { validate: isUuid } = require('uuid');
const messageService = require('../services/messageService');

const getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit, cursor } = req.query;

    if (!isUuid(userId)) {
      return res.status(400).json({
        error: {
          message: 'userId must be a valid UUID'
        }
      });
    }

    const result = await messageService.getConversation({
      userId: req.user.id,
      peerUserId: userId,
      limit,
      cursor
    });

    return res.json({ messages: result.rows });
  } catch (err) {
    console.error('Conversation fetch error:', err);
    if (err.status) {
      return next(err);
    }
    return res.status(500).json({ error: { message: 'Internal server error' } });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConversation
};

const messageService = require('../services/messageService');

const getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit, cursor } = req.query;

    const result = await messageService.getConversation({
      userId: req.user.id,
      peerUserId: userId,
      limit,
      cursor
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConversation
};

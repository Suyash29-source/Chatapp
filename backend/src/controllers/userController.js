const createError = require('http-errors');
const userModel = require('../models/userModel');

const getMe = async (req, res, next) => {
  try {
    const user = await userModel.findUserById(req.user.id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe
};

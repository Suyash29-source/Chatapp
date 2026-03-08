const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const session = await authService.login(email, password);
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokenPair = await authService.refreshSession(refreshToken);
    res.status(200).json(tokenPair);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh
};

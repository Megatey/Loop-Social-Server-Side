const services = require('../../../applicationServices');

async function register(req, res) {
  const { user, token } = await services.registerUser(req.validated.body);
  res.status(201).json({ status: 'Success', username: user.username, token, user });
}

async function login(req, res) {
  const { email, password } = req.validated.body;
  const { user, token } = await services.loginUser(email, password);
  res.status(200).json({ status: 'Success', username: user.username, token });
}

module.exports = {
  register,
  login,
};

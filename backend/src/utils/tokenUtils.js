const { signToken } = require('./jwt');

const generateToken = (user) => {
  return signToken(user.id);
};

module.exports = {
  generateToken
};

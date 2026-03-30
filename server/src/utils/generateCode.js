const crypto = require('crypto');

const generateShareCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = 'EVT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateAccessToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = { generateShareCode, generateAccessToken };

const crypto = require('crypto');

// Generate secret hash with crypto to use for encryption
const key = crypto
  .createHash('sha512')
  .update(process.env.SECRET_KEY)
  .digest('hex')
  .substring(0, 32);

const encryptionIV = crypto
  .createHash('sha512')
  .update(process.env.SECRET_IV)
  .digest('hex')
  .substring(0, 16);

// Encrypt data
const encryptData = (data) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, encryptionIV);
  return Buffer.from(
    cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
  ).toString('base64'); // Encrypts data and converts to hex and base64
};

// Decrypt data
const decryptData = (encryptedData) => {
  const buff = Buffer.from(encryptedData, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, encryptionIV);
  return (
    decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
    decipher.final('utf8')
  ); // Decrypts data and converts to utf8
};

module.exports = { encryptData, decryptData };

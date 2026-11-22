const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'khushi-online-centre-api';
const JWT_AUDIENCE = 'khushi-online-centre-web';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes. Generate a strong random secret.');
  }
  return secret;
}

module.exports = { JWT_ALGORITHM, JWT_ISSUER, JWT_AUDIENCE, getJwtSecret };

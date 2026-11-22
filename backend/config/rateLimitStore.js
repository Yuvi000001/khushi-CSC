const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');

let client;
let connection;

function createRateLimitStore(prefix) {
  if (!process.env.REDIS_URL) return undefined;
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (error) => console.error('[redis rate limit]', error.message));
    connection = client.connect();
  }
  return new RedisStore({
    prefix: `khushi:${prefix}:`,
    sendCommand: async (...args) => {
      await connection;
      return client.sendCommand(args);
    },
  });
}

async function connectRateLimitStore() {
  if (connection) await connection;
}

module.exports = { createRateLimitStore, connectRateLimitStore };

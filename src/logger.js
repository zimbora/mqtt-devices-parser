const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'trace',
  timestamp: false,
  
  base: {
    pid: process.pid
  },

  formatters: {
    level(label) {
      return { level: label };
    }
  }
});

module.exports = logger;

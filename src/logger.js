const pino = require('pino');
$ = {};
$.config = require('../config');

const logger = pino({
  level: $.config.log.level,
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

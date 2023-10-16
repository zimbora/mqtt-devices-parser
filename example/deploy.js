const config = require('../config');
const parser = require('mqtt-devices-parser');

global.BASE_DIR = process.cwd();
var projectsPath = global.BASE_DIR+'../projects/';

parser.deploy(config,projectsPath);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // exit with failure code
  if($.config.dev)
    process.exit(1);
});
